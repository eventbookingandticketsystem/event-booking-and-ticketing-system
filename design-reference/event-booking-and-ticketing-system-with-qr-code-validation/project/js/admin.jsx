// Tiketi — Admin shell (desktop sidebar) + screens AD1–AD6.
const { useState: useStateAD } = React;

const ADMIN_NAV = [
  { id: "overview", label: "Overview", icon: "layout-dashboard" },
  { id: "organizers", label: "Organizers", icon: "building-2" },
  { id: "events", label: "Events", icon: "calendar-days" },
  { id: "gateagents", label: "Gate Agents", icon: "users" },
  { id: "health", label: "System Health", icon: "activity" },
];
const ADMIN_FOOT = [{ id: "settings", label: "Settings", icon: "settings" }];

function AdSection({ title, action, children, danger, pad = true }) {
  return (
    <div className={"card" + (danger ? " set-danger" : "")} style={{ overflow: "hidden" }}>
      {title && <div className="sec-card-head"><h3 className="sec-card-title" style={danger ? { color: "var(--danger)" } : {}}>{title}</h3>{action}</div>}
      <div style={pad ? { padding: 20 } : {}}>{children}</div>
    </div>
  );
}

function AdSidebar({ active, onNav }) {
  return (
    <aside className="osidebar">
      <div>
        <div className="obrand">
          <span className="mark"><Icon name="ticket" size={19} color="#fff" /></span>
          <div><div className="name">Tiketi</div><div className="sub">Admin console</div></div>
        </div>
        <nav className="onav" aria-label="Admin">
          {ADMIN_NAV.map((n) => (
            <button key={n.id} className={"onav-item" + (active === n.id ? " on" : "")} aria-current={active === n.id} onClick={() => onNav(n.id)}>
              <Icon name={n.icon} size={18} /> {n.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="onav">
        {ADMIN_FOOT.map((n) => (
          <button key={n.id} className={"onav-item" + (active === n.id ? " on" : "")} onClick={() => onNav(n.id)}>
            <Icon name={n.icon} size={18} /> {n.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

function AdTopbar({ crumb, onCrumbRoot }) {
  return (
    <header className="otopbar">
      <div className="page-crumb" style={{ margin: 0 }}>
        <button className="auth-link" style={{ color: "var(--text-secondary)", fontWeight: 400 }} onClick={onCrumbRoot}>Admin</button>
        <Icon name="chevron-right" size={14} /><span style={{ color: "var(--text)", fontWeight: 600 }}>{crumb}</span>
      </div>
      <div className="otopbar-right">
        <span className="role-badge" style={{ background: "var(--accent-chip-bg)", color: "var(--accent-deep)", fontSize: 13, fontWeight: 600, padding: "4px 12px", borderRadius: "9999px" }}>Admin</span>
        <div className="gate-agent-av" style={{ width: 32, height: 32, fontSize: 13, background: "var(--navy)" }}>SA</div>
      </div>
    </header>
  );
}

// ---------- AD1 OVERVIEW ----------
function AdOverview() {
  const state = useScreen("AD1", "System overview", ["loaded", "loading", "error"]);
  const d = ADMIN_OVERVIEW;

  if (state === "error") {
    return (
      <React.Fragment>
        <div className="page-head"><div><h1 className="page-title">System overview</h1><p className="page-sub">System-wide activity across all organizers.</p></div></div>
        <AlertBanner tone="danger" title="Failed to load system data">The monitoring service could not be reached.</AlertBanner>
        <div style={{ marginTop: 16 }}><Button icon="rotate-ccw">Retry</Button></div>
      </React.Fragment>
    );
  }

  if (state === "loading") {
    return (
      <React.Fragment>
        <div className="page-head"><div><Skeleton w={240} h={28} /><Skeleton w={200} h={14} mt={10} /></div></div>
        <div className="ostats">{[0, 1, 2, 3].map((i) => <div className="stat" key={i}><Skeleton w="55%" h={12} /><Skeleton w="60%" h={30} mt={12} /></div>)}</div>
        <div className="card card-pad" style={{ marginTop: 22 }}><Skeleton w={180} h={18} /><Skeleton h={200} mt={18} /></div>
        <div className="tbl-wrap" style={{ marginTop: 22 }}><div style={{ padding: 16 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={20} mt={i ? 16 : 0} />)}</div></div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="page-head">
        <div><h1 className="page-title">System overview</h1><p className="page-sub"><span className="osync"><Icon name="refresh-cw" size={13} /> Updated just now · 6 Dec 2025, 14:30</span></p></div>
      </div>
      <div className="ostats">
        <StatCard label="Total Organizers" value={d.organizers} chipIcon="building-2" footText="Across South Sudan" />
        <StatCard label="Active Events Today" value={d.activeToday} chipIcon="calendar-check" footDot="var(--accent)" footText="Gates open now" />
        <StatCard label="Tickets Sold (all time)" value={d.ticketsAllTime.toLocaleString()} chipIcon="ticket" chipBg="var(--success-bg)" chipFg="var(--success)" footDot="var(--success)" footText="Platform total" />
        <StatCard label="Fraud Attempts (30d)" value={d.fraud30d} chipIcon="shield-alert" chipBg="var(--danger-bg)" chipFg="var(--danger)" footDot="var(--danger)" footText="Rejected at gates" />
      </div>

      <div className="card card-pad" style={{ marginTop: 22 }}>
        <div className="chart-head"><h3 className="sec-card-title">Tickets sold</h3><span className="muted" style={{ fontSize: 13 }}>Per day · last 30 days</span></div>
        <LineChart data={d.salesTrend} label="tickets sold per day" />
      </div>

      <div className="tbl-wrap" style={{ marginTop: 22 }}>
        <div className="sec-card-head"><h3 className="sec-card-title">Recent activity</h3></div>
        <table className="tbl">
          <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Status</th></tr></thead>
          <tbody>
            {d.activity.map((a, i) => (
              <tr key={i}>
                <td className="mono" style={{ whiteSpace: "nowrap" }}>{a.time}</td>
                <td style={{ fontWeight: 600 }}>{a.actor}</td>
                <td className="muted">{a.action}</td>
                <td>{a.status === "Completed" ? <StatusPill status="Completed" tone="success" sm /> : a.status === "Pending" ? <StatusPill status="Pending" tone="warning" sm /> : <StatusPill status="Upcoming" tone="info" sm />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </React.Fragment>
  );
}

// ---------- AD2 ORGANIZER MANAGEMENT ----------
function AdOrganizers({ onOpen }) {
  const state = useScreen("AD2", "Organizers", ["loaded", "loading", "empty"]);
  const [modal, setModal] = useStateAD(false);
  const [confirm, setConfirm] = useStateAD(null); // {type, org}
  const [q, setQ] = useStateAD("");
  const rows = state === "empty" ? [] : ORGANIZERS.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()) || o.contact.toLowerCase().includes(q.toLowerCase()));

  return (
    <React.Fragment>
      <div className="page-head"><div><h1 className="page-title">Organizers</h1><p className="page-sub">Everyone authorised to create events on Tiketi.</p></div><Button icon="user-plus" onClick={() => setModal(true)}>Add organizer</Button></div>

      {state !== "empty" && state !== "loading" && (
        <div className="msearch" style={{ margin: "0 0 18px", maxWidth: 360 }}><Icon name="search" size={18} color="var(--text-muted)" /><input placeholder="Search organizers..." aria-label="Search organizers" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      )}

      {state === "empty" ? (
        <div className="card"><EmptyState icon="building-2" title="No organizers yet" body="Invite an organizer to start hosting events." cta="Add organizer" onCta={() => setModal(true)} /></div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Phone</th><th>Events</th><th>Status</th><th>Joined</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>
              {state === "loading" ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td><Skeleton w="70%" h={14} /></td><td><Skeleton w={120} h={12} /></td><td><Skeleton w={30} h={12} /></td><td><Skeleton w={70} h={20} r={9999} /></td><td><Skeleton w={80} h={12} /></td><td><Skeleton w={90} h={28} /></td></tr>
              )) : rows.map((o) => (
                <tr key={o.id}>
                  <td><button className="linkcell" onClick={() => onOpen(o.id)}>{o.name}</button><div className="muted" style={{ fontSize: 12 }}>{o.contact}</div></td>
                  <td className="mono">{o.phone}</td>
                  <td className="mono">{o.events}</td>
                  <td><StatusPill status={o.status} sm /></td>
                  <td className="muted">{o.joined}</td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                      <button className="icon-btn" aria-label="View" title="View" onClick={() => onOpen(o.id)}><Icon name="eye" size={15} /></button>
                      <button className="icon-btn" aria-label="Suspend" title="Suspend" onClick={() => setConfirm({ type: "suspend", org: o })}><Icon name="ban" size={15} /></button>
                      <button className="icon-btn danger" aria-label="Delete" title="Delete" onClick={() => setConfirm({ type: "delete", org: o })}><Icon name="trash-2" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <AddOrganizerModal onClose={() => setModal(false)} />}
      {confirm && confirm.type === "suspend" && (
        <Modal icon="alert-triangle" title={`Suspend ${confirm.org.name}?`} sub="They will be unable to create or manage events until reactivated." onClose={() => setConfirm(null)}
          footer={<React.Fragment><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" icon="ban" onClick={() => setConfirm(null)}>Suspend</Button></React.Fragment>}>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>Active events stay live, but no new changes can be made.</p>
        </Modal>
      )}
      {confirm && confirm.type === "delete" && (
        <Modal icon="alert-triangle" title={`Delete ${confirm.org.name}?`} sub="This permanently removes the organizer and all their draft events. This cannot be undone." onClose={() => setConfirm(null)}
          footer={<React.Fragment><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" icon="trash-2" onClick={() => setConfirm(null)}>Delete organizer</Button></React.Fragment>}>
          <FormField label="Type DELETE to confirm" placeholder="DELETE" />
        </Modal>
      )}
    </React.Fragment>
  );
}

function AddOrganizerModal({ onClose }) {
  const [f, setF] = useStateAD({ name: "", phone: DEFAULT_PHONE, org: "" });
  const [touched, setTouched] = useStateAD(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const existing = ORGANIZERS.map((o) => o.phone.replace(/\s/g, ""));
  const phoneFull = phoneE164(f.phone);
  const err = {
    name: !f.name.trim() ? "Full name is required" : "",
    phone: !f.phone.num ? "Phone number is required" : f.phone.num.length < 7 ? "Enter a valid phone number" : existing.includes(phoneFull) ? "This phone number is already registered" : "",
    org: !f.org.trim() ? "Organization name is required" : "",
  };
  const valid = !Object.values(err).some(Boolean);
  const e = (k) => touched ? err[k] : "";
  const submit = () => { setTouched(true); if (valid) onClose(); };

  return (
    <Modal title="Add organizer" sub="They'll receive an invite by SMS to set up their account." onClose={onClose}
      footer={<React.Fragment><Button variant="ghost" onClick={onClose}>Cancel</Button><Button icon="send" onClick={submit}>Send invite</Button></React.Fragment>}>
      <FormField label="Full name" icon="user" placeholder="e.g. Grace Lado" value={f.name} onChange={set("name")} error={e("name")} />
      <PhoneInput value={f.phone} onChange={(p) => setF({ ...f, phone: p })} error={e("phone")} />
      <FormField label="Organization name" icon="building-2" placeholder="e.g. Grace Arena" value={f.org} onChange={set("org")} error={e("org")} />
      <div className="field">
        <label className="field-label">Role</label>
        <div className="input" style={{ background: "var(--bg)", color: "var(--text-secondary)" }}>
          <span className="lead"><Icon name="lock" size={16} /></span>
          <input value="Organizer" readOnly disabled />
        </div>
      </div>
    </Modal>
  );
}

// ---------- AD2b ORGANIZER DETAIL ----------
function AdOrganizerDetail({ orgId, onBack, onOpenEvent }) {
  useScreen("AD2b", "Organizer detail", ["loaded"]);
  const o = ORGANIZER_BY_ID[orgId] || ORGANIZERS[0];
  const [tab, setTab] = useStateAD("events");
  const [status, setStatus] = useStateAD(o.status);
  const [confirm, setConfirm] = useStateAD(false);
  const evs = ORG_EVENTS.filter((e) => ["evt-jmf", "evt-gospel"].includes(e.id) || o.id === "org-nile").slice(0, status === "Suspended" ? 3 : 3);
  const agents = GATE_AGENTS.slice(0, 3);

  const toggle = () => { if (status === "Active") setConfirm(true); else setStatus("Active"); };

  return (
    <React.Fragment>
      <div className="page-head">
        <div>
          <div className="page-crumb"><button className="auth-link" style={{ color: "var(--text-secondary)" }} onClick={onBack}>Organizers</button><Icon name="chevron-right" size={14} /><span style={{ color: "var(--text)" }}>{o.name}</span></div>
          <h1 className="page-title">{o.name} <StatusPill status={status} /></h1>
        </div>
        <Button variant={status === "Active" ? "ghost" : "primary"} icon={status === "Active" ? "ban" : "check"} onClick={toggle}>{status === "Active" ? "Suspend" : "Activate"}</Button>
      </div>

      {status === "Suspended" && <div style={{ marginBottom: 18 }}><AlertBanner tone="warning" title="This organizer is suspended">They cannot create or manage events until reactivated.</AlertBanner></div>}

      <AdSection title="Organizer information">
        <div className="form-grid">
          <div><div className="field-label">Contact</div><div style={{ fontWeight: 600, marginTop: 3 }}>{o.contact}</div></div>
          <div><div className="field-label">Phone</div><div className="mono" style={{ fontWeight: 600, marginTop: 3 }}>{o.phone}</div></div>
          <div><div className="field-label">Organization</div><div style={{ fontWeight: 600, marginTop: 3 }}>{o.org}</div></div>
          <div><div className="field-label">Joined</div><div style={{ fontWeight: 600, marginTop: 3 }}>{o.joined}</div></div>
          <div><div className="field-label">Total events</div><div style={{ fontWeight: 600, marginTop: 3 }}>{o.events}</div></div>
          <div><div className="field-label">Revenue generated</div><div style={{ fontWeight: 600, marginTop: 3 }}>{SSP(o.revenue)}</div></div>
        </div>
      </AdSection>

      <div className="otabs" style={{ marginTop: 22 }}>
        {[["events", "Events"], ["agents", "Gate agents"], ["activity", "Activity log"]].map(([id, l]) => (
          <button key={id} className={"otab" + (tab === id ? " on" : "")} onClick={() => setTab(id)}>{l}</button>
        ))}
      </div>

      {tab === "events" && (evs.length ? (
        <div className="tbl-wrap">
          <table className="tbl"><thead><tr><th>Event</th><th>Date</th><th>Venue</th><th>Tickets sold</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>{evs.map((e) => (
              <tr key={e.id}><td style={{ fontWeight: 600 }}>{e.name}</td><td>{e.date}</td><td className="muted">{e.venue}</td><td className="mono">{e.status === "Draft" ? "—" : e.sold.toLocaleString() + " / " + e.capacity.toLocaleString()}</td><td><StatusPill status={e.status} sm /></td>
                <td><div className="row-actions" style={{ justifyContent: "flex-end" }}><button className="icon-btn" aria-label="View" onClick={() => onOpenEvent(e.id)}><Icon name="eye" size={15} /></button></div></td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : <AdSection><EmptyState icon="calendar-off" title="No events" body="This organizer hasn't created any events yet." /></AdSection>)}

      {tab === "agents" && (
        <div className="tbl-wrap">
          <table className="tbl"><thead><tr><th>Name</th><th>Phone</th><th>Gate</th><th>Status</th></tr></thead>
            <tbody>{agents.map((a) => <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.name}</td><td className="mono">{a.phone}</td><td>{a.gate}</td><td><StatusPill status={a.status} sm /></td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === "activity" && (
        <AdSection pad={false}>
          <div className="actlog">
            {ORG_ACTIVITY.map((a, i) => (
              <div className="actlog-row" key={i}>
                <span className="actlog-dot" />
                <div><div style={{ fontWeight: 500, fontSize: 14 }}>{a.action}</div><div className="mono" style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{a.time}</div></div>
              </div>
            ))}
          </div>
        </AdSection>
      )}

      {confirm && (
        <Modal icon="alert-triangle" title={`Suspend ${o.name}?`} sub="They will be unable to create or manage events until reactivated." onClose={() => setConfirm(false)}
          footer={<React.Fragment><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" icon="ban" onClick={() => { setStatus("Suspended"); setConfirm(false); }}>Suspend</Button></React.Fragment>}>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>Active events stay live, but no new changes can be made.</p>
        </Modal>
      )}
    </React.Fragment>
  );
}

// ---------- AD3 EVENT OVERSIGHT ----------
const AD_EVENT_FILTERS = ["All", "Upcoming", "Ongoing", "Completed", "Flagged"];
function AdEvents({ onOpen }) {
  const state = useScreen("AD3", "All events", ["loaded", "loading", "empty"]);
  const [filter, setFilter] = useStateAD("All");
  const [q, setQ] = useStateAD("");
  let rows = state === "empty" ? [] : ALL_EVENTS;
  if (filter === "Flagged") rows = rows.filter((e) => e.fraud > 5);
  else if (filter !== "All") rows = rows.filter((e) => e.status === filter);
  rows = rows.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <React.Fragment>
      <div className="page-head"><div><h1 className="page-title">All events</h1><p className="page-sub">Every event across the platform.</p></div></div>
      <div className="otabs">{AD_EVENT_FILTERS.map((f) => <button key={f} className={"otab" + (filter === f ? " on" : "")} onClick={() => setFilter(f)}>{f}</button>)}</div>

      {filter === "Flagged" && rows.length > 0 && <div style={{ marginBottom: 18 }}><AlertBanner tone="warning" title="Elevated fraud activity">These events have more than 5 fraud attempts and may need review.</AlertBanner></div>}

      {state !== "loading" && state !== "empty" && (
        <div className="msearch" style={{ margin: "0 0 18px", maxWidth: 360 }}><Icon name="search" size={18} color="var(--text-muted)" /><input placeholder="Search events..." aria-label="Search events" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      )}

      {state === "empty" || rows.length === 0 ? (
        <div className="card"><EmptyState icon="calendar-off" title="No events match this filter" body="Try a different filter or search term." /></div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Event</th><th>Organizer</th><th>Date</th><th>Sold</th><th>Fraud</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>
              {state === "loading" ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td><Skeleton w="70%" h={14} /></td><td><Skeleton w={100} h={12} /></td><td><Skeleton w={70} h={12} /></td><td><Skeleton w={50} h={12} /></td><td><Skeleton w={30} h={12} /></td><td><Skeleton w={70} h={20} r={9999} /></td><td><Skeleton w={90} h={28} /></td></tr>
              )) : rows.map((e) => (
                <tr key={e.id}>
                  <td><button className="linkcell" onClick={() => onOpen(e.id)}>{e.name}</button></td>
                  <td className="muted">{e.organizer}</td>
                  <td>{e.date}</td>
                  <td className="mono">{e.sold.toLocaleString()}</td>
                  <td className="mono" style={{ color: e.fraud > 5 ? "var(--danger)" : "inherit", fontWeight: e.fraud > 5 ? 600 : 400 }}>{e.fraud}</td>
                  <td><StatusPill status={e.status} sm /></td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                      <button className="icon-btn" aria-label="View" title="View" onClick={() => onOpen(e.id)}><Icon name="eye" size={15} /></button>
                      <button className="icon-btn" aria-label="Flag" title="Flag"><Icon name="flag" size={15} /></button>
                      <button className="icon-btn danger" aria-label="Remove" title="Remove"><Icon name="trash-2" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </React.Fragment>
  );
}

// AD3b read-only event detail (reuses event mock)
function AdEventDetail({ eventId, onBack }) {
  useScreen("AD3b", "Event detail (view only)", ["loaded"]);
  const meta = ALL_EVENTS.find((e) => e.id === eventId) || ALL_EVENTS[0];
  const ev = EVENT_BY_ID[eventId] || EVENTS[0];
  const revenue = (ev.tiers || []).reduce((s, t) => s + (t.capacity - t.remaining) * t.price, 0);

  return (
    <React.Fragment>
      <div className="page-head">
        <div>
          <div className="page-crumb"><button className="auth-link" style={{ color: "var(--text-secondary)" }} onClick={onBack}>All events</button><Icon name="chevron-right" size={14} /><span style={{ color: "var(--text)" }}>{meta.name}</span></div>
          <h1 className="page-title">{meta.name} <StatusPill status={meta.status} /></h1>
        </div>
        <span className="pill pill-neutral"><Icon name="eye" size={14} /> View only</span>
      </div>
      <div className="stack20">
        <div className="ostats">
          <StatCard label="Tickets Sold" value={meta.sold.toLocaleString()} chipIcon="ticket" chipBg="var(--info-bg)" chipFg="var(--navy)" footText={"Organizer: " + meta.organizer} />
          <StatCard label="Revenue" value={SSP(revenue)} chipIcon="trending-up" chipBg="var(--success-bg)" chipFg="var(--success)" footDot="var(--success)" footText="Gross sales" />
          <StatCard label="Fraud Attempts" value={meta.fraud} chipIcon="shield-alert" chipBg="var(--danger-bg)" chipFg="var(--danger)" footDot="var(--danger)" footText="Rejected at gate" />
          <StatCard label="Categories" value={(ev.tiers || []).length} chipIcon="layers" footText="Ticket tiers" />
        </div>
        <AdSection title="Event information">
          <div className="dz-preview" style={{ backgroundImage: ev.poster, marginBottom: 18 }} />
          <div className="form-grid">
            <div><div className="field-label">Organizer</div><div style={{ fontWeight: 600, marginTop: 3 }}>{meta.organizer}</div></div>
            <div><div className="field-label">Date</div><div style={{ fontWeight: 600, marginTop: 3 }}>{meta.date}</div></div>
            <div className="full"><div className="field-label">About</div><div style={{ marginTop: 3, lineHeight: 1.55, color: "var(--text-secondary)" }}>{ev.about}</div></div>
          </div>
        </AdSection>
        <div className="tbl-wrap">
          <div className="sec-card-head"><h3 className="sec-card-title">Ticket categories</h3></div>
          <table className="tbl"><thead><tr><th>Category</th><th>Price</th><th>Sold</th><th>Capacity</th></tr></thead>
            <tbody>{(ev.tiers || []).map((t) => <tr key={t.id}><td style={{ fontWeight: 600 }}>{t.name}</td><td className="mono">{SSP(t.price)}</td><td className="mono">{(t.capacity - t.remaining).toLocaleString()}</td><td className="mono">{t.capacity.toLocaleString()}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </React.Fragment>
  );
}

// ---------- AD4 GATE AGENT OVERSIGHT ----------
function AdGateAgents() {
  const state = useScreen("AD4", "Gate agents", ["loaded", "loading", "empty"]);
  const [history, setHistory] = useStateAD(null);
  const [confirm, setConfirm] = useStateAD(null);
  const rows = state === "empty" ? [] : ADMIN_AGENTS;

  return (
    <React.Fragment>
      <div className="page-head"><div><h1 className="page-title">Gate agents</h1><p className="page-sub">Every scanning agent across all events.</p></div></div>

      {state === "empty" ? (
        <div className="card"><EmptyState icon="users" title="No gate agents registered yet" body="Agents appear here once organizers assign them to events." /></div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Phone</th><th>Assigned event</th><th>Last active</th><th>Scans today</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>
              {state === "loading" ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td><Skeleton w="70%" h={14} /></td><td><Skeleton w={120} h={12} /></td><td><Skeleton w={120} h={12} /></td><td><Skeleton w={70} h={12} /></td><td><Skeleton w={40} h={12} /></td><td><Skeleton w={70} h={20} r={9999} /></td><td><Skeleton w={90} h={28} /></td></tr>
              )) : rows.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td className="mono">{a.phone}</td>
                  <td className="muted">{a.event}</td>
                  <td className="muted">{a.lastActive}</td>
                  <td className="mono">{a.scansToday.toLocaleString()}</td>
                  <td><StatusPill status={a.status} sm /></td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                      <button className="icon-btn" aria-label="View scan history" title="Scan history" onClick={() => setHistory(a)}><Icon name="history" size={15} /></button>
                      <button className="icon-btn danger" aria-label="Deactivate" title="Deactivate" onClick={() => setConfirm(a)}><Icon name="power" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {history && (
        <Modal title={history.name + " — scan history"} sub={history.event} onClose={() => setHistory(null)} width={520}
          footer={<Button variant="ghost" onClick={() => setHistory(null)}>Close</Button>}>
          <div className="scanhist">
            {AGENT_SCAN_HISTORY.map((s, i) => (
              <div className="scanhist-row" key={i}>
                <span className="mono" style={{ fontSize: 13, color: "var(--text-secondary)", width: 64 }}>{s.time}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{s.event}</span>
                {s.result === "ADMIT" ? <StatusPill status="Admitted" tone="success" sm /> : <StatusPill status="Rejected" tone="danger" sm />}
                <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)", width: 116, textAlign: "right" }}>{s.id}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal icon="alert-triangle" title={`Deactivate ${confirm.name}?`} sub="They will be signed out of the scanner and unable to validate tickets." onClose={() => setConfirm(null)}
          footer={<React.Fragment><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" icon="power" onClick={() => setConfirm(null)}>Deactivate</Button></React.Fragment>}>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>You can reactivate them at any time.</p>
        </Modal>
      )}
    </React.Fragment>
  );
}

// ---------- AD5 SYSTEM HEALTH ----------
function AdHealth() {
  const state = useScreen("AD5", "System health", ["loaded", "loading", "error"]);
  const h = SYSTEM_HEALTH;
  const degraded = h.services.find((s) => s.status === "Degraded");

  if (state === "error") {
    return (
      <React.Fragment>
        <div className="page-head"><div><h1 className="page-title">System health</h1><p className="page-sub">Live status of every connected service.</p></div></div>
        <AlertBanner tone="danger" title="Health check failed">Could not reach the monitoring service. Status below may be stale.</AlertBanner>
        <div style={{ marginTop: 16 }}><Button icon="rotate-ccw">Retry</Button></div>
      </React.Fragment>
    );
  }
  if (state === "loading") {
    return (
      <React.Fragment>
        <div className="page-head"><div><Skeleton w={220} h={28} /></div></div>
        <div className="ostats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>{[0, 1, 2].map((i) => <div className="stat" key={i}><Skeleton w="55%" h={12} /><Skeleton w="50%" h={30} mt={12} /></div>)}</div>
        <div className="card card-pad" style={{ marginTop: 22 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={22} mt={i ? 18 : 0} />)}</div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="page-head"><div><h1 className="page-title">System health</h1><p className="page-sub"><span className="osync"><Icon name="refresh-cw" size={13} /> Auto-refreshing every 30s</span></p></div></div>

      {degraded && <div style={{ marginBottom: 18 }}><AlertBanner tone="warning" title={degraded.name + " is degraded"}>Payments through this provider may be delayed.</AlertBanner></div>}

      <div className="ostats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <StatCard label="API Uptime" value={h.uptime} chipIcon="trending-up" chipBg="var(--success-bg)" chipFg="var(--success)" footDot="var(--success)" footText="Last 30 days" />
        <StatCard label="Avg Response Time" value={h.responseTime} chipIcon="timer" chipBg="var(--success-bg)" chipFg="var(--success)" footDot="var(--success)" footText="p50 across endpoints" />
        <StatCard label="Failed Callbacks (24h)" value={h.failedCallbacks} chipIcon="alert-triangle" chipBg="var(--warning-bg)" chipFg="var(--warning)" footDot="var(--warning)" footText="Retried automatically" />
      </div>

      <div className="card" style={{ marginTop: 22, overflow: "hidden" }}>
        <div className="sec-card-head"><h3 className="sec-card-title">Service status</h3></div>
        <div>
          {h.services.map((s, i) => (
            <div className="svc-row" key={s.name} style={i ? { borderTop: "1px solid var(--border-soft)" } : {}}>
              <span className="svc-dot" style={{ background: s.status === "Operational" ? "var(--success)" : "var(--warning)" }} />
              <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{s.name}</span>
              <StatusPill status={s.status === "Operational" ? "Online" : "Pending"} tone={s.status === "Operational" ? "success" : "warning"} sm />
              <span className="muted" style={{ fontSize: 12, width: 90, textAlign: "right" }}>{s.checked}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tbl-wrap" style={{ marginTop: 22 }}>
        <div className="sec-card-head"><h3 className="sec-card-title">Recent error log</h3></div>
        <table className="tbl"><thead><tr><th>Time</th><th>Service</th><th>Code</th><th>Message</th><th>Resolved</th></tr></thead>
          <tbody>{h.errors.map((e, i) => (
            <tr key={i}><td className="mono">{e.time}</td><td>{e.service}</td><td className="mono">{e.code}</td><td className="muted">{e.message}</td><td>{e.resolved ? <StatusPill status="Completed" tone="success" sm /> : <StatusPill status="Pending" tone="warning" sm />}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </React.Fragment>
  );
}

// ---------- AD6 ADMIN SETTINGS ----------
function MaskedField({ label, value }) {
  const [show, setShow] = useStateAD(false);
  const [copied, setCopied] = useStateAD(false);
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="copyfield">
        <input readOnly type={show ? "text" : "password"} value={value} />
        <button className="copyfield-btn" aria-label={show ? "Hide" : "Show"} onClick={() => setShow(!show)}><Icon name={show ? "eye-off" : "eye"} size={16} /></button>
        <button className="copyfield-btn" aria-label="Copy" onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }}><Icon name={copied ? "check" : "copy"} size={16} /></button>
      </div>
    </div>
  );
}

function AdSettings() {
  useScreen("AD6", "Admin settings", ["loaded"]);
  const [cfg, setCfg] = useStateAD({ maxCats: 10, payTimeout: 5, smsRetries: 3 });
  const [maint, setMaint] = useStateAD(false);
  const [maintConfirm, setMaintConfirm] = useStateAD(false);
  const [rotate, setRotate] = useStateAD(false);
  const setC = (k) => (v) => setCfg({ ...cfg, [k]: v });

  return (
    <React.Fragment>
      <div className="page-head"><div><h1 className="page-title">Settings</h1><p className="page-sub">Platform-wide credentials and configuration.</p></div></div>
      <div className="stack20" style={{ maxWidth: 820 }}>
        <AdSection title="Admin profile" action={<Button size="sm" variant="ghost">Save changes</Button>}>
          <div className="form-grid">
            <FormField label="Name" icon="user" value="System Admin" onChange={() => {}} />
            <FormField label="Phone" icon="phone" type="tel" value="+211 920 000 001" onChange={() => {}} />
          </div>
        </AdSection>

        <AdSection title="API credentials" action={<Button size="sm" variant="ghost">Save changes</Button>}>
          <div className="stack16">
            <MaskedField label="Africa's Talking API key" value="atsk_live_7f3c9a21b8e4d6105fa2c0993ee1" />
            <MaskedField label="MTN webhook secret" value="mtn_whsec_4b8c1d9e0f2a6357c9d1e8b04a7f" />
            <MaskedField label="Airtel webhook secret" value="airtel_whsec_2c7e9f1a3b5d8064e1f9a2c4d6b8" />
            <div className="field">
              <label className="field-label">JWT signing secret</label>
              <div className="copyfield"><input readOnly type="password" value="jwt_sec_••••••••••••••••••••••••••" /><span style={{ fontSize: 12, color: "var(--text-secondary)", padding: "0 6px" }}>Hidden</span></div>
            </div>
          </div>
        </AdSection>

        <AdSection title="System configuration" action={<Button size="sm" variant="ghost">Save changes</Button>}>
          <div className="form-grid">
            <NumberField label="Max ticket categories per event" min={1} max={20} value={cfg.maxCats} onChange={setC("maxCats")} />
            <NumberField label="Payment timeout (minutes)" min={1} max={60} value={cfg.payTimeout} onChange={setC("payTimeout")} />
            <NumberField label="SMS retry attempts" min={1} max={10} value={cfg.smsRetries} onChange={setC("smsRetries")} />
          </div>
          <div className="set-row" style={{ marginTop: 8, borderTop: "1px solid var(--border-soft)", paddingBottom: 0 }}>
            <div><div className="set-row-title">Maintenance mode</div><div className="set-row-desc">Takes the platform offline for all users. Only admins can sign in.</div></div>
            <button className={"toggle" + (maint ? " on" : "")} role="switch" aria-checked={maint} aria-label="Maintenance mode" onClick={() => { if (maint) setMaint(false); else setMaintConfirm(true); }}><span className="toggle-knob" /></button>
          </div>
        </AdSection>

        <AdSection title="Danger zone" danger>
          <div className="set-row" style={{ padding: 0 }}>
            <div><div className="set-row-title">Rotate JWT signing secret</div><div className="set-row-desc">Rotating invalidates all active tickets and signs every user out. This cannot be undone.</div></div>
            <Button variant="danger" icon="key-round" onClick={() => setRotate(true)}>Rotate key</Button>
          </div>
        </AdSection>
      </div>

      {maintConfirm && (
        <Modal icon="alert-triangle" title="Enable maintenance mode?" sub="All attendees, organizers, and gate agents will be locked out until you turn it off." onClose={() => setMaintConfirm(false)}
          footer={<React.Fragment><Button variant="ghost" onClick={() => setMaintConfirm(false)}>Cancel</Button><Button variant="danger" icon="power" onClick={() => { setMaint(true); setMaintConfirm(false); }}>Enable maintenance</Button></React.Fragment>}>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>In-progress payments and gate scans will fail while maintenance is active.</p>
        </Modal>
      )}
      {rotate && (
        <Modal icon="alert-triangle" title="Rotate JWT signing secret?" sub="This invalidates every active ticket and signs out all users immediately. This cannot be undone." onClose={() => setRotate(false)}
          footer={<React.Fragment><Button variant="ghost" onClick={() => setRotate(false)}>Cancel</Button><Button variant="danger" icon="key-round" onClick={() => setRotate(false)}>Rotate secret</Button></React.Fragment>}>
          <FormField label="Type ROTATE to confirm" placeholder="ROTATE" />
        </Modal>
      )}
    </React.Fragment>
  );
}

// ---------- Admin shell ----------
function AdminShell() {
  const [nav, setNav] = useStateAD("overview");
  const [orgDetail, setOrgDetail] = useStateAD(null);
  const [eventDetail, setEventDetail] = useStateAD(null);
  const meta = [...ADMIN_NAV, ...ADMIN_FOOT].find((n) => n.id === nav);
  const go = (id) => { setOrgDetail(null); setEventDetail(null); setNav(id); };

  let body, crumb = meta.label;
  if (eventDetail) { body = <AdEventDetail eventId={eventDetail} onBack={() => setEventDetail(null)} />; crumb = "Event detail"; }
  else if (orgDetail) { body = <AdOrganizerDetail orgId={orgDetail} onBack={() => setOrgDetail(null)} onOpenEvent={setEventDetail} />; crumb = "Organizer detail"; }
  else if (nav === "overview") body = <AdOverview />;
  else if (nav === "organizers") body = <AdOrganizers onOpen={setOrgDetail} />;
  else if (nav === "events") body = <AdEvents onOpen={setEventDetail} />;
  else if (nav === "gateagents") body = <AdGateAgents />;
  else if (nav === "health") body = <AdHealth />;
  else if (nav === "settings") body = <AdSettings />;

  return (
    <div className="oshell">
      <AdSidebar active={nav} onNav={go} />
      <div className="omain">
        <AdTopbar crumb={crumb} onCrumbRoot={() => go("overview")} />
        <div className="ocontent"><div className="ocontainer fadein" key={nav + (orgDetail || "") + (eventDetail || "")}>{body}</div></div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminShell });
