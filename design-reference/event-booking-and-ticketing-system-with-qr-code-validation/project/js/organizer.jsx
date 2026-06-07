// Tiketi — Organizer shell (desktop sidebar) + O1 Dashboard.
const { useState: useStateO } = React;

const ORG_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { id: "events", label: "My Events", icon: "calendar-days" },
  { id: "create", label: "Create Event", icon: "plus-circle" },
  { id: "agents", label: "Gate Agents", icon: "users" },
  { id: "reports", label: "Reports", icon: "bar-chart-2" },
];
const ORG_FOOT = [{ id: "settings", label: "Settings", icon: "settings" }];

function OrgSidebar({ active, onNav }) {
  return (
    <aside className="osidebar">
      <div>
        <div className="obrand">
          <span className="mark"><Icon name="ticket" size={19} color="#fff" /></span>
          <div><div className="name">Tiketi</div><div className="sub">Organizer</div></div>
        </div>
        <nav className="onav" aria-label="Organizer">
          {ORG_NAV.map((n) => (
            <button key={n.id} className={"onav-item" + (active === n.id ? " on" : "")} aria-current={active === n.id} onClick={() => onNav(n.id)}>
              <Icon name={n.icon} size={18} /> {n.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="onav">
        {ORG_FOOT.map((n) => (
          <button key={n.id} className={"onav-item" + (active === n.id ? " on" : "")} onClick={() => onNav(n.id)}>
            <Icon name={n.icon} size={18} /> {n.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

function OrgTopbar({ crumb, eventName, onEvent }) {
  return (
    <header className="otopbar">
      <div className="page-crumb" style={{ margin: 0 }}><span>Organizer</span><Icon name="chevron-right" size={14} /><span style={{ color: "var(--text)", fontWeight: 600 }}>{crumb}</span></div>
      <div className="otopbar-right">
        {eventName && <button className="event-select" onClick={onEvent}><Icon name="calendar" size={16} color="var(--text-secondary)" /> {eventName} <Icon name="chevron-down" size={15} color="var(--text-secondary)" /></button>}
        <span className="role-badge" style={{ background: "var(--accent-chip-bg)", color: "var(--accent-deep)", fontSize: 13, fontWeight: 600, padding: "4px 12px", borderRadius: "9999px" }}>Organizer</span>
        <div className="gate-agent-av" style={{ width: 32, height: 32, fontSize: 13, background: "var(--navy)" }}>RM</div>
      </div>
    </header>
  );
}

// ---------- O1 DASHBOARD ----------
function OrgDashboard() {
  const state = useScreen("O1", "Dashboard (real-time)", ["live", "loading", "noevent"]);
  const d = DASH;
  const [page, setPage] = useStateO(1);

  if (state === "noevent") {
    return (
      <React.Fragment>
        <div className="page-head"><div><h1 className="page-title">Dashboard</h1><p className="page-sub">Real-time gate attendance and revenue.</p></div></div>
        <div className="card"><EmptyState icon="calendar-off" title="No live event selected" body="Choose an event from the dropdown above to see real-time attendance." /></div>
      </React.Fragment>
    );
  }

  if (state === "loading") {
    return (
      <React.Fragment>
        <div className="page-head"><div><Skeleton w={260} h={28} /><Skeleton w={180} h={14} mt={10} /></div></div>
        <div className="ostats">{[0, 1, 2, 3].map((i) => <div className="stat" key={i}><Skeleton w="55%" h={12} /><Skeleton w="70%" h={30} mt={12} /><Skeleton h={6} mt={16} /></div>)}</div>
        <div className="odash-grid"><div className="card card-pad"><Skeleton w={160} h={18} /><Skeleton h={200} mt={18} /></div><div className="card card-pad"><Skeleton w={160} h={18} /><Skeleton h={200} mt={18} /></div></div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="page-head">
        <div>
          <h1 className="page-title">{d.eventName} <StatusPill status="Live" pulse /></h1>
          <p className="page-sub"><span className="osync"><Icon name="refresh-cw" size={13} /> Updated 12s ago</span></p>
        </div>
      </div>

      <div className="ostats">
        <StatCard label="Admitted" value={d.admitted.toLocaleString()} chipIcon="door-open" progress={Math.round(d.admitted / d.capacity * 100)} footText={`${Math.round(d.admitted / d.capacity * 100)}% of ${d.capacity.toLocaleString()} capacity`} />
        <StatCard label="Tickets Sold" value={d.sold.toLocaleString()} chipIcon="ticket" chipBg="var(--info-bg)" chipFg="var(--navy)" footDot="var(--info)" footText="Across all tiers" />
        <StatCard label="Fraud Attempts" value={d.fraud} chipIcon="shield-alert" chipBg="var(--danger-bg)" chipFg="var(--danger)" footDot="var(--danger)" footText="Rejected at the gate" />
        <StatCard label="Revenue" value={SSP(d.revenue)} chipIcon="trending-up" chipBg="var(--success-bg)" chipFg="var(--success)" footDot="var(--success)" footText="Net of service fees" />
      </div>

      <div className="card card-pad" style={{ marginTop: 22 }}>
        <div className="chart-head"><h3 className="sec-title" style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, margin: 0 }}>Entry rate</h3><span className="muted" style={{ fontSize: 13 }}>Admissions per 30 min</span></div>
        <LineChart data={d.entryRate} />
      </div>

      <div className="odash-grid">
        <div className="card card-pad chart-card">
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, margin: "0 0 8px" }}>Tier breakdown</h3>
          <HBar rows={d.tiers} />
        </div>
        <div className="tbl-wrap">
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}><h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, margin: 0 }}>Recent scans</h3></div>
          <table className="tbl">
            <thead><tr><th>Time</th><th>Gate</th><th>Tier</th><th>Result</th></tr></thead>
            <tbody>
              {d.scans.map((s, i) => (
                <tr key={i}>
                  <td className="mono">{s.time}</td>
                  <td>{s.gate}</td>
                  <td>{s.tier}</td>
                  <td>{s.result === "ADMIT" ? <StatusPill status="Admitted" tone="success" sm /> : <StatusPill status="Rejected" tone="danger" sm />}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pager">
            <span className="pager-count">Showing 10 of 1,247</span>
            <div className="pager-ctrls">
              <button className="pg-arrow" aria-label="Previous" disabled={page === 1} onClick={() => setPage(page - 1)}><Icon name="chevron-left" size={16} /></button>
              {[1, 2, 3].map((p) => <button key={p} className={"pg-num" + (page === p ? " on" : "")} onClick={() => setPage(p)}>{p}</button>)}
              <button className="pg-arrow" aria-label="Next" onClick={() => setPage(page + 1)}><Icon name="chevron-right" size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

function OrgStub({ id, label, icon }) {
  useScreen(id, label, ["loaded"]);
  return (
    <React.Fragment>
      <div className="page-head"><div><h1 className="page-title">{label}</h1><p className="page-sub">Part of the full organizer build.</p></div></div>
      <div className="card"><EmptyState icon={icon} title={label} body="This screen is scoped for the next build pass once you approve the critical-path slice." /></div>
    </React.Fragment>
  );
}

function OrganizerShell() {
  const [nav, setNav] = useStateO("dashboard");
  const [detail, setDetail] = useStateO(null);
  const [createdEvents, setCreatedEvents] = useStateO([]);
  const meta = [...ORG_NAV, ...ORG_FOOT].find((n) => n.id === nav);
  const go = (id) => { setDetail(null); setNav(id); };
  const onPublish = (ev) => { setCreatedEvents((list) => [ev, ...list]); setDetail(null); setNav("events"); };

  let body, crumb = meta.label, eventName = null;
  if (detail) {
    body = <OrgEventDetail eventId={detail} onBack={() => setDetail(null)} onAgents={() => go("agents")} />;
    crumb = "Event detail";
  } else if (nav === "dashboard") {
    body = <OrgDashboard />;
    eventName = DASH.eventName;
  } else if (window.ORG_SCREENS && window.ORG_SCREENS[nav]) {
    body = window.ORG_SCREENS[nav]({ go, onOpenEvent: setDetail, onCreate: () => go("create"), onPublish, createdEvents });
  } else {
    body = <OrgStub id={"O-" + nav} label={meta.label} icon={meta.icon} />;
  }

  return (
    <div className="oshell">
      <OrgSidebar active={nav} onNav={go} />
      <div className="omain">
        <OrgTopbar crumb={crumb} eventName={eventName} onEvent={() => {}} />
        <div className="ocontent"><div className="ocontainer fadein" key={nav + (detail || "")}>{body}</div></div>
      </div>
    </div>
  );
}

Object.assign(window, { OrganizerShell });
