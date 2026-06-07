// Tiketi — shared primitives (Validata vocabulary). Exposed on window.

function Icon({ name, size = 18, color = "currentColor", style = {}, strokeWidth }) {
  const extra = strokeWidth ? ` stroke-width="${strokeWidth}"` : "";
  const ref = React.useRef(null);
  // Convert this placeholder on mount. useLayoutEffect runs SYNCHRONOUSLY in
  // React's commit phase (before paint) — unlike useEffect/rAF/setInterval, it is
  // not deferred by the scheduler, which this preview iframe throttles. The first
  // icon in a batch converts all pending placeholders document-wide; siblings
  // then find none in their own node and skip (~O(1) createIcons per batch).
  React.useLayoutEffect(() => {
    if (window.lucide && ref.current && ref.current.querySelector("[data-lucide]")) {
      window.lucide.createIcons();
    }
  });
  return (
    <span ref={ref} className="ic" style={{ width: size, height: size, color, ...style }}
      dangerouslySetInnerHTML={{ __html: `<i data-lucide="${name}"${extra}></i>` }} />
  );
}

function Button({ variant = "primary", size, icon, iconRight, block, children, ...props }) {
  const cls = ["btn", `btn-${variant}`, size === "sm" ? "btn-sm" : "", size === "lg" ? "btn-lg" : "", block ? "btn-block" : ""].filter(Boolean).join(" ");
  const isz = size === "sm" ? 16 : size === "lg" ? 19 : 17;
  return (
    <button className={cls} {...props}>
      {icon && <Icon name={icon} size={isz} />}
      {children}
      {iconRight && <Icon name={iconRight} size={isz} />}
    </button>
  );
}

// StatusPill — maps a status label to the right Validata tone.
const STATUS_TONE = {
  "Valid": "success", "Admitted": "success", "Online": "success", "Active": "success", "Completed": "success", "Confirmed": "success", "Published": "success", "Live": "success",
  "Used": "neutral", "Expired": "neutral", "Past": "neutral", "Inactive": "neutral", "Draft": "neutral", "Archived": "neutral", "Completed ": "neutral",
  "Selling Fast": "warning", "Ongoing": "warning", "Pending": "warning", "Offline": "warning", "Low stock": "warning",
  "Sold Out": "danger", "Rejected": "danger", "Cancelled": "danger", "Fraud": "danger",
  "Upcoming": "info",
};
function StatusPill({ status, tone, dot, pulse, sm }) {
  const t = tone || STATUS_TONE[status] || "neutral";
  return (
    <span className={`pill pill-${t}${sm ? " pill-sm" : ""}${pulse ? " pill-dot-pulse" : ""}`}>
      {(dot || pulse) && <span className="dotlive"></span>}
      {status}
    </span>
  );
}

function Pill({ tone = "neutral", sm, children }) {
  return <span className={`pill pill-${tone}${sm ? " pill-sm" : ""}`}>{children}</span>;
}

// SkeletonBlock — w/h/radius shimmer
function Skeleton({ w = "100%", h = 16, r, mt, style = {}, className = "" }) {
  return <div className={"sk " + className} style={{ width: w, height: h, borderRadius: r, marginTop: mt, ...style }} />;
}

function Spinner({ size, light }) {
  return <span className={"spinner" + (size === "sm" ? " spinner-sm" : "") + (light ? " spinner-light" : "")} />;
}
function LoadingSpinner({ label = "Loading...", light }) {
  return (
    <div className="loadbox" style={light ? { color: "rgba(255,255,255,.7)" } : {}}>
      <Spinner light={light} />
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ icon = "inbox", title, body, cta, onCta }) {
  return (
    <div className="empty">
      <span className="empty-ic"><Icon name={icon} size={26} /></span>
      <h3 className="empty-title">{title}</h3>
      {body && <p className="empty-body">{body}</p>}
      {cta && <Button size="sm" onClick={onCta}>{cta}</Button>}
    </div>
  );
}

const ALERT_IC = { success: "check-circle", danger: "alert-octagon", warning: "alert-triangle", info: "info" };
function AlertBanner({ tone = "info", title, children, onDismiss }) {
  return (
    <div className={`alert alert-${tone}`} role="status">
      <span className="alert-ic"><Icon name={ALERT_IC[tone]} size={18} /></span>
      <div className="alert-body">
        {title && <p className="alert-title">{title}</p>}
        {children && <p className="alert-text">{children}</p>}
      </div>
      {onDismiss && <button className="alert-x" aria-label="Dismiss" onClick={onDismiss}><Icon name="x" size={16} /></button>}
    </div>
  );
}

// FormField — label + control + error slot
function FormField({ label, error, hint, icon, type = "text", trail, textarea, select, children, value, onChange, placeholder, ...rest }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <div className={"input" + (error ? " invalid" : "") + (textarea ? " input-textarea" : "")}>
        {icon && <span className="lead"><Icon name={icon} size={17} /></span>}
        {textarea ? (
          <textarea value={value} onChange={onChange} placeholder={placeholder} {...rest} />
        ) : select ? (
          children
        ) : (
          <input type={type} value={value} onChange={onChange} placeholder={placeholder} {...rest} />
        )}
        {trail}
      </div>
      {error && <span className="field-error"><Icon name="alert-circle" size={13} /> {error}</span>}
      {hint && !error && <span className="field-hint">{hint}</span>}
    </div>
  );
}

// Select styled like a FormField
function SelectField({ label, value, onChange, options, icon, placeholder }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <div className="input select-wrap">
        {icon && <span className="lead"><Icon name={icon} size={17} /></span>}
        <select value={value} onChange={onChange}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
        <span className="chev"><Icon name="chevron-down" size={16} /></span>
      </div>
    </div>
  );
}

function Modal({ icon, title, sub, children, onClose, footer, width }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" style={width ? { width } : {}} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          {icon && <span style={{ color: "var(--accent-deep)" }}><Icon name={icon} size={22} /></span>}
          <div style={{ flex: 1 }}>
            <h3 className="modal-title">{title}</h3>
            {sub && <p className="modal-sub">{sub}</p>}
          </div>
          <button className="modal-x" aria-label="Close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function StatCard({ label, value, chipIcon, chipBg = "var(--accent-chip-bg)", chipFg = "var(--accent-deep)", footDot, footText, progress, progressColor = "var(--accent)" }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <div>
          <div className="stat-cap">{label}</div>
          <div className="stat-num">{value}</div>
        </div>
        {chipIcon && <div className="stat-chip" style={{ background: chipBg, color: chipFg }}><Icon name={chipIcon} size={17} /></div>}
      </div>
      {typeof progress === "number" && (
        <div className="stat-prog"><div className="stat-prog-bar" style={{ width: progress + "%", background: progressColor }} /></div>
      )}
      {footText && (
        <div className="stat-foot">
          {footDot && <span className="dot" style={{ background: footDot }} />}
          {footText}
        </div>
      )}
    </div>
  );
}

// ---------- PhoneInput: country selector (colored code box, not emoji) + numeric-only local number ----------
const PHONE_COUNTRIES = [
  { code: "SS", name: "South Sudan", dial: "+211", color: "#0F47AF" },
  { code: "CF", name: "CAR", dial: "+236", color: "#2A6FDB" },
  { code: "CD", name: "DR Congo", dial: "+243", color: "#1F8A5B" },
  { code: "ET", name: "Ethiopia", dial: "+251", color: "#3A7D3A" },
  { code: "KE", name: "Kenya", dial: "+254", color: "#A32D2D" },
  { code: "NG", name: "Nigeria", dial: "+234", color: "#1F8A5B" },
  { code: "RW", name: "Rwanda", dial: "+250", color: "#2A6FDB" },
  { code: "SD", name: "Sudan", dial: "+249", color: "#A83900" },
  { code: "TZ", name: "Tanzania", dial: "+255", color: "#0E7C5A" },
  { code: "UG", name: "Uganda", dial: "+256", color: "#1A1A1A" },
  { code: "GB", name: "UK", dial: "+44", color: "#1F3A93" },
  { code: "US", name: "USA", dial: "+1", color: "#2A4FAF" },
];
const DEFAULT_PHONE = { dial: "+211", code: "SS", num: "" };

function FlagBox({ code, color }) {
  return <span className="flagbox" style={{ background: color }}>{code}</span>;
}

function PhoneInput({ label = "Phone number", value = DEFAULT_PHONE, onChange, error, disabled }) {
  const v = value || DEFAULT_PHONE;
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef(null);
  const country = PHONE_COUNTRIES.find((c) => c.code === v.code) || PHONE_COUNTRIES[0];

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const list = PHONE_COUNTRIES.filter((c) => {
    const q = search.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.dial.includes(q);
  });

  const pick = (c) => { onChange({ dial: c.dial, code: c.code, num: v.num }); setOpen(false); setSearch(""); };
  const onNum = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 12);
    onChange({ ...v, num: digits });
  };

  return (
    <div className="field" ref={ref}>
      {label && <label className="field-label">{label}</label>}
      <div className={"phone-row" + (error ? " invalid" : "")}>
        <button type="button" className="phone-dial" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
          <FlagBox code={country.code} color={country.color} />
          <span className="mono phone-dial-code">{country.dial}</span>
          <Icon name="chevron-down" size={15} color="var(--text-secondary)" />
        </button>
        <input className="phone-num" type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="912 345 678"
          value={v.num} onChange={onNum} disabled={disabled} aria-label="Phone number" />
        {open && (
          <div className="phone-dd" role="listbox">
            <div className="phone-dd-search">
              <Icon name="search" size={15} color="var(--text-muted)" />
              <input autoFocus placeholder="Search country or code" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="phone-dd-list">
              {list.map((c) => (
                <button type="button" key={c.code} role="option" aria-selected={c.code === v.code} className={"phone-dd-row" + (c.code === v.code ? " on" : "")} onClick={() => pick(c)}>
                  <FlagBox code={c.code} color={c.color} />
                  <span className="phone-dd-name">{c.name}</span>
                  <span className="mono phone-dd-dial">{c.dial}</span>
                </button>
              ))}
              {list.length === 0 && <div className="phone-dd-empty">No match</div>}
            </div>
          </div>
        )}
      </div>
      {error && <span className="field-error"><Icon name="alert-circle" size={13} /> {error}</span>}
    </div>
  );
}
// validity helper for phone: returns error string or ""
function phoneError(value, touched) {
  if (!touched) return "";
  const num = (value && value.num) || "";
  if (!num) return "Phone number is required";
  if (num.length < 7) return "Enter a valid phone number";
  return "";
}
function phoneE164(value) { const v = value || DEFAULT_PHONE; return v.dial + v.num; }

// ---------- NumberField: digit-only input, clamp to min/max on blur ----------
function NumberField({ value, onChange, min, max, ...props }) {
  return (
    <FormField
      type="text" inputMode="numeric" pattern="[0-9]*"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      onBlur={() => {
        if (value === "" || value == null) return;
        let n = Number(value);
        if (min != null && n < min) n = min;
        if (max != null && n > max) n = max;
        onChange(String(n));
      }}
      {...props}
    />
  );
}

Object.assign(window, { Icon, Button, Pill, StatusPill, Skeleton, Spinner, LoadingSpinner, EmptyState, AlertBanner, FormField, SelectField, Modal, StatCard, PhoneInput, NumberField, phoneError, phoneE164, DEFAULT_PHONE });
