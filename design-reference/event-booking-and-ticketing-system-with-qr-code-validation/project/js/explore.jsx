// Tiketi — public /explore discovery page + public event preview. No login required.

const PRICE_LABEL = (p) => p === 0 ? "Free" : "From " + SSP(p);

// Shared sticky nav (matches landing)
function ExploreNav({ onSignIn, onRegister, onExplore, active }) {
  const [drawer, setDrawer] = React.useState(false);
  return (
    <React.Fragment>
      <header className="lp-nav xnav">
        <div className="lp-nav-inner">
          <div className="lp-brand" style={{ cursor: "pointer" }} onClick={onExplore}>
            <span className="lp-brand-mark"><Icon name="ticket" size={19} color="#fff" /></span>
            <span className="lp-brand-word">Tiketi</span>
            <button className={"xnav-link" + (active ? " on" : "")} onClick={(e) => { e.stopPropagation(); onExplore(); }}>Explore Events</button>
          </div>
          <nav className="lp-nav-actions">
            <Button variant="ghost" size="sm" onClick={onSignIn}>Sign in</Button>
            <Button size="sm" onClick={onRegister}>Get started</Button>
          </nav>
          <button className="lp-burger" aria-label="Menu" onClick={() => setDrawer(true)}><Icon name="menu" size={22} color="#fff" /></button>
        </div>
      </header>
      {drawer && (
        <div className="lp-drawer-scrim" onClick={() => setDrawer(false)}>
          <div className="lp-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="lp-drawer-head"><span className="lp-brand-word" style={{ color: "#fff" }}>Tiketi</span><button className="lp-drawer-x" aria-label="Close" onClick={() => setDrawer(false)}><Icon name="x" size={20} color="#fff" /></button></div>
            <Button block onClick={() => { setDrawer(false); onRegister(); }}>Get started</Button>
            <Button block variant="ghost" onClick={() => { setDrawer(false); onSignIn(); }}>Sign in</Button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

// ExploreCard — 3:4 gradient poster
function ExploreCard({ ev, onClick, fixed }) {
  const poster = EXPLORE_POSTERS[ev.category] || EXPLORE_POSTERS.Music;
  const pill = ev.status === "happening-now"
    ? <span className="xpill-now"><span className="dotlive" /> Happening Now</span>
    : <span className="xpill-when">{ev.date}{ev.time && ev.date === "Today" ? ", " + ev.time.split(" ")[0] : ""}</span>;
  return (
    <button className={"xcard" + (fixed ? " xcard-fixed" : "")} onClick={onClick} aria-label={ev.title} style={{ backgroundImage: poster }}>
      <span className="xcard-pattern" aria-hidden="true" />
      <span className="xcard-cat">{ev.category}</span>
      <span className="xcard-top">{pill}</span>
      <span className="xcard-grad" aria-hidden="true" />
      <span className="xcard-body">
        <span className="xcard-title">{ev.title}</span>
        <span className="xcard-meta"><Icon name="map-pin" size={13} /> {ev.venue}</span>
        <span className={"xcard-price" + (ev.price === 0 ? " free" : "")}>
          <Icon name={ev.price === 0 ? "gift" : "ticket"} size={13} /> {PRICE_LABEL(ev.price)}
        </span>
      </span>
    </button>
  );
}

function ExploreCardSkeleton({ fixed }) {
  return <div className={"xcard xcard-sk" + (fixed ? " xcard-fixed" : "")}><div className="sk-dark" style={{ position: "absolute", inset: 0, borderRadius: 12 }} /></div>;
}

function SectionHeading({ children, accent, seeAll, onSeeAll }) {
  return (
    <div className="xsec-head">
      <h2 className="xsec-title">{accent && <span className="xsec-dot" />}{children}</h2>
      {seeAll && <button className="xsec-seeall" onClick={onSeeAll}>See all <Icon name="arrow-right" size={15} /></button>}
    </div>
  );
}

function ExploreShell({ onSignIn, onRegister, onOpenEvent }) {
  const state = useScreen("EXP", "Explore events", ["loaded", "skeleton", "empty", "error"]);
  const [city, setCity] = React.useState("Juba");
  const [cityOpen, setCityOpen] = React.useState(false);
  const [cats, setCats] = React.useState([]); // [] = All
  const [times, setTimes] = React.useState([]);
  const [q, setQ] = React.useState("");
  const [asc, setAsc] = React.useState(true);
  const cityRef = React.useRef(null);

  React.useEffect(() => {
    if (!cityOpen) return;
    const onDoc = (e) => { if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [cityOpen]);

  const toggle = (arr, setArr, v) => setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const anyFilter = cats.length || times.length || q.trim();
  const clearAll = () => { setCats([]); setTimes([]); setQ(""); };

  const match = (ev) =>
    (cats.length === 0 || cats.includes(ev.category)) &&
    (times.length === 0 || ev.times.some((t) => times.includes(t))) &&
    (!q.trim() || ev.title.toLowerCase().includes(q.trim().toLowerCase()));

  const sortFn = (a, b) => asc ? a.sortKey - b.sortKey : b.sortKey - a.sortKey;
  const matched = EXPLORE_EVENTS.filter(match).sort(sortFn);
  const now = matched.filter((e) => e.status === "happening-now");
  const upcoming = matched.filter((e) => e.status !== "happening-now");
  const free = matched.filter((e) => e.price === 0);

  const catChip = (c) => {
    const on = c === "All" ? cats.length === 0 : cats.includes(c);
    return (
      <button key={c} className={"xchip" + (on ? " on" : "")} onClick={() => c === "All" ? setCats([]) : toggle(cats, setCats, c)}>{c}</button>
    );
  };

  return (
    <div className="xpage">
      <ExploreNav onSignIn={onSignIn} onRegister={onRegister} onExplore={() => {}} active />

      {/* sticky subheader */}
      <div className="xsub">
        <div className="xsub-row">
          <div className="xloc-wrap" ref={cityRef}>
            <span className="xloc-label">Showing events in</span>
            <button className="xloc-pill" onClick={() => setCityOpen(!cityOpen)}>
              <span className="flagbox" style={{ background: "#0F47AF" }}>SS</span>
              {city === "All Cities" ? "All Cities" : city + ", South Sudan"}
              <Icon name="chevron-down" size={15} />
            </button>
            {cityOpen && (
              <div className="xloc-dd">
                {EXPLORE_CITIES.map((c) => (
                  <button key={c} className={"xloc-dd-row" + (c === city ? " on" : "")} onClick={() => { setCity(c); setCityOpen(false); }}>
                    {c}{c === city && <Icon name="check" size={15} color="var(--accent)" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="xsearch">
            <Icon name="search" size={18} color="var(--text-on-dark-faint)" />
            <input placeholder="Search events, organizers..." aria-label="Search events" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="xchips">
          {EXPLORE_CATEGORIES.map(catChip)}
        </div>
        <div className="xchips-row2">
          <div className="xchips">
            {EXPLORE_TIMES.map((t) => (
              <button key={t.id} className={"xchip" + (times.includes(t.id) ? " on" : "")} onClick={() => toggle(times, setTimes, t.id)}>{t.label}</button>
            ))}
          </div>
          <button className="xsort" onClick={() => setAsc(!asc)}>
            <Icon name="calendar" size={15} /> Date <Icon name={asc ? "arrow-down" : "arrow-up"} size={14} />
          </button>
        </div>
        {anyFilter ? <button className="xclear" onClick={clearAll}><Icon name="x" size={14} /> Clear all filters</button> : null}
      </div>

      <div className="xbody">
        {state === "error" && (
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <AlertBanner tone="danger" title="Couldn't load events">Something went wrong reaching the events service.</AlertBanner>
            <div style={{ marginTop: 16, textAlign: "center" }}><Button icon="rotate-ccw">Retry</Button></div>
          </div>
        )}

        {state === "skeleton" && (
          <React.Fragment>
            <div className="xsec"><SectionHeading accent>Active Events</SectionHeading><div className="xrow">{[0,1,2,3].map((i) => <ExploreCardSkeleton key={i} fixed />)}</div></div>
            <div className="xsec"><SectionHeading>Upcoming Events</SectionHeading><div className="xgrid">{[0,1,2,3].map((i) => <ExploreCardSkeleton key={i} />)}</div></div>
          </React.Fragment>
        )}

        {state === "empty" && (
          <div className="card" style={{ background: "var(--xcard-surface)", border: "1px solid rgba(255,255,255,.08)", maxWidth: 520, margin: "40px auto" }}>
            <EmptyState icon="calendar-x" title="No events found in Juba" body="Try a different city or category." cta="Clear filters" onCta={clearAll} />
          </div>
        )}

        {state === "loaded" && (
          matched.length === 0 ? (
            <div className="xempty">
              <span className="empty-ic" style={{ background: "rgba(255,255,255,.06)", color: "var(--text-on-dark-dim)" }}><Icon name="calendar-x" size={26} /></span>
              <h3 className="xempty-title">No events found in {city === "All Cities" ? "any city" : city}</h3>
              <p className="xempty-body">Try a different city or category.</p>
              {anyFilter ? <Button size="sm" onClick={clearAll}>Clear filters</Button> : null}
            </div>
          ) : (
            <React.Fragment>
              {now.length > 0 && (
                <div className="xsec">
                  <SectionHeading accent>Active Events</SectionHeading>
                  <div className="xrow">{now.map((ev) => <ExploreCard key={ev.id} ev={ev} fixed onClick={() => onOpenEvent(ev.id)} />)}</div>
                </div>
              )}
              {upcoming.length > 0 && (
                <div className="xsec">
                  <SectionHeading seeAll onSeeAll={clearAll}>Upcoming Events</SectionHeading>
                  <div className="xgrid">{upcoming.map((ev) => <ExploreCard key={ev.id} ev={ev} onClick={() => onOpenEvent(ev.id)} />)}</div>
                </div>
              )}
              {free.length > 0 && (
                <div className="xsec">
                  <SectionHeading>Free to Attend</SectionHeading>
                  <div className="xgrid">{free.map((ev) => <ExploreCard key={ev.id} ev={ev} onClick={() => onOpenEvent(ev.id)} />)}</div>
                </div>
              )}
              {cats.map((cat) => {
                const list = matched.filter((e) => e.category === cat);
                if (list.length === 0) return null;
                return (
                  <div className="xsec" key={cat}>
                    <SectionHeading>{cat}</SectionHeading>
                    <div className="xrow">{list.map((ev) => <ExploreCard key={ev.id} ev={ev} fixed onClick={() => onOpenEvent(ev.id)} />)}</div>
                  </div>
                );
              })}
            </React.Fragment>
          )
        )}
      </div>
    </div>
  );
}

// ---------- Public event preview (/explore/[id]) ----------
function PublicEventPreview({ eventId, onBack, onSignIn, onRegister, onBook }) {
  useScreen("EXP-P", "Event preview", ["loaded"]);
  const ev = EXPLORE_BY_ID[eventId] || EXPLORE_EVENTS[0];
  const poster = EXPLORE_POSTERS[ev.category] || EXPLORE_POSTERS.Music;
  const [expanded, setExpanded] = React.useState(false);
  const [toast, setToast] = React.useState(false);

  const share = () => {
    setToast(true); setTimeout(() => setToast(false), 1800);
  };

  return (
    <div className="xpage">
      <ExploreNav onSignIn={onSignIn} onRegister={onRegister} onExplore={onBack} />
      <div className="xprev">
        {/* poster header 16:9 */}
        <div className="xprev-hero" style={{ backgroundImage: poster }}>
          <span className="xcard-pattern" aria-hidden="true" />
          <button className="xprev-back" aria-label="Back" onClick={onBack}><Icon name="arrow-left" size={19} /></button>
          <button className="xprev-share" aria-label="Share" onClick={share}><Icon name="share-2" size={18} /></button>
          <div className="xprev-hero-cat">{ev.category}</div>
          <div className="xprev-hero-title">{ev.title}</div>
        </div>

        <div className="xprev-grid">
          <div className="xprev-main">
            {ev.status === "happening-now" && <div style={{ marginBottom: 18 }}><span className="xpill-now"><span className="dotlive" /> Happening Now</span></div>}
            <div className="xprev-info">
              <div className="xprev-info-row"><span className="xprev-info-ic"><Icon name="calendar" size={18} /></span><div><div className="xprev-info-k">Date & time</div><div className="xprev-info-v">{ev.date} · {ev.time}</div></div></div>
              <div className="xprev-info-row"><span className="xprev-info-ic"><Icon name="map-pin" size={18} /></span><div><div className="xprev-info-k">Venue</div><div className="xprev-info-v">{ev.venue}, {ev.city}</div></div></div>
              <div className="xprev-info-row"><span className="xprev-info-ic"><Icon name="user" size={18} /></span><div><div className="xprev-info-k">Organizer</div><div className="xprev-info-v">{ev.organizer}</div></div></div>
            </div>
            <h3 className="xprev-h3">About this event</h3>
            <p className={"xprev-about" + (expanded ? "" : " clamp")}>{ev.about}</p>
            <button className="xprev-more" onClick={() => setExpanded(!expanded)}>{expanded ? "Show less" : "Read more"}</button>
          </div>

          <aside className="xprev-tickets">
            <div className="xprev-tickets-card">
              <h3 className="xprev-tickets-title">Tickets</h3>
              {ev.tiers.map((t) => (
                <div className="xprev-tier" key={t.id}>
                  <div>
                    <div className="xprev-tier-name">{t.name}</div>
                    <div className="xprev-tier-cap">{t.remaining.toLocaleString()} remaining</div>
                  </div>
                  <div className="xprev-tier-right">
                    <div className={"xprev-tier-price" + (t.price === 0 ? " free" : "")}>{t.price === 0 ? "Free" : SSP(t.price)}</div>
                    <Button size="sm" onClick={() => onBook(ev.id)}>Book this ticket</Button>
                  </div>
                </div>
              ))}
              <p className="xprev-tickets-note"><Icon name="info" size={13} /> Sign in to complete your booking.</p>
            </div>
          </aside>
        </div>
      </div>
      {toast && <div className="xtoast"><Icon name="check" size={16} /> Link copied</div>}
    </div>
  );
}

Object.assign(window, { ExploreShell, PublicEventPreview, ExploreCard });
