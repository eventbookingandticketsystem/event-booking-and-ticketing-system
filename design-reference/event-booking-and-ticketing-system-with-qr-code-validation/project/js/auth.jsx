// Tiketi — Authentication. AUTH1 Sign In (states: loaded | error; loading on submit).

function AuthBrand() {
  return (
    <div className="auth-brand">
      <div className="auth-glow" />
      <div className="auth-top">
        <div className="auth-head">
          <span className="auth-mark"><Icon name="ticket" size={24} color="#fff" /></span>
          <span className="auth-word">Tiketi</span>
        </div>
      </div>
      <div className="auth-mid">
        <h1 className="auth-tag">Every ticket verified at the gate.</h1>
        <p className="auth-tag-sub">Book events across Juba, pay with mobile money, and walk in with a QR ticket that works even when the network doesn't.</p>
        <div className="auth-features">
          <div className="auth-feature">
            <span className="auth-fic"><Icon name="qr-code" size={20} color="#fff" /></span>
            <div><div className="auth-ftitle">QR validation</div><div className="auth-fsub">Forgery-proof tickets, scanned in under a second</div></div>
          </div>
          <div className="auth-feature">
            <span className="auth-fic"><Icon name="wifi-off" size={20} color="#fff" /></span>
            <div><div className="auth-ftitle">Offline scanning</div><div className="auth-fsub">Gate agents validate without a signal, then sync</div></div>
          </div>
          <div className="auth-feature">
            <span className="auth-fic"><Icon name="smartphone" size={20} color="#fff" /></span>
            <div><div className="auth-ftitle">Mobile money</div><div className="auth-fsub">Pay with MTN or Airtel in SSP</div></div>
          </div>
        </div>
      </div>
      <div className="auth-foot-txt">Tiketi · Juba, South Sudan · Version 1.0.0</div>
    </div>
  );
}

function SignIn({ onSignIn, onRegister, onForgot, banner, onClearBanner }) {
  const state = useScreen("AUTH1", "Sign in", ["loaded", "error"]);
  const [phone, setPhone] = React.useState(DEFAULT_PHONE);
  const [pw, setPw] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const showError = state === "error";

  const err = {
    phone: !phone.num ? "Phone number is required" : phone.num.length < 7 ? "Enter a valid phone number" : "",
    pw: !pw ? "Password is required" : pw.length < 6 ? "At least 6 characters" : "",
  };
  const valid = !err.phone && !err.pw;
  const e = (k) => touched ? err[k] : "";

  const submit = (ev) => {
    ev.preventDefault();
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onSignIn(); }, 1100);
  };

  return (
    <div className="auth">
      <AuthBrand />
      <div className="auth-form-pane">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-card-head">
            <h2 className="auth-card-title">Sign in</h2>
            <p className="auth-card-sub">Welcome back. Enter your details to continue.</p>
          </div>
          {banner && <AlertBanner tone={banner.tone} title={banner.title} onDismiss={onClearBanner}>{banner.body}</AlertBanner>}
          {showError && <AlertBanner tone="danger" title="Incorrect phone number or password">Check your details and try again.</AlertBanner>}
          <PhoneInput value={phone} onChange={setPhone} disabled={loading} error={e("phone")} />
          <FormField label="Password" icon="lock" type={show ? "text" : "password"} placeholder="Enter your password"
            value={pw} onChange={(ev) => setPw(ev.target.value)} disabled={loading} error={e("pw")}
            trail={<button type="button" className="trail" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}><Icon name={show ? "eye-off" : "eye"} size={18} /></button>} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -6 }}>
            <button type="button" className="auth-link" style={{ fontSize: 14 }} onClick={onForgot}>Forgot password?</button>
          </div>
          <Button type="submit" block size="lg" disabled={loading} iconRight={loading ? undefined : "arrow-right"}>
            {loading ? <React.Fragment><Spinner size="sm" light /> Signing in…</React.Fragment> : "Sign in"}
          </Button>
          <div className="auth-divider">New to Tiketi?</div>
          <Button type="button" variant="ghost" block onClick={onRegister}>Create an account</Button>
          <div className="auth-card-foot">
            <span className="auth-secure"><Icon name="shield" size={13} /> Secure 256-bit encrypted session</span>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- AUTH2 REGISTER ----------
function Register({ onRegistered, onSignIn }) {
  useScreen("AUTH2", "Register", ["loaded"]);
  const [f, setF] = React.useState({ name: "", phone: DEFAULT_PHONE, pw: "", confirm: "" });
  const [role, setRole] = React.useState("attendee");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // password strength: length + variety
  const pwScore = (() => {
    let s = 0;
    if (f.pw.length >= 8) s++;
    if (/[A-Z]/.test(f.pw) && /[a-z]/.test(f.pw)) s++;
    if (/\d/.test(f.pw) || /[^A-Za-z0-9]/.test(f.pw)) s++;
    return f.pw.length === 0 ? 0 : s;
  })();
  const pwLabel = ["", "Weak", "Fair", "Strong"][pwScore];
  const pwColor = ["", "var(--danger)", "var(--warning)", "var(--success)"][pwScore];

  const err = {
    name: !f.name.trim() ? "Full name is required" : f.name.trim().length < 2 ? "At least 2 characters" : "",
    phone: !f.phone.num ? "Phone number is required" : f.phone.num.length < 7 ? "Enter a valid phone number" : "",
    pw: !f.pw ? "Password is required" : f.pw.length < 8 ? "At least 8 characters" : "",
    confirm: !f.confirm ? "Confirm your password" : f.confirm !== f.pw ? "Passwords do not match" : "",
  };
  const valid = !Object.values(err).some(Boolean);
  const show1 = (k) => touched && err[k] ? err[k] : "";

  const submit = (e) => {
    e.preventDefault(); setTouched(true);
    if (!valid) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onRegistered(); }, 1100);
  };

  return (
    <div className="auth">
      <AuthBrand />
      <div className="auth-form-pane">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-card-head">
            <h2 className="auth-card-title">Create your account</h2>
            <p className="auth-card-sub">Join Tiketi to book and manage events.</p>
          </div>
          <FormField label="Full name" icon="user" placeholder="Achol Deng" value={f.name} onChange={set("name")} error={show1("name")} disabled={loading} />
          <PhoneInput value={f.phone} onChange={(p) => setF({ ...f, phone: p })} error={show1("phone")} disabled={loading} />
          <FormField label="Password" icon="lock" type={show ? "text" : "password"} placeholder="Create a password" value={f.pw} onChange={set("pw")} error={show1("pw")} disabled={loading}
            trail={<button type="button" className="trail" aria-label={show ? "Hide" : "Show"} onClick={() => setShow(!show)}><Icon name={show ? "eye-off" : "eye"} size={18} /></button>} />
          {f.pw && (
            <div style={{ marginTop: -8 }}>
              <div className="pwbar">
                {[1, 2, 3].map((i) => <span key={i} className="pwbar-seg" style={i <= pwScore ? { background: pwColor } : {}} />)}
              </div>
              <div className="pwbar-label" style={{ color: pwColor }}>{pwLabel} password</div>
            </div>
          )}
          <FormField label="Confirm password" icon="lock" type={show ? "text" : "password"} placeholder="Re-enter password" value={f.confirm} onChange={set("confirm")} error={show1("confirm")} disabled={loading} />
          <div className="field">
            <label className="field-label">I am registering as</label>
            <div className="role-toggle" role="radiogroup" aria-label="Role">
              <button type="button" role="radio" aria-checked={role === "attendee"} className={"role-toggle-btn" + (role === "attendee" ? " on" : "")} onClick={() => setRole("attendee")}><Icon name="smartphone" size={16} /> Attendee</button>
              <button type="button" role="radio" aria-checked={role === "organizer"} className={"role-toggle-btn" + (role === "organizer" ? " on" : "")} onClick={() => setRole("organizer")}><Icon name="layout-dashboard" size={16} /> Organizer</button>
            </div>
          </div>
          <Button type="submit" block size="lg" disabled={loading} iconRight={loading ? undefined : "arrow-right"}>
            {loading ? <React.Fragment><Spinner size="sm" light /> Creating account…</React.Fragment> : "Create account"}
          </Button>
          <div className="auth-card-foot">Already have an account? <button type="button" className="auth-link" onClick={onSignIn}>Sign in</button></div>
        </form>
      </div>
    </div>
  );
}

// ---------- AUTH3 FORGOT PASSWORD ----------
function ForgotPassword({ onSignIn, onSent }) {
  const state = useScreen("AUTH3", "Forgot password", ["loaded", "sent"]);
  const [phone, setPhone] = React.useState(DEFAULT_PHONE);
  const [loading, setLoading] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  React.useEffect(() => { setSent(state === "sent"); }, [state]);

  const phoneErr = !phone.num ? "Phone number is required" : phone.num.length < 7 ? "Enter a valid phone number" : "";

  const submit = (e) => {
    e.preventDefault(); setTouched(true);
    if (phoneErr) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); if (onSent) onSent(); else setSent(true); }, 1000);
  };

  return (
    <div className="auth">
      <AuthBrand />
      <div className="auth-form-pane">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-card-head">
            <h2 className="auth-card-title">Reset password</h2>
            <p className="auth-card-sub">We'll text a reset code to your number.</p>
          </div>
          {sent ? (
            <React.Fragment>
              <AlertBanner tone="success" title="Reset code sent">A reset code has been sent to {phoneE164(phone)}. Enter it on the next screen to set a new password.</AlertBanner>
              <Button type="button" block size="lg" icon="arrow-left" variant="ghost" onClick={onSignIn}>Back to sign in</Button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <PhoneInput value={phone} onChange={setPhone} disabled={loading} error={touched ? phoneErr : ""} />
              <Button type="submit" block size="lg" disabled={loading} iconRight={loading ? undefined : "arrow-right"}>
                {loading ? <React.Fragment><Spinner size="sm" light /> Sending…</React.Fragment> : "Send reset code"}
              </Button>
              <div className="auth-card-foot"><button type="button" className="auth-link" onClick={onSignIn}>Back to sign in</button></div>
            </React.Fragment>
          )}
        </form>
      </div>
    </div>
  );
}

// ---------- Auth flow wrapper ----------
function AuthFlow({ onAuthed, initialMode = "signin", initialBanner = null, onExit }) {
  const [mode, setMode] = React.useState(initialMode);
  const [banner, setBanner] = React.useState(initialBanner);
  if (mode === "register") return <Register onRegistered={() => { setBanner({ tone: "success", title: "Account created", body: "Sign in to continue." }); setMode("signin"); }} onSignIn={() => setMode("signin")} />;
  if (mode === "forgot") return <ForgotPassword onSignIn={() => setMode("signin")} onSent={() => { setBanner({ tone: "info", title: "Reset code sent", body: "We texted a reset code to your number." }); setMode("signin"); }} />;
  return <SignIn onSignIn={onAuthed} onRegister={() => { setBanner(null); setMode("register"); }} onForgot={() => { setBanner(null); setMode("forgot"); }} banner={banner} onClearBanner={() => setBanner(null)} />;
}

Object.assign(window, { SignIn, Register, ForgotPassword, AuthFlow, AuthBrand });
