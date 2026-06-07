// Tiketi — root app: Sign in → Role switcher → role shells. Review chrome + Tweaks.
const { useState: useStateR, useEffect: useEffectR } = React;

const ACCENTS = {
  "#FF5A00": { hover: "#E85100", press: "#CC4800", deep: "#A83900", chip: "#FFE9E3" },
  "#A8572F": { hover: "#924B28", press: "#7C3F21", deep: "#6E3A1E", chip: "#F2E8E1" },
};
const RADII = {
  sharp:    { sm: "0px", md: "2px", lg: "4px" },
  default:  { sm: "2px", md: "6px", lg: "8px" },
  rounded:  { sm: "8px", md: "14px", lg: "18px" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FF5A00",
  "radius": "default",
  "density": "regular"
}/*EDITMODE-END*/;

const ROLES = [
  { id: "attendee", name: "Attendee", icon: "smartphone", desc: "Discover events across Juba, book tickets with mobile money, and carry QR tickets in a wallet." },
  { id: "organizer", name: "Organizer", icon: "layout-dashboard", desc: "Create events, manage tickets and gate agents, and watch live attendance roll in." },
  { id: "gate", name: "Gate Agent", icon: "scan-line", desc: "A single-purpose offline scanner that validates QR tickets at the gate in under a second." },
  { id: "admin", name: "Admin", icon: "shield", desc: "Oversee organizers, events, gate agents, and system health across the whole platform." },
];

function RoleSwitcher({ onPick }) {
  useScreen("—", "Role launcher", ["loaded"]);
  return (
    <div className="roleswitch">
      <span className="rs-mark"><Icon name="ticket" size={28} color="#fff" /></span>
      <div className="rs-word">Tiketi</div>
      <p className="rs-tag">Event booking & ticketing for South Sudan. Choose a role to explore its experience.</p>
      <div className="rs-grid">
        {ROLES.map((r) => (
          <button key={r.id} className="rs-card" onClick={() => onPick(r.id)}>
            <span className="rs-card-ic"><Icon name={r.icon} size={26} color="#fff" /></span>
            <h3 className="rs-card-name">{r.name}</h3>
            <p className="rs-card-desc">{r.desc}</p>
            <span className="rs-card-go">Enter {r.name.toLowerCase()} <Icon name="arrow-right" size={16} /></span>
          </button>
        ))}
      </div>
      <div className="rs-foot">Prototype · Validata design system</div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authMode, setAuthMode] = useStateR("signin");
  const [authBanner, setAuthBanner] = useStateR(null);
  const [previewId, setPreviewId] = useStateR(null);
  const [screen, setScreen] = useStateR(() => {
    const h = (location.hash || "").replace("#", "");
    return ["landing", "explore", "signin", "switcher", "attendee", "organizer", "gate", "admin"].includes(h) ? h : "landing";
  });

  useEffectR(() => { window.lucide && window.lucide.createIcons(); });

  // Icons convert themselves on mount (see Icon in primitives.jsx); this initial
  // pass covers the very first render before those effects have run.

  useEffectR(() => {
    const onHash = () => {
      const h = (location.hash || "").replace("#", "");
      if (["landing", "explore", "signin", "switcher", "attendee", "organizer", "gate", "admin"].includes(h)) setScreen(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // apply tweaks to :root
  useEffectR(() => {
    const root = document.documentElement;
    const a = ACCENTS[t.accent] || ACCENTS["#FF5A00"];
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-hover", a.hover);
    root.style.setProperty("--accent-press", a.press);
    root.style.setProperty("--accent-deep", a.deep);
    root.style.setProperty("--accent-chip-bg", a.chip);
    const r = RADII[t.radius] || RADII.default;
    root.style.setProperty("--r-sm", r.sm);
    root.style.setProperty("--r-md", r.md);
    root.style.setProperty("--r-lg", r.lg);
    root.setAttribute("data-density", t.density === "regular" ? "" : t.density);
  }, [t.accent, t.radius, t.density]);

  const goSignIn = () => { setAuthMode("signin"); setScreen("signin"); };
  const goRegister = () => { setAuthMode("register"); setScreen("signin"); };
  const openPreview = (id) => { setPreviewId(id); setScreen("preview"); };
  const bookFromPreview = () => { setAuthMode("signin"); setAuthBanner({ tone: "info", title: "Sign in to complete your booking", body: "Your selection is saved. Sign in to pay and get your ticket." }); setScreen("signin"); };

  let body;
  if (screen === "landing") body = <Landing onSignIn={goSignIn} onRegister={goRegister} onExplore={() => setScreen("explore")} />;
  else if (screen === "explore") body = <ExploreShell onSignIn={goSignIn} onRegister={goRegister} onOpenEvent={openPreview} />;
  else if (screen === "preview") body = <PublicEventPreview eventId={previewId} onBack={() => setScreen("explore")} onSignIn={goSignIn} onRegister={goRegister} onBook={bookFromPreview} />;
  else if (screen === "signin") body = <AuthFlow initialMode={authMode} initialBanner={authBanner} onAuthed={() => setScreen("switcher")} />;
  else if (screen === "switcher") body = <RoleSwitcher onPick={setScreen} />;
  else if (screen === "attendee") body = <AttendeeShell />;
  else if (screen === "organizer") body = <OrganizerShell />;
  else if (screen === "gate") body = <GateShell />;
  else if (screen === "admin") body = <AdminShell />;

  return (
    <ReviewProvider onHome={() => setScreen("switcher")}>
      <div key={screen}>{body}</div>
      <TweaksPanel title="Tweaks">
        <TweakSection label="Accent" />
        <TweakColor label="Accent color" value={t.accent} options={["#FF5A00", "#A8572F"]} onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Shape" />
        <TweakRadio label="Corner radius" value={t.radius} options={["sharp", "default", "rounded"]} onChange={(v) => setTweak("radius", v)} />
        <TweakSection label="Density" />
        <TweakRadio label="Spacing" value={t.density} options={["compact", "regular", "comfortable"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </ReviewProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
