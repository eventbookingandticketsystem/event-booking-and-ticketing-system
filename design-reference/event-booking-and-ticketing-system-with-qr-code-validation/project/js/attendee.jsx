// Tiketi — Attendee shell (mobile) + screens A1–A7.
const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

const ATTENDEE_TABS = [
  { id: "home", label: "Home", icon: "house" },
  { id: "discover", label: "Discover", icon: "compass" },
  { id: "tickets", label: "My Tickets", icon: "ticket" },
  { id: "account", label: "Account", icon: "user" },
];

function MobileTopBar({ title, onBack, action }) {
  return (
    <div className="mtop">
      {onBack && <button className="mtop-back" aria-label="Back" onClick={onBack}><Icon name="arrow-left" size={18} /></button>}
      <h1 className="mtop-title">{title}</h1>
      {action}
    </div>
  );
}

function BottomNav({ tab, onTab }) {
  return (
    <nav className="mnav" aria-label="Primary">
      {ATTENDEE_TABS.map((t) => (
        <button key={t.id} className={"mnav-item" + (tab === t.id ? " on" : "")} aria-current={tab === t.id} onClick={() => onTab(t.id)}>
          <Icon name={t.icon} size={21} />
          {t.label}
        </button>
      ))}
    </nav>
  );
}

// ---------- A1 HOME ----------
const FILTERS = ["All", "Concert", "Football", "Conference", "Graduation"];
function HomeScreen({ onOpen }) {
  const state = useScreen("A1", "Home / Discovery", ["loaded", "skeleton", "empty"]);
  const [filter, setFilter] = useStateA("All");
  const list = filter === "All" ? EVENTS : EVENTS.filter((e) => e.category === filter);
  const featured = EVENTS.find((e) => e.featured);
  const upcoming = list.filter((e) => !e.featured || filter !== "All");
  const empty = state === "empty";

  return (
    <React.Fragment>
      <div className="mscroll fadein">
        <div className="mtop"><h1 className="mtop-title" style={{ fontSize: 22 }}>Discover</h1>
          <button className="mtop-action" aria-label="Notifications"><Icon name="bell" size={19} /></button>
        </div>
        <div className="msearch"><Icon name="search" size={18} color="var(--text-muted)" /><input placeholder="Search events in Juba..." aria-label="Search events" /></div>
        <div className="chips" role="tablist" aria-label="Categories">
          {FILTERS.map((f) => <button key={f} role="tab" aria-selected={filter === f} className={"chip" + (filter === f ? " on" : "")} onClick={() => setFilter(f)}>{f}</button>)}
        </div>

        {state === "skeleton" ? (
          <div className="mpad">
            <EventCardSkeleton featured />
            <div className="msec-title"><Skeleton w={140} h={18} /></div>
            <div className="stack12"><EventCardSkeleton /><EventCardSkeleton /><EventCardSkeleton /></div>
          </div>
        ) : empty ? (
          <div className="mpad">
            <EmptyState icon="calendar-search" title="No events found" body="No events match this filter right now. Check back soon." cta="Clear filters" onCta={() => setFilter("All")} />
          </div>
        ) : (
          <div className="mpad">
            {filter === "All" && featured && <EventCard ev={featured} featured onClick={() => onOpen(featured)} />}
            <div className="msec-title">{filter === "All" ? "Upcoming events" : filter}</div>
            <div className="stack12">
              {(filter === "All" ? EVENTS.filter((e) => !e.featured) : list).map((ev) => (
                <EventCard key={ev.id} ev={ev} onClick={() => onOpen(ev)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

// ---------- A2 EVENT DETAIL ----------
function DetailScreen({ ev, onBack, onBook }) {
  const state = useScreen("A2", "Event detail", ["loaded", "skeleton", "soldout"]);
  const [open, setOpen] = useStateA(true);
  const [qty, setQty] = useStateA({});
  const soldOut = state === "soldout";
  const tiers = soldOut ? ev.tiers.map((t) => ({ ...t, soldOut: true, remaining: 0 })) : ev.tiers;
  const total = tiers.reduce((s, t) => s + (qty[t.id] || 0) * t.price, 0);
  const count = Object.values(qty).reduce((a, b) => a + b, 0);

  if (state === "skeleton") {
    return (
      <React.Fragment>
        <div className="mscroll">
          <Skeleton h={240} r={0} />
          <div className="edetail-body">
            <Skeleton w={90} h={11} /><Skeleton w="80%" h={24} mt={10} /><Skeleton w="50%" h={14} mt={8} />
            <div className="edetail-info" style={{ marginTop: 22 }}><Skeleton h={48} /><Skeleton h={48} /></div>
            <Skeleton h={56} mt={10} /><Skeleton h={86} mt={12} /><Skeleton h={86} mt={12} />
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="mscroll fadein">
        <div className="edetail-hero" style={{ backgroundImage: ev.poster }}>
          <div className="edetail-hero-grad" />
          <button className="edetail-back" aria-label="Back" onClick={onBack}><Icon name="arrow-left" size={19} /></button>
        </div>
        <div className="edetail-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="edetail-cat">{ev.category}</span>
            {soldOut && <StatusPill status="Sold Out" />}
          </div>
          <h1 className="edetail-title">{ev.title}</h1>
          <div className="edetail-org">by {ev.organizer}</div>

          <div className="edetail-info">
            <div className="edetail-info-row">
              <span className="edetail-info-ic"><Icon name="calendar" size={18} /></span>
              <div><div className="edetail-info-k">Date & time</div><div className="edetail-info-v">{ev.date} · {ev.time}</div></div>
            </div>
            <div className="edetail-info-row">
              <span className="edetail-info-ic"><Icon name="map-pin" size={18} /></span>
              <div><div className="edetail-info-k">Venue</div><div className="edetail-info-v">{ev.venue}</div></div>
            </div>
          </div>

          <button className="collapse-head" aria-expanded={open} onClick={() => setOpen(!open)}>
            About this event <Icon name={open ? "chevron-up" : "chevron-down"} size={18} />
          </button>
          {open && <p className="collapse-body">{ev.about}</p>}

          <div className="msec-title" style={{ borderTop: "1px solid var(--border)", paddingTop: 18, marginTop: 0 }}>Tickets</div>
          {soldOut ? (
            <div className="tiers-wrap">
              {tiers.map((t) => <TierSelector key={t.id} tier={t} qty={0} onChange={() => {}} />)}
            </div>
          ) : (
            <div className="tiers-wrap">
              {tiers.map((t) => <TierSelector key={t.id} tier={t} qty={qty[t.id] || 0} onChange={(v) => setQty({ ...qty, [t.id]: v })} />)}
            </div>
          )}
        </div>
      </div>
      <div className="mbar">
        <div className="mbar-total">
          <div className="mbar-total-k">{count > 0 ? `${count} ticket${count > 1 ? "s" : ""}` : "Total"}</div>
          <div className="mbar-total-v">{SSP(total)}</div>
        </div>
        <Button disabled={soldOut || count === 0} onClick={() => onBook(ev, tiers.filter((t) => qty[t.id] > 0).map((t) => ({ ...t, qty: qty[t.id] })))}>
          {soldOut ? "Sold out" : "Book tickets"}
        </Button>
      </div>
    </React.Fragment>
  );
}

// ---------- A3 BOOKING SUMMARY ----------
function BookingScreen({ ev, sel, onBack, onConfirm }) {
  const state = useScreen("A3", "Booking summary", ["loaded", "skeleton"]);
  const [lines, setLines] = useStateA(sel);
  const [method, setMethod] = useStateA("mtn");
  const total = lines.reduce((s, t) => s + t.qty * t.price, 0);
  const fee = 500;

  if (state === "skeleton") {
    return (
      <React.Fragment>
        <MobileTopBar title="Booking summary" onBack={onBack} />
        <div className="mscroll"><div className="mpad">
          <div className="loadbox"><Spinner /><span>Reserving your tickets…</span></div>
          <Skeleton h={180} /><Skeleton h={120} mt={16} />
        </div></div>
      </React.Fragment>
    );
  }

  const setQty = (id, v) => setLines((ls) => ls.map((l) => l.id === id ? { ...l, qty: v } : l).filter((l) => l.qty > 0));

  return (
    <React.Fragment>
      <MobileTopBar title="Booking summary" onBack={onBack} />
      <div className="mscroll fadein"><div className="mpad" style={{ paddingTop: 4 }}>
        <div className="sumcard">
          <div className="sumcard-head">
            <div className="sumcard-event">{ev.title}</div>
            <div className="sumcard-date">{ev.date} · {ev.venue}</div>
          </div>
          {lines.length === 0 && (
            <div style={{ padding: "18px 16px", textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
              No tickets selected. Go back to add at least one.
            </div>
          )}
          {lines.map((l) => (
            <div className="sumcard-line" key={l.id}>
              <div style={{ flex: 1 }}>
                <div className="sumcard-line-name">{l.name}</div>
                <div className="sumcard-line-sub">{SSP(l.price)} each</div>
                {l.qty >= l.remaining && <div style={{ fontSize: 12, color: "var(--warning)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><Icon name="alert-triangle" size={11} /> Only {l.remaining} remaining</div>}
              </div>
              <div className="stepper" style={{ marginRight: 12 }}>
                <button aria-label="Remove one" onClick={() => setQty(l.id, l.qty - 1)}><Icon name="minus" size={15} /></button>
                <span className="stepper-val">{l.qty}</span>
                <button aria-label="Add one" disabled={l.qty >= l.remaining} onClick={() => setQty(l.id, l.qty + 1)}><Icon name="plus" size={15} /></button>
              </div>
              <div className="sumcard-line-price">{SSP(l.qty * l.price)}</div>
            </div>
          ))}
          <div className="sumcard-line"><div className="sumcard-line-name" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Service fee</div><div className="sumcard-line-price">{SSP(fee)}</div></div>
          <div className="sumcard-total"><span className="sumcard-total-k">Total</span><span className="sumcard-total-v">{SSP(total + fee)}</span></div>
        </div>

        <div className="msec-title">Payment method</div>
        <div className="stack12">
          <label className={"pay-opt" + (method === "mtn" ? " on" : "")}>
            <input type="radio" name="pay" checked={method === "mtn"} onChange={() => setMethod("mtn")} style={{ display: "none" }} />
            <span className="pay-logo mtn">MTN</span>
            <span className="pay-name">MTN Mobile Money</span>
            <span className="radio" />
          </label>
          <label className={"pay-opt" + (method === "airtel" ? " on" : "")}>
            <input type="radio" name="pay" checked={method === "airtel"} onChange={() => setMethod("airtel")} style={{ display: "none" }} />
            <span className="pay-logo airtel">Airtel</span>
            <span className="pay-name">Airtel Money</span>
            <span className="radio" />
          </label>
        </div>
      </div></div>
      <div className="mbar">
        <Button block size="lg" disabled={lines.length === 0} title={lines.length === 0 ? "Select at least one ticket" : undefined} onClick={() => onConfirm(ev, lines, method, total + fee)}>Confirm booking</Button>
      </div>
    </React.Fragment>
  );
}

// ---------- A4 PAYMENT INSTRUCTION ----------
function PaymentScreen({ ev, total, method, onBack, onConfirmed }) {
  const reviewState = useScreen("A4", "Payment instruction", ["waiting", "timeout"]);
  const [phase, setPhase] = useStateA(reviewState);
  const [secs, setSecs] = useStateA(272);
  const [copied, setCopied] = useStateA(false);
  useEffectA(() => { setPhase(reviewState); if (reviewState === "waiting") setSecs(272); }, [reviewState]);
  useEffectA(() => {
    if (phase !== "waiting") return;
    if (secs <= 0) { setPhase("timeout"); return; }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secs]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const low = secs < 60;
  const ussd = method === "mtn" ? "*165*4*1*2348#" : "*185*4*1*2348#";
  const provider = method === "mtn" ? "MTN Mobile Money" : "Airtel Money";

  return (
    <React.Fragment>
      <MobileTopBar title="Complete payment" onBack={onBack} />
      <div className="mscroll fadein"><div className="mpad" style={{ paddingTop: 4 }}>
        <div className="sumcard" style={{ marginBottom: 18 }}>
          <div className="sumcard-line" style={{ background: "var(--bg)" }}>
            <div><div className="sumcard-line-name">{ev.title}</div><div className="sumcard-line-sub">{ev.date}</div></div>
            <div className="sumcard-total-v" style={{ fontSize: 17 }}>{SSP(total)}</div>
          </div>
          <div className="sumcard-line">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={"pay-logo " + method} style={{ width: 34, height: 34, fontSize: 10 }}>{method === "mtn" ? "MTN" : "Airtel"}</span>
              <span className="sumcard-line-name">{provider}</span>
            </div>
            <StatusPill status="Confirmed" tone="success" sm />
          </div>
        </div>

        {phase === "timeout" ? (
          <div className="stack16">
            <AlertBanner tone="danger" title="Payment window expired">Your reserved tickets have been released. You can start again to re-reserve them.</AlertBanner>
            <Button block size="lg" icon="rotate-ccw" onClick={() => { setPhase("waiting"); setSecs(272); }}>Try again</Button>
          </div>
        ) : (
          <div className="stack16">
            <div>
              <div className="field-label" style={{ marginBottom: 8 }}>Dial this code on your phone to pay</div>
              <div className="ussd">
                <span className="ussd-code">{ussd}</span>
                <button className="ussd-copy" aria-label="Copy USSD code" onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                  <Icon name={copied ? "check" : "copy"} size={18} />
                </button>
              </div>
            </div>
            <Button variant="ghost" block icon="phone-call">Open dialer</Button>

            <div className="countdown">
              <div className="countdown-head">
                <span className="muted">Payment window closes in</span>
                <span className="countdown-time" style={{ color: low ? "var(--warning)" : "var(--text)" }}>{mm}:{ss}</span>
              </div>
              <div className="countdown-track">
                <div className="countdown-bar" style={{ width: (secs / 272 * 100) + "%", background: low ? "var(--warning)" : "var(--accent)" }} />
              </div>
            </div>

            <div className="waiting"><Spinner size="sm" /> Waiting for payment confirmation…</div>
            <Button block size="lg" icon="check" onClick={onConfirmed} style={{ background: "var(--success)" }}>I've completed payment</Button>
          </div>
        )}
      </div></div>
    </React.Fragment>
  );
}

// ---------- A5 BOOKING CONFIRMATION ----------
function ConfirmScreen({ ev, lines, total, ref, onTickets, onHome }) {
  useScreen("A5", "Booking confirmation", ["loaded"]);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return (
    <React.Fragment>
      <div className="mscroll fadein"><div className="mpad" style={{ paddingTop: 36 }}>
        <div className="confirm-wrap">
          <span className="confirm-ic"><Icon name="check" size={44} strokeWidth={3} /></span>
          <h1 className="confirm-title">Booking confirmed</h1>
          <div className="muted" style={{ fontSize: 14 }}>Your tickets are ready in your wallet.</div>
          <div className="confirm-ref">{ref}</div>
        </div>
        <div className="sumcard" style={{ marginBottom: 18 }}>
          <div className="sumcard-line"><div className="sumcard-line-name" style={{ fontWeight: 500, color: "var(--text-secondary)" }}>Event</div><div className="sumcard-line-price">{ev.title}</div></div>
          <div className="sumcard-line"><div className="sumcard-line-name" style={{ fontWeight: 500, color: "var(--text-secondary)" }}>Date</div><div className="sumcard-line-price">{ev.date}</div></div>
          <div className="sumcard-line"><div className="sumcard-line-name" style={{ fontWeight: 500, color: "var(--text-secondary)" }}>Tickets</div><div className="sumcard-line-price">{count}</div></div>
          <div className="sumcard-total"><span className="sumcard-total-k">Total paid</span><span className="sumcard-total-v">{SSP(total)}</span></div>
        </div>
        <AlertBanner tone="info" title="Ticket link sent">A confirmation with your ticket link was sent to +211 928 114 507.</AlertBanner>
        <div className="stack12" style={{ marginTop: 18 }}>
          <Button block size="lg" icon="ticket" onClick={onTickets}>View my tickets</Button>
          <Button variant="quiet" block onClick={onHome}>Back to home</Button>
        </div>
      </div></div>
    </React.Fragment>
  );
}

// ---------- A6 TICKET WALLET ----------
function WalletScreen({ onOpen }) {
  const state = useScreen("A6", "Ticket wallet", ["loaded", "skeleton", "empty"]);
  const [tab, setTab] = useStateA("upcoming");
  const tickets = MY_TICKETS.filter((t) => t.when === tab);

  return (
    <React.Fragment>
      <div className="mscroll fadein">
        <div className="mtop"><h1 className="mtop-title" style={{ fontSize: 22 }}>My tickets</h1></div>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "upcoming"} className={"tab" + (tab === "upcoming" ? " on" : "")} onClick={() => setTab("upcoming")}>Upcoming</button>
          <button role="tab" aria-selected={tab === "past"} className={"tab" + (tab === "past" ? " on" : "")} onClick={() => setTab("past")}>Past</button>
        </div>
        <div className="mpad" style={{ paddingTop: 16 }}>
          {state === "skeleton" ? (
            <div className="stack12"><TicketCardSkeleton /><TicketCardSkeleton /><TicketCardSkeleton /></div>
          ) : state === "empty" || tickets.length === 0 ? (
            tab === "upcoming"
              ? <EmptyState icon="ticket" title="No upcoming tickets" body="Browse events to book your first ticket." cta="Browse events" onCta={() => {}} />
              : <EmptyState icon="history" title="No past events yet" body="Tickets you've used will appear here after the event." />
          ) : (
            <div className="stack12">{tickets.map((t) => <TicketCard key={t.id} ticket={t} onClick={() => onOpen(t)} />)}</div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

// ---------- A7 TICKET DETAIL (QR) ----------
function QRScreen({ ticket, onBack }) {
  useScreen("A7", "Ticket detail (QR)", ["loaded"]);
  const ev = EVENT_BY_ID[ticket.eventId];
  const [tip, setTip] = useStateA(true);
  return (
    <React.Fragment>
      <MobileTopBar title="Your ticket" onBack={onBack} action={<button className="mtop-action" aria-label="Share ticket"><Icon name="share-2" size={18} /></button>} />
      <div className="mscroll fadein">
        {tip && <div style={{ padding: "0 18px 6px" }}><AlertBanner tone="info" onDismiss={() => setTip(false)}>Increase your screen brightness for faster scanning.</AlertBanner></div>}
        <div className="qrview">
          <h2 className="qrview-event">{ev.title}</h2>
          <div className="qrview-meta">{ev.date} · {ev.venue}</div>
          <div className="qrview-qr"><QRCode value={ticket.id} size={236} n={29} /></div>
          <div className="qrview-id">{ticket.id}</div>
          <div className="qrview-badges">
            <span className="tier-badge" style={{ fontSize: 13, padding: "4px 12px" }}>{ticket.tier}</span>
            <StatusPill status={ticket.status} />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

// ---------- Discover (light) + Account (light) ----------
function DiscoverScreen({ onOpen }) {
  useScreen("Ax", "Discover", ["loaded"]);
  return (
    <div className="mscroll fadein">
      <div className="mtop"><h1 className="mtop-title" style={{ fontSize: 22 }}>Discover</h1></div>
      <div className="msearch"><Icon name="search" size={18} color="var(--text-muted)" /><input placeholder="Search events in Juba..." aria-label="Search" /></div>
      <div className="mpad" style={{ paddingTop: 16 }}>
        <div className="stack12">{EVENTS.map((ev) => <EventCard key={ev.id} ev={ev} onClick={() => onOpen(ev)} />)}</div>
      </div>
    </div>
  );
}
function AccountScreen() {
  const state = useScreen("A8", "Account", ["loaded", "skeleton"]);
  const items = [
    { icon: "ticket", label: "My bookings" }, { icon: "bell", label: "Notification preferences" },
    { icon: "life-buoy", label: "Help & support" }, { icon: "log-out", label: "Sign out" },
  ];
  return (
    <div className="mscroll fadein">
      <div className="mtop"><h1 className="mtop-title" style={{ fontSize: 22 }}>Account</h1></div>
      <div className="mpad" style={{ paddingTop: 8 }}>
        {state === "skeleton" ? (
          <div className="stack12">
            <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "10px 0" }}><Skeleton w={64} h={64} r="50%" /><div style={{ flex: 1 }}><Skeleton w="60%" h={18} /><Skeleton w="40%" h={13} mt={8} /></div></div>
            {items.map((_, i) => <Skeleton key={i} h={56} />)}
          </div>
        ) : (
          <React.Fragment>
            <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 0 20px" }}>
              <div className="gate-agent-av" style={{ width: 64, height: 64, fontSize: 22, background: "var(--navy)" }}>AD</div>
              <div><div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 }}>Achol Deng</div><div className="muted" style={{ fontSize: 14 }}>+211 928 114 507</div></div>
            </div>
            <div className="card">
              {items.map((it, i) => (
                <button key={it.label} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "16px 16px", border: "none", background: "none", borderTop: i ? "1px solid var(--border-soft)" : "none", textAlign: "left", color: it.label === "Sign out" ? "var(--danger)" : "var(--text)" }}>
                  <Icon name={it.icon} size={19} />
                  <span style={{ flex: 1, fontWeight: 500, fontSize: 15 }}>{it.label}</span>
                  {it.label !== "Sign out" && <Icon name="chevron-right" size={17} color="var(--text-muted)" />}
                </button>
              ))}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

// ---------- Attendee shell ----------
function AttendeeShell() {
  const [tab, setTab] = useStateA("home");
  const [stack, setStack] = useStateA([]); // pushed routes
  const top = stack[stack.length - 1];
  const push = (r) => setStack((s) => [...s, r]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const reset = () => setStack([]);

  const goTickets = () => { reset(); setTab("tickets"); };
  const goHome = () => { reset(); setTab("home"); };

  let body;
  if (top) {
    if (top.name === "detail") body = <DetailScreen ev={top.ev} onBack={pop} onBook={(ev, sel) => push({ name: "booking", ev, sel })} />;
    else if (top.name === "booking") body = <BookingScreen ev={top.ev} sel={top.sel} onBack={pop} onConfirm={(ev, lines, method, total) => push({ name: "payment", ev, lines, method, total })} />;
    else if (top.name === "payment") body = <PaymentScreen ev={top.ev} total={top.total} method={top.method} onBack={pop} onConfirmed={() => push({ name: "confirm", ev: top.ev, lines: top.lines, total: top.total, ref: "TKT-" + Math.random().toString(36).slice(2, 8).toUpperCase() })} />;
    else if (top.name === "confirm") body = <ConfirmScreen ev={top.ev} lines={top.lines} total={top.total} ref={top.ref} onTickets={goTickets} onHome={goHome} />;
    else if (top.name === "qr") body = <QRScreen ticket={top.ticket} onBack={pop} />;
  } else {
    if (tab === "home") body = <HomeScreen onOpen={(ev) => push({ name: "detail", ev })} />;
    else if (tab === "discover") body = <DiscoverScreen onOpen={(ev) => push({ name: "detail", ev })} />;
    else if (tab === "tickets") body = <WalletScreen onOpen={(t) => push({ name: "qr", ticket: t })} />;
    else if (tab === "account") body = <AccountScreen />;
  }

  const showNav = !top;
  return (
    <div className="mstage">
      <div className="mphone">
        {body}
        {showNav && <BottomNav tab={tab} onTab={(t) => { reset(); setTab(t); }} />}
      </div>
    </div>
  );
}

Object.assign(window, { AttendeeShell });
