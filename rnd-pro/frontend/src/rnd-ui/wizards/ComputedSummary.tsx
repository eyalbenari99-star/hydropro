import React from 'react';

export function ElectricalComputedSummary({ computed }: { computed: any }) {
  if (!computed) return null;
  return (
    <div style={box}>
      <div style={hdr}>📐 Computed engineering</div>
      <div style={meta}>
        Supply: <b>{computed.voltage} V</b> · Main breaker: <b>{computed.main_breaker_a} A</b> · SC rating: <b>{computed.short_circuit_ka} kA</b>
      </div>
      <table style={table}>
        <thead>
          <tr><th style={th}>Ref</th><th style={th}>Load</th><th style={th}>kW</th><th style={th}>FLA</th><th style={th}>Breaker</th><th style={th}>Contactor</th><th style={th}>Overload</th><th style={th}>Cable</th></tr>
        </thead>
        <tbody>
          {(computed.feeders || []).map((f: any) => (
            <tr key={f.ref}>
              <td style={td}><b>{f.ref}</b></td>
              <td style={td}>{f.label}</td>
              <td style={tdNum}>{f.kw ?? '—'}</td>
              <td style={tdNum}>{f.flaA ?? '—'}</td>
              <td style={td}>{f.breaker}</td>
              <td style={td}>{f.contactor || '—'}</td>
              <td style={td}>{f.overload || '—'}</td>
              <td style={tdNum}>{f.cableMm2 ?? '—'} mm² · {f.cableAmpacityA ?? '—'} A</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PlumbingComputedSummary({ computed }: { computed: any }) {
  if (!computed) return null;
  const p = computed.pump;
  return (
    <div style={box}>
      <div style={hdr}>💧 Computed hydraulics</div>
      <div style={row}><b>Pump duty</b>: {p.flow_design_m3h} m³/h × {p.head_design_m} m (with {Math.round(((p.flow_design_m3h/p.flow_required_m3h)-1)*100)}% flow / {Math.round(((p.head_design_m/p.head_required_m)-1)*100)}% head margin)</div>
      <div style={row}>Pressure head: {p.pressure_head_m} m · Static head: {p.static_head_m} m · Losses: {p.losses_m} m</div>
      <div style={row}><b>Main pipe</b>: DN{computed.mainPipe.dn} · velocity {computed.mainPipe.velocityMs} m/s · {computed.mainPipe.material.toUpperCase()}</div>
      <div style={row}><b>Per-zone</b>: DN{computed.zonePipe.dn} · {computed.zonePipe.flowPerZoneM3h} m³/h · velocity {computed.zonePipe.velocityMs} m/s</div>
      <div style={row}><b>Filtration</b>: {computed.filtration.micron} µm · {computed.filtration.kind} · {computed.filtration.flowM3h} m³/h</div>
    </div>
  );
}

const box: React.CSSProperties = { background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 14, marginTop: 14 };
const hdr: React.CSSProperties = { color: '#facc15', fontWeight: 700, marginBottom: 10, fontSize: 14 };
const meta: React.CSSProperties = { color: '#94a3b8', fontSize: 12, marginBottom: 10 };
const row: React.CSSProperties = { color: '#cbd5e1', fontSize: 12, marginBottom: 4 };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 11.5 };
const th: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #334155', color: '#facc15', fontWeight: 600 };
const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #1e293b', color: '#cbd5e1' };
const tdNum: React.CSSProperties = { ...td, textAlign: 'right' };
