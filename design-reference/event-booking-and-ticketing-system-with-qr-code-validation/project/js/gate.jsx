// Tiketi — Gate Agent shell (fullscreen, no nav). G1 selector, G2 scanner, G3–G7 results.
const { useState: useStateG, useEffect: useEffectG } = React;

const GATE_EVENTS = [
  { id: "evt-jmf", name: "Juba Music Festival 2025", tickets: 2000, date: "Sat, 14 Dec 2025" },
  { id: "evt-psl", name: "South Sudan Premier League Final", tickets: 8600, date: "Sun, 22 Dec 2025" },
];

// ---------- G1 EVENT SELECTOR ----------
function GateSelector({ onStart }) {
  const reviewState = useScreen("G1", "Event selector", ["ready", "downloading", "failed"]);
  const [phase, setPhase] = useStateG(reviewState);
  const [pct, setPct] = useStateG(reviewState === "downloading" ? 0 : 100);
  useEffectG(() => { setPhase(reviewState); setPct(reviewState === "downloading" ? 0 : 100); }, [reviewState]);
  useEffectG(() => {
    if (phase !== "downloading") return;
    if (pct >= 100) { setPhase("ready"); return; }
    const t = setTimeout(() => setPct((p) => Math.min(100, p + 7)), 130);
    return () => clearTimeout(t);
  }, [phase, pct]);

  const ev = GATE_EVENTS[0];
  return (
    <div className="gate">
      <div className="gate-pad">
        <div className="gate-brand">
          <span className="gate-mark"><Icon name="scan-line" size={22} color="#fff" /></span>
          <div><div className="gate-word">Tiketi Gate</div><div className="gate-agent-sub" style={{ marginTop: 0 }}>Scanner</div></div>
        </div>

        <div className="gate-agent-row">
          <span className="gate-agent-av">JM</span>
          <div style={{ flex: 1 }}><div className="gate-agent-name">James Majok</div><div className="gate-agent-sub">Gate agent · {ev.date}</div></div>
        </div>

        <div className="stack8">
          <span className="gate-label">Assigned event</span>
          <button className="gate-select"><span>{ev.name}</span><Icon name="chevron-down" size={20} color="rgba(255,255,255,.6)" /></button>
        </div>

        {phase === "downloading" && (
          <div className="gate-prefetch">
            <div className="gate-prefetch-head"><span>Downloading ticket data…</span><span className="mono">{pct}%</span></div>
            <div className="gate-prefetch-track"><div className="gate-prefetch-bar" style={{ width: pct + "%" }} /></div>
          </div>
        )}
        {phase === "ready" && (
          <div className="gate-alert gate-alert-success"><Icon name="check-circle" size={18} /><div><b>{ev.tickets.toLocaleString()} tickets ready</b> for offline validation</div></div>
        )}
        {phase === "failed" && (
          <div className="stack12">
            <div className="gate-alert gate-alert-danger"><Icon name="alert-octagon" size={18} /><div><b>Download failed.</b> Check your connection and retry.</div></div>
            <button className="gate-btn-ghost" onClick={() => { setPhase("downloading"); setPct(0); }}><Icon name="rotate-ccw" size={18} /> Retry download</button>
          </div>
        )}

        <div style={{ flex: 1 }} />
        <button className="gate-btn-primary" disabled={phase !== "ready"} onClick={() => onStart(ev)}>
          <Icon name="scan-line" size={20} /> Start scanning
        </button>
      </div>
    </div>
  );
}

// ---------- G3–G7 RESULT OVERLAYS ----------
const RESULTS = {
  admit:   { cls: "admit",   ic: "check",        verdict: "ADMIT",          tier: true },
  used:    { cls: "reject",  ic: "x",            verdict: "ALREADY USED",   sub: "First scanned at 2:34 PM at Gate A" },
  invalid: { cls: "reject",  ic: "x",            verdict: "INVALID TICKET", sub: "This ticket could not be verified" },
  wrong:   { cls: "warn",    ic: "alert-triangle", verdict: "WRONG EVENT",  sub: "This ticket is for a different event" },
  expired: { cls: "expired", ic: "clock",        verdict: "TICKET EXPIRED", sub: "This ticket is no longer valid" },
};

function ResultOverlay({ kind, name, tier, onReset }) {
  const r = RESULTS[kind];
  const [n, setN] = useStateG(2);
  useEffectG(() => {
    if (n <= 0) { onReset(); return; }
    const t = setTimeout(() => setN((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div className={"result " + r.cls} role="alert" onClick={onReset}>
      <span className="result-ic"><Icon name={r.ic} size={64} strokeWidth={2.5} color="#fff" /></span>
      <h1 className="result-verdict">{r.verdict}</h1>
      {r.tier ? (
        <React.Fragment>
          <div className="result-name">{name}</div>
          <span className="result-tier">{tier}</span>
        </React.Fragment>
      ) : (
        <p className="result-sub">{r.sub}</p>
      )}
      <div className="result-reset"><Icon name="rotate-ccw" size={14} /> Auto-reset in {n}s</div>
    </div>
  );
}

// ---------- G8 OFFLINE SYNC SHEET ----------
function OfflineSyncSheet({ online, onRestore, onClose }) {
  useScreen("G8", "Offline sync", ["loaded"]);
  const [phase, setPhase] = useStateG("idle"); // idle | syncing | done
  const [pct, setPct] = useStateG(0);
  useEffectG(() => {
    if (phase !== "syncing") return;
    if (pct >= 100) { setPhase("done"); return; }
    const t = setTimeout(() => setPct((p) => Math.min(100, p + 9)), 90);
    return () => clearTimeout(t);
  }, [phase, pct]);

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-h">Offline mode</h2>
        <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14, margin: "0 0 8px" }}>Scans are saved on this device and uploaded when you reconnect.</p>
        <div className="sheet-stat"><span style={{ color: "rgba(255,255,255,.7)" }}>Scans recorded locally</span><span className="sheet-stat-v">38</span></div>
        <div className="sheet-stat"><span style={{ color: "rgba(255,255,255,.7)" }}>Pending sync</span><span className="sheet-stat-v" style={{ color: phase === "done" ? "#8fe0ad" : "#f0c878" }}>{phase === "done" ? 0 : 38}</span></div>
        <div className="sheet-stat" style={{ borderBottom: "none" }}><span style={{ color: "rgba(255,255,255,.7)" }}>Last sync</span><span style={{ fontSize: 14 }}>Today, 6:12 PM</span></div>

        {phase === "syncing" && (
          <div style={{ margin: "8px 0 16px" }}>
            <div className="gate-prefetch-head" style={{ color: "#fff" }}><span>Uploading scans…</span><span className="mono">{pct}%</span></div>
            <div className="gate-prefetch-track"><div className="gate-prefetch-bar" style={{ width: pct + "%" }} /></div>
          </div>
        )}
        {phase === "done" && <div className="gate-alert gate-alert-success" style={{ margin: "12px 0 16px" }}><Icon name="check-circle" size={18} /><div>All scans uploaded</div></div>}

        <div className="stack12" style={{ marginTop: 16 }}>
          <button className="gate-btn-primary" disabled={!online || phase === "syncing"} onClick={() => { setPct(0); setPhase("syncing"); }}>
            {phase === "syncing" ? <React.Fragment><Spinner size="sm" light /> Syncing…</React.Fragment> : phase === "done" ? "Synced" : online ? "Sync now" : "Sync now (offline)"}
          </button>
          <button className="gate-btn-ghost" onClick={onRestore}>{online ? "Connection restored" : "Simulate connection restored"}</button>
        </div>
      </div>
    </div>
  );
}

// ---------- G9 MANUAL CASH ENTRY ----------
function CashEntrySheet({ onClose }) {
  useScreen("G9", "Manual cash entry", ["loaded"]);
  const [done, setDone] = useStateG(false);
  const [f, setF] = useStateG({ name: "", cat: "General", amount: "" });
  const [touched, setTouched] = useStateG(false);
  const CAT_PRICES = { VIP: 45000, General: 18000, Student: 9000 };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const err = {
    name: !f.name.trim() ? "Attendee name is required" : f.name.trim().length < 2 ? "At least 2 characters" : "",
    cat: !f.cat ? "Select a category" : "",
  };
  const amountWarn = f.amount !== "" && Number(f.amount) !== CAT_PRICES[f.cat]
    ? `Expected ${SSP(CAT_PRICES[f.cat])} for ${f.cat}` : "";
  const valid = !err.name && !err.cat;
  const e = (k) => touched ? err[k] : "";
  const record = () => { setTouched(true); if (!valid) return; setDone(true); setTimeout(onClose, 1100); };
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(ev) => ev.stopPropagation()}>
        <div className="sheet-handle" />
        {done ? (
          <div className="center-col" style={{ padding: "16px 0 8px", textAlign: "center" }}>
            <span className="confirm-ic" style={{ width: 72, height: 72, marginBottom: 14 }}><Icon name="check" size={36} strokeWidth={3} /></span>
            <h2 className="sheet-h">Entry recorded</h2>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14, margin: 0 }}>Cash sale added and attendee admitted.</p>
          </div>
        ) : (
          <React.Fragment>
            <h2 className="sheet-h">Manual cash entry</h2>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14, margin: "0 0 18px" }}>Record a walk-up sale paid in cash.</p>
            <div className="stack12">
              <div>
                <div className="gate-label" style={{ marginBottom: 6 }}>Attendee name</div>
                <div className="sheet-gate-input" style={e("name") ? { borderColor: "#f0a8a8" } : {}}><input placeholder="Full name" value={f.name} onChange={set("name")} /></div>
                {e("name") && <div style={{ color: "#f0a8a8", fontSize: 12, marginTop: 5 }}>{e("name")}</div>}
              </div>
              <div>
                <div className="gate-label" style={{ marginBottom: 6 }}>Ticket category</div>
                <div className="sheet-gate-input" style={{ justifyContent: "space-between" }}>
                  <select value={f.cat} onChange={set("cat")} style={{ background: "transparent", border: "none", outline: "none", color: "#fff", flex: 1, fontSize: 15, appearance: "none" }}>
                    <option style={{ color: "#000" }}>VIP</option><option style={{ color: "#000" }}>General</option><option style={{ color: "#000" }}>Student</option>
                  </select>
                  <Icon name="chevron-down" size={18} color="rgba(255,255,255,.5)" />
                </div>
              </div>
              <div>
                <div className="gate-label" style={{ marginBottom: 6 }}>Amount paid (SSP)</div>
                <div className="sheet-gate-input"><input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder={String(CAT_PRICES[f.cat])} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^0-9]/g, "") })} /></div>
                {amountWarn && <div style={{ color: "#f0c878", fontSize: 12, marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}><Icon name="alert-triangle" size={12} /> {amountWarn}</div>}
              </div>
            </div>
            <button className="gate-btn-primary" style={{ marginTop: 18 }} onClick={record}><Icon name="check" size={18} /> Record entry</button>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

// ---------- G2 SCANNER ----------
function GateScanner({ ev, onExit }) {
  useScreen("G2", "Scanner", ["loaded"]);
  const [online, setOnline] = useStateG(true);
  const [admitted, setAdmitted] = useStateG(847);
  const [result, setResult] = useStateG(null);
  const [menu, setMenu] = useStateG(false);
  const [sheet, setSheet] = useStateG(null); // "sync" | "cash"
  const cycleRef = React.useRef(0);

  const simKinds = [
    { kind: "admit", label: "Admit", name: ATTENDEE_NAMES[Math.floor(Math.random() * ATTENDEE_NAMES.length)], tier: "General" },
    { kind: "used", label: "Used" }, { kind: "invalid", label: "Invalid" },
    { kind: "wrong", label: "Wrong event" }, { kind: "expired", label: "Expired" },
  ];
  const randName = () => ATTENDEE_NAMES[Math.floor(Math.random() * ATTENDEE_NAMES.length)];
  const fire = (s) => { const r = s.kind === "admit" ? { ...s, name: s.name || randName() } : s; setResult(r); if (r.kind === "admit") setAdmitted((a) => a + 1); };
  // FLOW 2: demo “Scan QR” cycles ADMIT → Used → Invalid → Wrong → Expired
  const scanQR = () => { const s = simKinds[cycleRef.current % simKinds.length]; cycleRef.current++; fire(s); };
  const pillClick = () => { if (online) setOnline(false); else setSheet("sync"); };

  return (
    <div className="gate" style={{ position: "relative" }}>
      <div className="scan-top">
        <div className="scan-top-left">
          <Icon name="ticket" size={18} color="var(--accent)" />
          <span className="scan-event">{ev.name}</span>
        </div>
        <span className="scan-count">{admitted.toLocaleString()} <span>admitted</span></span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className={"scan-pill " + (online ? "online" : "offline")} onClick={pillClick} aria-label="Connectivity">
            <Icon name={online ? "wifi" : "wifi-off"} size={13} /> {online ? "Online" : "Offline"}
          </button>
          <button className="scan-menu" aria-label="Menu" onClick={() => setMenu(!menu)}><Icon name="more-vertical" size={18} /></button>
        </div>
      </div>

      <div className="scan-view">
        {!online && <div className="scan-offline-banner"><Icon name="wifi-off" size={15} /> Offline mode — scans saved locally</div>}
        <div className="scan-frame">
          <div className="scan-corner tl" /><div className="scan-corner tr" /><div className="scan-corner bl" /><div className="scan-corner br" />
          <div className="scan-line" />
        </div>
        <div className="scan-hint">Point camera at a QR code</div>
        <button className="scan-qr-btn" onClick={scanQR}><Icon name="scan-line" size={20} /> Scan QR</button>
        <div className="scan-sim" role="group" aria-label="Simulate a specific result">
          {simKinds.map((s) => <button key={s.kind} className="scan-sim-btn" onClick={() => fire(s)}>{s.label}</button>)}
        </div>
      </div>

      {menu && (
        <div className="scrim" style={{ alignItems: "flex-end", justifyContent: "center" }} onClick={() => setMenu(false)}>
          <div className="card" style={{ width: "100%", maxWidth: 372, marginBottom: 16, padding: 8 }} onClick={(e) => e.stopPropagation()}>
            {[{ ic: "wallet", t: "Manual cash entry", a: () => setSheet("cash") }, { ic: "refresh-cw", t: "Sync offline scans", a: () => setSheet("sync") }, { ic: "log-out", t: "Exit scanner", a: onExit }].map((m, i) => (
              <button key={m.t} style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", padding: 15, border: "none", background: "none", borderTop: i ? "1px solid var(--border-soft)" : "none", fontSize: 15, fontWeight: 500, textAlign: "left" }} onClick={() => { setMenu(false); m.a && m.a(); }}>
                <Icon name={m.ic} size={19} /> {m.t}
              </button>
            ))}
          </div>
        </div>
      )}

      {sheet === "sync" && <OfflineSyncSheet online={online} onRestore={() => setOnline(true)} onClose={() => setSheet(null)} />}
      {sheet === "cash" && <CashEntrySheet onClose={() => setSheet(null)} />}

      {result && <ResultOverlay kind={result.kind} name={result.name} tier={result.tier} onReset={() => setResult(null)} />}
    </div>
  );
}

// ---------- Gate shell ----------
function GateShell() {
  const [ev, setEv] = useStateG(null);
  return (
    <div className="mstage">
      <div className="mphone dark">
        {ev ? <GateScanner ev={ev} onExit={() => setEv(null)} /> : <GateSelector onStart={setEv} />}
      </div>
    </div>
  );
}

Object.assign(window, { GateShell });
