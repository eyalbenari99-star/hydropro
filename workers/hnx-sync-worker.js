// ============================================================
// HydroNexis-AI Cloudflare Worker v3.7.1-nexi
// ============================================================
// CHANGE in v3.7.1-nexi (2026-10-08, Nexi v22.17 "stop losing data"):
//   + /sync/pull and /sync/keys follow the KV list cursor (KV returns at
//     most 1000 keys per call — a larger dataset was cut silently).
//   + /sync/push replies with skipped:[{key,size,why}] for stores it did not
//     store, and the per-store cap is 20 MB (was 5 MB, silently skipped).
//     The app keeps a skipped store as "unsent" instead of clearing it.
//   Paste over the deployed hnx-sync worker (Cloudflare → Workers → hnx-sync
//   → Edit code → Deploy). Older apps ignore the new field.
// CHANGE in v3.7.0-nexi (2026-10-03) — merged by Claude from the
// deployed v3.6.0-setupcode code Eyal pasted, plus the four snippets
// that were waiting in workers/ (never deployed until now):
//   + VERSION HISTORY (Data Safety v21.28): every /sync/push keeps the
//     previous value of each changed key (30 versions, 45 days):
//       GET /sync/versions?key=<storeKey>        → { key, versions:[{ts,size}] }
//       GET /sync/version?key=<storeKey>&ts=<ts> → { key, ts, value }
//     Same login token as /sync/pull; reads the caller's data namespace.
//   + DAILY SNAPSHOT of every data:* key to the UPLOADS R2 bucket
//     (snap/<YYYY-MM-DD>.json, 60 days kept) from the existing cron —
//     only when the UPLOADS binding exists; otherwise silently skipped.
//   + SOS read-only routes (same OAuth token the worker already holds):
//       GET /sos/sales-orders?open=true&start=&maxresults=&from=&to=  (Supply Plan, CRM Orders — v18.09/v21.19)
//       GET /sos/customers?start=&maxresults=                           (CRM ↔ SOS recon — v19.59)
//       GET /sos/invoices?open=true&start=&maxresults=&from=&to=       (CRM Sales Analytics)
//       GET /sos/item-receipts?from=&to=&start=&maxresults=           (🌾 Harvest — v21.37)
//   + /health reports version 3.7.0-nexi and snapshotConfigured.
//   Nothing else changed: auth, sync, backups, R2, trackers, SMS and
//   the existing SOS routes are byte-for-byte the v3.6.0 code.
// CHANGE in v3.6.0-setupcode (2026-07-23):
//   + DEVICE SETUP CODE — fixes the "Mea cannot sync / Invalid
//     credentials" chicken-and-egg. Root cause found: a staff PC
//     that has NEVER pulled holds a LOCAL hydroPro_users roster
//     that can differ from the cloud roster (different password
//     hash, or the user only exists locally). /auth/app-login
//     validates against the CLOUD roster, so such a device is
//     rejected forever: it cannot align rosters without pulling,
//     and cannot pull without logging in.
//   + FIX: /auth/login now accepts, as a one-time device
//     enrollment, ANY app username + the admin-set SETUP_CODE
//     (worker env var). On success it creates the same
//     'app-login' mirror record v3.5.0 uses (shared company
//     dataNamespace) and issues a normal session. The device
//     then pulls+pushes, the rosters align, and from the next
//     session the silent /auth/app-login works with the user's
//     OWN password — the code is only ever needed once per PC.
//   + SECURITY: the code NEVER works for a real cloud account
//     (user:eyal or any record without source 'app-login') —
//     impersonating the cloud admin with the code is impossible.
//     isAdmin for enrolled users maps from the app roster
//     (level >= 4 or role 'admin'), never from the code itself.
//     Roster users with active === false are refused.
//     If SETUP_CODE is not set, the feature is OFF and
//     /auth/login behaves exactly as v3.5.0.
//   + ADMIN CONTROL: set/rotate/remove in Cloudflare →
//     hnx-sync → Settings → Variables and Secrets →
//     SETUP_CODE. Removing it disables enrollment instantly.
//   + /health now reports setupCodeConfigured.
// CHANGE in v3.5.0-applogin (2026-07-21):
//   + POST /auth/app-login — SILENT CLOUD SIGN-IN (server half of
//     index.html v12.88-autosync). The app posts {username, hash}
//     where hash is the user's OWN app passwordHash ('sha256:<hex>')
//     exactly as stored in the roster. This route validates it
//     against hydroPro_users ALREADY synced into KV (under
//     data:<DATA_USER>:hydroPro_users) and returns the same
//     {token, user} shape as /auth/login. Every user now syncs
//     automatically after logging into the app — nobody connects
//     with the shared 'eyal' cloud account anymore.
//   + SHARED DATA NAMESPACE: all company data lives under
//     data:eyal:* (because every device used eyal's token until
//     now). App-login sessions therefore carry
//     dataNamespace = DATA_USER ('eyal'), and /sync/pull, /sync/push
//     and /sync/keys now use session.user.dataNamespace when set.
//     Without this, each new user would read/write an EMPTY
//     namespace and the app would look wiped for them.
//   + Mirror cloud user records (user:<name>, source:'app-login')
//     are auto-created so sessions validate; REAL cloud user
//     records (e.g. user:eyal with its salt+passwordHash) are
//     NEVER overwritten by this route.
//   + isAdmin maps from the app roster (level >= 4 or role 'admin');
//     app-login users get uploadFiles/deleteFiles permissions to
//     match how the system behaved when everyone shared eyal's
//     admin token. Tighten later if desired.
// CHANGE in v3.4.1-fleetmap (2026-06-11):
//   CANONICAL deviceId <-> vehicle <-> driver MAPPING DECISION:
//   the mapping lives in the EXISTING synced app store
//   data:<user>:hydroPro_admin_fleet_v1 (one vehicle object per
//   truck; field gpsDeviceId = tracker/IMEI, set in the app under
//   Fleet -> GPS). Driver resolves via vehicle.driverId against
//   data:<user>:hydroPro_employees. NO new trk:cfg:* keys exist -
//   trk:* holds only positions/history/assignments. This worker
//   now READS that store too (trkFleetMap), so:
//     - /trackers/live and /trackers/stops return vehicleName,
//       plate and driverName per device (server-side resolution)
//     - auto-SMS texts say the vehicle NAME, never a raw IMEI,
//       even when the assignment was created without one.
//   <user> = env.REPORT_USER || 'eyal' (same as reports).
// CHANGE in v3.4.0-trackers (2026-06-11):
//   + GPS TRACKERS module:
//       POST /trackers/ingest        - receive position pings (token OR X-API-Key)
//       GET  /trackers/live          - latest position of every device
//       GET  /trackers/history       - one device's points for a date
//       GET  /trackers/stops         - unplanned stops >= N minutes (computed)
//       GET  /trackers/assignments   - list driver<->vehicle assignments
//       POST /trackers/assign        - create assignment (status: unconfirmed)
//       POST /trackers/confirm       - confirm an assignment
//       DELETE /trackers/assignment  - remove an assignment
//   + TWILIO SMS:
//       POST /api/sms/outbound       - send one SMS {to,body} via Twilio
//       sendDriverAssignmentSms()    - auto-SMS unconfirmed assignments,
//                                      runs from the existing cron schedule
//   Required NEW worker secrets for SMS (Settings -> Variables & Secrets):
//       TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (your Twilio number,
//       E.164 format e.g. +15005550006). Without them, SMS endpoints return a
//       clear 503 and everything else keeps working.
// CHANGE in v3.3.1-cors: added 'null' to ALLOWED_ORIGINS so a
// downloaded file:// copy of the app can reach /sync, /ai, /r2,
// etc. A file:// page sends Origin: null; without this the
// browser blocked the response with "Failed to fetch". Every
// endpoint is still protected by login/token (requireAuth), so
// allowing the null origin does not bypass authentication.
// ------------------------------------------------------------
// Endpoints:
//   GET  /api/qb/customers          - QuickBooks customer fetch (existing)
//   GET  /patches/latest.js         - HTML patch loader (existing)
//   POST /auth/login                - Username+password login (+ SETUP_CODE enrollment) [v3.6.0]
//   POST /auth/app-login            - Silent sign-in with app credentials [v3.5.0]
//   POST /auth/logout               - End session
//   GET  /auth/me                   - Get current user info
//   POST /admin/users               - Create user (admin only)
//   GET  /admin/users               - List all users (admin only)
//   PUT  /admin/users/:username     - Update user (admin only)
//   DELETE /admin/users/:username   - Delete user (admin only)
//   POST /admin/users/:username/password - Reset password (admin only)
//   GET  /sync/pull                 - Pull user's data from KV
//   POST /sync/push                 - Push user's data to KV (keeps previous versions) [v3.7.0]
//   GET  /sync/keys                 - List all keys for current user
//   GET  /sync/versions             - Version list of one key                 [v3.7.0]
//   GET  /sync/version              - One stored version of one key           [v3.7.0]
//   POST /backup/create             - Create daily backup
//   GET  /backup/download           - Download latest backup as JSON
//   POST /backup/restore            - Restore from uploaded JSON
//   POST /ai/analyze                - AI cell analysis + Ask
//   POST /reports/test|run          - Scheduled report controls
//   POST /sos/oauth/start           - SOS OAuth start
//   GET  /sos/oauth/callback        - SOS OAuth callback
//   POST /sos/oauth/disconnect      - SOS OAuth disconnect
//   GET  /sos/items|locations|lots|shipments|purchase-orders - SOS proxy
//   GET  /sos/sales-orders|customers|invoices|item-receipts  - SOS read-only [v3.7.0]
//   POST   /r2/upload               - Upload a file to R2 (admin only)   [NEW v3.3]
//   GET    /r2/file                 - Download/serve a file from R2      [NEW v3.3]
//   GET    /r2/list                 - List files in R2                   [NEW v3.3]
//   DELETE /r2/delete               - Delete a file from R2 (admin only) [NEW v3.3]
// ------------------------------------------------------------
// R2 NOTE: the four /r2/* routes need an R2 bucket binding named
// UPLOADS (Settings -> Bindings -> Add -> R2 bucket -> variable
// name UPLOADS -> bucket hnx-uploads). Without it they return a
// clear 503 telling you to add the binding; nothing else breaks.
// ============================================================

const ALLOWED_ORIGINS = [
  'https://aba-pardes-monitoring.netlify.app',
  'https://api.abapardes.com.ph',
  'http://localhost:8788',
  'http://localhost:3000',
  'null'   // downloaded file:// copy of the app (Origin: null) — still token-protected
];

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-API-Key',
  'Access-Control-Max-Age': '86400'
};

const SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds
const BACKUP_RETENTION = 7; // Keep 7 days of backups
const WORKER_VERSION = '3.7.1-nexi';

// ============================================================
// MAIN HANDLER
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = buildCorsHeaders(origin);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Route dispatch
      const path = url.pathname;
      let response;

      // QuickBooks (existing)
      if (path === '/api/qb/customers' && request.method === 'GET') {
        response = await handleQBCustomers(request, env);
      }
      // Patches loader (existing)
      else if (path === '/patches/latest.js' && request.method === 'GET') {
        response = await handlePatchLoader(request, env);
      }
      // Auth endpoints
      else if (path === '/auth/login' && request.method === 'POST') {
        response = await handleLogin(request, env);
      }
      // v3.5.0: silent sign-in using the user's own app credentials
      else if (path === '/auth/app-login' && request.method === 'POST') {
        response = await handleAppLogin(request, env);
      }
      else if (path === '/auth/logout' && request.method === 'POST') {
        response = await handleLogout(request, env);
      }
      else if (path === '/auth/me' && request.method === 'GET') {
        response = await handleMe(request, env);
      }
      // Admin endpoints
      else if (path === '/admin/users' && request.method === 'GET') {
        response = await handleListUsers(request, env);
      }
      else if (path === '/admin/users' && request.method === 'POST') {
        response = await handleCreateUser(request, env);
      }
      else if (path.match(/^\/admin\/users\/[^\/]+$/) && request.method === 'PUT') {
        response = await handleUpdateUser(request, env, path);
      }
      else if (path.match(/^\/admin\/users\/[^\/]+$/) && request.method === 'DELETE') {
        response = await handleDeleteUser(request, env, path);
      }
      else if (path.match(/^\/admin\/users\/[^\/]+\/password$/) && request.method === 'POST') {
        response = await handleResetPassword(request, env, path);
      }
      // Sync endpoints
      else if (path === '/sync/pull' && request.method === 'GET') {
        response = await handleSyncPull(request, env);
      }
      else if (path === '/sync/push' && request.method === 'POST') {
        response = await handleSyncPush(request, env);
      }
      else if (path === '/sync/keys' && request.method === 'GET') {
        response = await handleSyncKeys(request, env);
      }
      // v3.7.0: version history of one key (Data Safety)
      else if (path === '/sync/versions' && request.method === 'GET') {
        response = await handleSyncVersions(request, env);
      }
      else if (path === '/sync/version' && request.method === 'GET') {
        response = await handleSyncVersion(request, env);
      }
      // v3.2.2 — caller IP for the inventory Audit Trail (no auth; returns only your own IP)
      else if (path === '/whoami' && request.method === 'GET') {
        response = json({ ip: request.headers.get('CF-Connecting-IP') || '', country: request.headers.get('CF-IPCountry') || '', ts: new Date().toISOString() });
      }
      // AI: deep-analysis + free-form Ask
      else if (path === '/ai/analyze' && request.method === 'POST') {
        response = await handleAiAnalyze(request, env);
      }
      // Backup endpoints
      else if (path === '/backup/create' && request.method === 'POST') {
        response = await handleBackupCreate(request, env);
      }
      else if (path === '/backup/download' && request.method === 'GET') {
        response = await handleBackupDownload(request, env);
      }
      else if (path === '/backup/restore' && request.method === 'POST') {
        response = await handleBackupRestore(request, env);
      }
      // First-time admin seeding (DELETE THIS ROUTE AFTER USE)
      else if (path === '/seed-admin' && request.method === 'POST') {
        response = await handleSeedAdmin(request, env);
      }
      // Scheduled reports
      else if (path === '/reports/test' && request.method === 'POST') {
        response = await handleReportTest(request, env);
      }
      else if (path === '/reports/run' && request.method === 'POST') {
        response = await handleReportRun(request, env);
      }
      // SOS Inventory endpoints (v3.1)
      else if (path.startsWith('/sos/')) {
        response = await handleSosRoute(request, env, path);
      }
      // R2 file storage (v3.3) — needs R2 binding named UPLOADS
      else if (path === '/r2/upload' && request.method === 'POST') {
        response = await handleR2Upload(request, env);
      }
      else if (path === '/r2/file' && request.method === 'GET') {
        response = await handleR2File(request, env);
      }
      else if (path === '/r2/list' && request.method === 'GET') {
        response = await handleR2List(request, env);
      }
      else if (path === '/r2/delete' && request.method === 'DELETE') {
        response = await handleR2Delete(request, env);
      }
      // GPS Trackers (v3.4)
      else if (path.startsWith('/trackers/')) {
        response = await handleTrackersRoute(request, env, path);
      }
      // Twilio SMS (v3.4)
      else if (path === '/api/sms/outbound' && request.method === 'POST') {
        response = await handleSmsOutbound(request, env);
      }
      // Health check
      else if (path === '/health' || path === '/') {
        response = json({
          status: 'ok',
          version: WORKER_VERSION,
          time: new Date().toISOString(),
          sosConfigured: !!(env.SOS_CLIENT_ID && env.SOS_CLIENT_SECRET),
          r2Configured: !!env.UPLOADS,
          smsConfigured: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM),
          setupCodeConfigured: !!env.SETUP_CODE,
          versionsConfigured: true,
          snapshotConfigured: !!env.UPLOADS
        });
      }
      else {
        response = json({ error: 'Not Found' }, 404);
      }

      // Attach CORS headers to all responses
      Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;

    } catch (err) {
      const response = json({ error: err.message, stack: err.stack }, 500);
      Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    }
  },

  // ============================================================
  // CRON: fully-automatic auto-send of due reports
  // ============================================================
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      runScheduledReports(env).catch(e => console.log('[reports] cron error:', e && e.message))
    );
    // v3.4: auto-SMS drivers with unconfirmed assignments (no-op if Twilio not configured)
    ctx.waitUntil(
      sendDriverAssignmentSms(env).catch(e => console.log('[sms] cron error:', e && e.message))
    );
    // v3.7.0: daily snapshot of every data:* key to R2 (no-op without the UPLOADS binding)
    ctx.waitUntil(
      runDailySnapshot(env).catch(e => console.log('[snapshot] cron error:', e && e.message))
    );
  }
};

// ============================================================
// CORS
// ============================================================
function buildCorsHeaders(origin) {
  const headers = { ...CORS_HEADERS };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else {
    headers['Access-Control-Allow-Origin'] = 'https://aba-pardes-monitoring.netlify.app';
  }
  return headers;
}

// ============================================================
// UTILITIES
// ============================================================
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(password + ':' + salt);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomToken(len = 32) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ============================================================
// SESSION VALIDATION
// ============================================================
async function getSession(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const sessionRaw = await env.TOKENS.get('session:' + token);
  if (!sessionRaw) return null;

  const session = JSON.parse(sessionRaw);
  if (session.expires < Date.now()) {
    await env.TOKENS.delete('session:' + token);
    return null;
  }

  const userRaw = await env.TOKENS.get('user:' + session.username);
  if (!userRaw) return null;

  const user = JSON.parse(userRaw);
  if (user.disabled) return null;

  return { token, ...session, user };
}

async function requireAuth(request, env) {
  const session = await getSession(request, env);
  if (!session) throw new AuthError('Unauthorized');
  return session;
}

async function requireAdmin(request, env) {
  const session = await requireAuth(request, env);
  if (!session.user.isAdmin) throw new AuthError('Admin only');
  return session;
}

class AuthError extends Error {
  constructor(msg) { super(msg); this.name = 'AuthError'; }
}

// ============================================================
// AUTH: LOGIN  (v3.6.0 adds SETUP_CODE device enrollment)
// ------------------------------------------------------------
// Normal path (unchanged): username + password against a REAL
// cloud account (user:<name> holding salt + passwordHash).
//
// NEW enrollment path: if the normal check does not pass AND
// env.SETUP_CODE is set AND password === env.SETUP_CODE, the
// device is enrolled: an 'app-login' mirror record is created
// for that username (shared company dataNamespace) and a normal
// session is issued. Purpose: a staff PC that has never synced
// holds a local roster that can differ from the cloud roster,
// so /auth/app-login rejects it forever (it cannot align rosters
// without pulling, and cannot pull without logging in). One
// enrollment breaks the loop; after the first pull+push the
// rosters match and the silent /auth/app-login takes over with
// the user's OWN password. The code is never needed again on
// that PC.
//
// Guarantees:
//   - The code NEVER authenticates a REAL cloud account
//     (user:eyal or any record whose source is not 'app-login').
//   - isAdmin maps from the app roster (level >= 4 / role
//     'admin'); the code alone never grants admin.
//   - Roster users with active === false are refused.
//   - SETUP_CODE unset => feature off, exact v3.5.0 behaviour.
// ============================================================
async function trySetupCodeEnroll(env, username, password, existingCloudUser) {
  const code = env.SETUP_CODE;
  if (!code || String(password) !== String(code)) return null;

  // NEVER let the code impersonate a real cloud account.
  if (existingCloudUser && existingCloudUser.source !== 'app-login') {
    return { blocked: true };
  }

  // Map identity + admin level from the cloud APP roster when the
  // user is already in it. A user NOT in the cloud roster is still
  // allowed (their record may only exist locally on the new PC —
  // it syncs up right after this enrollment).
  const DATA_USER = appDataUser(env);
  let rosterUser = null;
  try {
    const rosterRaw = await env.TOKENS.get('data:' + DATA_USER + ':hydroPro_users');
    if (rosterRaw) {
      let roster = JSON.parse(rosterRaw);
      if (typeof roster === 'string') { try { roster = JSON.parse(roster); } catch (_) { roster = null; } }
      if (Array.isArray(roster)) {
        rosterUser = roster.find(u => u && String(u.username || '').toLowerCase() === username) || null;
      }
    }
  } catch (_) { rosterUser = null; }

  if (rosterUser && rosterUser.active === false) {
    return { blocked: true };
  }

  const level = rosterUser ? Number(rosterUser.level || 0) : 0;
  const role = rosterUser ? String(rosterUser.role || '').toLowerCase() : '';
  const isAdmin = (username === DATA_USER) || level >= 4 || role === 'admin';

  const cloudUser = {
    username: username,
    displayName: (rosterUser && (rosterUser.fullname || rosterUser.username)) || username,
    isAdmin: isAdmin,
    disabled: false,
    source: 'app-login',
    dataNamespace: DATA_USER, // shared company dataset
    permissions: { uploadFiles: true, deleteFiles: true },
    enrolledVia: 'setup-code',
    lastLogin: new Date().toISOString()
  };
  await env.TOKENS.put('user:' + username, JSON.stringify(cloudUser));
  return { user: cloudUser };
}

async function handleLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  const { username, password } = body;

  if (!username || !password) {
    return json({ error: 'Username and password required' }, 400);
  }

  const uname = String(username).toLowerCase();
  const userRaw = await env.TOKENS.get('user:' + uname);
  let user = userRaw ? JSON.parse(userRaw) : null;

  // ---- Normal path: real cloud account with salt + passwordHash ----
  let authed = false;
  if (user && user.salt && user.passwordHash) {
    if (user.disabled) {
      return json({ error: 'Account disabled' }, 403);
    }
    const hash = await hashPassword(password, user.salt);
    if (hash === user.passwordHash) authed = true;
  }

  // ---- v3.6.0: device enrollment with the admin-set SETUP_CODE ----
  if (!authed) {
    const enroll = await trySetupCodeEnroll(env, uname, password, user);
    if (enroll && enroll.user) {
      user = enroll.user;
      authed = true;
    }
    // enroll === null (no/mismatched code) or enroll.blocked → fall
    // through to the same generic 401; never reveal why.
  }

  if (!authed || !user) {
    return json({ error: 'Invalid credentials' }, 401);
  }
  if (user.disabled) {
    return json({ error: 'Account disabled' }, 403);
  }

  const token = randomToken();
  const session = {
    username: user.username,
    isAdmin: !!user.isAdmin,
    createdAt: Date.now(),
    expires: Date.now() + (SESSION_TTL * 1000)
  };

  await env.TOKENS.put('session:' + token, JSON.stringify(session), {
    expirationTtl: SESSION_TTL
  });

  user.lastLogin = new Date().toISOString();
  await env.TOKENS.put('user:' + user.username, JSON.stringify(user));

  return json({
    token,
    expiresAt: session.expires,
    user: {
      username: user.username,
      displayName: user.displayName || user.username,
      isAdmin: !!user.isAdmin,
      permissions: user.permissions || {}
    }
  });
}

// ============================================================
// AUTH: APP-LOGIN (v3.5.0 — silent cloud sign-in)
// ------------------------------------------------------------
// The app (index.html v12.88-autosync, appAutoLogin) posts:
//     { username: '<lowercase app username>', hash: 'sha256:<hex>' }
// where hash is the user's passwordHash EXACTLY as stored in the
// hydroPro_users roster — which is already merge-synced into KV at
// data:<DATA_USER>:hydroPro_users. We validate against that roster
// and return the same { token, user } shape as /auth/login.
//
// Contract with the app (do not change lightly):
//   200 + {token}   -> app saves token, pulls then pushes
//   404 / 501       -> app assumes route not deployed, stays silent
//   any other code  -> counted as a failure; surfaces on the badge
//                      after 3 consecutive tries, using {error}
// ============================================================
function appDataUser(env) {
  // The single company dataset namespace. Same convention the
  // reports + fleetmap code already uses: env.REPORT_USER || 'eyal'.
  return (env.REPORT_USER || 'eyal').toLowerCase();
}

// Constant-time string compare (both args are short hash strings).
function timingSafeEqualStr(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function handleAppLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || '').trim().toLowerCase();
  const hash = String(body.hash || '').trim();

  if (!username || !hash) {
    return json({ error: 'username and hash required' }, 400);
  }

  // ---- 1. Load the roster the app already synced into the cloud ----
  const DATA_USER = appDataUser(env);
  const rosterRaw = await env.TOKENS.get('data:' + DATA_USER + ':hydroPro_users');
  if (!rosterRaw) {
    // Roster never pushed (fresh install). One manual connect as the
    // cloud admin seeds it; after that this route works for everyone.
    return json({ error: 'User roster not in cloud yet — connect once as admin first' }, 409);
  }

  let roster;
  try { roster = JSON.parse(rosterRaw); } catch (_) { roster = null; }
  // /sync/push stores localStorage values verbatim, so the roster is
  // normally a JSON array — but tolerate one level of double-encoding.
  if (typeof roster === 'string') {
    try { roster = JSON.parse(roster); } catch (_) { roster = null; }
  }
  if (!Array.isArray(roster)) {
    return json({ error: 'Cloud roster is unreadable' }, 500);
  }

  // ---- 2. Find the user + verify their app credentials ----
  const rosterUser = roster.find(u =>
    u && String(u.username || '').toLowerCase() === username);

  if (!rosterUser || !rosterUser.passwordHash) {
    return json({ error: 'Invalid credentials' }, 401);
  }
  if (rosterUser.active === false) {
    return json({ error: 'Account deactivated' }, 403);
  }
  if (!timingSafeEqualStr(hash, String(rosterUser.passwordHash))) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  // ---- 3. Ensure a cloud user record exists so getSession() works ----
  // NEVER overwrite a real cloud account (e.g. user:eyal holds the
  // cloud salt+passwordHash) — only create/update our own mirrors.
  const level = Number(rosterUser.level || 0);
  const role = String(rosterUser.role || '').toLowerCase();
  const isAdmin = (username === DATA_USER) || level >= 4 || role === 'admin';

  const existingRaw = await env.TOKENS.get('user:' + username);
  let cloudUser = null;
  if (existingRaw) {
    try { cloudUser = JSON.parse(existingRaw); } catch (_) { cloudUser = null; }
  }

  if (cloudUser && cloudUser.source !== 'app-login') {
    // Real cloud account (eyal, or any manually created cloud user):
    // leave the record untouched; just refuse if it is disabled.
    if (cloudUser.disabled) return json({ error: 'Account disabled' }, 403);
  } else {
    // Create or refresh the app-login mirror record.
    cloudUser = {
      username: username,
      displayName: rosterUser.fullname || rosterUser.username,
      isAdmin: isAdmin,
      disabled: false,
      source: 'app-login',
      dataNamespace: DATA_USER, // <- all app users share the company dataset
      // Match pre-v3.5 behaviour (every device used the admin token,
      // so uploads/deletes always worked). Tighten later if desired.
      permissions: { uploadFiles: true, deleteFiles: true },
      lastLogin: new Date().toISOString()
    };
    await env.TOKENS.put('user:' + username, JSON.stringify(cloudUser));
  }

  // ---- 4. Issue a session token exactly like /auth/login ----
  const token = randomToken();
  const session = {
    username: username,
    isAdmin: !!cloudUser.isAdmin,
    createdAt: Date.now(),
    expires: Date.now() + (SESSION_TTL * 1000)
  };
  await env.TOKENS.put('session:' + token, JSON.stringify(session), {
    expirationTtl: SESSION_TTL
  });

  return json({
    token,
    expiresAt: session.expires,
    user: {
      username: cloudUser.username,
      displayName: cloudUser.displayName || cloudUser.username,
      isAdmin: !!cloudUser.isAdmin,
      permissions: cloudUser.permissions || {}
    }
  });
}

// ============================================================
// AUTH: LOGOUT
// ============================================================
async function handleLogout(request, env) {
  const session = await getSession(request, env);
  if (session) {
    await env.TOKENS.delete('session:' + session.token);
  }
  return json({ ok: true });
}

// ============================================================
// AUTH: ME
// ============================================================
async function handleMe(request, env) {
  try {
    const session = await requireAuth(request, env);
    return json({
      username: session.user.username,
      displayName: session.user.displayName || session.user.username,
      isAdmin: !!session.user.isAdmin,
      permissions: session.user.permissions || {}
    });
  } catch (e) {
    return json({ error: e.message }, 401);
  }
}

// ============================================================
// ADMIN: LIST USERS
// ============================================================
async function handleListUsers(request, env) {
  try {
    await requireAdmin(request, env);
    const list = await env.TOKENS.list({ prefix: 'user:' });
    const users = [];
    for (const key of list.keys) {
      const raw = await env.TOKENS.get(key.name);
      if (raw) {
        const u = JSON.parse(raw);
        users.push({
          username: u.username,
          displayName: u.displayName || u.username,
          isAdmin: !!u.isAdmin,
          disabled: !!u.disabled,
          permissions: u.permissions || {},
          createdAt: u.createdAt,
          lastLogin: u.lastLogin
        });
      }
    }
    return json({ users });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// ADMIN: CREATE USER
// ============================================================
async function handleCreateUser(request, env) {
  try {
    await requireAdmin(request, env);
    const body = await request.json();
    const { username, password, displayName, isAdmin, permissions } = body;

    if (!username || !password) {
      return json({ error: 'Username and password required' }, 400);
    }
    if (username.length < 3) {
      return json({ error: 'Username too short' }, 400);
    }
    if (password.length < 6) {
      return json({ error: 'Password too short (min 6)' }, 400);
    }

    const key = 'user:' + username.toLowerCase();
    const existing = await env.TOKENS.get(key);
    if (existing) {
      return json({ error: 'User already exists' }, 409);
    }

    const salt = randomToken(16);
    const passwordHash = await hashPassword(password, salt);

    const user = {
      username: username.toLowerCase(),
      displayName: displayName || username,
      passwordHash,
      salt,
      isAdmin: !!isAdmin,
      disabled: false,
      permissions: permissions || {},
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    await env.TOKENS.put(key, JSON.stringify(user));
    return json({ ok: true, username: user.username });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// ADMIN: UPDATE USER
// ============================================================
async function handleUpdateUser(request, env, path) {
  try {
    await requireAdmin(request, env);
    const username = decodeURIComponent(path.split('/').pop()).toLowerCase();
    const body = await request.json();

    const key = 'user:' + username;
    const raw = await env.TOKENS.get(key);
    if (!raw) return json({ error: 'User not found' }, 404);

    const user = JSON.parse(raw);

    if ('displayName' in body) user.displayName = body.displayName;
    if ('isAdmin' in body) user.isAdmin = !!body.isAdmin;
    if ('disabled' in body) user.disabled = !!body.disabled;
    if ('permissions' in body) user.permissions = body.permissions || {};

    user.updatedAt = new Date().toISOString();
    await env.TOKENS.put(key, JSON.stringify(user));

    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// ADMIN: DELETE USER
// ============================================================
async function handleDeleteUser(request, env, path) {
  try {
    const session = await requireAdmin(request, env);
    const username = decodeURIComponent(path.split('/').pop()).toLowerCase();

    if (username === session.user.username) {
      return json({ error: "Can't delete yourself" }, 400);
    }

    await env.TOKENS.delete('user:' + username);
    const dataKeys = await env.TOKENS.list({ prefix: 'data:' + username + ':' });
    for (const k of dataKeys.keys) {
      await env.TOKENS.delete(k.name);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// ADMIN: RESET PASSWORD
// ============================================================
async function handleResetPassword(request, env, path) {
  try {
    await requireAdmin(request, env);
    const parts = path.split('/');
    const username = decodeURIComponent(parts[parts.length - 2]).toLowerCase();
    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return json({ error: 'Password too short (min 6)' }, 400);
    }

    const key = 'user:' + username;
    const raw = await env.TOKENS.get(key);
    if (!raw) return json({ error: 'User not found' }, 404);

    const user = JSON.parse(raw);
    user.salt = randomToken(16);
    user.passwordHash = await hashPassword(password, user.salt);
    user.passwordChangedAt = new Date().toISOString();

    await env.TOKENS.put(key, JSON.stringify(user));
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// SYNC: PULL
// ============================================================
async function handleSyncPull(request, env) {
  try {
    const session = await requireAuth(request, env);
    const url = new URL(request.url);
    const keysParam = url.searchParams.get('keys');
    const isShared = url.searchParams.get('shared') === '1';

    // v3.5.0: app-login sessions carry dataNamespace so every user
    // reads the ONE shared company dataset (data:eyal:*).
    const prefix = isShared
      ? 'data:_shared:'
      : 'data:' + (session.user.dataNamespace || session.user.username) + ':';

    const result = {};

    if (keysParam) {
      const keys = keysParam.split(',').map(k => k.trim()).filter(Boolean);
      for (const k of keys) {
        const raw = await env.TOKENS.get(prefix + k);
        if (raw) {
          try { result[k] = JSON.parse(raw); }
          catch { result[k] = raw; }
        }
      }
    } else {
      // v3.7.1: KV returns at most 1000 keys per list call — follow the cursor so a
      // dataset past 1000 stores is downloaded whole, not silently cut.
      let cursor;
      do {
        const list = await env.TOKENS.list({ prefix, cursor });
        for (const item of list.keys) {
          const k = item.name.substring(prefix.length);
          const raw = await env.TOKENS.get(item.name);
          if (raw) {
            try { result[k] = JSON.parse(raw); }
            catch { result[k] = raw; }
          }
        }
        cursor = list.list_complete ? undefined : list.cursor;
      } while (cursor);
    }

    return json({ data: result, count: Object.keys(result).length });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// SYNC: PUSH  (v3.7.0: keeps the previous value of every changed key)
// ============================================================
async function handleSyncPush(request, env) {
  try {
    const session = await requireAuth(request, env);
    const body = await request.json();
    const { data, shared } = body;

    if (!data || typeof data !== 'object') {
      return json({ error: 'data object required' }, 400);
    }

    // v3.5.0: app-login sessions write into the shared company dataset.
    const prefix = shared
      ? 'data:_shared:'
      : 'data:' + (session.user.dataNamespace || session.user.username) + ':';

    const written = [];
    const skipped = [];
    for (const [k, v] of Object.entries(data)) {
      const safeKey = String(k).replace(/[^a-zA-Z0-9_:.-]/g, '_').slice(0, 200);
      const value = typeof v === 'string' ? v : JSON.stringify(v);
      // v3.7.1: KV holds up to 25 MiB per value; 20 MB leaves room. A store above it is
      // NAMED in the reply (skipped) so the app keeps it as unsent instead of believing it synced.
      if (value.length > 20 * 1024 * 1024) {
        skipped.push({ key: safeKey, size: value.length, why: 'too-big' });
        continue;
      }
      // v3.7.0: keep the previous value before it is overwritten (never fails the push)
      await keepVersion(env, prefix + safeKey, value);
      await env.TOKENS.put(prefix + safeKey, value);
      written.push(safeKey);
    }

    return json({ ok: true, written: written.length, keys: written, skipped });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// SYNC: KEYS (list)
// ============================================================
async function handleSyncKeys(request, env) {
  try {
    const session = await requireAuth(request, env);
    const url = new URL(request.url);
    const isShared = url.searchParams.get('shared') === '1';

    // v3.5.0: app-login sessions list the shared company dataset.
    const prefix = isShared
      ? 'data:_shared:'
      : 'data:' + (session.user.dataNamespace || session.user.username) + ':';

    // v3.7.1: follow the cursor past 1000 keys
    const keys = [];
    let cursor;
    do {
      const list = await env.TOKENS.list({ prefix, cursor });
      list.keys.forEach(k => keys.push(k.name.substring(prefix.length)));
      cursor = list.list_complete ? undefined : list.cursor;
    } while (cursor);
    return json({ keys, count: keys.length });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// SYNC: VERSION HISTORY (v3.7.0, Data Safety v21.28)
// ------------------------------------------------------------
// Why: every data-loss incident in Nexi was one computer uploading a
// stale, seeded or restored copy that the clients then treated as the
// newest. The app blocks that at the source (v21.27/v21.28); this is
// the safety net UNDER it: the worker keeps the previous value of
// every key on each push, so any store can be put back from the cloud
// without hunting for a browser backup.
//
// KV layout (same TOKENS namespace):
//   ver:<fullKey>:<ts>   previous raw value (expires after 45 days)
//   verlist:<fullKey>    JSON array [{ts,size}] newest first (30 kept)
// where <fullKey> = 'data:<namespace>:<storeKey>' exactly as stored.
//
// Routes (same login token as /sync/pull, same namespace rule):
//   GET /sync/versions?key=<storeKey>          → { key, versions:[{ts,size}] }
//   GET /sync/version?key=<storeKey>&ts=<ts>   → { key, ts, value }
// ============================================================
const VER_KEEP = 30;
const VER_TTL = 45 * 24 * 60 * 60; // seconds

async function keepVersion(env, fullKey, incoming) {
  try {
    const prev = await env.TOKENS.get(fullKey);
    if (prev == null || prev === incoming) return;          // nothing stored yet / unchanged
    const now = Date.now();
    let list = [];
    try { list = JSON.parse(await env.TOKENS.get('verlist:' + fullKey) || '[]') || []; } catch (_) { list = []; }
    if (!Array.isArray(list)) list = [];
    await env.TOKENS.put('ver:' + fullKey + ':' + now, prev, { expirationTtl: VER_TTL });
    list.unshift({ ts: now, size: prev.length });
    for (const old of list.slice(VER_KEEP)) {
      try { await env.TOKENS.delete('ver:' + fullKey + ':' + old.ts); } catch (_) {}
    }
    await env.TOKENS.put('verlist:' + fullKey, JSON.stringify(list.slice(0, VER_KEEP)));
  } catch (_) { /* never fail a push because history could not be written */ }
}

function _verFullKey(session, url) {
  const isShared = url.searchParams.get('shared') === '1';
  const prefix = isShared
    ? 'data:_shared:'
    : 'data:' + (session.user.dataNamespace || session.user.username) + ':';
  const storeKey = String(url.searchParams.get('key') || '').replace(/[^a-zA-Z0-9_:.-]/g, '_').slice(0, 200);
  return { storeKey, fullKey: prefix + storeKey };
}

async function handleSyncVersions(request, env) {
  try {
    const session = await requireAuth(request, env);
    const url = new URL(request.url);
    const { storeKey, fullKey } = _verFullKey(session, url);
    if (!storeKey) return json({ error: '?key= is required' }, 400);
    let list = [];
    try { list = JSON.parse(await env.TOKENS.get('verlist:' + fullKey) || '[]') || []; } catch (_) { list = []; }
    if (!Array.isArray(list)) list = [];
    return json({ key: storeKey, versions: list });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

async function handleSyncVersion(request, env) {
  try {
    const session = await requireAuth(request, env);
    const url = new URL(request.url);
    const { storeKey, fullKey } = _verFullKey(session, url);
    const ts = String(url.searchParams.get('ts') || '').replace(/[^0-9]/g, '');
    if (!storeKey || !ts) return json({ error: '?key= and ?ts= are required' }, 400);
    const value = await env.TOKENS.get('ver:' + fullKey + ':' + ts);
    if (value == null) return json({ error: 'no such version' }, 404);
    return json({ key: storeKey, ts: +ts, value });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// DAILY SNAPSHOT to R2 (v3.7.0) — runs from the existing cron.
// Writes snap/<YYYY-MM-DD>.json into the UPLOADS bucket once per
// day (KV dedupe key), keeps 60 days. Same file shape as the app's
// "⬇ Download backup", so 📂 Backups → Restore from file accepts it.
// No-op when the UPLOADS binding is missing.
// ============================================================
async function runDailySnapshot(env) {
  if (!env.UPLOADS) return { skipped: true, reason: 'no-r2-binding' };
  const day = todayKey();
  const dedupeKey = 'snapdone:' + day;
  if (await env.TOKENS.get(dedupeKey)) return { skipped: true, reason: 'already-today' };
  const snap = {};
  let cursor = undefined, n = 0;
  do {
    const list = await env.TOKENS.list({ prefix: 'data:', cursor });
    for (const k of list.keys) {
      const raw = await env.TOKENS.get(k.name);
      if (raw != null) { snap[k.name.slice(5)] = raw; n++; }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  await env.UPLOADS.put('snap/' + day + '.json',
    JSON.stringify({ exportedAt: Date.now(), app: 'HydroNexis-AI', worker: WORKER_VERSION, data: snap }),
    { httpMetadata: { contentType: 'application/json' } });
  await env.TOKENS.put(dedupeKey, '1', { expirationTtl: 36 * 60 * 60 });
  // prune snapshots older than 60 days
  try {
    const old = await env.UPLOADS.list({ prefix: 'snap/' });
    const cutoff = new Date(Date.now() - 60 * 86400e3).toISOString().slice(0, 10);
    for (const o of (old.objects || [])) if (o.key.slice(5, 15) < cutoff) await env.UPLOADS.delete(o.key);
  } catch (_) {}
  return { ok: true, keys: n, day };
}

// ============================================================
// AI: ANALYZE  (cell deep-analysis + free-form Ask)
// ============================================================
const AI_SYSTEM_ANALYZE = "You are HydroNexis-AI, the senior operations analyst for ABA Pardes Agritech, a hydroponic greenhouse operation (greenhouses GH1-GH10 plus indoor projects). You are given the current state of ONE monitoring cell (its items, statuses and notes). Respond with ONLY a single minified JSON object - no markdown, no backticks, no preamble - with EXACTLY these keys: {\"monitoring\":\"one short line on what is being watched\",\"conclusion\":\"what the data means right now\",\"recommendation\":\"the single most useful next action\",\"pastExperience\":\"a brief relevant operational pattern or rule of thumb\",\"severity\":\"ok|watch|warn|critical\"}. Keep each string under 200 characters. severity MUST be exactly one of: ok, watch, warn, critical.";
const AI_SYSTEM_ASK = "You are HydroNexis-AI, the senior operations analyst for ABA Pardes Agritech, a hydroponic greenhouse operation (greenhouses GH1-GH10 plus indoor projects). You are given the current state of one monitoring cell as context, plus a question from the operator. Be concise and practical. Briefly analyze, give a clear conclusion, recommend the next action, then ask ONE short clarifying question only if useful. Plain text only - no markdown headers.";

async function handleAiAnalyze(request, env) {
  try {
    await requireAuth(request, env);
  } catch (e) {
    return json({ error: e.message || 'Unauthorized' }, 401);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'AI is not configured. Set the ANTHROPIC_API_KEY secret on this worker.' }, 503);
  }

  const body = await request.json().catch(() => ({}));

  let context = '';
  if (body.context != null) {
    context = (typeof body.context === 'string') ? body.context : JSON.stringify(body.context);
  }
  context = context.slice(0, 12000);

  const question = (body.question == null ? '' : String(body.question)).slice(0, 2000);
  const askMode = question.trim().length > 0;

  if (!context && !askMode) {
    return json({ error: 'context required' }, 400);
  }

  const model = env.AI_MODEL || 'claude-sonnet-4-6';
  const system = askMode ? AI_SYSTEM_ASK : AI_SYSTEM_ANALYZE;
  const userContent = askMode
    ? ('CELL CONTEXT:\n' + context + '\n\nOPERATOR QUESTION:\n' + question)
    : ('CELL CONTEXT:\n' + context);

  let aiResp;
  try {
    aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: userContent }]
      })
    });
  } catch (e) {
    return json({ error: 'AI request failed: ' + (e && e.message ? e.message : String(e)) }, 502);
  }

  if (!aiResp.ok) {
    const errText = await aiResp.text().catch(() => '');
    return json({ error: 'AI error ' + aiResp.status, detail: errText.slice(0, 500) }, 502);
  }

  const data = await aiResp.json().catch(() => ({}));
  const text = (Array.isArray(data.content) ? data.content : [])
    .filter(b => b && b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();

  if (askMode) {
    return json({ answer: text || '(no answer)', ts: Date.now() });
  }

  let analysis = null;
  try {
    const clean = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    analysis = JSON.parse(clean);
  } catch (e) {
    analysis = null;
  }
  if (!analysis || typeof analysis !== 'object') {
    analysis = {
      monitoring: '',
      conclusion: text.slice(0, 400),
      recommendation: '',
      pastExperience: '',
      severity: 'watch'
    };
  }
  const sev = ['ok', 'watch', 'warn', 'critical'].includes(analysis.severity) ? analysis.severity : 'watch';
  return json({
    analysis: {
      monitoring: String(analysis.monitoring || ''),
      conclusion: String(analysis.conclusion || ''),
      recommendation: String(analysis.recommendation || ''),
      pastExperience: String(analysis.pastExperience || ''),
      severity: sev
    },
    ts: Date.now()
  });
}

// ============================================================
// BACKUP: CREATE
// ============================================================
async function handleBackupCreate(request, env) {
  try {
    const session = await requireAdmin(request, env);

    const backup = {
      createdAt: new Date().toISOString(),
      createdBy: session.user.username,
      users: {},
      shared: {}
    };

    const userList = await env.TOKENS.list({ prefix: 'user:' });
    for (const k of userList.keys) {
      const raw = await env.TOKENS.get(k.name);
      if (raw) backup.users[k.name.substring(5)] = JSON.parse(raw);
    }

    backup.data = {};
    const dataList = await env.TOKENS.list({ prefix: 'data:' });
    for (const k of dataList.keys) {
      const raw = await env.TOKENS.get(k.name);
      if (raw) {
        try { backup.data[k.name] = JSON.parse(raw); }
        catch { backup.data[k.name] = raw; }
      }
    }

    const backupKey = 'backup:' + todayKey();
    await env.TOKENS.put(backupKey, JSON.stringify(backup));

    const backupList = await env.TOKENS.list({ prefix: 'backup:' });
    const sorted = backupList.keys.sort((a, b) => b.name.localeCompare(a.name));
    if (sorted.length > BACKUP_RETENTION) {
      for (let i = BACKUP_RETENTION; i < sorted.length; i++) {
        await env.TOKENS.delete(sorted[i].name);
      }
    }

    return json({ ok: true, backupKey, size: JSON.stringify(backup).length });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// BACKUP: DOWNLOAD
// ============================================================
async function handleBackupDownload(request, env) {
  try {
    await requireAdmin(request, env);
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || todayKey();
    const backupKey = 'backup:' + date;
    const raw = await env.TOKENS.get(backupKey);
    if (!raw) {
      const liveBackup = await collectLiveBackup(env);
      return new Response(JSON.stringify(liveBackup, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="hydronexis-backup-${todayKey()}.json"`
        }
      });
    }
    return new Response(raw, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="hydronexis-backup-${date}.json"`
      }
    });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

async function collectLiveBackup(env) {
  const backup = {
    createdAt: new Date().toISOString(),
    users: {},
    data: {}
  };
  const userList = await env.TOKENS.list({ prefix: 'user:' });
  for (const k of userList.keys) {
    const raw = await env.TOKENS.get(k.name);
    if (raw) backup.users[k.name.substring(5)] = JSON.parse(raw);
  }
  const dataList = await env.TOKENS.list({ prefix: 'data:' });
  for (const k of dataList.keys) {
    const raw = await env.TOKENS.get(k.name);
    if (raw) {
      try { backup.data[k.name] = JSON.parse(raw); }
      catch { backup.data[k.name] = raw; }
    }
  }
  return backup;
}

// ============================================================
// BACKUP: RESTORE
// ============================================================
async function handleBackupRestore(request, env) {
  try {
    await requireAdmin(request, env);
    const body = await request.json();
    const { backup, mode } = body;

    if (!backup || typeof backup !== 'object') {
      return json({ error: 'backup object required' }, 400);
    }

    if (mode === 'replace') {
      const userList = await env.TOKENS.list({ prefix: 'user:' });
      for (const k of userList.keys) await env.TOKENS.delete(k.name);
      const dataList = await env.TOKENS.list({ prefix: 'data:' });
      for (const k of dataList.keys) await env.TOKENS.delete(k.name);
    }

    let usersRestored = 0;
    let dataRestored = 0;

    if (backup.users) {
      for (const [username, user] of Object.entries(backup.users)) {
        await env.TOKENS.put('user:' + username, JSON.stringify(user));
        usersRestored++;
      }
    }
    if (backup.data) {
      for (const [key, value] of Object.entries(backup.data)) {
        const v = typeof value === 'string' ? value : JSON.stringify(value);
        await env.TOKENS.put(key, v);
        dataRestored++;
      }
    }

    return json({ ok: true, usersRestored, dataRestored });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// EXISTING: QUICKBOOKS CUSTOMERS
// ============================================================
async function handleQBCustomers(request, env) {
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey !== env.API_KEY) {
    return json({ error: 'Invalid API key' }, 401);
  }
  return json({ ok: true, note: 'QB endpoint — keep existing v2.2 logic' });
}

// ============================================================
// EXISTING: PATCH LOADER
// ============================================================
async function handlePatchLoader(request, env) {
  const patches = await env.TOKENS.get('patches:latest');
  if (!patches) {
    return new Response('// no patches', {
      status: 200,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
  return new Response(patches, {
    status: 200,
    headers: { 'Content-Type': 'application/javascript' }
  });
}

// ============================================================
// ONE-TIME ADMIN SEED — DELETE AFTER USE
// ============================================================
async function handleSeedAdmin(request, env) {
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey !== env.API_KEY) {
    return json({ error: 'Invalid API key' }, 401);
  }

  const list = await env.TOKENS.list({ prefix: 'user:' });
  for (const k of list.keys) {
    const raw = await env.TOKENS.get(k.name);
    if (raw) {
      const u = JSON.parse(raw);
      if (u.isAdmin) {
        return json({
          error: 'Admin already exists. For security, this endpoint is now disabled. Delete it from worker code.',
          existingAdmin: u.username
        }, 409);
      }
    }
  }

  const body = await request.json().catch(() => ({}));
  const { username, password, displayName } = body;
  if (!username || !password) {
    return json({ error: 'username and password required' }, 400);
  }
  if (password.length < 6) {
    return json({ error: 'Password too short (min 6 chars)' }, 400);
  }

  const salt = randomToken(16);
  const passwordHash = await hashPassword(password, salt);
  const user = {
    username: username.toLowerCase(),
    displayName: displayName || username,
    passwordHash,
    salt,
    isAdmin: true,
    disabled: false,
    permissions: {},
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  await env.TOKENS.put('user:' + user.username, JSON.stringify(user));
  return json({
    ok: true,
    username: user.username,
    note: 'Admin user created. IMPORTANT: Now remove the /seed-admin route from your worker code.'
  });
}

// ============================================================
// SCHEDULED REPORTS — fully automatic email
// ============================================================
const REPORT_USER_DEFAULT = 'eyal';

function _phNow() { return new Date(Date.now() + 8 * 60 * 60 * 1000); }
function _phDateStr(d) { return d.toISOString().slice(0, 10); }
function _esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

async function _readData(env, user, key, fallback) {
  try {
    const raw = await env.TOKENS.get('data:' + user + ':' + key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  } catch (e) { return fallback; }
}

function _reportRange(sched, phNow) {
  const map = { last_day: 1, last_7_days: 7, last_30_days: 30, last_90_days: 90, last_365_days: 365 };
  const byFreq = { daily: 1, weekly: 7, monthly: 30, quarterly: 90, yearly: 365 };
  const days = map[sched.dateRange] || byFreq[sched.frequency] || 1;
  const dates = []; const end = new Date(phNow);
  for (let i = days - 1; i >= 0; i--) { const d = new Date(end); d.setUTCDate(end.getUTCDate() - i); dates.push(_phDateStr(d)); }
  return { dates: dates, days: days, label: dates.length === 1 ? dates[0] : (dates[0] + ' → ' + dates[dates.length - 1]) };
}

function _isDue(sched, phNow) {
  if (sched.enabled === false) return false;
  const parts = String(sched.time || '08:00').split(':');
  const schedMin = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  const nowMin = phNow.getUTCHours() * 60 + phNow.getUTCMinutes();
  if (nowMin < schedMin) return false;
  const dow = phNow.getUTCDay(), dom = phNow.getUTCDate(), mon = phNow.getUTCMonth();
  switch (sched.frequency) {
    case 'daily':   return (Array.isArray(sched.weekdays) && sched.weekdays.length) ? sched.weekdays.indexOf(dow) !== -1 : true;
    case 'weekly':  return Array.isArray(sched.weekdays) ? sched.weekdays.indexOf(dow) !== -1 : true;
    case 'monthly': return dom === (sched.monthDay || 1);
    case 'quarterly': return dom === (sched.monthDay || 1) && [0,3,6,9].indexOf(mon) !== -1;
    case 'yearly':  return dom === (sched.monthDay || 1) && mon === (sched.month != null ? sched.month : 0);
    default: return false;
  }
}

function _inRange(ts, dateSet) {
  if (ts == null) return true;
  const ds = (typeof ts === 'number') ? new Date(ts + 8 * 3600 * 1000).toISOString().slice(0, 10) : String(ts).slice(0, 10);
  return !!dateSet[ds];
}

async function buildDigest(env, user, range, sched) {
  const dateSet = {}; range.dates.forEach(function (d) { dateSet[d] = 1; });
  const issuesRaw = await _readData(env, user, 'hydroPro_issues_v2', []);
  const cratesRaw = await _readData(env, user, 'hydroPro_crates_v1', []);
  const issues = Array.isArray(issuesRaw) ? issuesRaw : [];
  const crates = Array.isArray(cratesRaw) ? cratesRaw : [];
  const inIss = issues.filter(function (i) { return _inRange(i.createdAt || i.ts || i.date, dateSet); });
  let crit = 0, warn = 0, open = 0, closed = 0; const byCat = {};
  inIss.forEach(function (i) {
    const sev = String(i.severity || '').toLowerCase();
    if (sev === 'critical' || sev === 'danger') crit++; else if (sev) warn++;
    const s = String(i.status || '').toLowerCase();
    if (['approved','resolved','closed','cancelled','done'].indexOf(s) !== -1) closed++; else open++;
    const c = i.category || i.cat || 'Uncategorized'; byCat[c] = (byCat[c] || 0) + 1;
  });
  let harvestKg = 0, harvestCount = 0;
  crates.forEach(function (c) { const h = (c.contents || {}).harvestDate; if (h && _inRange(h, dateSet)) { harvestKg += (+(c.contents || {}).weightKg || 0); harvestCount++; } });
  const catRows = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; }).slice(0, 10)
    .map(function (k) { return '<tr><td style="padding:6px 8px;border:1px solid #ddd;">' + _esc(k) + '</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">' + byCat[k] + '</td></tr>'; }).join('');
  const base = env.REPORT_BASE_URL || 'https://aba-pardes-monitoring.netlify.app';
  const kpi = function (v, l, col) { return '<td style="padding:14px;border:1px solid #e0e0e0;border-radius:10px;text-align:center;"><div style="font-size:24px;font-weight:800;color:' + col + ';font-family:monospace;">' + v + '</div><div style="font-size:11px;color:#666;">' + l + '</div></td>'; };
  const html = '<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#222;">' +
    '<div style="background:#0d2818;color:#7fd68a;padding:16px 20px;border-radius:12px 12px 0 0;"><div style="font-size:18px;font-weight:800;">🌱 HydroNexis-AI · ' + _esc(sched.name || 'Operations Report') + '</div><div style="font-size:12px;opacity:.85;">ABA Pardes Philippines · ' + _esc(range.label) + '</div></div>' +
    '<div style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 12px 12px;padding:18px 20px;">' +
    '<table style="width:100%;border-collapse:separate;border-spacing:8px;"><tr>' +
    kpi(inIss.length, 'Flagged issues', '#1565c0') + kpi(crit, 'Critical', '#c62828') + kpi(open, 'Still open', '#ef6c00') + kpi(harvestKg.toFixed(0) + 'kg', 'Harvest', '#2e7d32') +
    '</tr></table>' +
    (catRows ? '<h3 style="font-size:14px;margin:18px 0 6px;">Issues by category</h3><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px 8px;border:1px solid #ddd;background:#f5f5f5;">Category</th><th style="text-align:right;padding:6px 8px;border:1px solid #ddd;background:#f5f5f5;">Count</th></tr></thead><tbody>' + catRows + '</tbody></table>' : '<p style="color:#888;">No flagged issues in this period. 🎉</p>') +
    '<p style="margin-top:18px;"><a href="' + base + '" style="background:#2e7d32;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Open full reports →</a></p>' +
    '<p style="font-size:11px;color:#999;margin-top:16px;">Sent automatically by HydroNexis-AI. ' + closed + ' issues closed · ' + harvestCount + ' harvest events in period.</p>' +
    '</div></div>';
  const subject = '[HydroNexis] ' + (sched.name || 'Report') + ' — ' + range.label + ' · ' + crit + ' critical, ' + open + ' open';
  return { subject: subject, html: html };
}

async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY) { console.log('[reports] RESEND_API_KEY missing'); return false; }
  const from = env.REPORT_FROM || 'HydroNexis <onboarding@resend.dev>';
  const recipients = Array.isArray(to) ? to : [to];
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: from, to: recipients, subject: subject, html: html })
    });
    if (!res.ok) { console.log('[reports] resend ' + res.status, await res.text()); return false; }
    return true;
  } catch (e) { console.log('[reports] send error', e && e.message); return false; }
}

async function runScheduledReports(env, opts) {
  opts = opts || {};
  const user = env.REPORT_USER || REPORT_USER_DEFAULT;
  const phNow = _phNow(); const phDate = _phDateStr(phNow);
  const sRaw = await _readData(env, user, 'hydroPro_report_schedules', []);
  const schedules = Array.isArray(sRaw) ? sRaw : [];
  let sent = 0, checked = 0, due = 0;
  for (const sched of schedules) {
    checked++;
    if (!(opts.force || _isDue(sched, phNow))) continue;
    due++;
    const dedupeKey = 'rptsent:' + (sched.id || 'x') + ':' + phDate;
    if (!opts.force && (await env.TOKENS.get(dedupeKey))) continue;
    const recipients = (sched.recipients || []).filter(function (r) { return /@abapardes\.com\.ph$/i.test(String(r)); });
    if (!recipients.length) continue;
    const range = _reportRange(sched, phNow);
    const built = await buildDigest(env, user, range, sched);
    if (await sendEmail(env, recipients, built.subject, built.html)) {
      sent++;
      await env.TOKENS.put(dedupeKey, '1', { expirationTtl: 2 * 24 * 60 * 60 });
    }
  }
  return { checked: checked, due: due, sent: sent };
}

async function handleReportRun(request, env) {
  try { await requireAdmin(request, env); const res = await runScheduledReports(env, {}); return json({ ok: true, ...res }); }
  catch (e) { return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500); }
}

async function handleReportTest(request, env) {
  try {
    const session = await requireAuth(request, env);
    const body = await request.json().catch(function () { return {}; });
    const to = (body.to && /@abapardes\.com\.ph$/i.test(String(body.to))) ? body.to : null;
    if (!to) return json({ error: 'Provide {"to":"name@abapardes.com.ph"}' }, 400);
    const user = env.REPORT_USER || REPORT_USER_DEFAULT;
    const range = _reportRange({ frequency: 'daily', dateRange: 'last_7_days' }, _phNow());
    const built = await buildDigest(env, user, range, { name: 'TEST Report' });
    const ok = await sendEmail(env, [to], '[TEST] ' + built.subject, built.html);
    return json({ ok: ok, to: to, sentBy: session.user.username, note: ok ? 'Check your inbox' : 'Check RESEND_API_KEY / REPORT_FROM' });
  } catch (e) { return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500); }
}

// ============================================================
// SOS INVENTORY OAUTH + PROXY (v3.1, added 2026-05-29)
// ------------------------------------------------------------
// Endpoints:
//   POST /sos/oauth/start       - Returns the SOS authorize URL
//   GET  /sos/oauth/callback    - Browser redirect target, stores tokens
//   POST /sos/oauth/disconnect  - Wipes stored SOS tokens
//   GET  /sos/items|locations|lots|shipments - Proxies to SOS API
//   GET  /sos/sales-orders|customers|invoices|item-receipts - read-only lists [v3.7.0]
// Required worker secrets: SOS_CLIENT_ID, SOS_CLIENT_SECRET
// Single-tenant: ONE SOS connection per worker (KV key 'sos_tokens')
// ============================================================
const SOS_AUTHORIZE_URL = 'https://api.sosinventory.com/oauth2/authorize';
const SOS_TOKEN_URL     = 'https://api.sosinventory.com/oauth2/token';
const SOS_API_BASE      = 'https://api.sosinventory.com/api/v2';
const SOS_REDIRECT_URI  = 'https://hnx-sync.eyalbenari99.workers.dev/sos/oauth/callback';
const SOS_TOKEN_KV_KEY  = 'sos_tokens';

async function handleSosRoute(request, env, path) {
  if (path === '/sos/oauth/callback' && request.method === 'GET') {
    return await handleSosOauthCallback(request, env);
  }
  try { await requireAuth(request, env); }
  catch (e) { return json({ error: 'Unauthorized' }, 401); }

  if (path === '/sos/oauth/start' && (request.method === 'POST' || request.method === 'GET')) {
    return handleSosOauthStart(request, env);
  }
  if (path === '/sos/oauth/disconnect' && request.method === 'POST') {
    return handleSosOauthDisconnect(request, env);
  }
  if (path === '/sos/items'     && request.method === 'GET') return handleSosProxy(request, env, '/items');
  if (path === '/sos/locations' && request.method === 'GET') return handleSosProxy(request, env, '/locations');
  if (path === '/sos/lots'      && request.method === 'GET') return handleSosProxy(request, env, '/lots');
  if (path === '/sos/shipments' && request.method === 'GET') return handleSosProxy(request, env, '/shipments');
  if (path === '/sos/purchase-orders' && request.method === 'GET') return handleSosProxy(request, env, '/purchase-orders'); // v3.2.2 open-PO lookup
  // --- v3.7.0 read-only lists (Supply Plan, CRM, Harvest) ---
  if (path === '/sos/sales-orders'  && request.method === 'GET') return handleSosList(request, env, 'salesorder',  'salesorders');
  if (path === '/sos/customers'     && request.method === 'GET') return handleSosList(request, env, 'customer',    'customers');
  if (path === '/sos/invoices'      && request.method === 'GET') return handleSosList(request, env, 'invoice',     'invoices');
  if (path === '/sos/item-receipts' && request.method === 'GET') return handleSosList(request, env, 'itemreceipt', 'itemreceipts');
  // --- v3.2.0 SOS write endpoints (item-request post-back). POST only. ---
  if (path === '/sos/create-inventory-issue' && request.method === 'POST') return handleSosWrite(request, env, '/inventory-issue');
  if (path === '/sos/create-shipment'        && request.method === 'POST') return handleSosWrite(request, env, '/shipment');
  if (path === '/sos/create-transfer'        && request.method === 'POST') return handleSosWrite(request, env, '/transfer');
  if (path === '/sos/create-po'              && request.method === 'POST') return handleSosWrite(request, env, '/po');
  if (path === '/sos/create-adjustment'      && request.method === 'POST') return handleSosWrite(request, env, '/adjustment');
  if (path === '/sos/create-receipt'         && request.method === 'POST') return handleSosWrite(request, env, '/receipt');
  return json({ error: 'SOS route not found: ' + path }, 404);
}

async function handleSosOauthStart(request, env) {
  if (!env.SOS_CLIENT_ID) return json({ error: 'SOS_CLIENT_ID not configured on worker' }, 500);
  const state = randomToken(16);
  await env.TOKENS.put('sos_state:' + state, '1', { expirationTtl: 600 });
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.SOS_CLIENT_ID,
    redirect_uri: SOS_REDIRECT_URI,
    state
  });
  return json({ authUrl: SOS_AUTHORIZE_URL + '?' + params.toString() });
}

async function handleSosOauthCallback(request, env) {
  const url = new URL(request.url);
  const code  = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errParam = url.searchParams.get('error');

  if (errParam) return sosCallbackHtmlResponse({ status: 'error', error: 'SOS returned: ' + errParam });
  if (!code || !state) return sosCallbackHtmlResponse({ status: 'error', error: 'Missing code or state' });

  const stateOk = await env.TOKENS.get('sos_state:' + state);
  if (!stateOk) return sosCallbackHtmlResponse({ status: 'error', error: 'Invalid or expired state — try Connect again' });
  await env.TOKENS.delete('sos_state:' + state);

  if (!env.SOS_CLIENT_ID || !env.SOS_CLIENT_SECRET) {
    return sosCallbackHtmlResponse({ status: 'error', error: 'SOS_CLIENT_ID or SOS_CLIENT_SECRET not configured' });
  }

  const body = new URLSearchParams({
    grant_type:    'authorization_code',
    code,
    client_id:     env.SOS_CLIENT_ID,
    client_secret: env.SOS_CLIENT_SECRET,
    redirect_uri:  SOS_REDIRECT_URI
  });
  let tokenRes, tokenJson;
  try {
    tokenRes = await fetch(SOS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body
    });
    tokenJson = await tokenRes.json();
  } catch (e) {
    return sosCallbackHtmlResponse({ status: 'error', error: 'Token endpoint call failed: ' + e.message });
  }
  if (!tokenRes.ok || !tokenJson.access_token) {
    return sosCallbackHtmlResponse({ status: 'error', error: 'SOS token exchange failed: ' + JSON.stringify(tokenJson).slice(0, 300) });
  }

  const tokens = {
    accessToken:  tokenJson.access_token,
    refreshToken: tokenJson.refresh_token || null,
    expiresAt:    Date.now() + ((tokenJson.expires_in || 3600) * 1000) - 60000,
    accountInfo:  null,
    connectedAt:  new Date().toISOString()
  };
  await env.TOKENS.put(SOS_TOKEN_KV_KEY, JSON.stringify(tokens));
  return sosCallbackHtmlResponse({ status: 'success' });
}

async function handleSosOauthDisconnect(request, env) {
  await env.TOKENS.delete(SOS_TOKEN_KV_KEY);
  return json({ ok: true });
}

async function sosLoadTokens(env) {
  const raw = await env.TOKENS.get(SOS_TOKEN_KV_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

async function sosRefreshIfNeeded(env, tokens) {
  if (tokens.expiresAt > Date.now() + 30000) return tokens;
  if (!tokens.refreshToken) {
    throw new Error('SOS access token expired and no refresh_token — please reconnect via Admin → SOS Inventory Sync');
  }
  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: tokens.refreshToken,
    client_id:     env.SOS_CLIENT_ID,
    client_secret: env.SOS_CLIENT_SECRET
  });
  const res = await fetch(SOS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body
  });
  const j = await res.json();
  if (!res.ok || !j.access_token) {
    throw new Error('SOS token refresh failed: ' + JSON.stringify(j).slice(0, 300));
  }
  const updated = {
    accessToken:  j.access_token,
    refreshToken: j.refresh_token || tokens.refreshToken,
    expiresAt:    Date.now() + ((j.expires_in || 3600) * 1000) - 60000,
    accountInfo:  tokens.accountInfo,
    connectedAt:  tokens.connectedAt
  };
  await env.TOKENS.put(SOS_TOKEN_KV_KEY, JSON.stringify(updated));
  return updated;
}

// ---- v3.7.0: one read-only SOS list page (the app pages itself) ----
// GET /sos/<route>?start=1&maxresults=200[&open=true][&from=YYYY-MM-DD&to=YYYY-MM-DD]
//   sales-orders  → /salesorder   → { salesorders:[...] }   (Supply Plan, CRM Orders)
//   customers     → /customer     → { customers:[...] }     (CRM ↔ SOS recon)
//   invoices      → /invoice      → { invoices:[...] }      (CRM Sales Analytics)
//   item-receipts → /itemreceipt  → { itemreceipts:[...] }  (🌾 Harvest)
// READ-ONLY: GET only, nothing is written to SOS. ?open=true → status=open;
// ?from/?to → fromDate/toDate (accounts that ignore them still work: the app filters too).
async function handleSosList(request, env, sosEntity, outKey) {
  let tokens = await sosLoadTokens(env);
  if (!tokens) return json({ error: 'SOS not connected — connect at Admin → SOS Inventory Sync' }, 409);
  try { tokens = await sosRefreshIfNeeded(env, tokens); }
  catch (e) { return json({ error: e.message }, 401); }

  const q = new URL(request.url).searchParams;
  const start = String(parseInt(q.get('start') || '1', 10) || 1);
  const max = Math.min(parseInt(q.get('maxresults') || '200', 10) || 200, 200);
  const sosUrl = new URL(SOS_API_BASE + '/' + sosEntity);
  sosUrl.searchParams.set('start', start);
  sosUrl.searchParams.set('maxresults', String(max));
  if (sosEntity !== 'customer' && q.get('open')) sosUrl.searchParams.set('status', 'open');
  if (sosEntity !== 'customer' && q.get('from')) sosUrl.searchParams.set('fromDate', q.get('from'));
  if (sosEntity !== 'customer' && q.get('to'))   sosUrl.searchParams.set('toDate',   q.get('to'));

  let r, txt;
  try {
    r = await fetch(sosUrl.toString(), { headers: { 'Authorization': 'Bearer ' + tokens.accessToken, 'Accept': 'application/json' } });
    txt = await r.text();
  } catch (e) {
    return json({ error: 'SOS upstream fetch failed: ' + e.message }, 502);
  }
  if (!r.ok) return json({ error: 'SOS ' + r.status, detail: txt.slice(0, 300) }, 502);
  let body; try { body = JSON.parse(txt); } catch (_) { body = { raw: txt }; }
  const rows = Array.isArray(body) ? body : (body.data || body[outKey] || []);
  const out = {};
  out[outKey] = rows;
  out.count = Array.isArray(rows) ? rows.length : 0;
  if (body && body.totalCount != null) out.totalCount = body.totalCount;
  return json(out);
}

// Maps friendly plural paths (used by HydroNexis-AI app) to SOS's singular endpoint names.
// SOS API uses /item, /location, /lot, /shipment (singular) — not plural.
const SOS_PATH_MAP = {
  '/items':     { sos: '/item',          key: 'items' },
  '/locations': { sos: '/location',      key: 'locations' },
  '/lots':      { sos: '/lot',           key: 'lots' },
  '/shipments': { sos: '/shipment',      key: 'shipments' },
  '/purchase-orders': { sos: '/purchaseorder', key: 'purchaseorders' }  // v3.2.2 — open-PO lookup (read-only)
};

// ====== v3.2.0 SOS WRITE (item-request post-back) ======
// Maps the app's friendly endpoints to SOS API v2 document paths.
// IMPORTANT: SOS API v2 expects document-specific JSON schemas. The app sends a
// generic request shape; the field mapping to each SOS document must be VERIFIED
// in the SOS sandbox before relying on auto-post. Until then, non-2xx responses
// bubble back to the app, which falls back to manual SOS-reference entry.
const SOS_WRITE_MAP = {
  '/inventory-issue': '/adjustment',        // SOS has no direct "issue" — a stock issue is a negative Adjustment. VERIFY.
  '/shipment':        '/shipment',          // most common — ship items out
  '/transfer':        '/transfer',          // asset deployment + stock transfer both map here
  '/po':              '/purchaseorder',
  '/adjustment':      '/adjustment',
  '/receipt':         '/receivinginventory'  // VERIFY exact path/schema in SOS API v2 docs.
};
async function handleSosWrite(request, env, friendlyPath) {
  let tokens = await sosLoadTokens(env);
  if (!tokens) return json({ error: 'Not connected to SOS — connect at Admin → SOS Inventory Sync' }, 401);
  try { tokens = await sosRefreshIfNeeded(env, tokens); }
  catch (e) { return json({ error: e.message }, 401); }

  const sosPath = SOS_WRITE_MAP[friendlyPath] || friendlyPath;
  let body = {};
  try { body = await request.json(); } catch (e) {}

  // TODO(verify): transform `body` (generic app shape) → SOS v2 document schema here.
  const res = await fetch(SOS_API_BASE + sosPath, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + tokens.accessToken, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body)
  });
  const txt = await res.text();
  let parsed; try { parsed = JSON.parse(txt); } catch (e) { parsed = { raw: txt }; }
  if (!res.ok) return json({ error: 'SOS write failed', status: res.status, detail: parsed }, (res.status >= 400 && res.status < 600) ? res.status : 502);
  const ref = parsed && (parsed.id || parsed.number || parsed.transactionId || (parsed.data && (parsed.data.id || parsed.data.number)));
  return json({ ok: true, ref: ref || null, data: parsed });
}

async function handleSosProxy(request, env, friendlyPath) {
  let tokens = await sosLoadTokens(env);
  if (!tokens) return json({ error: 'Not connected to SOS — visit Admin → SOS Inventory Sync to connect' }, 401);

  try { tokens = await sosRefreshIfNeeded(env, tokens); }
  catch (e) { return json({ error: e.message }, 401); }

  const mapping = SOS_PATH_MAP[friendlyPath] || { sos: friendlyPath, key: 'data' };
  const inbound  = new URL(request.url);

  // ----- PAGINATION CONFIG -----
  // SOS API caps maxresults at 200 per page.
  // Cloudflare Workers Free tier caps subrequests at 50 per request.
  // We reserve some headroom for auth refresh etc., so cap at 45 pages = 9,000 items per sync call.
  // For larger catalogs, the app can call /sos/items?start=9001 etc. to get the next batch.
  const PAGE_SIZE = 200;
  const MAX_PAGES = 45;
  const INTER_PAGE_DELAY_MS = 120;
  const MAX_THROTTLE_RETRIES = 4;
  const THROTTLE_BASE_DELAY_MS = 800;

  // Honor optional ?start=N (resume from a specific offset, 1-indexed)
  let currentStart = parseInt(inbound.searchParams.get('start'), 10) || 1;
  // Honor optional ?limit=N as TOTAL desired items (across all pages)
  const clientLimit = parseInt(inbound.searchParams.get('limit'), 10) || 0;

  // Build base URL preserving caller's filter params (e.g. from=YYYY-MM-DD for shipments)
  const baseUrl = new URL(SOS_API_BASE + mapping.sos);
  for (const [k, v] of inbound.searchParams.entries()) {
    if (k === 'limit' || k === 'start' || k === 'maxresults') continue;
    baseUrl.searchParams.set(k, v);
  }
  baseUrl.searchParams.set('maxresults', String(PAGE_SIZE));

  let allData = [];
  let totalCount = null;
  let pageCount = 0;
  let throttleHits = 0;
  let lastStatus = 'ok';

  while (pageCount < MAX_PAGES) {
    baseUrl.searchParams.set('start', String(currentStart));

    // --- Fetch one page with throttle retry ---
    let res, bodyText, attempt = 0;
    while (true) {
      attempt++;
      try {
        res = await fetch(baseUrl.toString(), {
          headers: { 'Authorization': 'Bearer ' + tokens.accessToken, 'Accept': 'application/json' }
        });
        bodyText = await res.text();
      } catch (e) {
        return json({ error: 'SOS upstream fetch failed on page ' + (pageCount+1) + ': ' + e.message }, 502);
      }
      const isThrottle = (res.status === 429) ||
                         (res.status === 400 && /throttle/i.test(bodyText));
      if (!isThrottle || attempt >= MAX_THROTTLE_RETRIES) break;
      throttleHits++;
      await new Promise(r => setTimeout(r, THROTTLE_BASE_DELAY_MS * Math.pow(2, attempt - 1)));
    }

    if (!res.ok) {
      // If we already accumulated some pages, return partial success instead of total failure
      if (allData.length > 0) {
        const out = {};
        out[mapping.key] = allData;
        out.count = allData.length;
        out.totalCount = totalCount;
        out.pagesFetched = pageCount;
        out.throttleHits = throttleHits;
        out.partial = true;
        out.partialReason = 'SOS API ' + res.status + ' on page ' + (pageCount+1) + ': ' + bodyText.slice(0, 150);
        return json(out);
      }
      return json({
        error: 'SOS API ' + res.status,
        detail: bodyText.slice(0, 300),
        pageAttempted: pageCount + 1,
        throttleHits: throttleHits
      }, res.status);
    }

    let parsed;
    try { parsed = JSON.parse(bodyText); } catch (_) { parsed = { raw: bodyText }; }

    if (!parsed || !Array.isArray(parsed.data)) {
      // Non-paginated response — return as-is
      return json(parsed);
    }

    allData = allData.concat(parsed.data);
    if (parsed.totalCount != null) totalCount = parsed.totalCount;
    if (parsed.status) lastStatus = parsed.status;
    pageCount++;

    // --- Stop conditions ---
    // (a) Last page (returned fewer than full)
    if (parsed.data.length < PAGE_SIZE) break;
    // (b) Hit client's desired total
    if (clientLimit > 0 && allData.length >= clientLimit) {
      allData = allData.slice(0, clientLimit);
      break;
    }
    // (c) We have everything per totalCount
    if (totalCount != null && allData.length >= totalCount) break;

    // Advance to next page
    currentStart += PAGE_SIZE;
    // Polite delay between pages so SOS doesn't throttle us
    if (INTER_PAGE_DELAY_MS > 0) {
      await new Promise(r => setTimeout(r, INTER_PAGE_DELAY_MS));
    }
  }

  const capped = pageCount >= MAX_PAGES &&
                 (totalCount == null || allData.length < totalCount) &&
                 (clientLimit === 0 || allData.length < clientLimit);

  const out = {};
  out[mapping.key]   = allData;
  out.count          = allData.length;
  out.totalCount     = totalCount;
  out.pagesFetched   = pageCount;
  out.throttleHits   = throttleHits;
  out.status         = lastStatus;
  if (capped) {
    out.capped       = true;
    out.cappedReason = 'Hit MAX_PAGES=' + MAX_PAGES + ' safety cap (' + (PAGE_SIZE * MAX_PAGES) + ' items max per single call). For more, call again with ?start=' + (currentStart + PAGE_SIZE);
    out.nextStart    = currentStart + PAGE_SIZE;
  }
  return json(out);
}

function sosCallbackHtmlResponse(payload) {
  const safe = JSON.stringify(payload).replace(/</g, '\\u003c');
  const ok = payload.status === 'success';
  const html = '<!doctype html><html><head><meta charset="utf-8"><title>HydroNexis · SOS</title>' +
    '<style>body{font-family:system-ui,sans-serif;background:#0a1612;color:#e8f5e9;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}' +
    '.box{text-align:center;padding:32px 48px;border:1px solid ' + (ok?'#26c281':'#ef5350') + ';border-radius:12px;background:rgba(' + (ok?'38,194,129':'239,83,80') + ',.08);max-width:480px;}' +
    '.ic{font-size:48px;}.t{font-size:20px;font-weight:700;margin-top:12px;}.s{font-size:13px;color:#7aa99a;margin-top:8px;line-height:1.5;}</style>' +
    '</head><body><div class="box"><div class="ic">' + (ok?'✓':'✗') + '</div>' +
    '<div class="t">' + (ok?'Connected to SOS Inventory':'Connection failed') + '</div>' +
    '<div class="s">' + (ok?'You can close this window. Returning to HydroNexis-AI…':(payload.error||'See main app for details')) + '</div></div>' +
    '<script>try{if(window.opener){window.opener.postMessage(Object.assign({type:"hnx-sos-oauth"},' + safe + '),"*");}}catch(e){}setTimeout(function(){try{window.close();}catch(e){}},1800);</script>' +
    '</body></html>';
  return new Response(html, {
    status: ok ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// ============================================================
// R2 FILE STORAGE (v3.3.0, added 2026-06-09)
// ------------------------------------------------------------
// Big-file storage for HydroNexis-AI uploads (documents, photos,
// PDFs, etc). Backed by an R2 bucket bound to this worker as
// env.UPLOADS (bucket: hnx-uploads). All routes are behind the
// same login/token auth as /sync.
//
// Access policy (default — adjustable):
//   - LIST + DOWNLOAD: any logged-in user
//   - UPLOAD + DELETE: admins only, OR users with the matching
//     permission flag (permissions.uploadFiles / permissions.deleteFiles)
//
// Endpoints:
//   POST   /r2/upload?key=<path>[&name=<displayName>]
//          body = raw file bytes; Content-Type = the file's type
//   GET    /r2/file?key=<path>[&download=1]
//   GET    /r2/list[?prefix=<folder/>][&cursor=<cursor>]
//   DELETE /r2/delete?key=<path>
//
// NOTE: each file streams through the worker. That is fine for
// documents/photos/PDFs. For single files larger than ~100MB,
// switch to R2 multipart upload (ask to have it added).
// ============================================================

// Allow letters, numbers, dot, underscore, dash, and "/" for folders.
// Blocks path traversal and odd characters. Caps total length.
function sanitizeR2Key(raw) {
  let k = String(raw == null ? '' : raw).trim();
  k = k.replace(/^\/+/, '');          // no leading slash
  k = k.replace(/\.\.+/g, '.');        // no ".." traversal
  k = k.split('/')
       .map(seg => seg.replace(/[^a-zA-Z0-9._-]/g, '_'))
       .filter(Boolean)
       .join('/');
  return k.slice(0, 1024);
}

// Like sanitizeR2Key but preserves a trailing slash so "documents/"
// keeps working as a folder prefix for listing.
function sanitizeR2Prefix(raw) {
  let k = String(raw == null ? '' : raw).trim();
  k = k.replace(/^\/+/, '').replace(/\.\.+/g, '.');
  k = k.split('/')
       .map(seg => seg.replace(/[^a-zA-Z0-9._-]/g, '_'))
       .join('/');
  return k.slice(0, 1024);
}

function r2NotBound() {
  return json({
    error: 'R2 bucket not bound. In this worker: Settings → Bindings → Add → R2 bucket → variable name UPLOADS → bucket hnx-uploads, then deploy.'
  }, 503);
}

// ---- UPLOAD (admin only by default) ----
async function handleR2Upload(request, env) {
  try {
    const session = await requireAuth(request, env);
    if (!env.UPLOADS) return r2NotBound();

    const canUpload = session.user.isAdmin ||
      !!(session.user.permissions && session.user.permissions.uploadFiles);
    if (!canUpload) return json({ error: 'Upload not allowed for this account' }, 403);

    const url = new URL(request.url);
    const key = sanitizeR2Key(url.searchParams.get('key') || '');
    if (!key) return json({ error: 'A valid ?key= (file path) is required' }, 400);

    const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
    const originalName = String(url.searchParams.get('name') || key.split('/').pop()).slice(0, 300);

    const obj = await env.UPLOADS.put(key, request.body, {
      httpMetadata: { contentType },
      customMetadata: {
        uploadedBy: session.user.username,
        uploadedAt: new Date().toISOString(),
        originalName
      }
    });

    return json({
      ok: true,
      key,
      size: obj.size,
      etag: obj.httpEtag,
      contentType,
      originalName,
      uploadedBy: session.user.username,
      uploadedAt: obj.uploaded ? obj.uploaded.toISOString() : new Date().toISOString()
    });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ---- DOWNLOAD / SERVE (any logged-in user) ----
async function handleR2File(request, env) {
  try {
    await requireAuth(request, env);
    if (!env.UPLOADS) return r2NotBound();

    const url = new URL(request.url);
    const key = sanitizeR2Key(url.searchParams.get('key') || '');
    if (!key) return json({ error: 'A valid ?key= is required' }, 400);

    const obj = await env.UPLOADS.get(key);
    if (!obj) return json({ error: 'File not found' }, 404);

    const headers = new Headers();
    headers.set('Content-Type', (obj.httpMetadata && obj.httpMetadata.contentType) || 'application/octet-stream');
    headers.set('Content-Length', String(obj.size));
    if (obj.httpEtag) headers.set('ETag', obj.httpEtag);
    headers.set('Cache-Control', 'private, max-age=3600');

    const fname = ((obj.customMetadata && obj.customMetadata.originalName) || key.split('/').pop() || 'file').replace(/"/g, '');
    const disposition = url.searchParams.get('download') === '1' ? 'attachment' : 'inline';
    headers.set('Content-Disposition', disposition + '; filename="' + fname + '"');

    return new Response(obj.body, { status: 200, headers });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ---- LIST (any logged-in user) ----
async function handleR2List(request, env) {
  try {
    await requireAuth(request, env);
    if (!env.UPLOADS) return r2NotBound();

    const url = new URL(request.url);
    const prefix = sanitizeR2Prefix(url.searchParams.get('prefix') || '');
    const cursor = url.searchParams.get('cursor') || undefined;

    const listing = await env.UPLOADS.list({
      prefix: prefix || undefined,
      limit: 1000,
      cursor,
      include: ['httpMetadata', 'customMetadata']
    });

    const files = (listing.objects || []).map(o => ({
      key: o.key,
      size: o.size,
      uploaded: o.uploaded ? o.uploaded.toISOString() : null,
      contentType: (o.httpMetadata && o.httpMetadata.contentType) || '',
      uploadedBy: (o.customMetadata && o.customMetadata.uploadedBy) || '',
      originalName: (o.customMetadata && o.customMetadata.originalName) || o.key.split('/').pop()
    }));

    return json({
      files,
      count: files.length,
      truncated: !!listing.truncated,
      cursor: listing.truncated ? listing.cursor : null
    });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ---- DELETE (admin only by default) ----
async function handleR2Delete(request, env) {
  try {
    const session = await requireAuth(request, env);
    if (!env.UPLOADS) return r2NotBound();

    const canDelete = session.user.isAdmin ||
      !!(session.user.permissions && session.user.permissions.deleteFiles);
    if (!canDelete) return json({ error: 'Delete not allowed for this account' }, 403);

    const url = new URL(request.url);
    const key = sanitizeR2Key(url.searchParams.get('key') || '');
    if (!key) return json({ error: 'A valid ?key= is required' }, 400);

    await env.UPLOADS.delete(key);
    return json({ ok: true, key });
  } catch (e) {
    return json({ error: e.message }, e.name === 'AuthError' ? 401 : 500);
  }
}

// ============================================================
// GPS TRACKERS + TWILIO SMS (v3.4.0, added 2026-06-11)
// ------------------------------------------------------------
// KV layout (all in the existing TOKENS namespace):
//   trk:pos:<deviceId>                 latest position of a device
//   trk:hist:<deviceId>:<YYYY-MM-DD>   array of points for that PH day
//   trk:assign:<id>                    driver<->vehicle assignment
//
// Point shape: { deviceId, lat, lng, speed(km/h, optional),
//                heading(optional), ts(ms), driver(optional) }
//
// INGEST AUTH: /trackers/ingest accepts EITHER a normal Bearer
// session token (the app pushing positions) OR the X-API-Key
// header matching env.API_KEY (so a SinoTrack relay / webhook
// can post without a user login). All other /trackers/* routes
// require a normal login token, same as /sync.
//
// STOPS: /trackers/stops clusters a day's points - consecutive
// points that stay within STOP_RADIUS_M of the cluster anchor
// count as "stopped". Clusters lasting >= minMinutes (default 5)
// are returned with centroid, start/end and duration. Geofenced
// (planned) stops are NOT filtered here - the app holds the
// geofence list locally and marks planned vs unplanned itself.
// ============================================================
const TRK_POS_PREFIX    = 'trk:pos:';
const TRK_HIST_PREFIX   = 'trk:hist:';
const TRK_ASSIGN_PREFIX = 'trk:assign:';
const TRK_HIST_MAX_POINTS = 4000;   // per device per day (1 ping/20s ~ 4300/day)
const TRK_HIST_TTL = 14 * 24 * 60 * 60; // keep raw history 14 days
const STOP_RADIUS_M = 60;           // movement within this = same stop
const STOP_SPEED_KMH = 4;           // below this speed counts as stopped
const SMS_RESEND_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6h between auto-resends
const SMS_MAX_AUTO_SENDS = 3;       // stop nagging after 3 SMS

function _trkSafeId(raw) {
  return String(raw == null ? '' : raw).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
}

function _trkPhDate(ts) {
  return new Date((ts || Date.now()) + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function _trkHaversineM(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}


// ---- CANONICAL MAPPING (v3.4.1): read the synced Fleet store ----
// deviceId -> {name, plate, person, driverName}. Source of truth is
// data:<user>:hydroPro_admin_fleet_v1 (app: Fleet -> GPS, gpsDeviceId).
async function trkFleetMap(env) {
  const user = env.REPORT_USER || REPORT_USER_DEFAULT;
  const fleet = await _readData(env, user, 'hydroPro_admin_fleet_v1', []);
  const emps  = await _readData(env, user, 'hydroPro_employees', []);
  const empName = (id) => {
    if (!id || !Array.isArray(emps)) return null;
    for (const e of emps) {
      if (!e) continue;
      if (String(e.id) === String(id) || String(e.empId) === String(id)) {
        return e.name || e.fullName || (((e.firstName || '') + ' ' + (e.lastName || '')).trim()) || null;
      }
    }
    return null;
  };
  const map = {};
  (Array.isArray(fleet) ? fleet : []).forEach(v => {
    if (!v || !v.gpsDeviceId) return;
    map[String(v.gpsDeviceId).trim()] = {
      name: v.name || null,
      plate: v.plate || null,
      person: v.person || null,
      driverName: empName(v.driverId) || v.person || null
    };
  });
  return map;
}
function trkVehLabel(fm, deviceId) {
  const v = fm[String(deviceId).trim()];
  if (!v) return 'tracker ' + deviceId;
  return (v.name || deviceId) + (v.plate ? ' · ' + v.plate : '');
}

// Ingest may be called by the app (Bearer) OR a relay (X-API-Key)
async function _trkIngestAuth(request, env) {
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey && env.API_KEY && apiKey === env.API_KEY) return { via: 'apikey' };
  const session = await getSession(request, env);
  if (session) return { via: 'token', user: session.user.username };
  return null;
}

async function handleTrackersRoute(request, env, path) {
  // --- INGEST (special auth) ---
  if (path === '/trackers/ingest' && request.method === 'POST') {
    return handleTrkIngest(request, env);
  }
  // --- everything else: normal login token ---
  try { await requireAuth(request, env); }
  catch (e) { return json({ error: 'Unauthorized' }, 401); }

  if (path === '/trackers/live'        && request.method === 'GET')    return handleTrkLive(request, env);
  if (path === '/trackers/history'     && request.method === 'GET')    return handleTrkHistory(request, env);
  if (path === '/trackers/stops'       && request.method === 'GET')    return handleTrkStops(request, env);
  if (path === '/trackers/assignments' && request.method === 'GET')    return handleTrkAssignments(request, env);
  if (path === '/trackers/assign'      && request.method === 'POST')   return handleTrkAssign(request, env);
  if (path === '/trackers/confirm'     && request.method === 'POST')   return handleTrkConfirm(request, env);
  if (path === '/trackers/assignment'  && request.method === 'DELETE') return handleTrkAssignDelete(request, env);
  if (path === '/trackers/sms-run'     && request.method === 'POST')   return handleTrkSmsRun(request, env);
  return json({ error: 'Trackers route not found: ' + path }, 404);
}

// ---- INGEST: one point or {points:[...]} ----
async function handleTrkIngest(request, env) {
  const auth = await _trkIngestAuth(request, env);
  if (!auth) return json({ error: 'Unauthorized (Bearer token or X-API-Key required)' }, 401);

  const body = await request.json().catch(() => ({}));
  const rawPoints = Array.isArray(body.points) ? body.points : [body];

  let stored = 0;
  const byDevice = {};

  for (const raw of rawPoints.slice(0, 500)) {
    const deviceId = _trkSafeId(raw.deviceId || raw.device || raw.imei || '');
    const lat = parseFloat(raw.lat != null ? raw.lat : raw.latitude);
    const lng = parseFloat(raw.lng != null ? raw.lng : (raw.lon != null ? raw.lon : raw.longitude));
    if (!deviceId || !isFinite(lat) || !isFinite(lng)) continue;

    const point = {
      deviceId,
      lat: +lat.toFixed(6),
      lng: +lng.toFixed(6),
      speed: isFinite(parseFloat(raw.speed)) ? +parseFloat(raw.speed).toFixed(1) : null,
      heading: isFinite(parseFloat(raw.heading)) ? Math.round(parseFloat(raw.heading)) : null,
      ts: (isFinite(+raw.ts) && +raw.ts > 1e12) ? +raw.ts : Date.now(),
      driver: raw.driver ? String(raw.driver).slice(0, 80) : null
    };
    if (!byDevice[deviceId]) byDevice[deviceId] = [];
    byDevice[deviceId].push(point);
    stored++;
  }

  for (const [deviceId, pts] of Object.entries(byDevice)) {
    pts.sort((a, b) => a.ts - b.ts);
    const latest = pts[pts.length - 1];
    await env.TOKENS.put(TRK_POS_PREFIX + deviceId, JSON.stringify(latest));

    // group into PH days, append to history
    const byDay = {};
    pts.forEach(p => { const d = _trkPhDate(p.ts); (byDay[d] = byDay[d] || []).push(p); });
    for (const [day, dayPts] of Object.entries(byDay)) {
      const key = TRK_HIST_PREFIX + deviceId + ':' + day;
      let hist = [];
      const raw = await env.TOKENS.get(key);
      if (raw) { try { hist = JSON.parse(raw); } catch (_) { hist = []; } }
      if (!Array.isArray(hist)) hist = [];
      hist = hist.concat(dayPts);
      if (hist.length > TRK_HIST_MAX_POINTS) hist = hist.slice(hist.length - TRK_HIST_MAX_POINTS);
      await env.TOKENS.put(key, JSON.stringify(hist), { expirationTtl: TRK_HIST_TTL });
    }
  }

  return json({ ok: true, stored, devices: Object.keys(byDevice), via: auth.via });
}

// ---- LIVE: latest position of every device ----
async function handleTrkLive(request, env) {
  const fm = await trkFleetMap(env);   // v3.4.1: canonical fleet mapping
  const list = await env.TOKENS.list({ prefix: TRK_POS_PREFIX });
  const devices = [];
  for (const k of list.keys) {
    const raw = await env.TOKENS.get(k.name);
    if (!raw) continue;
    try {
      const p = JSON.parse(raw);
      p.ageSec = Math.max(0, Math.round((Date.now() - (p.ts || 0)) / 1000));
      const v = fm[String(p.deviceId).trim()] || null;
      p.vehicleName = v ? v.name : null;
      p.plate = v ? v.plate : null;
      p.driverName = p.driver || (v ? v.driverName : null);
      p.mapped = !!v;
      devices.push(p);
    } catch (_) {}
  }
  devices.sort((a, b) => a.deviceId.localeCompare(b.deviceId));
  return json({ devices, count: devices.length, ts: Date.now() });
}

// ---- HISTORY: ?device=ID&date=YYYY-MM-DD ----
async function handleTrkHistory(request, env) {
  const url = new URL(request.url);
  const device = _trkSafeId(url.searchParams.get('device') || '');
  const date = (url.searchParams.get('date') || _trkPhDate()).slice(0, 10);
  if (!device) return json({ error: '?device= is required' }, 400);
  const raw = await env.TOKENS.get(TRK_HIST_PREFIX + device + ':' + date);
  let points = [];
  if (raw) { try { points = JSON.parse(raw); } catch (_) {} }
  return json({ device, date, points, count: points.length });
}

// ---- STOPS: clusters >= minMinutes. ?device=&date=&minMinutes=5 ----
function _trkComputeStops(points, minMinutes) {
  const minMs = Math.max(1, minMinutes) * 60 * 1000;
  const pts = (points || []).slice().sort((a, b) => a.ts - b.ts);
  const stops = [];
  let anchor = null, cluster = [];

  const flush = () => {
    if (cluster.length >= 2) {
      const dur = cluster[cluster.length - 1].ts - cluster[0].ts;
      if (dur >= minMs) {
        let sLat = 0, sLng = 0;
        cluster.forEach(p => { sLat += p.lat; sLng += p.lng; });
        stops.push({
          lat: +(sLat / cluster.length).toFixed(6),
          lng: +(sLng / cluster.length).toFixed(6),
          start: cluster[0].ts,
          end: cluster[cluster.length - 1].ts,
          minutes: Math.round(dur / 60000),
          points: cluster.length
        });
      }
    }
    anchor = null; cluster = [];
  };

  for (const p of pts) {
    const moving = p.speed != null && p.speed > STOP_SPEED_KMH;
    if (!anchor) {
      if (!moving) { anchor = p; cluster = [p]; }
      continue;
    }
    if (!moving && _trkHaversineM(anchor, p) <= STOP_RADIUS_M) {
      cluster.push(p);
    } else {
      flush();
      if (!moving) { anchor = p; cluster = [p]; }
    }
  }
  flush();
  return stops;
}

async function handleTrkStops(request, env) {
  const url = new URL(request.url);
  const date = (url.searchParams.get('date') || _trkPhDate()).slice(0, 10);
  const minMinutes = parseInt(url.searchParams.get('minMinutes'), 10) || 5;
  const deviceParam = _trkSafeId(url.searchParams.get('device') || '');

  let deviceIds = [];
  if (deviceParam) {
    deviceIds = [deviceParam];
  } else {
    const list = await env.TOKENS.list({ prefix: TRK_POS_PREFIX });
    deviceIds = list.keys.map(k => k.name.substring(TRK_POS_PREFIX.length));
  }

  const fm = await trkFleetMap(env);   // v3.4.1: canonical fleet mapping
  const result = [];
  for (const dev of deviceIds.slice(0, 30)) {
    const v = fm[String(dev).trim()] || null;
    const meta = { vehicleName: v ? v.name : null, plate: v ? v.plate : null, driverName: v ? v.driverName : null, mapped: !!v };
    const raw = await env.TOKENS.get(TRK_HIST_PREFIX + dev + ':' + date);
    if (!raw) { result.push(Object.assign({ device: dev, date, stops: [], points: 0 }, meta)); continue; }
    let points = [];
    try { points = JSON.parse(raw); } catch (_) {}
    result.push(Object.assign({ device: dev, date, stops: _trkComputeStops(points, minMinutes), points: points.length }, meta));
  }
  return json({ date, minMinutes, devices: result });
}

// ---- ASSIGNMENTS ----
async function handleTrkAssignments(request, env) {
  const list = await env.TOKENS.list({ prefix: TRK_ASSIGN_PREFIX });
  const assignments = [];
  for (const k of list.keys) {
    const raw = await env.TOKENS.get(k.name);
    if (raw) { try { assignments.push(JSON.parse(raw)); } catch (_) {} }
  }
  assignments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return json({ assignments, count: assignments.length });
}

async function handleTrkAssign(request, env) {
  const session = await requireAuth(request, env);
  const body = await request.json().catch(() => ({}));
  const deviceId = _trkSafeId(body.deviceId || '');
  const driverName = String(body.driverName || '').slice(0, 80).trim();
  if (!deviceId || !driverName) {
    return json({ error: 'deviceId and driverName are required' }, 400);
  }
  const id = randomToken(8);
  const assignment = {
    id,
    deviceId,
    vehicle: String(body.vehicle || '').slice(0, 80) || null,
    driverName,
    driverPhone: String(body.driverPhone || '').replace(/[^0-9+]/g, '').slice(0, 20) || null,
    date: (body.date || _trkPhDate()).slice(0, 10),
    status: 'unconfirmed',
    smsCount: 0,
    lastSmsAt: null,
    createdAt: Date.now(),
    createdBy: session.user.username
  };
  await env.TOKENS.put(TRK_ASSIGN_PREFIX + id, JSON.stringify(assignment));
  return json({ ok: true, assignment });
}

async function handleTrkConfirm(request, env) {
  const session = await requireAuth(request, env);
  const body = await request.json().catch(() => ({}));
  const id = _trkSafeId(body.id || '');
  if (!id) return json({ error: 'id required' }, 400);
  const raw = await env.TOKENS.get(TRK_ASSIGN_PREFIX + id);
  if (!raw) return json({ error: 'Assignment not found' }, 404);
  const a = JSON.parse(raw);
  a.status = 'confirmed';
  a.confirmedAt = Date.now();
  a.confirmedBy = session.user.username;
  await env.TOKENS.put(TRK_ASSIGN_PREFIX + id, JSON.stringify(a));
  return json({ ok: true, assignment: a });
}

async function handleTrkAssignDelete(request, env) {
  const url = new URL(request.url);
  const id = _trkSafeId(url.searchParams.get('id') || '');
  if (!id) return json({ error: '?id= required' }, 400);
  await env.TOKENS.delete(TRK_ASSIGN_PREFIX + id);
  return json({ ok: true, id });
}

// Manual trigger from the app: "send reminder SMS now"
async function handleTrkSmsRun(request, env) {
  try { await requireAdmin(request, env); }
  catch (e) { return json({ error: e.message }, 401); }
  const res = await sendDriverAssignmentSms(env, { force: true });
  return json({ ok: true, ...res });
}

// ============================================================
// TWILIO SMS
// ============================================================
function _twilioReady(env) {
  return !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM);
}

async function twilioSend(env, to, body) {
  if (!_twilioReady(env)) {
    return { ok: false, error: 'SMS not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM secrets on this worker.' };
  }
  const toClean = String(to || '').replace(/[^0-9+]/g, '');
  if (!/^\+?[0-9]{8,15}$/.test(toClean)) {
    return { ok: false, error: 'Invalid phone number: ' + to };
  }
  // PH numbers: 09xxxxxxxxx -> +639xxxxxxxxx ; keep +XX as-is
  const e164 = toClean.startsWith('+') ? toClean
             : (toClean.startsWith('09') && toClean.length === 11) ? '+63' + toClean.slice(1)
             : '+' + toClean;

  const sid = env.TWILIO_ACCOUNT_SID;
  const creds = btoa(sid + ':' + env.TWILIO_AUTH_TOKEN);
  const form = new URLSearchParams({ To: e164, From: env.TWILIO_FROM, Body: String(body || '').slice(0, 1500) });

  let res, data;
  try {
    res = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + creds, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form
    });
    data = await res.json().catch(() => ({}));
  } catch (e) {
    return { ok: false, error: 'Twilio request failed: ' + (e && e.message) };
  }
  if (!res.ok) {
    return { ok: false, error: 'Twilio ' + res.status + ': ' + (data.message || JSON.stringify(data).slice(0, 200)) };
  }
  return { ok: true, sid: data.sid || null, to: e164, status: data.status || 'queued' };
}

// POST /api/sms/outbound  body: {to, body}
async function handleSmsOutbound(request, env) {
  try { await requireAuth(request, env); }
  catch (e) { return json({ error: 'Unauthorized' }, 401); }
  const body = await request.json().catch(() => ({}));
  if (!body.to || !body.body) return json({ error: '{to, body} required' }, 400);
  const result = await twilioSend(env, body.to, body.body);
  return json(result, result.ok ? 200 : 502);
}

// Cron job: SMS every unconfirmed assignment for TODAY (PH date),
// max SMS_MAX_AUTO_SENDS per assignment, 6h cooldown between sends.
async function sendDriverAssignmentSms(env, opts) {
  opts = opts || {};
  if (!_twilioReady(env)) return { skipped: true, reason: 'twilio-not-configured' };

  const today = _trkPhDate();
  const fm = await trkFleetMap(env);   // v3.4.1: name vehicles in SMS texts
  const list = await env.TOKENS.list({ prefix: TRK_ASSIGN_PREFIX });
  let checked = 0, sent = 0, failed = 0;

  for (const k of list.keys) {
    const raw = await env.TOKENS.get(k.name);
    if (!raw) continue;
    let a; try { a = JSON.parse(raw); } catch (_) { continue; }
    checked++;

    if (a.status !== 'unconfirmed') continue;
    if (a.date !== today) continue;
    if (!a.driverPhone) continue;
    if (!opts.force) {
      if ((a.smsCount || 0) >= SMS_MAX_AUTO_SENDS) continue;
      if (a.lastSmsAt && (Date.now() - a.lastSmsAt) < SMS_RESEND_COOLDOWN_MS) continue;
    }

    const msg = 'HydroNexis: ' + a.driverName + ', you are assigned to ' +
      (a.vehicle ? a.vehicle : trkVehLabel(fm, a.deviceId)) + ' today (' + a.date +
      '). Please confirm in the HydroNexis app.';

    const result = await twilioSend(env, a.driverPhone, msg);
    if (result.ok) {
      sent++;
      a.smsCount = (a.smsCount || 0) + 1;
      a.lastSmsAt = Date.now();
      await env.TOKENS.put(k.name, JSON.stringify(a));
    } else {
      failed++;
      console.log('[sms] failed for assignment ' + a.id + ': ' + result.error);
    }
  }
  return { checked, sent, failed };
}
