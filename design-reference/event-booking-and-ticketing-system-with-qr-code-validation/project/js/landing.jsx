// Tiketi — public Landing / marketing homepage. App entry point.
// CTAs route into the auth flow: onSignIn → AUTH1, onRegister → AUTH2.

const HOW_STEPS = [
  { icon: "ticket", title: "Book your ticket", body: "Browse events, choose your tier, and pay with MTN or Airtel Money." },
  { icon: "smartphone", title: "Receive your QR", body: "Get your QR ticket instantly in-app or via SMS — no internet needed at the gate." },
  { icon: "check-circle", title: "Scan and enter", body: "Gate agents scan your QR in under 2 seconds. Works even when offline." },
];

const WHY_FEATURES = [
  { icon: "shield", title: "Fraud-proof tickets", body: "Cryptographically signed QR codes. Impossible to duplicate or forge." },
  { icon: "wifi-off", title: "Offline gate scanning", body: "Gates keep working with no internet. Scans sync automatically when back online." },
  { icon: "smartphone", title: "Mobile money payments", body: "Pay with MTN Mobile Money or Airtel Money. No bank card needed." },
  { icon: "bar-chart-2", title: "Real-time analytics", body: "Track admissions, revenue, and fraud attempts live from your dashboard." },
];

const EVENT_TYPES = [
  { icon: "music", label: "Concerts", body: "From Nyakuron to riverside festivals." },
  { icon: "trophy", label: "Football matches", body: "Stadium turnstiles, sorted." },
  { icon: "users", label: "Church conferences", body: "Seat thousands with ease." },
  { icon: "graduation-cap", label: "Graduations", body: "Guest tickets, allocated cleanly." },
];

// Hero visual — flat geometric QR-scan moment (navy + orange, no photography)
function HeroArt() {
  const mods = [
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,1,0,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,0,0,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,1,1,0,1,0,1,1,0],
    [0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1],
    [1,0,0,1,1,1,1,0,1,1,1,0,1,0,0,1,0],
    [0,1,1,0,0,1,0,1,0,0,1,1,0,1,1,0,1],
    [1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,0,0],
    [1,0,0,0,0,0,1,0,0,1,1,0,0,1,0,1,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,1,0,1,0],
    [1,1,1,1,1,1,1,0,1,0,1,1,0,1,1,0,1],
  ];
  const n = mods.length, cell = 13, pad = 22, qr = n * cell + pad * 2;
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox={`0 0 ${qr} ${qr}`} width="100%" height="100%">
        <rect x="2" y="2" width={qr - 4} height={qr - 4} rx="14" fill="#fff" stroke="#11314a" strokeWidth="2" />
        {mods.flatMap((row, r) => row.map((on, c) => on ? <rect key={r + "-" + c} x={pad + c * cell} y={pad + r * cell} width={cell} height={cell} fill="#08283B" /> : null))}
        {/* scan beam */}
        <rect x={pad - 6} y={qr * 0.46} width={qr - 2 * (pad - 6)} height="6" rx="3" fill="var(--accent)" opacity="0.9" />
        <rect x={pad - 6} y={qr * 0.46 - 30} width={qr - 2 * (pad - 6)} height="30" fill="url(#beam)" />
        {/* corner brackets */}
        {[[8,8,1,1],[qr-8,8,-1,1],[8,qr-8,1,-1],[qr-8,qr-8,-1,-1]].map(([x,y,sx,sy],i)=>(
          <path key={i} d={`M ${x} ${y+sy*34} L ${x} ${y} L ${x+sx*34} ${y}`} stroke="var(--accent)" strokeWidth="6" fill="none" strokeLinecap="round" />
        ))}
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0.28" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Landing({ onSignIn, onRegister, onExplore }) {
  useScreen("LP", "Landing page", ["loaded"]);
  const [drawer, setDrawer] = React.useState(false);

  return (
    <div className="lp">
      {/* sticky nav */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-brand"><span className="lp-brand-mark"><Icon name="ticket" size={19} color="#fff" /></span><span className="lp-brand-word">Tiketi</span><button className="xnav-link" onClick={onExplore}>Explore Events</button></div>
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
            <div className="lp-drawer-head">
              <span className="lp-brand-word" style={{ color: "#fff" }}>Tiketi</span>
              <button className="lp-drawer-x" aria-label="Close" onClick={() => setDrawer(false)}><Icon name="x" size={20} color="#fff" /></button>
            </div>
            <Button block onClick={() => { setDrawer(false); onRegister(); }}>Get started</Button>
            <Button block variant="ghost" onClick={() => { setDrawer(false); onSignIn(); }}>Sign in</Button>
          </div>
        </div>
      )}

      {/* SECTION 1 — Hero */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow">Event ticketing · Juba, South Sudan</span>
            <h1 className="lp-hero-title">Tiketi</h1>
            <p className="lp-hero-tag">Secure event ticketing for South Sudan</p>
            <p className="lp-hero-sub">QR-validated tickets. Mobile money payments. Works offline. Built for Juba.</p>
            <div className="lp-hero-cta">
              <Button size="lg" iconRight="arrow-right" onClick={onRegister}>Get started</Button>
              <Button size="lg" variant="ghost" onClick={onExplore} style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.4)" }}>Explore events</Button>
              <Button size="lg" variant="ghost" onClick={onSignIn} style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.4)" }}>Sign in</Button>
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      {/* SECTION 2 — How it works */}
      <section className="lp-section">
        <div className="lp-wrap">
          <h2 className="lp-h2">How Tiketi works</h2>
          <div className="lp-steps">
            {HOW_STEPS.map((s, i) => (
              <div className="lp-step" key={s.title}>
                <div className="lp-step-num mono">{String(i + 1).padStart(2, "0")}</div>
                <span className="lp-step-ic"><Icon name={s.icon} size={26} /></span>
                <h3 className="lp-card-title">{s.title}</h3>
                <p className="lp-card-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — Why Tiketi */}
      <section className="lp-section alt">
        <div className="lp-wrap">
          <h2 className="lp-h2">Built for South Sudan</h2>
          <div className="lp-features">
            {WHY_FEATURES.map((f) => (
              <div className="lp-feature" key={f.title}>
                <span className="lp-feature-ic"><Icon name={f.icon} size={22} /></span>
                <div>
                  <h3 className="lp-card-title">{f.title}</h3>
                  <p className="lp-card-body">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — Event types */}
      <section className="lp-section">
        <div className="lp-wrap">
          <h2 className="lp-h2">For every event in Juba</h2>
          <div className="lp-types">
            {EVENT_TYPES.map((t) => (
              <div className="lp-type" key={t.label}>
                <span className="lp-type-ic"><Icon name={t.icon} size={20} /></span>
                <h3 className="lp-type-label">{t.label}</h3>
                <p className="lp-card-body">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — CTA band */}
      <section className="lp-cta-band">
        <div className="lp-wrap" style={{ textAlign: "center" }}>
          <h2 className="lp-cta-title">Ready to run better events?</h2>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 24 }}>
            <Button size="lg" iconRight="arrow-right" onClick={onRegister}>Get started</Button>
            <button className="auth-link" style={{ color: "rgba(255,255,255,.8)", fontSize: 15 }} onClick={onSignIn}>Or sign in to your account</button>
          </div>
        </div>
      </section>

      {/* SECTION 6 — Footer */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <div>
            <div className="lp-brand" style={{ marginBottom: 10 }}><span className="lp-brand-mark"><Icon name="ticket" size={16} color="#fff" /></span><span className="lp-brand-word" style={{ color: "#fff", fontSize: 18 }}>Tiketi</span></div>
            <p className="lp-footer-tag">Event Ticketing for South Sudan</p>
          </div>
          <div className="lp-footer-links">
            <button className="lp-footer-link" onClick={onExplore}>Explore events</button>
            <button className="lp-footer-link" onClick={onSignIn}>Sign in</button>
            <button className="lp-footer-link" onClick={onRegister}>Register</button>
            <button className="lp-footer-link">Contact</button>
          </div>
        </div>
        <div className="lp-wrap"><div className="lp-copyright">© 2025 Tiketi. Built on Africa's Talking, MTN Mobile Money, and Airtel Money.</div></div>
      </footer>
    </div>
  );
}

Object.assign(window, { Landing });
