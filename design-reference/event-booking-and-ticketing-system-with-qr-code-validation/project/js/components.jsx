// Tiketi — composite components: EventCard, TicketCard, TierSelector, charts, skeletons.

// availability pill from remaining/capacity
function availability(ev) {
  const rem = ev.tiers.reduce((s, t) => s + t.remaining, 0);
  const cap = ev.tiers.reduce((s, t) => s + t.capacity, 0);
  if (rem === 0) return { status: "Sold Out" };
  if (rem / cap < 0.12) return { status: "Selling Fast" };
  return null;
}

function EventCard({ ev, featured, onClick }) {
  const avail = availability(ev);
  const minPrice = Math.min(...ev.tiers.map((t) => t.price));
  if (featured) {
    return (
      <button className="ecard" onClick={onClick} aria-label={ev.title}>
        <div className="ecard-poster feat" style={{ backgroundImage: ev.poster }}>
          <div className="ecard-grad" />
          <div className="ecard-poster-top">
            <span className="pill pill-accent pill-sm">Featured</span>
            {avail && <StatusPill status={avail.status} sm />}
          </div>
          <div className="ecard-poster-cat">
            <div className="e-cat">{ev.category}</div>
            <div className="e-title">{ev.title}</div>
          </div>
        </div>
        <div className="ecard-body">
          <div className="ecard-meta">
            <div className="ecard-meta-row"><Icon name="calendar" size={14} /> {ev.date} · {ev.time}</div>
            <div className="ecard-meta-row"><Icon name="map-pin" size={14} /> {ev.venue}</div>
          </div>
          <div className="ecard-foot">
            <span className="ecard-price">from <b>{SSP(minPrice)}</b></span>
            <span className="ecard-price"><Icon name="arrow-right" size={16} color="var(--accent)" /></span>
          </div>
        </div>
      </button>
    );
  }
  return (
    <button className="ecard" onClick={onClick} aria-label={ev.title} style={{ display: "flex", textAlign: "left" }}>
      <div className="ecard-poster" style={{ backgroundImage: ev.poster, width: 116, flexShrink: 0, aspectRatio: "auto", alignSelf: "stretch" }}>
        <div className="ecard-grad" style={{ background: "linear-gradient(110deg, rgba(8,40,59,0) 40%, rgba(8,40,59,.25) 100%)" }} />
      </div>
      <div className="ecard-body" style={{ flex: 1, paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <span className="e-cat" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "var(--accent-deep)" }}>{ev.category}</span>
          {avail && <StatusPill status={avail.status} sm />}
        </div>
        <h3 className="ecard-title">{ev.title}</h3>
        <div className="ecard-meta">
          <div className="ecard-meta-row"><Icon name="calendar" size={13} /> {ev.date}</div>
          <div className="ecard-meta-row"><Icon name="map-pin" size={13} /> {ev.venue}</div>
        </div>
        <div className="ecard-foot">
          <span className="ecard-price">from <b>{SSP(minPrice)}</b></span>
        </div>
      </div>
    </button>
  );
}

function TierSelector({ tier, qty = 0, onChange }) {
  const soldOut = tier.soldOut || tier.remaining === 0;
  const low = tier.lowStock || (tier.remaining > 0 && tier.remaining <= 12);
  return (
    <div className={"tier" + (qty > 0 ? " active" : "") + (soldOut ? " soldout" : "")}>
      <div className="tier-main">
        <div className="tier-name">
          {tier.name}
          {soldOut && <StatusPill status="Sold Out" sm />}
          {!soldOut && low && <StatusPill status={`Only ${tier.remaining} left`} tone="warning" sm />}
        </div>
        <div className="tier-price">{SSP(tier.price)}</div>
        {!soldOut && <div className="tier-cap">{tier.remaining.toLocaleString()} of {tier.capacity.toLocaleString()} remaining</div>}
      </div>
      <div className="stepper">
        <button aria-label={"Remove one " + tier.name} disabled={soldOut || qty === 0} onClick={() => onChange(Math.max(0, qty - 1))}><Icon name="minus" size={16} /></button>
        <span className="stepper-val">{qty}</span>
        <button aria-label={"Add one " + tier.name} disabled={soldOut || qty >= tier.remaining} onClick={() => onChange(qty + 1)}><Icon name="plus" size={16} /></button>
      </div>
    </div>
  );
}

function TicketCard({ ticket, onClick }) {
  const ev = EVENT_BY_ID[ticket.eventId];
  return (
    <button className="tcard" onClick={onClick} aria-label={"Ticket for " + ev.title}>
      <div className="tcard-top">
        <div className="tcard-qr"><QRCode value={ticket.id} size={56} n={25} /></div>
        <div className="tcard-info">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
            <div className="tcard-title">{ev.title}</div>
            <StatusPill status={ticket.status} sm />
          </div>
          <div className="tcard-meta">
            <span><Icon name="calendar" size={12} /> {ev.date}</span>
            <span><Icon name="map-pin" size={12} /> {ev.venue}</span>
          </div>
        </div>
      </div>
      <div className="tcard-foot">
        <span className="tcard-id">{ticket.id}</span>
        <span className="tier-badge">{ticket.tier}</span>
      </div>
    </button>
  );
}

// ---- Skeletons matching loaded layouts ----
function EventCardSkeleton({ featured }) {
  if (featured) return (
    <div className="ecard">
      <Skeleton h={188} r={0} />
      <div className="ecard-body"><Skeleton w="60%" h={14} /><Skeleton w="80%" h={14} mt={10} /><Skeleton w="40%" h={16} mt={14} /></div>
    </div>
  );
  return (
    <div className="ecard" style={{ display: "flex" }}>
      <Skeleton w={116} h="auto" r={0} style={{ alignSelf: "stretch", minHeight: 120 }} />
      <div className="ecard-body" style={{ flex: 1, paddingTop: 12 }}>
        <Skeleton w="40%" h={11} /><Skeleton w="85%" h={15} mt={9} /><Skeleton w="70%" h={13} mt={10} /><Skeleton w="35%" h={14} mt={14} />
      </div>
    </div>
  );
}
function TicketCardSkeleton() {
  return (
    <div className="tcard">
      <div className="tcard-top">
        <Skeleton w={56} h={56} />
        <div className="tcard-info" style={{ flex: 1 }}><Skeleton w="80%" h={15} /><Skeleton w="60%" h={12} mt={9} /><Skeleton w="50%" h={12} mt={6} /></div>
      </div>
      <div className="tcard-foot"><Skeleton w={120} h={12} /><Skeleton w={44} h={16} /></div>
    </div>
  );
}

// ---- Charts ----
function HBar({ rows }) {
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <div>
      {rows.map((r) => (
        <div className="hbar-row" key={r.name}>
          <span className="hbar-label">{r.name}</span>
          <span className="hbar-track"><span className="hbar-fill" style={{ width: (r.count / max * 100) + "%", background: r.color }} /></span>
          <span className="hbar-val"><b>{r.count.toLocaleString()}</b> · {Math.round(r.count / r.total * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, height = 200, label = "admissions" }) {
  const W = 560, H = height, padL = 38, padB = 28, padT = 12, padR = 12;
  const max = Math.max(...data.map((d) => d.v)) * 1.15;
  const ix = (i) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const iy = (v) => padT + (1 - v / max) * (H - padT - padB);
  const pts = data.map((d, i) => [ix(i), iy(d.v)]);
  const line = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0] + " " + p[1]).join(" ");
  const area = line + ` L${ix(data.length - 1)} ${H - padB} L${padL} ${H - padB} Z`;
  const yticks = 4;
  return (
    <svg className="linechart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={"Entry rate chart, " + label}>
      {Array.from({ length: yticks + 1 }).map((_, i) => {
        const y = padT + (i / yticks) * (H - padT - padB);
        const val = Math.round(max - (i / yticks) * max);
        return (
          <g key={i}>
            <line className="lc-grid" x1={padL} y1={y} x2={W - padR} y2={y} opacity={i === yticks ? 1 : 0.5} />
            <text className="lc-axis" x={padL - 7} y={y + 3} textAnchor="end">{val}</text>
          </g>
        );
      })}
      <path className="lc-area" d={area} />
      <path className="lc-line" d={line} />
      {pts.map((p, i) => <circle key={i} className="lc-dot" cx={p[0]} cy={p[1]} r={3} />)}
      {data.map((d, i) => <text key={i} className="lc-axis" x={ix(i)} y={H - 9} textAnchor="middle">{d.t}</text>)}
    </svg>
  );
}

Object.assign(window, { EventCard, TierSelector, TicketCard, EventCardSkeleton, TicketCardSkeleton, HBar, LineChart, availability });
