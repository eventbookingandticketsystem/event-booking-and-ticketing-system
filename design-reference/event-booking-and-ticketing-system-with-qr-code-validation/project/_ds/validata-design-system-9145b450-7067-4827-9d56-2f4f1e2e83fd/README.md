# Validata — Design System

**Validata** is the brand name for **Lab Results Validator**, an internal web application used by training-program administrators and instructors to upload, validate, and audit learner lab-results data (CSV/XLSX). It is a back-office data-integrity tool, not a consumer product: the personality is utilitarian, precise, and trustworthy — "the single source of truth for lab results validation and internal data auditing."

Core jobs the product does:
- **Upload** lab-result spreadsheets and run them through a multi-tier validation engine.
- **Validate** each row against rules (date format, numeric ranges, required fields, email format…) producing accepted / rejected / partial outcomes with specific rule IDs and error messages.
- **Audit** every action via immutable logs, and manage cohorts, learners, instructors, and reference data.
- **Export** clean data to analytics tools (Power BI connection screen exists).

## Sources

- **Figma:** "Lab Result Validation App.fig" — mounted read-only. Page-1 contains 17 frames: Login Form, Set New Password, Admin Dashboard, Instructor Dashboard, Upload Results, Validation Report, Learner Roster, Cohort list, Audit Log, Reference Data, Bulk Setup CSV, Download Template, Power BI Connection, Add/Edit Cohort Form, Add/Edit Learner Form, Add/Edit Lab Drawer, Edit Instructor Drawer.
- **uploads/DESIGN.md** — the written design brief with the canonical color, type, radius, and component spec. This is the authoritative token source; the Figma frames are the authoritative layout/composition source.

> Note: the Figma `.jsx` is reconstructed pseudocode. Where it disagrees with DESIGN.md on token values, DESIGN.md wins. Frame screenshots occasionally garble glyphs (e.g. "COHORTS"→"Că Hă RTS", "Oct"→"ă ct") — these are OCR artifacts of the screenshot tool, not real copy.

---

## CONTENT FUNDAMENTALS

**Voice:** plain, operational, and confident. It reads like well-written internal software — no marketing fluff, no exclamation marks, no jokes. Every string tells the user what is happening or what to do next.

**Casing:** **Sentence case everywhere** for headings, buttons, and body ("Sign in", "Upload results", "Download corrections CSV", "Re-upload fixed file", "Attention required"). The ONLY uppercase is small **eyebrow/label caps** with wide letter-spacing for KPI labels and meta ("COHORTS", "LEARNERS", "TOTAL ROWS EVALUATED", "SECURE 256-BIT ENCRYPTED SESSION"). Status pills are Title/Sentence case ("Completed", "Partial").

**Person:** addresses the user as **you** ("Drop your CSV here", "Contact your administrator if you don't have an account", "You may correct these specific errors…"). System describes its own actions in plain declaratives ("The 43 valid rows have been successfully committed…").

**Numbers & data:** quantitative and exact. Counts ("43 / 48"), percentages ("82% Rejected"), file names, row numbers, rule IDs, and timestamps are first-class content and always shown in **monospace** (`lab_results_batch_Q3_final.csv`, `VAL-DATE-01`, row `12`). Error messages are specific and actionable: "Invalid date format. Expected YYYY-MM-DD.", "Value exceeds maximum allowed score of 100.", "Required field is missing or empty."

**Tone of helper text:** terse, factual constraints — "or click to browse · .csv only · max 5 MB or 10,000 rows", "name@organization.com". Middot `·` separates inline constraints.

**Emoji:** none. Never. This is an internal compliance tool.

**Vibe:** trustworthy data infrastructure — think "audit-grade." Security and immutability are recurring themes (encrypted-session badge, audit trail, version stamp "Version 2.4.0-pro" in the footer).

---

## VISUAL FOUNDATIONS

**Overall feel:** a clean, dense, light enterprise dashboard with a dark-navy chrome and a single hot-orange accent. High legibility, restrained color, lots of white surface on a warm off-white page.

**Color usage**
- **Off-white page** (`#F7F6F2`) is the canvas; report-type pages use a slightly warmer tint (`#FFF8F6`).
- **White cards** sit on the page with a 1px warm-grey border (`#E2E0D8`) and a barely-there shadow.
- **Deep navy** (`#08283B`) is reserved for *structural* surfaces: the fixed left sidebar and table header rows. It is never used for body text.
- **Orange** (`#FF5A00`) is the one accent — primary buttons, the active-nav left border, links, KPI accent icons, and focus rings. Used sparingly so it always means "action / important." A darker orange (`#A83900`) appears for icons on light-orange chips.
- **Semantic trio** (green / red / amber) only for row + status outcomes, each as a soft tinted background with a darker text/icon of the same hue. Blue (`#466177`/`#CAE6FF`) is a secondary informational accent (learners chip, info callouts).

**Typography**
- **Poppins** (SemiBold/Bold) for all display & headings — sharp, geometric, utilitarian; negative letter-spacing on the large sizes.
- **Inter** (Regular/Medium/SemiBold) for all body, labels, and UI text.
- **JetBrains Mono** for any machine data: row numbers, rule IDs, file names, hashes, error codes. This mono/sans split is a signature of the brand — data is always mono.
- Scale: Display 32 / 24, Headline 18, Body 16 / 14, Label 12 (caps, +letter-spacing), eyebrow 11 (caps, wide tracking), mono 13.

**Spacing & layout**
- Fixed **220px** navy sidebar + fixed **56px** white topbar + scrollable content. Content centers at **~1100px** max-width with **32px** gutters.
- **Role-based sidebar:** the nav set differs by role and is standardized per role. **Admin** (5 items): Dashboard · Lab Results · User Management · Settings · Reports. **Instructor** (4 items): Dashboard · Download Template · Upload Results · My Uploads. Both share the same chrome (navy, brand header, Logout pinned to the footer) and the same active/hover/idle states — only the item list changes.
- 8 / 16 / 24 / 32 spacing rhythm. Cards pad 16px (stat) – 24px (content) – 40px (auth card).
- Page pattern: breadcrumb → page title (Poppins 24, sentence case) + one-line grey subtitle → primary CTA top-right → content.

**Backgrounds:** flat fills, no photography in-app. The only imagery is small JPG user avatars (circular). The login's navy panel carries a very subtle dark gradient and a faint blurred orange shape at ~20% opacity — the single decorative flourish in the whole system; everything else is flat. No textures, no patterns.

**Corner radii:** tight and rectilinear — **2px** on inputs, buttons, and icon chips; **6px** on cards (per spec); **8px** on the auth card / large surfaces; full-round only on status pills and avatars. The overall geometry reads square and engineered, not soft.

**Borders:** 1px solid `#E2E0D8` is the workhorse divider and card/input outline. Inner hairlines use it at 50% opacity. The active nav item carries a **3–4px orange left border**. Info/partial callouts use a thicker (≈4px) orange left border on a tinted panel.

**Shadows / elevation:** extremely subtle. Cards = `0 1px 2px rgba(0,0,0,0.05)`; stat cards = `0 2px 4px rgba(0,0,0,0.02)`. Depth comes from borders and the navy/white contrast far more than from shadow. Menus/drawers/modals get a soft larger shadow.

**Cards:** white fill, 1px `#E2E0D8` border, 6px radius, 16–24px padding, whisper shadow. Stat cards add a colored icon chip (top-right), a big Poppins number, an eyebrow label, and a hairline footer row with a status dot.

**Buttons**
- *Primary*: solid orange `#FF5A00`, white bold label, 2px radius, ~44px tall, optional trailing arrow icon. Hover darkens (`#E85100`), active darker (`#CC4800`), disabled = orange at ~50% opacity.
- *Ghost / secondary*: white fill, 1px navy or border outline, navy/`#0F1A20` label.
- *Destructive*: `#A32D2D`.

**Form inputs:** 40–44px tall, white, 1px `#E2E0D8`, 2px radius, leading icon at 12px inset, 16px placeholder in `#6B7280`. Focus = orange ring. Labels are 14–16px secondary-grey above the field.

**Status pills / badges:** rounded-full, soft tinted fill + darker same-hue text, **no border**, ~12–14px medium. Completed=green, Partial=amber, Rejected/error=red, role badge ("Admin")=orange tint.

**Tables:** navy (`#08283B`) sticky header with white text, alternating white / `#F7F6F2` body rows, 1px `#E2E0D8` row separators. Cell data that is machine-readable renders mono.

**Animation:** minimal and functional — short ease fades/slides for menus, drawers, and hover color transitions (~150ms). No bounces, no decorative loops. Hover = subtle background tint (nav: lighter navy; rows: warm grey) or color darken (buttons/links). Press = slightly darker color (no large scale changes).

**Transparency & blur:** sparse. White-on-navy text uses opacity tiers (100 / 70 / 60 / 30%). The login decorative shape uses 20% opacity + blur. No glassmorphism in the working app.

---

## ICONOGRAPHY

The product uses **simple single-weight line icons in the Lucide style** (2px stroke, rounded caps/joins, 24px grid), rendered at ~15–20px. They are monochrome and inherit color from context — white at 70% on the navy sidebar, navy/grey in content, white inside the orange logo chip, and semantic hues inside status contexts.

Observed icons and their Lucide equivalents:
- Sidebar nav: `layout-dashboard` (Dashboard), `microscope` (Lab Results), `users` (User Management), `settings` (Settings), `bar-chart-2` (Reports), `log-out` (Logout).
- Forms/auth: `mail`, `lock`, `eye` / `eye-off`, `arrow-right`, `shield`.
- Data UI: `upload-cloud`, `download`, `file-text`, `clock`, `alert-triangle`, `check-circle`, `info`, `lightbulb`, `graduation-cap` (cohorts chip), `user`, `id-card` (instructors).

**Approach for this system:** the source SVGs are standard Lucide, so we link **Lucide from CDN** (`lucide@latest`) for crispness and completeness rather than copying garbled vector exports. The one custom asset is the **brand mark** — a `microscope` glyph in white on an orange (`#FF5A00`) rounded square — stored in `assets/`. See `assets/logo-mark.svg`.

**Unicode/emoji as icons:** none. The only non-Lucide glyph in use is the middot `·` as an inline separator in helper text.

---

## INDEX — what's in this design system

| Path | What it is |
|---|---|
| `README.md` | This file — context, content + visual foundations, iconography. |
| `colors_and_type.css` | CSS custom properties (color, type families, radii, shadow, spacing) + semantic type classes. Import this everywhere. |
| `assets/` | Brand mark (`logo-mark.svg`) and exported icon assets. |
| `preview/` | Small HTML specimen cards that populate the Design System tab (colors, type, components, etc.). |
| `ui_kits/app/` | The Validata web-app UI kit: interactive, high-fidelity recreation of the core screens, with **Admin and Instructor** flows (role switch on login). Start at `ui_kits/app/index.html`. |
| `GAP_ANALYSIS.md` | Coverage status (PRD vs Figma vs kit), missing screens/components, open decisions, and a phased build plan. |
| `SKILL.md` | Agent-Skill manifest so this folder works as a downloadable Claude skill. |

**Fonts:** Poppins, Inter, JetBrains Mono — all Google Fonts (loaded via `<link>`); these are the *actual* fonts from the source, no substitution.
