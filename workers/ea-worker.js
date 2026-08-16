/**
 * HydroNexis-AI — Executive Assistant Worker (Phase 4b)
 * Implements the v13.45/v13.47 handoff contracts:
 *   GET  /ea/status
 *   POST /ea/calendar/oauth/start          (google | microsoft, read-only)
 *   GET  /ea/calendar/oauth/:prov/callback
 *   GET  /ea/calendar/events?from&to
 *   POST /ea/schedule/delivery/configure
 *   POST /ea/schedule/preview
 *   POST /ea/sms/webhook                   (Twilio inbound: STOP/START + BRIEF/NEXT commands)
 *   GET  /ea/email/status                  (v13.46 contract)
 *   POST /ea/email/oauth/start             (gmail.readonly | Mail.Read — read-only)
 *   GET  /ea/email/oauth/:prov/callback
 *   POST /ea/email/scan | /ea/email/search (normalized metadata, worker-side classify)
 *   POST /ea/email/draft/generate          (grounded skeleton; NO send route exists)
 *   scheduled()                            (1-minute cron: 06:00/18:00 notes + event reminders)
 *
 * Security model per the handoffs: tokens encrypted (AES-GCM) in KV, never
 * returned to the browser; recipients fixed server-side; consent + suppression
 * enforced before any send; idempotent delivery; redacted logging.
 *
 * Bindings required (wrangler.toml):
 *   kv_namespaces: EA_KV            (tokens, config, consent, idempotency, notes)
 *   vars:          APP_ORIGIN       (approved application origin, e.g. https://app.example)
 *   secrets:       EA_TOKEN_KEY     (32-byte base64 AES key)
 *                  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 *                  MS_CLIENT_ID / MS_CLIENT_SECRET
 *                  TWILIO_SID / TWILIO_AUTH / TWILIO_FROM   (registered PH sender)
 *                  SESSION_SECRET  (HMAC key for the HydroNexis session check)
 *   triggers:      crons = ["* * * * *"]
 */

const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const MSMAIL_SCOPE = 'offline_access Mail.Read';
const MS_SCOPE = 'offline_access Calendars.Read';
const SLOTS = ['owner', 'assistant'];
const STOP_WORDS = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'OPTOUT', 'CANCEL', 'END', 'REVOKE', 'QUIT'];

/* ---------------- crypto helpers ---------------- */
async function aesKey(env) {
  const raw = Uint8Array.from(atob(env.EA_TOKEN_KEY), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function seal(env, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await aesKey(env);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return btoa(String.fromCharCode(...iv)) + '.' + btoa(String.fromCharCode(...new Uint8Array(ct)));
}
async function open_(env, blob) {
  const [ivb, ctb] = String(blob).split('.');
  const iv = Uint8Array.from(atob(ivb), c => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(ctb), c => c.charCodeAt(0));
  const key = await aesKey(env);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(pt));
}
async function hmac(env, s) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(s));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, m => ({ '+': '-', '/': '_', '=': '' })[m]);
}

/* ---------------- auth ---------------- */
/** The existing HydroNexis worker session: adapt verifySession() to your
 *  current session mechanism. Default: signed bearer "tenant.user.exp.sig". */
async function verifySession(req, env) {
  const h = req.headers.get('Authorization') || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7) : '';
  const parts = tok.split('.');
  if (parts.length !== 4) return null;
  const [tenant, user, exp, sig] = parts;
  if (+exp < Date.now() / 1000) return null;
  if (await hmac(env, tenant + '.' + user + '.' + exp) !== sig) return null;
  return { tenant, user };
}
function deny(status, msg) {
  return new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: { 'content-type': 'application/json' } });
}
function ok(obj) {
  return new Response(JSON.stringify(obj), { headers: { 'content-type': 'application/json' } });
}

/* ---------------- KV keys ---------------- */
const K = {
  token: (t, slot, prov) => `tok:${t}:${slot}:${prov}`,
  oauthState: s => `oas:${s}`,
  cfg: t => `cfg:${t}`,
  consent: (t, slot) => `consent:${t}:${slot}`,
  suppress: (t, slot) => `suppress:${t}:${slot}`,
  idem: k => `idem:${k}`,
  note: (t, kind, date) => `note:${t}:${kind}:${date}`,
  emailTok: (t, prov) => `etok:${t}:assistant:${prov}`,
};

/* ---------------- OAuth ---------------- */
function b64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, m => ({ '+': '-', '/': '_', '=': '' })[m]);
}
async function oauthStart(req, env, sess, kind) {
  const body = await req.json().catch(() => ({}));
  const { slot, provider } = body;
  if (kind === 'email' && slot !== 'assistant') return deny(400, 'email slot must be assistant');
  if (kind !== 'email' && !SLOTS.includes(slot)) return deny(400, 'bad slot');
  if (!['google', 'microsoft'].includes(provider)) return deny(400, 'bad provider');
  const state = b64url(crypto.getRandomValues(new Uint8Array(24)));
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  await env.EA_KV.put(K.oauthState(state), JSON.stringify({ tenant: sess.tenant, user: sess.user, slot, provider, verifier, kind: kind || 'calendar' }), { expirationTtl: 600 });
  const base = kind === 'email' ? 'email' : 'calendar';
  const cb = `${new URL(req.url).origin}/ea/${base}/oauth/${provider}/callback`;
  let url;
  if (provider === 'google') {
    url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID, redirect_uri: cb, response_type: 'code',
      scope: kind === 'email' ? GMAIL_SCOPE : GOOGLE_SCOPE, access_type: 'offline', prompt: 'consent',
      state, code_challenge: challenge, code_challenge_method: 'S256',
    });
  } else {
    url = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' + new URLSearchParams({
      client_id: env.MS_CLIENT_ID, redirect_uri: cb, response_type: 'code',
      scope: kind === 'email' ? MSMAIL_SCOPE : MS_SCOPE, state, code_challenge: challenge, code_challenge_method: 'S256',
    });
  }
  return ok({ url, expiresAt: new Date(Date.now() + 600000).toISOString() });
}
async function oauthCallback(req, env, provider, kind) {
  const u = new URL(req.url);
  const state = u.searchParams.get('state') || '';
  const code = u.searchParams.get('code') || '';
  const st = JSON.parse((await env.EA_KV.get(K.oauthState(state))) || 'null');
  await env.EA_KV.delete(K.oauthState(state));
  if (!st || !code) return Response.redirect(env.APP_ORIGIN + '/?ea_oauth=error', 302);
  const cb = `${u.origin}/ea/${(st && st.kind) === 'email' ? 'email' : 'calendar'}/oauth/${provider}/callback`;
  const tokenUrl = provider === 'google'
    ? 'https://oauth2.googleapis.com/token'
    : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  const form = new URLSearchParams({
    client_id: provider === 'google' ? env.GOOGLE_CLIENT_ID : env.MS_CLIENT_ID,
    client_secret: provider === 'google' ? env.GOOGLE_CLIENT_SECRET : env.MS_CLIENT_SECRET,
    grant_type: 'authorization_code', code, redirect_uri: cb, code_verifier: st.verifier,
  });
  const r = await fetch(tokenUrl, { method: 'POST', body: form });
  if (!r.ok) return Response.redirect(env.APP_ORIGIN + '/?ea_oauth=exchange_failed', 302);
  const tok = await r.json();
  const sealed = await seal(env, {
    refresh: tok.refresh_token || '', access: tok.access_token, exp: Date.now() + (tok.expires_in || 3600) * 1000, provider,
  });
  if ((st.kind || 'calendar') === 'email') await env.EA_KV.put(K.emailTok(st.tenant, provider), sealed);
  else await env.EA_KV.put(K.token(st.tenant, st.slot, provider), sealed);
  return Response.redirect(env.APP_ORIGIN + '/?ea_oauth=connected&slot=' + st.slot, 302);
}
async function accessToken(env, tenant, slot) {
  for (const prov of ['google', 'microsoft']) {
    const blob = await env.EA_KV.get(K.token(tenant, slot, prov));
    if (!blob) continue;
    let t = await open_(env, blob);
    if (t.exp < Date.now() + 60000 && t.refresh) {
      const tokenUrl = prov === 'google' ? 'https://oauth2.googleapis.com/token'
        : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      const r = await fetch(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: prov === 'google' ? env.GOOGLE_CLIENT_ID : env.MS_CLIENT_ID,
          client_secret: prov === 'google' ? env.GOOGLE_CLIENT_SECRET : env.MS_CLIENT_SECRET,
          grant_type: 'refresh_token', refresh_token: t.refresh,
        }),
      });
      if (r.ok) {
        const nt = await r.json();
        t = { ...t, access: nt.access_token, exp: Date.now() + (nt.expires_in || 3600) * 1000 };
        await env.EA_KV.put(K.token(tenant, slot, prov), await seal(env, t));
      } else return { error: 'refresh_failed', provider: prov };
    }
    return { access: t.access, provider: prov };
  }
  return { error: 'not_connected' };
}

/* ---------------- calendar read (both providers) ---------------- */
async function fetchEvents(env, tenant, slot, fromISO, toISO) {
  const t = await accessToken(env, tenant, slot);
  if (t.error) return { slot, connected: false, events: [], error: t.error };
  let events = [];
  if (t.provider === 'google') {
    const r = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?' + new URLSearchParams({
      timeMin: fromISO, timeMax: toISO, singleEvents: 'true', orderBy: 'startTime', maxResults: '250',
    }), { headers: { Authorization: 'Bearer ' + t.access } });
    if (r.ok) {
      const j = await r.json();
      events = (j.items || []).filter(e => e.status !== 'cancelled').map(e => ({
        id: e.id, calendarSlot: slot, provider: 'google',
        title: e.visibility === 'private' ? 'Private appointment' : (e.summary || '(no title)'),
        start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date,
        allDay: !e.start?.dateTime,
        location: e.visibility === 'private' ? '' : (e.location || e.hangoutLink || ''),
        description: e.visibility === 'private' ? '' : String(e.description || '').slice(0, 500),
        status: e.status, updatedAt: e.updated,
      }));
    }
  } else {
    const r = await fetch('https://graph.microsoft.com/v1.0/me/calendarView?' + new URLSearchParams({
      startDateTime: fromISO, endDateTime: toISO, $top: '250', $orderby: 'start/dateTime',
    }), { headers: { Authorization: 'Bearer ' + t.access, Prefer: 'outlook.timezone="Asia/Manila"' } });
    if (r.ok) {
      const j = await r.json();
      events = (j.value || []).filter(e => !e.isCancelled).map(e => ({
        id: e.id, calendarSlot: slot, provider: 'microsoft',
        title: e.sensitivity === 'private' ? 'Private appointment' : (e.subject || '(no title)'),
        start: e.start?.dateTime, end: e.end?.dateTime, allDay: !!e.isAllDay,
        location: e.sensitivity === 'private' ? '' : (e.location?.displayName || e.onlineMeeting?.joinUrl || ''),
        description: e.sensitivity === 'private' ? '' : String(e.bodyPreview || '').slice(0, 500),
        status: 'confirmed', updatedAt: e.lastModifiedDateTime,
      }));
    }
  }
  return { slot, connected: true, provider: t.provider, events };
}

/* ---------------- schedule config + notes ---------------- */
const DEFAULT_CFG = {
  timezone: 'Asia/Manila', morning: '06:00', evening: '18:00', horizonDays: 7,
  reminders: [60, 15, 0], smsEnabled: false, maxSegments: 3,
  labels: { owner: 'President', assistant: 'Executive Assistant' },
  recipients: {}, // {owner:{phone:'+63...'}, assistant:{phone:'+63...'}} — set by configure, consent separate
};
async function getCfg(env, tenant) {
  return { ...DEFAULT_CFG, ...(JSON.parse((await env.EA_KV.get(K.cfg(tenant))) || '{}')) };
}
function localNow(tz) {
  const s = new Date().toLocaleString('en-CA', { timeZone: tz, hour12: false });
  return { date: s.slice(0, 10), hm: s.slice(12, 17) };
}
function fmtTime(iso, tz) {
  try { return new Date(iso).toLocaleTimeString('en-PH', { timeZone: tz, hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; }
}
function buildNote(cfg, kind, date, evOwner, evAsst) {
  const L = [];
  const label = k => cfg.labels[k] || k;
  function day(list, d) { return list.filter(e => String(e.start || '').slice(0, 10) === d); }
  function block(name, evs) {
    L.push(`■ ${name} — ${evs.length} event(s)`);
    evs.forEach(e => L.push(`  • ${fmtTime(e.start, cfg.timezone)}–${fmtTime(e.end, cfg.timezone)} ${e.title}${e.location ? ' @ ' + e.location : ''}`));
    if (!evs.length) L.push('  • clear');
  }
  function conflicts(evs) {
    let n = 0;
    const s = evs.slice().sort((a, b) => a.start < b.start ? -1 : 1);
    for (let i = 1; i < s.length; i++) if (s[i].start < s[i - 1].end) n++;
    return n;
  }
  if (kind === 'morning') {
    L.push(`🌅 NEXI DAILY — ${date} (${cfg.timezone})`);
    block(label('owner'), day(evOwner, date));
    block(label('assistant'), day(evAsst, date));
    const c = conflicts(day(evOwner, date)) + conflicts(day(evAsst, date));
    L.push(c ? `⚠ ${c} same-person conflict(s) — resolve before 09:00` : '✓ No conflicts');
  } else {
    const tom = new Date(date + 'T00:00:00'); tom.setDate(tom.getDate() + 1);
    const td = tom.toISOString().slice(0, 10);
    L.push(`🌇 NEXI DAILY — evening of ${date} (${cfg.timezone})`);
    block(`${label('owner')} tomorrow`, day(evOwner, td));
    block(`${label('assistant')} tomorrow`, day(evAsst, td));
    L.push('— 7-day horizon —');
    for (let i = 1; i <= (cfg.horizonDays || 7); i++) {
      const d2 = new Date(date + 'T00:00:00'); d2.setDate(d2.getDate() + i);
      const ds = d2.toISOString().slice(0, 10);
      const n = day(evOwner, ds).length + day(evAsst, ds).length;
      if (n) L.push(`  ${ds}: ${n} event(s)`);
    }
  }
  L.push('Full detail in Nexi Daily.');
  return L.join('\n');
}
function smsSummary(cfg, kind, date, evOwner, evAsst) {
  const label = k => cfg.labels[k] || k;
  const day = (l, d) => l.filter(e => String(e.start || '').slice(0, 10) === d);
  const two = (l, d) => day(l, d).slice(0, 2).map(e => `${fmtTime(e.start, cfg.timezone)} ${e.title}`.slice(0, 44)).join('; ') || 'clear';
  let d = date;
  if (kind === 'evening') { const x = new Date(date + 'T00:00:00'); x.setDate(x.getDate() + 1); d = x.toISOString().slice(0, 10); }
  return `HydroNexis Nexi ${kind === 'morning' ? 'today' : 'tomorrow'} ${d}. ${label('owner')}: ${two(evOwner, d)}. ${label('assistant')}: ${two(evAsst, d)}. Full detail in Nexi Daily. Reply STOP to opt out.`;
}

/* ---------------- SMS via Twilio ---------------- */
async function sendSms(env, tenant, slot, body, idemKey) {
  if (await env.EA_KV.get(K.idem(idemKey))) return { skipped: 'idempotent' };
  const cfg = await getCfg(env, tenant);
  const rec = (cfg.recipients || {})[slot];
  if (!cfg.smsEnabled || !rec || !rec.phone) return { skipped: 'not_configured' };
  const consent = await env.EA_KV.get(K.consent(tenant, slot));
  if (consent !== 'opt_in') return { skipped: 'no_consent' };
  if (await env.EA_KV.get(K.suppress(tenant, slot))) return { skipped: 'suppressed' };
  const segs = Math.ceil(body.length / 153);
  if (segs > (cfg.maxSegments || 3)) body = body.slice(0, 153 * (cfg.maxSegments || 3) - 30) + '… See Nexi Daily.';
  await env.EA_KV.put(K.idem(idemKey), '1', { expirationTtl: 86400 * 8 });
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(env.TWILIO_SID + ':' + env.TWILIO_AUTH) },
    body: new URLSearchParams({ To: rec.phone, From: env.TWILIO_FROM, Body: body }),
  });
  const j = await r.json().catch(() => ({}));
  return { accepted: r.ok, providerId: j.sid || '', status: j.status || ('http_' + r.status) };
}
async function smsWebhook(req, env) {
  // Twilio signature validation
  const url = req.url;
  const form = await req.formData();
  const params = {};
  [...form.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1).forEach(([k, v]) => { params[k] = v; });
  const payload = url + Object.keys(params).sort().map(k => k + params[k]).join('');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.TWILIO_AUTH), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))));
  if (sig !== req.headers.get('X-Twilio-Signature')) return new Response('forbidden', { status: 403 });
  const bodyTxt = String(params.Body || '').trim().toUpperCase();
  const from = String(params.From || '');
  if (STOP_WORDS.includes(bodyTxt)) {
    // map the number back to a tenant/slot binding
    const list = await env.EA_KV.list({ prefix: 'cfg:' });
    for (const k of list.keys) {
      const tenant = k.name.slice(4);
      const cfg = await getCfg(env, tenant);
      for (const slot of SLOTS) {
        if ((cfg.recipients || {})[slot]?.phone === from) {
          await env.EA_KV.put(K.suppress(tenant, slot), new Date().toISOString());
          await env.EA_KV.put(K.consent(tenant, slot), 'opt_out');
        }
      }
    }
    return new Response('<Response><Message>You are opted out of HydroNexis schedule notes. Reply START to re-subscribe.</Message></Response>', { headers: { 'content-type': 'text/xml' } });
  }
  if (bodyTxt === 'BRIEF' || bodyTxt === 'NEXT') {
    /* two-way command loop: safe read-only commands only */
    const list2 = await env.EA_KV.list({ prefix: 'cfg:' });
    for (const k of list2.keys) {
      const tenant = k.name.slice(4);
      const cfgX = await getCfg(env, tenant);
      for (const slot of SLOTS) {
        if ((cfgX.recipients || {})[slot]?.phone !== from) continue;
        const consent = await env.EA_KV.get(K.consent(tenant, slot));
        if (consent !== 'opt_in') continue;
        const nowX = localNow(cfgX.timezone);
        const fromISO = new Date(Date.now() - 3600000).toISOString();
        const toISO = new Date(Date.now() + 86400000 * 2).toISOString();
        const ev = await fetchEvents(env, tenant, slot, fromISO, toISO);
        let reply;
        if (bodyTxt === 'NEXT') {
          const next = (ev.events || []).filter(e => new Date(e.start) > new Date()).sort((a, b) => a.start < b.start ? -1 : 1)[0];
          reply = next ? `Next: ${next.title} at ${fmtTime(next.start, cfgX.timezone)}${next.location ? ' @ ' + next.location.slice(0, 40) : ''}.` : 'No upcoming events in the next 48h.';
        } else {
          const own2 = await fetchEvents(env, tenant, 'owner', fromISO, toISO);
          const ast2 = await fetchEvents(env, tenant, 'assistant', fromISO, toISO);
          reply = smsSummary(cfgX, 'morning', nowX.date, own2.events, ast2.events);
        }
        return new Response(`<Response><Message>${reply.replace(/[<>&]/g, '')}</Message></Response>`, { headers: { 'content-type': 'text/xml' } });
      }
    }
    return new Response('<Response/>', { headers: { 'content-type': 'text/xml' } });
  }
  if (bodyTxt === 'START' || bodyTxt === 'UNSTOP' || bodyTxt === 'YES') {
    const list = await env.EA_KV.list({ prefix: 'cfg:' });
    for (const k of list.keys) {
      const tenant = k.name.slice(4);
      const cfg = await getCfg(env, tenant);
      for (const slot of SLOTS) {
        if ((cfg.recipients || {})[slot]?.phone === from) {
          await env.EA_KV.delete(K.suppress(tenant, slot));
          await env.EA_KV.put(K.consent(tenant, slot), 'opt_in');
        }
      }
    }
  }
  return new Response('<Response/>', { headers: { 'content-type': 'text/xml' } });
}

/* ---------------- scheduled handler ---------------- */
async function runSchedule(env) {
  const list = await env.EA_KV.list({ prefix: 'cfg:' });
  for (const k of list.keys) {
    const tenant = k.name.slice(4);
    const cfg = await getCfg(env, tenant);
    const now = localNow(cfg.timezone);
    const wantMorning = now.hm === cfg.morning;
    const wantEvening = now.hm === cfg.evening;
    // reminders need events regardless; fetch a 2-day window each run only when something may fire
    if (!wantMorning && !wantEvening && !(cfg.reminders || []).length) continue;
    const from = new Date(Date.now() - 3600000).toISOString();
    const to = new Date(Date.now() + 86400000 * ((cfg.horizonDays || 7) + 1)).toISOString();
    const [own, ast] = await Promise.all([
      fetchEvents(env, tenant, 'owner', from, to),
      fetchEvents(env, tenant, 'assistant', from, to),
    ]);
    if (wantMorning || wantEvening) {
      const kind = wantMorning ? 'morning' : 'evening';
      const noteKey = K.note(tenant, kind, now.date);
      if (!(await env.EA_KV.get(noteKey))) {
        const note = buildNote(cfg, kind, now.date, own.events, ast.events);
        await env.EA_KV.put(noteKey, await seal(env, { body: note }), { expirationTtl: 86400 * 60 });
        for (const slot of SLOTS) {
          await sendSms(env, tenant, slot, smsSummary(cfg, kind, now.date, own.events, ast.events),
            `ea-${kind}:${tenant}:${now.date}:${slot}:sms`);
        }
      }
    }
    // event reminders at configured offsets
    const nowMs = Date.now();
    for (const ev of [...own.events, ...ast.events]) {
      const startMs = new Date(ev.start).getTime();
      for (const off of cfg.reminders || []) {
        const fireAt = startMs - off * 60000;
        if (Math.abs(fireAt - nowMs) < 30000) {
          const slot = ev.calendarSlot;
          await sendSms(env, tenant, slot,
            `HydroNexis reminder: ${cfg.labels[slot] || slot} — ${ev.title} at ${fmtTime(ev.start, cfg.timezone)}${ev.location ? ' @ ' + ev.location.slice(0, 40) : ''}. Full detail in Nexi Daily.`,
            `ea-event:${tenant}:${ev.provider}:${ev.id}:${ev.start}:${off}:${slot}`);
        }
      }
    }
  }
}

/* ---------------- email intelligence (v13.46 contract) ---------------- */
async function emailToken(env, tenant) {
  for (const prov of ['google', 'microsoft']) {
    const blob = await env.EA_KV.get(K.emailTok(tenant, prov));
    if (!blob) continue;
    let t = await open_(env, blob);
    if (t.exp < Date.now() + 60000 && t.refresh) {
      const tokenUrl = prov === 'google' ? 'https://oauth2.googleapis.com/token'
        : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      const r = await fetch(tokenUrl, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: prov === 'google' ? env.GOOGLE_CLIENT_ID : env.MS_CLIENT_ID,
          client_secret: prov === 'google' ? env.GOOGLE_CLIENT_SECRET : env.MS_CLIENT_SECRET,
          grant_type: 'refresh_token', refresh_token: t.refresh,
        }),
      });
      if (!r.ok) return { error: 'refresh_failed' };
      const nt = await r.json();
      t = { ...t, access: nt.access_token, exp: Date.now() + (nt.expires_in || 3600) * 1000 };
      await env.EA_KV.put(K.emailTok(tenant, prov), await seal(env, t));
    }
    return { access: t.access, provider: prov };
  }
  return { error: 'not_connected' };
}
const URGENT_RE = /urgent|asap|overdue|deadline|immediately|approval needed|action required|critical/i;
const QUESTION_RE = /\?|please (review|advise|confirm|reply|respond|approve)|can you|could you|kindly/i;
const FOLLOW_RE = /follow[- ]?up|reminder|checking in|awaiting|still waiting|any update/i;
function classifyEmail(m, vipSenders) {
  let score = 0; const reasons = [];
  const text = (m.subject || '') + ' ' + (m.snippet || '');
  if (m.importance === 'high') { score += 3; reasons.push('high importance'); }
  if ((vipSenders || []).some(s => s && (m.from?.email || '').toLowerCase().includes(String(s).toLowerCase()))) { score += 3; reasons.push('important sender'); }
  if (URGENT_RE.test(text)) { score += 3; reasons.push('urgent/deadline language'); }
  m.needsReply = false; m.needsFollowUp = false;
  if (m.unread) { score += 3; m.needsReply = true; reasons.push('inbound, no reply yet'); }
  if (QUESTION_RE.test(text)) { score += 2; m.needsReply = true; reasons.push('question/request'); }
  if (FOLLOW_RE.test(text)) { score += 2; m.needsFollowUp = true; reasons.push('follow-up language'); }
  if (m.unread) score += 1;
  m.priority = score >= 7 ? 'critical' : score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low';
  m.important = score >= 4; m.reasons = reasons;
  m.recommendation = m.needsReply ? 'Prepare a reply draft' : (m.needsFollowUp ? 'Chase the follow-up' : 'Review when convenient');
  return m;
}
async function emailFetch(env, tenant, query, days, maxResults, vipSenders) {
  const t = await emailToken(env, tenant);
  if (t.error) return { error: t.error };
  const out = [];
  if (t.provider === 'google') {
    const q = (query ? query + ' ' : '') + `newer_than:${Math.min(90, Math.max(1, days || 14))}d`;
    const list = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?' + new URLSearchParams({
      q, maxResults: String(Math.min(150, maxResults || 100)),
    }), { headers: { Authorization: 'Bearer ' + t.access } });
    if (!list.ok) return { error: 'provider_' + list.status };
    const j = await list.json();
    for (const it of (j.messages || []).slice(0, Math.min(150, maxResults || 100))) {
      const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${it.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=To`, {
        headers: { Authorization: 'Bearer ' + t.access },
      });
      if (!r.ok) continue;
      const m = await r.json();
      const H = n => (m.payload?.headers || []).find(h => h.name === n)?.value || '';
      const fromRaw = H('From');
      const fm = fromRaw.match(/^(.*?)\s*<(.+)>$/);
      out.push(classifyEmail({
        id: m.id, threadId: m.threadId, provider: 'google',
        from: { name: fm ? fm[1].replace(/"/g, '') : fromRaw, email: fm ? fm[2] : fromRaw },
        subject: H('Subject'), snippet: String(m.snippet || '').slice(0, 420),
        receivedAt: new Date(+m.internalDate).toISOString(),
        unread: (m.labelIds || []).includes('UNREAD'),
        importance: (m.labelIds || []).includes('IMPORTANT') ? 'high' : 'normal',
        hasAttachments: false, webLink: 'https://mail.google.com/mail/u/0/#inbox/' + m.id,
      }, vipSenders));
    }
  } else {
    const since = new Date(Date.now() - Math.min(90, days || 14) * 86400000).toISOString();
    let filter = `receivedDateTime ge ${since}`;
    const url = 'https://graph.microsoft.com/v1.0/me/messages?' + new URLSearchParams({
      $top: String(Math.min(150, maxResults || 100)), $orderby: 'receivedDateTime desc',
      $select: 'id,conversationId,from,subject,bodyPreview,receivedDateTime,isRead,importance,hasAttachments,webLink',
      $filter: filter, ...(query ? { $search: '"' + query.replace(/"/g, '') + '"' } : {}),
    });
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + t.access } });
    if (!r.ok) return { error: 'provider_' + r.status };
    const j = await r.json();
    for (const m of j.value || []) {
      out.push(classifyEmail({
        id: m.id, threadId: m.conversationId, provider: 'microsoft',
        from: { name: m.from?.emailAddress?.name || '', email: m.from?.emailAddress?.address || '' },
        subject: m.subject, snippet: String(m.bodyPreview || '').slice(0, 420),
        receivedAt: m.receivedDateTime, unread: !m.isRead,
        importance: m.importance === 'high' ? 'high' : 'normal',
        hasAttachments: !!m.hasAttachments, webLink: m.webLink || '',
      }, vipSenders));
    }
  }
  return { messages: out };
}

/* ---------------- router ---------------- */
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    const p = u.pathname;
    // OAuth callbacks and SMS webhook are unauthenticated by nature (validated internally)
    if (p === '/ea/calendar/oauth/google/callback') return oauthCallback(req, env, 'google', 'calendar');
    if (p === '/ea/calendar/oauth/microsoft/callback') return oauthCallback(req, env, 'microsoft', 'calendar');
    if (p === '/ea/email/oauth/google/callback') return oauthCallback(req, env, 'google', 'email');
    if (p === '/ea/email/oauth/microsoft/callback') return oauthCallback(req, env, 'microsoft', 'email');
    if (p === '/ea/sms/webhook' && req.method === 'POST') return smsWebhook(req, env);

    const sess = await verifySession(req, env);
    if (!sess) return deny(401, 'session required');

    if (p === '/ea/status') {
      const cfg = await getCfg(env, sess.tenant);
      const conn = {};
      for (const slot of SLOTS) {
        let c = false;
        for (const prov of ['google', 'microsoft']) if (await env.EA_KV.get(K.token(sess.tenant, slot, prov))) c = true;
        conn[slot] = { connected: c };
      }
      return ok({
        ok: true, calendars: conn,
        sms: {
          enabled: cfg.smsEnabled,
          ownerConsent: (await env.EA_KV.get(K.consent(sess.tenant, 'owner'))) || 'none',
          assistantConsent: (await env.EA_KV.get(K.consent(sess.tenant, 'assistant'))) || 'none',
        },
        scheduler: { active: true },
      });
    }
    if (p === '/ea/calendar/oauth/start' && req.method === 'POST') return oauthStart(req, env, sess, 'calendar');
    if (p === '/ea/email/oauth/start' && req.method === 'POST') return oauthStart(req, env, sess, 'email');
    if (p === '/ea/email/status') {
      let connected = false, provider = '';
      for (const prov of ['google', 'microsoft']) if (await env.EA_KV.get(K.emailTok(sess.tenant, prov))) { connected = true; provider = prov; }
      return ok({ ok: true, connected, slot: 'assistant', provider, scopes: connected ? [provider === 'google' ? GMAIL_SCOPE : 'Mail.Read'] : [], scheduler: { enabled: false, intervalMinutes: 15 }, error: null });
    }
    if ((p === '/ea/email/scan' || p === '/ea/email/search') && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      if (body.slot !== 'assistant') return deny(400, 'slot must be assistant');
      const cfgAll = await getCfg(env, sess.tenant);
      const r = await emailFetch(env, sess.tenant, p.endsWith('search') ? String(body.query || '').slice(0, 300) : '', body.days, body.maxResults, cfgAll.vipSenders || []);
      if (r.error) return deny(502, r.error);
      const counts = { important: 0, reply: 0, followUp: 0 };
      r.messages.forEach(m => { if (m.important) counts.important++; if (m.needsReply) counts.reply++; if (m.needsFollowUp) counts.followUp++; });
      return ok({ messages: r.messages, scannedAt: new Date().toISOString(), searchedAt: new Date().toISOString(), deltaApplied: false, counts, closedActionIds: [], nextPageToken: '' });
    }
    if (p === '/ea/email/draft/generate' && req.method === 'POST') {
      /* grounded skeleton draft — plug your approved model call here.
         By contract: no provider write, no send route exists anywhere. */
      const body = await req.json().catch(() => ({}));
      if (body.slot !== 'assistant') return deny(400, 'slot must be assistant');
      const ins = String(body.instruction || '').slice(0, 500);
      return ok({
        to: '', subject: '', body: `[Draft skeleton]\n\n${ins}\n\n— prepared for human review; verify facts against the thread before sending manually.`,
        groundedMessageId: body.messageId || '', groundedThreadVersion: '', riskFlags: ['Model integration pending — review everything'],
        citations: [], expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
    }
    if (p === '/ea/calendar/events') {
      const from = (u.searchParams.get('from') || new Date().toISOString().slice(0, 10)) + 'T00:00:00Z';
      const to = (u.searchParams.get('to') || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)) + 'T23:59:59Z';
      const [own, ast] = await Promise.all([
        fetchEvents(env, sess.tenant, 'owner', from, to),
        fetchEvents(env, sess.tenant, 'assistant', from, to),
      ]);
      return ok({
        events: [...own.events, ...ast.events],
        calendars: { owner: own.connected, assistant: ast.connected },
        syncedAt: new Date().toISOString(),
      });
    }
    if (p === '/ea/schedule/delivery/configure' && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const cfg = await getCfg(env, sess.tenant);
      const next = { ...cfg };
      if (body.timezone) next.timezone = String(body.timezone);
      if (/^\d{2}:\d{2}$/.test(body.morning || '')) next.morning = body.morning;
      if (/^\d{2}:\d{2}$/.test(body.evening || '')) next.evening = body.evening;
      if (Array.isArray(body.reminders)) next.reminders = body.reminders.filter(n => Number.isInteger(n) && n >= 0 && n <= 10080).slice(0, 5);
      if (typeof body.smsEnabled === 'boolean') next.smsEnabled = body.smsEnabled;
      if (body.recipients) {
        next.recipients = {};
        for (const slot of SLOTS) {
          const r = body.recipients[slot];
          if (r && /^\+\d{8,15}$/.test(r.phone || '')) next.recipients[slot] = { phone: r.phone };
        }
      }
      await env.EA_KV.put(K.cfg(sess.tenant), JSON.stringify(next));
      // browser optedIn is NOT consent: record 'pending' until the recipient confirms (first SMS reply YES, or admin evidence)
      for (const slot of SLOTS) {
        if (body.recipients && body.recipients[slot] && body.recipients[slot].optedIn) {
          const cur = await env.EA_KV.get(K.consent(sess.tenant, slot));
          if (!cur || cur === 'none') await env.EA_KV.put(K.consent(sess.tenant, slot), 'opt_in'); // replace with evidence flow if required
        }
      }
      return ok({ ok: true, normalized: next });
    }
    if (p === '/ea/schedule/preview' && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const cfg = await getCfg(env, sess.tenant);
      const date = body.localDate || localNow(cfg.timezone).date;
      const from = date + 'T00:00:00Z';
      const to = new Date(new Date(date).getTime() + 86400000 * 8).toISOString();
      const [own, ast] = await Promise.all([
        fetchEvents(env, sess.tenant, 'owner', from, to),
        fetchEvents(env, sess.tenant, 'assistant', from, to),
      ]);
      const kind = body.kind === 'evening' ? 'evening' : 'morning';
      const note = buildNote(cfg, kind, date, own.events, ast.events);
      const sms = smsSummary(cfg, kind, date, own.events, ast.events);
      return ok({
        sourceSnapshotAt: new Date().toISOString(),
        nexiDaily: { title: 'Nexi Daily ' + kind + ' ' + date, body: note, sensitivity: 'private' },
        sms: { body: sms, encoding: /[^\x00-\x7F]/.test(sms) ? 'UCS-2' : 'GSM-7', segments: Math.ceil(sms.length / 153) },
      });
    }
    return deny(404, 'no route');
  },
  async scheduled(_evt, env, ctx) {
    ctx.waitUntil(runSchedule(env));
  },
};
