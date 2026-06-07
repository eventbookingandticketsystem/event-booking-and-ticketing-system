// Tiketi — Organizer screens O2–O7. Exposes window.ORG_SCREENS + OrgEventDetail.
const { useState: useStateO2 } = React;

const PROGRESS_COLOR = (pct) => pct >= 90 ? "var(--danger)" : pct >= 60 ? "var(--accent)" : "var(--success)";

// Shared card with header
function SectionCard({ title, action, children, danger, pad = true }) {
  return (
    <div className={"card" + (danger ? " set-danger" : "")} style={{ overflow: "hidden" }}>
      {title && <div className="sec-card-head"><h3 className="sec-card-title" style={danger ? { color: "var(--danger)" } : {}}>{title}</h3>{action}</div>}
      <div style={pad ? { padding: 20 } : {}}>{children}</div>
    </div>
  );
}

// ---------- O2 MY EVENTS ----------
const EVENT_FILTERS = ["All", "Upcoming", "Ongoing", "Completed", "Draft"];
function OrgMyEvents({ onOpenEvent, onCreate, createdEvents = [] }) {
  const state = useScreen("O2", "My events", ["loaded", "loading", "empty"]);
  const [filter, setFilter] = useStateO2("All");
  const allRows = [...createdEvents, ...ORG_EVENTS];
  const rows = allRows.filter((e) => filter === "All" || e.status === filter || (filter === "Upcoming" && e.status === "Upcoming"));

  const head = (
    <div className="page-head">
      <div><h1 className="page-title">My events</h1><p className="page-sub">Create, monitor, and manage your events.</p></div>
      <Button icon="plus" onClick={onCreate}>Create event</Button>
    </div>
  );

  if (state === "empty") {
    return <React.Fragment>{head}<div className="card"><EmptyState icon="calendar-plus" title="No events yet" body="Create your first event to start selling tickets." cta="Create event" onCta={onCreate} /></div></React.Fragment>;
  }

  return (
    <React.Fragment>
      {head}
      <div className="otabs">{EVENT_FILTERS.map((f) => <button key={f} className={"otab" + (filter === f ? " on" : "")} onClick={() => setFilter(f)}>{f}</button>)}</div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Event</th><th>Date</th><th>Venue</th><th>Tickets sold</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>
            {state === "loading" ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td><Skeleton w="70%" h={14} /></td><td><Skeleton w={70} h={12} /></td><td><Skeleton w={90} h={12} /></td><td><Skeleton w={80} h={12} /></td><td><Skeleton w={70} h={20} r={9999} /></td><td><Skeleton w={90} h={28} /></td></tr>
              ))
            ) : (
              rows.map((e) => {
                const pct = Math.round(e.sold / e.capacity * 100);
                return (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                    <td>{e.date}</td>
                    <td className="muted">{e.venue}</td>
                    <td>{e.status === "Draft" ? <span className="muted">—</span> : <span className="mono">{e.sold.toLocaleString()} / {e.capacity.toLocaleString()}</span>}</td>
                    <td><StatusPill status={e.status} sm /></td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <button className="icon-btn" aria-label="View" title="View" onClick={() => onOpenEvent(e.id)}><Icon name="eye" size={15} /></button>
                        <button className="icon-btn" aria-label="Edit" title="Edit"><Icon name="pencil" size={15} /></button>
                        <button className="icon-btn danger" aria-label="Archive" title="Archive"><Icon name="archive" size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {state !== "loading" && (
          <div className="pager">
            <span className="pager-count">Showing {rows.length} of {allRows.length}</span>
            <div className="pager-ctrls"><button className="pg-arrow" disabled aria-label="Previous"><Icon name="chevron-left" size={16} /></button><button className="pg-num on">1</button><button className="pg-arrow" aria-label="Next"><Icon name="chevron-right" size={16} /></button></div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

// ---------- O3 CREATE EVENT ----------
const STEP_LABELS = ["Event details", "Ticket categories", "Review & publish"];
function OrgCreate({ onDone, onPublish }) {
  useScreen("O3", "Create event", ["loaded"]);
  const [step, setStep] = useStateO2(1);
  const [f, setF] = useStateO2({ title: "", desc: "", venue: "", date: "", time: "", category: "" });
  const [cats, setCats] = useStateO2([{ name: "General", price: "", capacity: "", open: "", close: "" }]);
  const [touched, setTouched] = useStateO2(false);
  const [touched2, setTouched2] = useStateO2(false);
  const [publishing, setPublishing] = useStateO2(false);
  const [published, setPublished] = useStateO2(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isFuture = (d) => { if (!d) return false; const dt = new Date(d); return dt >= today; };

  // Step 1 validation
  const e1 = {
    title: !f.title.trim() ? "Event title is required" : f.title.trim().length < 5 ? "At least 5 characters" : "",
    desc: !f.desc.trim() ? "Description is required" : f.desc.trim().length < 20 ? "At least 20 characters" : "",
    venue: !f.venue.trim() ? "Venue is required" : "",
    date: !f.date ? "Pick a date" : !isFuture(f.date) ? "Must be a future date" : "",
    time: !f.time ? "Pick a time" : "",
    category: !f.category ? "Choose a category" : "",
  };
  const step1Valid = !Object.values(e1).some(Boolean);
  const err = (k) => touched ? e1[k] : "";

  // Step 2 validation (per category)
  const catErr = (c) => ({
    name: !c.name.trim() ? "Required" : "",
    price: c.price === "" ? "Required" : Number(c.price) < 0 ? "Min 0 SSP" : "",
    capacity: c.capacity === "" ? "Required" : Number(c.capacity) < 1 ? "Min 1" : "",
    open: !c.open ? "Required" : "",
    close: !c.close ? "Required" : (c.open && c.close < c.open) ? "After sale opens" : (f.date && c.close > f.date) ? "Before event date" : "",
  });
  const step2Valid = cats.length >= 1 && cats.every((c) => !Object.values(catErr(c)).some(Boolean));
  const ce = (c, k) => touched2 ? catErr(c)[k] : "";

  const setCat = (i, k, v) => setCats(cats.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const addCat = () => cats.length < 10 && setCats([...cats, { name: "", price: "", capacity: "", open: "", close: "" }]);
  const rmCat = (i) => setCats(cats.filter((_, j) => j !== i));

  const next = () => {
    if (step === 1) { setTouched(true); if (!step1Valid) return; }
    if (step === 2) { setTouched2(true); if (!step2Valid) return; }
    setStep(step + 1);
  };

  // Step 3 validation summary
  const checks = [
    { label: "Event title", ok: !e1.title },
    { label: "Description", ok: !e1.desc },
    { label: "Venue", ok: !e1.venue },
    { label: "Date & time", ok: !e1.date && !e1.time },
    { label: "Category", ok: !e1.category },
    { label: "At least one valid ticket category", ok: step2Valid },
  ];
  const allValid = checks.every((c) => c.ok);

  const publish = () => {
    if (!allValid) return;
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      const newEvent = {
        id: "evt-new-" + Date.now(),
        name: f.title, date: f.date || "TBD", venue: f.venue,
        sold: 0, capacity: cats.reduce((s, c) => s + (Number(c.capacity) || 0), 0),
        status: "Published", category: f.category,
      };
      if (onPublish) onPublish(newEvent); else setPublished(true);
    }, 1200);
  };

  return (
    <React.Fragment>
      <div className="page-head"><div><div className="page-crumb"><button className="auth-link" style={{ color: "var(--text-secondary)" }} onClick={onDone}>My events</button><Icon name="chevron-right" size={14} /><span style={{ color: "var(--text)" }}>Create event</span></div><h1 className="page-title">Create event</h1></div></div>

      <div className="steps">
        {STEP_LABELS.map((l, i) => {
          const n = i + 1;
          return (
            <React.Fragment key={l}>
              {i > 0 && <div className={"step-line" + (step > i ? " done" : "")} style={step > i ? { background: "var(--success)" } : {}} />}
              <div className={"step" + (step === n ? " on" : step > n ? " done" : "")}>
                <span className="step-dot">{step > n ? <Icon name="check" size={15} /> : n}</span>
                <span className="step-label">{l}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ maxWidth: 760 }}>
        {published ? (
          <SectionCard>
            <div className="center-col" style={{ textAlign: "center", padding: "20px 0" }}>
              <span className="confirm-ic" style={{ width: 72, height: 72, marginBottom: 16 }}><Icon name="check" size={36} strokeWidth={3} /></span>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, margin: "0 0 6px" }}>Event published</h2>
              <p className="muted" style={{ margin: "0 0 18px" }}>{f.title || "Your event"} is now visible to attendees across Juba.</p>
              <Button onClick={onDone}>Back to my events</Button>
            </div>
          </SectionCard>
        ) : step === 1 ? (
          <SectionCard title="Event details">
            <div className="form-grid">
              <div className="full"><FormField label="Event title" placeholder="e.g. Juba Music Festival 2025" value={f.title} onChange={set("title")} error={err("title")} disabled={publishing} /></div>
              <div className="full"><FormField label="Description" textarea placeholder="Tell attendees what to expect…" value={f.desc} onChange={set("desc")} error={err("desc")} hint="At least 20 characters" /></div>
              <div className="full"><FormField label="Venue" icon="map-pin" placeholder="e.g. Nyakuron Cultural Centre" value={f.venue} onChange={set("venue")} error={err("venue")} /></div>
              <FormField label="Date" icon="calendar" type="date" value={f.date} onChange={set("date")} error={err("date")} />
              <FormField label="Time" icon="clock" type="time" value={f.time} onChange={set("time")} error={err("time")} />
              <div className="full">
                <SelectField label="Category" icon="tag" value={f.category} onChange={set("category")} placeholder="Select a category" options={["Concert", "Football", "Conference", "Graduation", "Other"]} />
                {err("category") && <span className="field-error" style={{ marginTop: 6 }}><Icon name="alert-circle" size={13} /> {err("category")}</span>}
              </div>
              <div className="full">
                <label className="field-label" style={{ marginBottom: 6, display: "block" }}>Event poster</label>
                <div className="dropzone"><span className="dz-ic"><Icon name="upload-cloud" size={26} /></span><p className="dz-title">Upload event poster</p><p className="dz-sub">Recommended 1200×628px · PNG or JPG · max 5 MB</p></div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}><Button iconRight="arrow-right" onClick={next}>Next</Button></div>
          </SectionCard>
        ) : step === 2 ? (
          <SectionCard title="Ticket categories" action={<span className="muted" style={{ fontSize: 13 }}>{cats.length} / 10</span>}>
            {cats.map((c, i) => (
              <div className="catblock" key={i}>
                <div className="catblock-head"><span className="catblock-title">Category {i + 1}</span>{cats.length > 1 && <button className="icon-btn danger" aria-label="Remove category" onClick={() => rmCat(i)}><Icon name="trash-2" size={15} /></button>}</div>
                <div className="form-grid">
                  <div className="full"><FormField label="Category name" placeholder="e.g. VIP" value={c.name} onChange={(e) => setCat(i, "name", e.target.value)} error={ce(c, "name")} /></div>
                  <NumberField label="Price (SSP)" placeholder="0" min={0} value={c.price} onChange={(v) => setCat(i, "price", v)} error={ce(c, "price")} />
                  <NumberField label="Capacity" placeholder="0" min={1} value={c.capacity} onChange={(v) => setCat(i, "capacity", v)} error={ce(c, "capacity")} />
                  <FormField label="Sale opens" type="date" value={c.open} onChange={(e) => setCat(i, "open", e.target.value)} error={ce(c, "open")} />
                  <FormField label="Sale closes" type="date" value={c.close} onChange={(e) => setCat(i, "close", e.target.value)} error={ce(c, "close")} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14 }}><Button variant="ghost" size="sm" icon="plus" disabled={cats.length >= 10} onClick={addCat}>Add category</Button></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}><Button variant="ghost" icon="arrow-left" onClick={() => setStep(1)}>Back</Button><Button iconRight="arrow-right" onClick={next}>Next</Button></div>
          </SectionCard>
        ) : (
          <div className="stack16">
            <SectionCard title="Review">
              <div className="dz-preview" style={{ backgroundImage: POSTERS.concert, marginBottom: 16 }} />
              <div className="form-grid">
                <div><div className="field-label">Title</div><div style={{ fontWeight: 600, marginTop: 3 }}>{f.title || "—"}</div></div>
                <div><div className="field-label">Category</div><div style={{ fontWeight: 600, marginTop: 3 }}>{f.category || "—"}</div></div>
                <div><div className="field-label">Venue</div><div style={{ fontWeight: 600, marginTop: 3 }}>{f.venue || "—"}</div></div>
                <div><div className="field-label">Date & time</div><div style={{ fontWeight: 600, marginTop: 3 }}>{f.date || "—"} {f.time}</div></div>
              </div>
            </SectionCard>
            <SectionCard title="Ticket categories" pad={false}>
              <table className="tbl tbl-inner"><thead><tr><th>Category</th><th>Price</th><th>Capacity</th></tr></thead>
                <tbody>{cats.map((c, i) => <tr key={i}><td style={{ fontWeight: 600 }}>{c.name || "Category " + (i + 1)}</td><td className="mono">{c.price ? SSP(Number(c.price)) : "—"}</td><td className="mono">{c.capacity || "—"}</td></tr>)}</tbody>
              </table>
            </SectionCard>
            <SectionCard title="Validation summary">
              <div className="vcheck-list">
                {checks.map((c) => (
                  <div className="vcheck-row" key={c.label}>
                    <span className="vcheck-ic" style={{ color: c.ok ? "var(--success)" : "var(--danger)" }}><Icon name={c.ok ? "check-circle" : "alert-circle"} size={18} /></span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{c.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.ok ? "var(--success)" : "var(--danger)" }}>{c.ok ? "Valid" : "Needs attention"}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
            <AlertBanner tone="warning" title="Publishing makes this event visible to all attendees.">You can still edit details after publishing.</AlertBanner>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button variant="ghost" icon="arrow-left" onClick={() => setStep(2)} disabled={publishing}>Back</Button>
              <div style={{ display: "flex", gap: 12 }}>
                <Button variant="ghost" onClick={onDone} disabled={publishing}>Save as draft</Button>
                <Button onClick={publish} disabled={publishing || !allValid} icon={publishing ? undefined : "send"}>{publishing ? <React.Fragment><Spinner size="sm" light /> Publishing…</React.Fragment> : "Publish event"}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

// ---------- O4 EVENT DETAIL (organizer) ----------
function OrgEventDetail({ eventId, onBack, onAgents }) {
  useScreen("O4", "Event detail", ["loaded"]);
  const meta = ORG_EVENTS.find((e) => e.id === eventId) || ORG_EVENTS[0];
  const ev = EVENT_BY_ID[eventId] || EVENTS[0];
  const [tab, setTab] = useStateO2("overview");
  const agents = GATE_AGENTS.filter((a) => a.event.includes("Juba Music") || a.event === meta.name).slice(0, 3);
  const revenue = (EVENT_BY_ID[eventId]?.tiers || []).reduce((s, t) => s + (t.capacity - t.remaining) * t.price, 0) || 94550;

  return (
    <React.Fragment>
      <div className="page-head">
        <div>
          <div className="page-crumb"><button className="auth-link" style={{ color: "var(--text-secondary)" }} onClick={onBack}>My events</button><Icon name="chevron-right" size={14} /><span style={{ color: "var(--text)" }}>{meta.name}</span></div>
          <h1 className="page-title">{meta.name} <StatusPill status={meta.status} /></h1>
        </div>
        <Button variant="ghost" icon="pencil">Edit event</Button>
      </div>

      <div className="otabs">
        {[["overview", "Overview"], ["categories", "Ticket categories"], ["agents", "Gate agents"], ["reports", "Reports"]].map(([id, l]) => (
          <button key={id} className={"otab" + (tab === id ? " on" : "")} onClick={() => setTab(id)}>{l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="stack20">
          <div className="ostats">
            <StatCard label="Tickets Sold" value={meta.sold.toLocaleString()} chipIcon="ticket" chipBg="var(--info-bg)" chipFg="var(--navy)" footText={`of ${meta.capacity.toLocaleString()} capacity`} />
            <StatCard label="Revenue" value={SSP(revenue)} chipIcon="trending-up" chipBg="var(--success-bg)" chipFg="var(--success)" footDot="var(--success)" footText="Gross sales" />
            <StatCard label="Categories" value={(ev.tiers || []).length} chipIcon="layers" footText="Ticket tiers" />
            <StatCard label="Gate Agents" value={agents.length} chipIcon="users" chipBg="var(--chip-amber-bg)" chipFg="var(--chip-amber-fg)" footText="Assigned" />
          </div>
          <SectionCard title="Event information">
            <div className="dz-preview" style={{ backgroundImage: ev.poster, marginBottom: 18 }} />
            <div className="form-grid">
              <div><div className="field-label">Venue</div><div style={{ fontWeight: 600, marginTop: 3 }}>{meta.venue}</div></div>
              <div><div className="field-label">Date</div><div style={{ fontWeight: 600, marginTop: 3 }}>{meta.date}</div></div>
              <div className="full"><div className="field-label">About</div><div style={{ marginTop: 3, lineHeight: 1.55, color: "var(--text-secondary)" }}>{ev.about}</div></div>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "categories" && (
        <div className="tbl-wrap">
          <table className="tbl"><thead><tr><th>Category</th><th>Price</th><th>Sold</th><th style={{ minWidth: 160 }}>Capacity</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>{(ev.tiers || []).map((t) => {
              const sold = t.capacity - t.remaining; const pct = Math.round(sold / t.capacity * 100);
              return (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td className="mono">{SSP(t.price)}</td>
                  <td className="mono">{sold.toLocaleString()}</td>
                  <td><div className="cell-prog"><div className="cell-prog-track"><span className="cell-prog-bar" style={{ width: pct + "%", background: PROGRESS_COLOR(pct) }} /></div><span className="cell-prog-txt">{pct}% of {t.capacity.toLocaleString()}</span></div></td>
                  <td><div className="row-actions" style={{ justifyContent: "flex-end" }}><button className="icon-btn" aria-label="Edit"><Icon name="pencil" size={15} /></button></div></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}

      {tab === "agents" && (
        <div className="tbl-wrap">
          <div className="sec-card-head"><h3 className="sec-card-title">Assigned gate agents</h3><Button size="sm" icon="user-plus" onClick={onAgents}>Add gate agent</Button></div>
          <table className="tbl"><thead><tr><th>Name</th><th>Phone</th><th>Gate</th><th>Status</th></tr></thead>
            <tbody>{agents.map((a) => <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.name}</td><td className="mono">{a.phone}</td><td>{a.gate}</td><td><StatusPill status={a.status} sm /></td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === "reports" && (
        <SectionCard>
          <EmptyState icon="bar-chart-2" title="Full report available after the event" body="Live attendance is on the dashboard. A complete post-event report unlocks once this event is marked completed." />
        </SectionCard>
      )}
    </React.Fragment>
  );
}

// ---------- O5 GATE AGENTS MANAGEMENT ----------
function OrgAgents() {
  const state = useScreen("O5", "Gate agents", ["loaded", "empty"]);
  const [modal, setModal] = useStateO2(false);
  const [agentPhone, setAgentPhone] = useStateO2(DEFAULT_PHONE);
  const rows = state === "empty" ? [] : GATE_AGENTS;

  return (
    <React.Fragment>
      <div className="page-head"><div><h1 className="page-title">Gate agents</h1><p className="page-sub">People authorised to scan tickets at your events.</p></div><Button icon="user-plus" onClick={() => setModal(true)}>Add agent</Button></div>
      {rows.length === 0 ? (
        <div className="card"><EmptyState icon="users" title="No gate agents added" body="Add agents to enable event gate scanning." cta="Add agent" onCta={() => setModal(true)} /></div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl"><thead><tr><th>Name</th><th>Phone</th><th>Assigned event</th><th>Gate</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>{rows.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.name}</td><td className="mono">{a.phone}</td><td className="muted">{a.event}</td><td>{a.gate}</td><td><StatusPill status={a.status} sm /></td>
                <td><div className="row-actions" style={{ justifyContent: "flex-end" }}><button className="icon-btn" aria-label="Edit"><Icon name="pencil" size={15} /></button><button className="icon-btn danger" aria-label="Remove"><Icon name="trash-2" size={15} /></button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {modal && (
        <Modal title="Add gate agent" sub="They'll receive a scanner login by SMS." onClose={() => setModal(false)}
          footer={<React.Fragment><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button icon="user-plus" onClick={() => setModal(false)}>Add agent</Button></React.Fragment>}>
          <FormField label="Full name" icon="user" placeholder="e.g. James Majok" />
          <PhoneInput value={agentPhone} onChange={setAgentPhone} />
          <SelectField label="Assigned event" icon="calendar" placeholder="Select an event" options={ORG_EVENTS.map((e) => e.name)} />
          <FormField label="Gate / position" icon="door-open" placeholder="e.g. Gate A" />
        </Modal>
      )}
    </React.Fragment>
  );
}

// ---------- O6 REPORTS ----------
function OrgReports() {
  const state = useScreen("O6", "Reports", ["loaded", "loading", "empty"]);
  const r = REPORT;
  if (state === "empty") {
    return <React.Fragment><div className="page-head"><div><h1 className="page-title">Reports</h1><p className="page-sub">Post-event analytics and exports.</p></div></div><div className="card"><EmptyState icon="bar-chart-2" title="No reports yet" body="Reports are available after an event is completed." /></div></React.Fragment>;
  }
  return (
    <React.Fragment>
      <div className="page-head">
        <div><h1 className="page-title">Reports</h1><p className="page-sub">{state === "loading" ? "Loading report…" : r.event}</p></div>
        <div className="event-select"><Icon name="calendar" size={16} color="var(--text-secondary)" /> {r.event} <Icon name="chevron-down" size={15} color="var(--text-secondary)" /></div>
      </div>

      {state === "loading" ? (
        <React.Fragment>
          <div className="ostats">{[0, 1, 2, 3].map((i) => <div className="stat" key={i}><Skeleton w="55%" h={12} /><Skeleton w="70%" h={28} mt={12} /></div>)}</div>
          <div className="card card-pad" style={{ marginTop: 22 }}><Skeleton w={160} h={18} /><Skeleton h={200} mt={18} /></div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="ostats">
            <StatCard label="Total Attended" value={r.attended.toLocaleString()} chipIcon="users" footText="Validated entries" />
            <StatCard label="Total Revenue" value={SSP(r.revenue)} chipIcon="trending-up" chipBg="var(--success-bg)" chipFg="var(--success)" footDot="var(--success)" footText="Gross sales" />
            <StatCard label="Fraud Attempts" value={r.fraud} chipIcon="shield-alert" chipBg="var(--danger-bg)" chipFg="var(--danger)" footDot="var(--danger)" footText="Rejected at gate" />
            <StatCard label="Scan Duration" value={r.duration} chipIcon="clock" chipBg="var(--chip-amber-bg)" chipFg="var(--chip-amber-fg)" footText="First to last scan" />
          </div>

          <div className="card card-pad" style={{ marginTop: 22 }}>
            <div className="chart-head"><h3 className="sec-card-title">Entry timeline</h3><span className="muted" style={{ fontSize: 13 }}>Admissions per 30 min</span></div>
            <LineChart data={r.entryRate} />
          </div>

          <div className="odash-grid">
            <div className="card card-pad"><h3 className="sec-card-title" style={{ marginBottom: 8 }}>Tier breakdown</h3><HBar rows={r.tiers} /></div>
            <div className="tbl-wrap">
              <div className="sec-card-head"><h3 className="sec-card-title">Fraud attempts</h3></div>
              <table className="tbl"><thead><tr><th>Time</th><th>Gate</th><th>Reason</th><th>Ticket ID</th></tr></thead>
                <tbody>{r.fraudRows.map((x, i) => <tr key={i}><td className="mono">{x.time}</td><td>{x.gate}</td><td><StatusPill status="Rejected" tone="danger" sm /> {x.reason}</td><td className="mono">{x.frag}</td></tr>)}</tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 22, justifyContent: "flex-end" }}>
            <Button variant="ghost" icon="download">Download CSV</Button>
            <Button variant="ghost" icon="file-text">Download PDF</Button>
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

// ---------- O7 SETTINGS ----------
function OrgSettings() {
  useScreen("O7", "Settings", ["loaded"]);
  const [showKey, setShowKey] = useStateO2(false);
  const [copied, setCopied] = useStateO2(false);
  const [notif, setNotif] = useStateO2({ booking: true, fraud: true, daily: false });
  const [del, setDel] = useStateO2(false);
  const apiKey = "atsk_live_7f3c9a21b8e4d6105fa2c0993ee1";

  return (
    <React.Fragment>
      <div className="page-head"><div><h1 className="page-title">Settings</h1><p className="page-sub">Manage your profile, integrations, and alerts.</p></div></div>
      <div className="stack20" style={{ maxWidth: 820 }}>
        <SectionCard title="Profile" action={<Button size="sm" variant="ghost">Save changes</Button>}>
          <div className="form-grid">
            <FormField label="Name" icon="user" value="Rebecca Mayen" onChange={() => {}} />
            <FormField label="Email" icon="mail" type="email" value="rebecca@nilelive.ss" onChange={() => {}} />
            <div className="full"><FormField label="Phone" icon="phone" type="tel" value="+211 922 700 145" onChange={() => {}} /></div>
          </div>
        </SectionCard>

        <SectionCard title="API configuration" action={<Button size="sm" variant="ghost">Save changes</Button>}>
          <div className="stack16">
            <div className="field">
              <label className="field-label">Africa's Talking API key</label>
              <div className="copyfield">
                <input readOnly type={showKey ? "text" : "password"} value={apiKey} />
                <button className="copyfield-btn" aria-label={showKey ? "Hide" : "Show"} onClick={() => setShowKey(!showKey)}><Icon name={showKey ? "eye-off" : "eye"} size={16} /></button>
                <button className="copyfield-btn" aria-label="Copy" onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }}><Icon name={copied ? "check" : "copy"} size={16} /></button>
              </div>
            </div>
            <FormField label="MTN webhook URL" icon="link" value="https://api.tiketi.ss/hooks/mtn" onChange={() => {}} />
            <FormField label="Airtel webhook URL" icon="link" value="https://api.tiketi.ss/hooks/airtel" onChange={() => {}} />
          </div>
        </SectionCard>

        <SectionCard title="Notification preferences" action={<Button size="sm" variant="ghost">Save changes</Button>}>
          <div className="set-section">
            {[["booking", "Booking alerts", "Notify me when a ticket is sold"], ["fraud", "Fraud alerts", "Notify me when a ticket is rejected at the gate"], ["daily", "Daily summary", "Send a daily sales and attendance digest"]].map(([k, t, d]) => (
              <div className="set-row" key={k}>
                <div><div className="set-row-title">{t}</div><div className="set-row-desc">{d}</div></div>
                <button className={"toggle" + (notif[k] ? " on" : "")} role="switch" aria-checked={notif[k]} aria-label={t} onClick={() => setNotif({ ...notif, [k]: !notif[k] })}><span className="toggle-knob" /></button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Danger zone" danger>
          <div className="set-row" style={{ padding: 0 }}>
            <div><div className="set-row-title">Delete account</div><div className="set-row-desc">Permanently delete your account and all event data. This cannot be undone.</div></div>
            <Button variant="danger" onClick={() => setDel(true)}>Delete account</Button>
          </div>
        </SectionCard>
      </div>

      {del && (
        <Modal icon="alert-triangle" title="Delete account?" sub="This permanently removes your account, events, and ticket data. This action cannot be undone." onClose={() => setDel(false)}
          footer={<React.Fragment><Button variant="ghost" onClick={() => setDel(false)}>Cancel</Button><Button variant="danger" icon="trash-2" onClick={() => setDel(false)}>Delete account</Button></React.Fragment>}>
          <FormField label="Type DELETE to confirm" placeholder="DELETE" />
        </Modal>
      )}
    </React.Fragment>
  );
}

window.ORG_SCREENS = {
  events: (p) => <OrgMyEvents {...p} />,
  create: (p) => <OrgCreate onDone={() => p.go("events")} onPublish={p.onPublish} />,
  agents: () => <OrgAgents />,
  reports: () => <OrgReports />,
  settings: () => <OrgSettings />,
};
Object.assign(window, { OrgEventDetail, OrgMyEvents, OrgCreate, OrgAgents, OrgReports, OrgSettings });
