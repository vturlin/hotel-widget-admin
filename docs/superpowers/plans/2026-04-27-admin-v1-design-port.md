# Admin V1 Design Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the V1 ("Classic split, polished") D-EDGE admin redesign from `design_handoff_widget_admin/` into `src/`, replacing the Inter-based purple palette and the monolithic `App.jsx` / `App.module.css` with a per-component split that uses the design tokens, Open Sans, the warm-stone neutrals, and the new chrome / form primitives — without changing any existing backend behavior or removing any existing feature.

**Architecture:** Aggressive per-component split. New `src/tokens.css` is the single source of truth for color, type, spacing, radius. Every JSX component gets its own folder with a co-located `.module.css`. The chrome shell (`AdminLayout`) composes `TopChrome` + `TabBar` + a `1fr 460px` grid (`PreviewPane` left, active-tab `<aside>` right). Each tab panel uses `<PanelHeader>` + one or more `<GroupCard>`s populated with form primitives (`Field`, `TextInput`, `Select`, `ColorInput`, `Toggle`, `Checkbox`). A tiny new `useUnpublishedDiff` hook compares the current `form` against a snapshot of the last loaded/published config to drive the "Unpublished changes" pill in the top bar and the status panel in the Publish tab.

**Tech Stack:** React 18, Vite 5, CSS Modules, vanilla CSS custom properties. No new runtime deps.

**Verification approach:** No test framework exists in the repo, and adding one for a visual port is out of scope. Each task ends in a manual browser check at `npm run dev` (default `http://localhost:5173`). Phase-level checkpoints exercise the affected feature against the spec's Section 8 acceptance checklist.

**Spec:** [docs/superpowers/specs/2026-04-27-admin-v1-design-port-design.md](../specs/2026-04-27-admin-v1-design-port-design.md)

---

## Phase 0 — Prep

### Task 0: Create a feature branch and confirm clean working tree

**Files:** none.

- [ ] **Step 1: Confirm clean tree**

```bash
git status
```

Expected: `working tree clean`. If not, stash or commit before continuing.

- [ ] **Step 2: Create branch**

```bash
git checkout -b feat/admin-v1-design-port
```

- [ ] **Step 3: Smoke-test current app**

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Sign in with the existing password. Confirm the hotels landing loads, you can open a config, and the preview iframe + screenshot both render. This is the baseline you're trying not to regress.

Stop the dev server (`Ctrl+C`) before proceeding.

---

## Phase 1 — Foundation (tokens, fonts, logo)

### Task 1: Drop in tokens.css, fonts, and logo

**Files:**
- Create: `src/tokens.css`
- Create: `src/assets/fonts/OpenSans-VariableFont_wdth_wght.ttf`
- Create: `src/assets/fonts/OpenSans-Italic-VariableFont_wdth_wght.ttf`
- Create: `src/assets/logo.svg`

- [ ] **Step 1: Copy fonts and logo into src/assets**

```bash
mkdir -p src/assets/fonts
cp design_handoff_widget_admin/fonts/OpenSans-VariableFont_wdth_wght.ttf src/assets/fonts/
cp design_handoff_widget_admin/fonts/OpenSans-Italic-VariableFont_wdth_wght.ttf src/assets/fonts/
cp design_handoff_widget_admin/assets/logo.svg src/assets/logo.svg
```

- [ ] **Step 2: Create src/tokens.css**

Copy `design_handoff_widget_admin/tokens.css` to `src/tokens.css`, then update the `@font-face` `url(...)` paths so they resolve from `src/`:

```css
@font-face {
  font-family: "Open Sans";
  src: url("./assets/fonts/OpenSans-VariableFont_wdth_wght.ttf") format("truetype-variations"),
       url("./assets/fonts/OpenSans-VariableFont_wdth_wght.ttf") format("truetype");
  font-weight: 300 800;
  font-stretch: 75% 125%;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Open Sans";
  src: url("./assets/fonts/OpenSans-Italic-VariableFont_wdth_wght.ttf") format("truetype-variations"),
       url("./assets/fonts/OpenSans-Italic-VariableFont_wdth_wght.ttf") format("truetype");
  font-weight: 300 800;
  font-stretch: 75% 125%;
  font-style: italic;
  font-display: swap;
}

:root {
  /* ---------- COLOUR: brand ---------- */
  --color-brand-primary:     #432975;
  --color-brand-secondary:   #7E65AE;
  --color-brand-light:       #ECE2FF;
  --color-brand-text-light:  #8764C9;

  /* ---------- COLOUR: neutrals ---------- */
  --color-bg-page:           #FBFAF9;
  --color-bg-surface:        #FFFFFF;
  --color-bg-nav-active:     #F7F7F7;
  --color-border:            #E7E5E4;

  --color-text-primary:      #424242;
  --color-text-secondary:    #666666;
  --color-text-tertiary:     #999999;
  --color-text-on-dark:      #FFFFFF;

  --color-tooltip-bg:        #222222;

  /* ---------- COLOUR: state ---------- */
  --color-success:           #10B981;
  --color-success-bg:        #ECFDF5;
  --color-success-border:    #BBF7D0;
  --color-success-text:      #1F5135;
  --color-warning:           #F59E0B;
  --color-error:             #EF4444;
  --color-error-bg:          #FEF2F2;
  --color-error-border:      #FECACA;
  --color-error-text:        #991B1B;

  /* ---------- TYPE ---------- */
  --font-family:             "Open Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-family-mono:        "SF Mono", Menlo, Consolas, monospace;

  --font-size-xs:            10px;
  --font-size-sm:            12px;
  --font-size-base:          13px;
  --font-size-md:            14px;
  --font-size-lg:            15px;
  --font-size-xl:            20px;

  --font-weight-regular:     400;
  --font-weight-medium:      500;
  --font-weight-semibold:    600;
  --font-weight-bold:        700;

  --line-height-h1:          30px;

  /* ---------- RADIUS ---------- */
  --radius-none:             0px;
  --radius-xs:               2px;
  --radius-sm:               4px;
  --radius-md:               6px;
  --radius-lg:               12px;
  --radius-full:             9999px;

  /* ---------- SHADOW ---------- */
  --shadow-none:             none;
  --shadow-card:             0 4px 8px rgba(51,51,51,0.10), 0 0 1px rgba(51,51,51,0.30);
  --shadow-segmented:        0 2px 6px rgba(0,0,0,0.04);
  --shadow-modal:            0 12px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);

  /* ---------- SPACING ---------- */
  --space-1:                 4px;
  --space-2:                 8px;
  --space-3:                 12px;
  --space-4:                 16px;
  --space-6:                 24px;
}

/* ===== Global resets ===== */

* { box-sizing: border-box; }

html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
}

html, body {
  font-family: var(--font-family);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  background: var(--color-bg-page);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button, input, select, textarea {
  font-family: inherit;
  color: inherit;
}

button { cursor: pointer; border: none; background: none; padding: 0; }

code {
  font-family: var(--font-family-mono);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}
```

The state-color tokens (`--color-success-bg`, `--color-error-text`, etc.) and the mono-font / shadow-segmented / shadow-modal tokens are additions on top of the design's `tokens.css` — they're used downstream by the API status banner, the publish dialog, and the device toggle.

- [ ] **Step 3: Import tokens globally**

Modify `src/main.jsx`. Add this import at the top, after the React imports:

```jsx
import './tokens.css';
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Don't sign in yet. Open DevTools → Elements → `<body>`. Confirm:
- `getComputedStyle($0).fontFamily` includes `"Open Sans"`.
- `getComputedStyle($0).backgroundColor` is `rgb(251, 250, 249)` (= `#FBFAF9`).

The page may look broken (the existing `App.module.css` still has its old tokens loaded). That's expected — we'll remove it later. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/tokens.css src/assets/
git commit -m "feat(tokens): drop in D-EDGE design tokens, Open Sans fonts, and logo"
```

---

## Phase 2 — Form primitives

Each primitive is a `.jsx` + `.module.css` pair under `src/components/forms/`. Tasks are ordered so each only depends on what came before. They don't need to be wired into the live app yet — that happens in Phase 5.

### Task 2: Field

**Files:**
- Create: `src/components/forms/Field.jsx`
- Create: `src/components/forms/Field.module.css`

- [ ] **Step 1: Create Field.module.css**

```css
.field {
  display: block;
  margin-bottom: var(--space-4);
}

.label {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.optional {
  font-size: 11px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-tertiary);
}

.hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.45;
  margin-top: 6px;
}

.hint code {
  background: #F2EFEC;
  padding: 0 4px;
  border-radius: var(--radius-xs);
  font-size: 12px;
  color: var(--color-text-primary);
}
```

- [ ] **Step 2: Create Field.jsx**

```jsx
import styles from './Field.module.css';

export default function Field({ label, hint, htmlFor, optional, children }) {
  return (
    <label htmlFor={htmlFor} className={styles.field}>
      <span className={styles.label}>
        {label}
        {optional && <span className={styles.optional}>optional</span>}
      </span>
      {children}
      {hint && <div className={styles.hint}>{hint}</div>}
    </label>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/Field.jsx src/components/forms/Field.module.css
git commit -m "feat(forms): add Field primitive (label + optional tag + hint)"
```

### Task 3: TextInput

**Files:**
- Create: `src/components/forms/TextInput.jsx`
- Create: `src/components/forms/TextInput.module.css`

- [ ] **Step 1: Create TextInput.module.css**

```css
.wrap {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  overflow: hidden;
  transition: border-color 120ms, box-shadow 120ms;
}

.wrap.disabled {
  background: var(--color-bg-page);
}

.wrap:focus-within {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 1px var(--color-brand-primary);
}

.prefix {
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  background: var(--color-bg-page);
  border-right: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.input {
  flex: 1;
  height: 38px;
  padding: 0 12px;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  min-width: 0;
}

.input.disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.mono {
  font-family: var(--font-family-mono);
  font-feature-settings: "tnum";
  letter-spacing: 0.01em;
  font-size: var(--font-size-base);
}
```

- [ ] **Step 2: Create TextInput.jsx**

```jsx
import styles from './TextInput.module.css';

export default function TextInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  monospace = false,
  prefix,
  type = 'text',
}) {
  const wrapClass = [styles.wrap, disabled && styles.disabled]
    .filter(Boolean)
    .join(' ');
  const inputClass = [
    styles.input,
    disabled && styles.disabled,
    monospace && styles.mono,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapClass}>
      {prefix && <span className={styles.prefix}>{prefix}</span>}
      <input
        type={type}
        className={inputClass}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/TextInput.jsx src/components/forms/TextInput.module.css
git commit -m "feat(forms): add TextInput primitive with prefix, monospace, disabled states"
```

### Task 4: Select

**Files:**
- Create: `src/components/forms/Select.jsx`
- Create: `src/components/forms/Select.module.css`

- [ ] **Step 1: Create Select.module.css**

```css
.wrap {
  position: relative;
}

.select {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  height: 38px;
  padding: 0 36px 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  cursor: pointer;
  outline: none;
  transition: border-color 120ms, box-shadow 120ms;
}

.select:focus {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 1px var(--color-brand-primary);
}

.chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
```

- [ ] **Step 2: Create Select.jsx**

```jsx
import styles from './Select.module.css';

export default function Select({ value, onChange, options }) {
  return (
    <div className={styles.wrap}>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className={styles.chevron}
        width="10"
        height="6"
        viewBox="0 0 10 6"
        aria-hidden="true"
      >
        <path
          d="M1 1L5 5L9 1"
          stroke="#666"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/Select.jsx src/components/forms/Select.module.css
git commit -m "feat(forms): add Select primitive with custom chevron"
```

### Task 5: ColorInput

**Files:**
- Create: `src/components/forms/ColorInput.jsx`
- Create: `src/components/forms/ColorInput.module.css`

- [ ] **Step 1: Create ColorInput.module.css**

```css
.wrap {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-surface);
}

.swatch {
  width: 56px;
  position: relative;
  cursor: pointer;
  border-right: 1px solid var(--color-border);
}

.swatchPicker {
  opacity: 0;
  position: absolute;
  inset: 0;
  cursor: pointer;
  border: none;
  background: transparent;
}

.hex {
  flex: 1;
  height: 38px;
  padding: 0 12px;
  border: none;
  outline: none;
  background: var(--color-bg-surface);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  min-width: 0;
}

.presets {
  display: flex;
  gap: 6px;
  margin-top: var(--space-2);
}

.preset {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  cursor: pointer;
  padding: 0;
}

.preset.active {
  border: 2px solid var(--color-brand-primary);
}
```

- [ ] **Step 2: Create ColorInput.jsx**

```jsx
import styles from './ColorInput.module.css';

export default function ColorInput({ value, onChange, presets = [] }) {
  const safeValue = value || '#000000';
  return (
    <div>
      <div className={styles.wrap}>
        <label
          className={styles.swatch}
          style={{ background: safeValue }}
          aria-label="Pick a color"
        >
          <input
            type="color"
            className={styles.swatchPicker}
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <input
          type="text"
          className={styles.hex}
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {presets.length > 0 && (
        <div className={styles.presets}>
          {presets.map((p) => {
            const active = safeValue.toLowerCase() === p.toLowerCase();
            return (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                className={`${styles.preset} ${active ? styles.active : ''}`}
                style={{ background: p }}
                title={p}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/ColorInput.jsx src/components/forms/ColorInput.module.css
git commit -m "feat(forms): add ColorInput primitive (swatch + hex + presets)"
```

### Task 6: Toggle

**Files:**
- Create: `src/components/forms/Toggle.jsx`
- Create: `src/components/forms/Toggle.module.css`

- [ ] **Step 1: Create Toggle.module.css**

```css
.row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.pill {
  width: 36px;
  height: 20px;
  border-radius: var(--radius-full);
  background: #D7D3D0;
  border: none;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  transition: background 120ms;
  padding: 0;
}

.pill.on {
  background: var(--color-brand-primary);
}

.knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: left 120ms;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.pill.on .knob {
  left: 18px;
}

.body { display: flex; flex-direction: column; }

.label {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: 2px;
  line-height: 1.4;
}
```

- [ ] **Step 2: Create Toggle.jsx**

```jsx
import styles from './Toggle.module.css';

export default function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className={styles.row}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`${styles.pill} ${checked ? styles.on : ''}`}
      >
        <span className={styles.knob} />
      </button>
      <div className={styles.body}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/Toggle.jsx src/components/forms/Toggle.module.css
git commit -m "feat(forms): add Toggle primitive"
```

### Task 7: Checkbox

**Files:**
- Create: `src/components/forms/Checkbox.jsx`
- Create: `src/components/forms/Checkbox.module.css`

- [ ] **Step 1: Create Checkbox.module.css**

```css
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: var(--space-2) 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  background: transparent;
  transition: background 120ms;
}

.row:hover {
  background: var(--color-bg-nav-active);
}

.row.checked,
.row.checked:hover {
  background: #F7F4FB;
}

.native {
  display: none;
}

.box {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background: var(--color-bg-surface);
  border: 1px solid #C9C5C2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.box.checked {
  background: var(--color-brand-primary);
  border-color: var(--color-brand-primary);
}

.label {
  flex: 1;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.suffix {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  margin-left: auto;
}
```

- [ ] **Step 2: Create Checkbox.jsx**

```jsx
import styles from './Checkbox.module.css';

export default function Checkbox({ checked, onChange, label, suffix }) {
  return (
    <label className={`${styles.row} ${checked ? styles.checked : ''}`}>
      <input
        type="checkbox"
        className={styles.native}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={`${styles.box} ${checked ? styles.checked : ''}`}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" aria-hidden="true">
            <path
              d="M1 4L4 7L9 1"
              stroke="#fff"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className={styles.label}>{label}</span>
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </label>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/Checkbox.jsx src/components/forms/Checkbox.module.css
git commit -m "feat(forms): add Checkbox primitive with hover and checked states"
```

---

## Phase 3 — Admin shell components

These build on the form primitives but are otherwise independent of each other. The order below moves from leaves (Logo) to composition (`AdminLayout`, last).

### Task 8: DEdgeLogo

**Files:**
- Create: `src/admin/DEdgeLogo.jsx`

- [ ] **Step 1: Create DEdgeLogo.jsx**

```jsx
import logoUrl from '../assets/logo.svg';

export default function DEdgeLogo({ height = 20 }) {
  return (
    <img
      src={logoUrl}
      alt="D-EDGE"
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/DEdgeLogo.jsx
git commit -m "feat(admin): add DEdgeLogo component"
```

### Task 9: PanelHeader

**Files:**
- Create: `src/admin/PanelHeader.jsx`
- Create: `src/admin/PanelHeader.module.css`

- [ ] **Step 1: Create PanelHeader.module.css**

```css
.wrap { margin-bottom: var(--space-6); }

.title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: 1.2;
}

.subtitle {
  margin: 6px 0 0;
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.subtitle code {
  background: #F2EFEC;
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}
```

- [ ] **Step 2: Create PanelHeader.jsx**

```jsx
import styles from './PanelHeader.module.css';

export default function PanelHeader({ title, subtitle }) {
  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/PanelHeader.jsx src/admin/PanelHeader.module.css
git commit -m "feat(admin): add PanelHeader component"
```

### Task 10: GroupCard

**Files:**
- Create: `src/admin/GroupCard.jsx`
- Create: `src/admin/GroupCard.module.css`

- [ ] **Step 1: Create GroupCard.module.css**

```css
.card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: var(--space-4);
}

.card.last { margin-bottom: 0; }

.header {
  margin-bottom: 14px;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.headerText { flex: 1; min-width: 0; }

.title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: 2px;
  line-height: 1.45;
}
```

- [ ] **Step 2: Create GroupCard.jsx**

```jsx
import styles from './GroupCard.module.css';

export default function GroupCard({ title, hint, action, children, last }) {
  return (
    <section className={`${styles.card} ${last ? styles.last : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.title}>{title}</div>
          {hint && <div className={styles.hint}>{hint}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/GroupCard.jsx src/admin/GroupCard.module.css
git commit -m "feat(admin): add GroupCard component with optional action slot"
```

### Task 11: UnpublishedPill

**Files:**
- Create: `src/admin/UnpublishedPill.jsx`
- Create: `src/admin/UnpublishedPill.module.css`

- [ ] **Step 1: Create UnpublishedPill.module.css**

```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-warning);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.13);
  flex-shrink: 0;
}

.label { font-weight: var(--font-weight-medium); }

.suffix {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}
```

- [ ] **Step 2: Create UnpublishedPill.jsx**

```jsx
import styles from './UnpublishedPill.module.css';

export default function UnpublishedPill({ count }) {
  if (!count) return null;
  return (
    <div className={styles.pill}>
      <span className={styles.dot} />
      <span className={styles.label}>Unpublished changes</span>
      <span className={styles.suffix}>· {count} field{count === 1 ? '' : 's'}</span>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/UnpublishedPill.jsx src/admin/UnpublishedPill.module.css
git commit -m "feat(admin): add UnpublishedPill (replaces would-be save status pill)"
```

### Task 12: TopChrome

**Files:**
- Create: `src/admin/TopChrome.jsx`
- Create: `src/admin/TopChrome.module.css`

- [ ] **Step 1: Create TopChrome.module.css**

```css
.bar {
  height: 56px;
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
  gap: var(--space-4);
  flex-shrink: 0;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin-left: var(--space-2);
}

.crumb {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 120ms;
}
.crumb:hover { color: var(--color-text-primary); }

.sep {
  color: #C9C5C2;
}

.title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.badge {
  margin-left: var(--space-1);
  padding: 2px 8px;
  background: var(--color-brand-light);
  color: var(--color-brand-text-light);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  border-radius: var(--radius-xs);
  text-transform: uppercase;
  font-family: var(--font-family);
}

.right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.outlineBtn {
  background: transparent;
  border: 1px solid var(--color-brand-primary);
  color: var(--color-brand-primary);
  padding: 7px 14px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: background 120ms;
}
.outlineBtn:hover:not(:disabled) {
  background: rgba(67, 41, 117, 0.06);
}
.outlineBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primaryBtn {
  background: var(--color-brand-primary);
  border: none;
  color: var(--color-text-on-dark);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: background 120ms;
}
.primaryBtn:hover:not(:disabled) {
  background: #372062;
}
.primaryBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 2: Create TopChrome.jsx**

```jsx
import DEdgeLogo from './DEdgeLogo.jsx';
import UnpublishedPill from './UnpublishedPill.jsx';
import styles from './TopChrome.module.css';

export default function TopChrome({
  hotelId,
  hotelName,
  onBackToHotels,
  unpublishedCount,
  onPreviewLive,
  onPublish,
  canAct,
}) {
  return (
    <header className={styles.bar}>
      <DEdgeLogo height={20} />
      <span className={styles.divider} />
      <button type="button" className={styles.crumb} onClick={onBackToHotels}>
        Hotels
      </button>
      <span className={styles.sep}>›</span>
      <h1 className={styles.title}>{hotelName || 'New configuration'}</h1>
      {hotelId && <span className={styles.badge}>{hotelId}</span>}

      <div className={styles.right}>
        <UnpublishedPill count={unpublishedCount} />
        <button
          type="button"
          className={styles.outlineBtn}
          onClick={onPreviewLive}
          disabled={!canAct}
        >
          Preview live
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onPublish}
          disabled={!canAct}
        >
          Publish
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/TopChrome.jsx src/admin/TopChrome.module.css
git commit -m "feat(admin): add TopChrome (logo + breadcrumb + badge + actions)"
```

### Task 13: TabBar

**Files:**
- Create: `src/admin/TabBar.jsx`
- Create: `src/admin/TabBar.module.css`

- [ ] **Step 1: Create TabBar.module.css**

```css
.bar {
  height: 48px;
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: stretch;
  padding: 0 var(--space-6);
  gap: var(--space-1);
  flex-shrink: 0;
}

.tab {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-md);
  padding: 0 var(--space-4);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 120ms, border-color 120ms;
}

.tab:hover { color: var(--color-text-primary); }

.tab.active {
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-semibold);
  border-bottom-color: var(--color-brand-primary);
}
```

- [ ] **Step 2: Create TabBar.jsx**

```jsx
import { TABS } from '../constants.js';
import styles from './TabBar.module.css';

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className={styles.bar}>
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`${styles.tab} ${activeTab === t.key ? styles.active : ''}`}
          onClick={() => onTabChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/TabBar.jsx src/admin/TabBar.module.css
git commit -m "feat(admin): add TabBar component"
```

### Task 14: BrowserChrome

**Files:**
- Create: `src/admin/BrowserChrome.jsx`
- Create: `src/admin/BrowserChrome.module.css`

- [ ] **Step 1: Create BrowserChrome.module.css**

```css
.card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.bar {
  height: 36px;
  background: #F2EFEC;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-3);
  gap: var(--space-2);
  flex-shrink: 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.url {
  margin-left: var(--space-2);
  flex: 1;
  height: 22px;
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.body {
  flex: 1;
  position: relative;
  min-height: 0;
}
```

- [ ] **Step 2: Create BrowserChrome.jsx**

```jsx
import styles from './BrowserChrome.module.css';

export default function BrowserChrome({ url, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.bar}>
        <span className={styles.dot} style={{ background: '#FF5F57' }} />
        <span className={styles.dot} style={{ background: '#FEBC2E' }} />
        <span className={styles.dot} style={{ background: '#28C840' }} />
        <div className={styles.url}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {url}
        </div>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/BrowserChrome.jsx src/admin/BrowserChrome.module.css
git commit -m "feat(admin): add BrowserChrome component (traffic-light dots + URL pill)"
```

### Task 15: DeviceToggle

**Files:**
- Create: `src/admin/DeviceToggle.jsx`
- Create: `src/admin/DeviceToggle.module.css`

- [ ] **Step 1: Create DeviceToggle.module.css**

```css
.wrap {
  display: inline-flex;
  padding: var(--space-1);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  gap: 2px;
  box-shadow: var(--shadow-segmented);
}

.btn {
  padding: 6px 18px;
  border-radius: var(--radius-full);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  text-transform: capitalize;
  transition: background 120ms, color 120ms;
}

.btn.active {
  background: var(--color-brand-primary);
  color: var(--color-text-on-dark);
}
```

- [ ] **Step 2: Create DeviceToggle.jsx**

```jsx
import styles from './DeviceToggle.module.css';

export default function DeviceToggle({ device, onChange }) {
  return (
    <div className={styles.wrap}>
      {['desktop', 'mobile'].map((d) => (
        <button
          key={d}
          type="button"
          className={`${styles.btn} ${device === d ? styles.active : ''}`}
          onClick={() => onChange(d)}
        >
          {d}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/DeviceToggle.jsx src/admin/DeviceToggle.module.css
git commit -m "feat(admin): add DeviceToggle (segmented control)"
```

---

## Phase 4 — Hook + assembly

### Task 16: useUnpublishedDiff hook

**Files:**
- Create: `src/hooks/useUnpublishedDiff.js`

The existing `src/diff.js` works on `config` shapes (post-`buildConfig`). For the pill we want changed *form* keys (so the labels match field names the user sees). We'll do a simple shallow + array compare on the form object directly — no need to invoke the deeper `diff.js` that's already used by `PublishConfirmDialog`.

- [ ] **Step 1: Create useUnpublishedDiff.js**

```js
import { useMemo } from 'react';

const FIELD_LABELS = {
  hotelId: 'Hotel ID',
  hotelName: 'Hotel name',
  hotelDomain: 'Client domain',
  logoUrl: 'Logo URL',
  apiHotelId: 'API Hotel ID',
  apiCompetitorId: 'Competitor ID',
  channelsEnabled: 'Channels',
  reserveUrl: 'Reserve URL',
  currency: 'Currency',
  position: 'Position on screen',
  size: 'Widget size',
  brandColor: 'Brand color',
  backgroundColor: 'Background color',
  enabledLocales: 'Enabled languages',
  defaultLocale: 'Default language',
  autoOpenMode: 'Auto-open trigger',
  autoOpenDelay: 'Delay before opening',
  autoOpenScrollPercent: 'Scroll threshold',
  analyticsEnabled: 'Analytics enabled',
  dataLayerName: 'DataLayer variable',
};

function shallowEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const sa = [...a].sort();
    const sb = [...b].sort();
    return sa.every((v, i) => v === sb[i]);
  }
  return false;
}

function humanize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

export default function useUnpublishedDiff(form, snapshot) {
  return useMemo(() => {
    if (!snapshot) {
      // Create mode: any non-empty hotelId means dirty.
      const dirty = Boolean(form?.hotelId);
      return {
        isDirty: dirty,
        changedFields: dirty ? ['Hotel ID'] : [],
      };
    }
    const changed = [];
    for (const key of Object.keys(form)) {
      if (!shallowEqual(form[key], snapshot[key])) {
        changed.push(FIELD_LABELS[key] || humanize(key));
      }
    }
    return {
      isDirty: changed.length > 0,
      changedFields: changed,
    };
  }, [form, snapshot]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useUnpublishedDiff.js
git commit -m "feat(hooks): add useUnpublishedDiff for the unpublished-changes indicator"
```

### Task 17: PreviewPane

**Files:**
- Create: `src/admin/PreviewPane.jsx`
- Create: `src/admin/PreviewPane.module.css`

This is the biggest "lift and shift" — the entire `PreviewFrame` component logic from `src/App.jsx:474-606` moves here unchanged, only reskinned.

- [ ] **Step 1: Create PreviewPane.module.css**

```css
.wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  height: 100%;
  padding: var(--space-6);
  min-height: 0;
}

.frame {
  flex: 1;
  min-height: 0;
}

.toggleRow {
  display: flex;
  justify-content: center;
}

.demoBackdrop {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%);
  background-image:
    radial-gradient(circle at 20% 30%, rgba(67, 41, 117, 0.04) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.04) 0%, transparent 40%);
}
```

- [ ] **Step 2: Create PreviewPane.jsx**

```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { isValidPublicDomain } from '../utils.js';
import BrowserChrome from './BrowserChrome.jsx';
import DeviceToggle from './DeviceToggle.jsx';
import styles from './PreviewPane.module.css';

export default function PreviewPane({
  previewUrl,
  viewport,
  device,
  setDevice,
  clientDomain,
}) {
  const wrapRef = useRef(null);
  const [available, setAvailable] = useState({ w: 800, h: 600 });
  const [screenshotFailed, setScreenshotFailed] = useState(false);

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setAvailable({
        w: Math.max(320, rect.width - 40),
        h: Math.max(400, rect.height - 80),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const clientUrl = useMemo(() => {
    if (!isValidPublicDomain(clientDomain)) return null;
    const d = clientDomain.trim();
    if (d.startsWith('http://') || d.startsWith('https://')) return d;
    return `https://${d}`;
  }, [clientDomain]);

  useEffect(() => {
    setScreenshotFailed(false);
  }, [clientUrl]);

  const screenshotUrl = useMemo(() => {
    if (!clientUrl || screenshotFailed) return null;
    return `https://image.thum.io/get/width/${viewport.w}/crop/${viewport.h}/${clientUrl}`;
  }, [clientUrl, screenshotFailed, viewport.w, viewport.h]);

  const useScreenshot = screenshotUrl !== null;

  const maxWidth = device === 'desktop' ? available.w : Math.min(320, available.w);
  const maxHeight = available.h;
  const scale = Math.min(maxWidth / viewport.w, maxHeight / viewport.h, 1);
  const displayW = viewport.w * scale;
  const displayH = viewport.h * scale;

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <div className={styles.frame} style={{ width: '100%', height: '100%' }}>
        <BrowserChrome url={useScreenshot ? clientUrl : 'demo.hotel-widget.app'}>
          <div style={{ width: displayW, height: displayH, position: 'relative', margin: '0 auto' }}>
            {useScreenshot ? (
              <img
                key={screenshotUrl}
                src={screenshotUrl}
                alt="Client website preview"
                onError={() => setScreenshotFailed(true)}
                style={{
                  width: viewport.w,
                  height: viewport.h,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  inset: 0,
                  objectFit: 'cover',
                  background: '#fff',
                }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.demoBackdrop} />
            )}
            <iframe
              key={previewUrl}
              src={previewUrl}
              title="Widget preview"
              style={{
                width: viewport.w,
                height: viewport.h,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                border: 0,
                position: 'absolute',
                inset: 0,
                background: 'transparent',
              }}
              allowTransparency="true"
            />
          </div>
        </BrowserChrome>
      </div>

      <div className={styles.toggleRow}>
        <DeviceToggle device={device} onChange={setDevice} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/PreviewPane.jsx src/admin/PreviewPane.module.css
git commit -m "feat(admin): add PreviewPane (wraps BrowserChrome + screenshot/iframe stack + DeviceToggle)"
```

### Task 18: AdminLayout

**Files:**
- Create: `src/admin/AdminLayout.jsx`
- Create: `src/admin/AdminLayout.module.css`

- [ ] **Step 1: Create AdminLayout.module.css**

```css
.shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}

.main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 460px;
  min-height: 0;
}

.preview {
  min-height: 0;
  overflow: hidden;
}

.aside {
  background: var(--color-bg-surface);
  border-left: 1px solid var(--color-border);
  overflow: auto;
  padding: var(--space-6) var(--space-6) 40px;
}
```

- [ ] **Step 2: Create AdminLayout.jsx**

```jsx
import TopChrome from './TopChrome.jsx';
import TabBar from './TabBar.jsx';
import PreviewPane from './PreviewPane.jsx';
import styles from './AdminLayout.module.css';

export default function AdminLayout({
  hotelId,
  hotelName,
  onBackToHotels,
  unpublishedCount,
  canAct,
  onPreviewLive,
  onPublish,
  activeTab,
  onTabChange,
  preview,
  children,
}) {
  return (
    <div className={styles.shell}>
      <TopChrome
        hotelId={hotelId}
        hotelName={hotelName}
        onBackToHotels={onBackToHotels}
        unpublishedCount={unpublishedCount}
        canAct={canAct}
        onPreviewLive={onPreviewLive}
        onPublish={onPublish}
      />
      <TabBar activeTab={activeTab} onTabChange={onTabChange} />
      <div className={styles.main}>
        <div className={styles.preview}>
          <PreviewPane {...preview} />
        </div>
        <aside className={styles.aside}>{children}</aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/AdminLayout.jsx src/admin/AdminLayout.module.css
git commit -m "feat(admin): add AdminLayout shell composing TopChrome + TabBar + grid"
```

---

## Phase 5 — Tab panels

Each tab is a function component that takes `{ form, updateField, ...extras }` and renders `<PanelHeader>` + `<GroupCard>`s. They're written first as standalone components; Phase 7 wires them into `ConfigForm`.

### Task 19: IdentityTab

**Files:**
- Create: `src/tabs/IdentityTab.jsx`

(no CSS module — uses primitives only.)

- [ ] **Step 1: Create IdentityTab.jsx**

```jsx
import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';

export default function IdentityTab({ form, updateField, isEditMode }) {
  return (
    <>
      <PanelHeader
        title="Identity"
        subtitle="Basic information about the hotel and how to identify it."
      />

      <GroupCard
        title="Identification"
        hint="Used internally and to fetch the right config."
      >
        <Field
          label="Hotel ID"
          hint={
            isEditMode
              ? 'Locked in edit mode. To change the ID, duplicate this configuration instead.'
              : 'Unique identifier used to fetch the config. Lowercase, alphanumeric, dashes and underscores only.'
          }
        >
          <TextInput
            value={form.hotelId}
            onChange={(v) => updateField('hotelId', v)}
            placeholder="e.g. hm_myhotel_paris"
            disabled={isEditMode}
            monospace
          />
        </Field>

        <Field label="Hotel name">
          <TextInput
            value={form.hotelName}
            onChange={(v) => updateField('hotelName', v)}
          />
        </Field>
      </GroupCard>

      <GroupCard
        title="Web presence"
        hint="Where the widget will be embedded."
        last
      >
        <Field
          label="Client domain"
          hint="Used to fetch a screenshot of the hotel's homepage as the preview backdrop. Falls back to a neutral demo if empty or invalid."
        >
          <TextInput
            value={form.hotelDomain}
            onChange={(v) => updateField('hotelDomain', v)}
            placeholder="hotel-client.com"
            prefix="https://"
          />
        </Field>

        <Field
          label="Logo URL"
          optional
          hint="If provided, shown in the widget header instead of the hotel name."
        >
          <TextInput
            value={form.logoUrl}
            onChange={(v) => updateField('logoUrl', v)}
            placeholder="https://..."
          />
        </Field>
      </GroupCard>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tabs/IdentityTab.jsx
git commit -m "feat(tabs): add IdentityTab using new primitives"
```

### Task 20: AppearanceTab

**Files:**
- Create: `src/tabs/AppearanceTab.jsx`

- [ ] **Step 1: Create AppearanceTab.jsx**

```jsx
import {
  POSITIONS,
  SIZES,
  AUTO_OPEN_MODES,
  AUTO_OPEN_DELAYS,
  SCROLL_THRESHOLDS,
} from '../constants.js';
import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import Select from '../components/forms/Select.jsx';
import ColorInput from '../components/forms/ColorInput.jsx';

const BRAND_PRESETS = ['#8B5A3C', '#1F5135', '#3E2D5A', '#B43A2A', '#1A1A1A'];
const BG_PRESETS = ['#FAF7F2', '#FFFFFF', '#F4EFE8', '#1A1A1A', '#F0E9DD'];

export default function AppearanceTab({ form, updateField }) {
  return (
    <>
      <PanelHeader
        title="Appearance"
        subtitle="Colors, position, and opening behaviour."
      />

      <GroupCard
        title="Colors"
        hint="Match the hotel's brand. Apply live to the preview."
      >
        <Field label="Brand color" hint="Buttons and accents.">
          <ColorInput
            value={form.brandColor}
            onChange={(v) => updateField('brandColor', v)}
            presets={BRAND_PRESETS}
          />
        </Field>
        <Field label="Background" hint="Widget panel fill.">
          <ColorInput
            value={form.backgroundColor}
            onChange={(v) => updateField('backgroundColor', v)}
            presets={BG_PRESETS}
          />
        </Field>
      </GroupCard>

      <GroupCard title="Placement">
        <Field label="Position on screen">
          <Select
            value={form.position}
            onChange={(v) => updateField('position', v)}
            options={POSITIONS}
          />
        </Field>
        <Field
          label="Widget size"
          hint="Overall scale of the widget. Small is discreet, large draws more attention."
        >
          <Select
            value={form.size}
            onChange={(v) => updateField('size', v)}
            options={SIZES}
          />
        </Field>
      </GroupCard>

      <GroupCard
        title="Auto-open behaviour"
        hint="When the widget opens itself for the first time in the session. Closing the widget suppresses auto-open for the rest of the session."
        last
      >
        <Field label="Auto-open trigger">
          <Select
            value={form.autoOpenMode}
            onChange={(v) => updateField('autoOpenMode', v)}
            options={AUTO_OPEN_MODES}
          />
        </Field>

        {(form.autoOpenMode === 'time' || form.autoOpenMode === 'time_or_scroll') && (
          <Field label="Delay before opening">
            <Select
              value={String(form.autoOpenDelay)}
              onChange={(v) => updateField('autoOpenDelay', parseInt(v, 10))}
              options={AUTO_OPEN_DELAYS.map((d) => ({
                value: String(d.value),
                label: d.label,
              }))}
            />
          </Field>
        )}

        {(form.autoOpenMode === 'scroll' || form.autoOpenMode === 'time_or_scroll') && (
          <Field label="Scroll threshold">
            <Select
              value={String(form.autoOpenScrollPercent)}
              onChange={(v) => updateField('autoOpenScrollPercent', parseInt(v, 10))}
              options={SCROLL_THRESHOLDS.map((t) => ({
                value: String(t.value),
                label: t.label,
              }))}
            />
          </Field>
        )}
      </GroupCard>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tabs/AppearanceTab.jsx
git commit -m "feat(tabs): add AppearanceTab with conditional delay/scroll fields"
```

### Task 21: LanguagesTab

**Files:**
- Create: `src/tabs/LanguagesTab.jsx`
- Create: `src/tabs/LanguagesTab.module.css`

- [ ] **Step 1: Create LanguagesTab.module.css**

```css
.localeGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}
```

- [ ] **Step 2: Create LanguagesTab.jsx**

```jsx
import { SUPPORTED_LOCALES } from '../constants.js';
import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import Select from '../components/forms/Select.jsx';
import Checkbox from '../components/forms/Checkbox.jsx';
import styles from './LanguagesTab.module.css';

export default function LanguagesTab({ form, updateField, toggleLocale }) {
  const enabled = form.enabledLocales || [];
  return (
    <>
      <PanelHeader
        title="Languages"
        subtitle="Which languages the widget offers, and which one it falls back to."
      />

      <GroupCard
        title="Enabled languages"
        hint={`${enabled.length} of ${SUPPORTED_LOCALES.length} languages enabled. The widget auto-detects the browser language.`}
      >
        <div className={styles.localeGrid}>
          {SUPPORTED_LOCALES.map((loc) => (
            <Checkbox
              key={loc.code}
              checked={enabled.includes(loc.code)}
              onChange={() => toggleLocale(loc.code)}
              label={loc.name}
              suffix={loc.code}
            />
          ))}
        </div>
      </GroupCard>

      <GroupCard
        title="Fallback"
        hint="Used when the browser language is not in the enabled list."
        last
      >
        <Field label="Default language">
          <Select
            value={form.defaultLocale}
            onChange={(v) => updateField('defaultLocale', v)}
            options={SUPPORTED_LOCALES.filter((l) => enabled.includes(l.code)).map(
              (l) => ({ value: l.code, label: l.name })
            )}
          />
        </Field>
      </GroupCard>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/tabs/LanguagesTab.jsx src/tabs/LanguagesTab.module.css
git commit -m "feat(tabs): add LanguagesTab with 2-column locale grid"
```

### Task 22: AnalyticsTab

**Files:**
- Create: `src/tabs/AnalyticsTab.jsx`
- Create: `src/tabs/AnalyticsTab.module.css`

- [ ] **Step 1: Create AnalyticsTab.module.css**

```css
.eventList {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.eventRow {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid #F2EFEC;
}

.eventRow:last-child {
  border-bottom: none;
}

.eventCode {
  font-size: var(--font-size-sm);
  color: var(--color-brand-primary);
  background: #F7F4FB;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
  font-family: var(--font-family-mono);
}

.eventDesc {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  flex: 1;
  padding-top: 2px;
}

.inlineCode {
  background: #F2EFEC;
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-mono);
  color: var(--color-text-primary);
}
```

- [ ] **Step 2: Create AnalyticsTab.jsx**

```jsx
import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';
import Toggle from '../components/forms/Toggle.jsx';
import styles from './AnalyticsTab.module.css';

const EVENTS = [
  { name: 'dedge_widget_opened',     desc: 'User opens the widget' },
  { name: 'dedge_widget_closed',     desc: 'User dismisses the widget' },
  { name: 'dedge_widget_viewed',     desc: 'Widget enters the viewport' },
  { name: 'dedge_widget_book_click', desc: 'User clicks the Book CTA' },
];

export default function AnalyticsTab({ form, updateField }) {
  return (
    <>
      <PanelHeader
        title="Analytics"
        subtitle={
          <>
            DataLayer events pushed when users interact with the widget. All events are prefixed{' '}
            <code className={styles.inlineCode}>dedge_widget_</code>.
          </>
        }
      />

      <GroupCard title="Tracking" hint="Connect to your existing analytics setup.">
        <Toggle
          checked={form.analyticsEnabled}
          onChange={(v) => updateField('analyticsEnabled', v)}
          label="Enable dataLayer push"
          hint="Disable if you don't use Google Tag Manager or a compatible setup."
        />
        {form.analyticsEnabled && (
          <Field
            label="DataLayer variable name"
            hint={
              <>
                Name of the global array. Default <code className={styles.inlineCode}>dataLayer</code> (GTM standard).
              </>
            }
          >
            <TextInput
              value={form.dataLayerName}
              onChange={(v) => updateField('dataLayerName', v)}
              monospace
            />
          </Field>
        )}
      </GroupCard>

      <GroupCard
        title="Events emitted"
        hint="The widget pushes these events when relevant. No configuration needed."
        last
      >
        <div className={styles.eventList}>
          {EVENTS.map((e) => (
            <div key={e.name} className={styles.eventRow}>
              <code className={styles.eventCode}>{e.name}</code>
              <span className={styles.eventDesc}>{e.desc}</span>
            </div>
          ))}
        </div>
      </GroupCard>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/tabs/AnalyticsTab.jsx src/tabs/AnalyticsTab.module.css
git commit -m "feat(tabs): add AnalyticsTab with toggle and event list"
```

### Task 23: PublishTab

**Files:**
- Create: `src/tabs/PublishTab.jsx`
- Create: `src/tabs/PublishTab.module.css`

- [ ] **Step 1: Create PublishTab.module.css**

```css
.statusPanel {
  padding: 12px 14px;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.dirty {
  background: var(--color-warning);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.13);
}

.dot.clean {
  background: var(--color-success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.13);
}

.statusBody { flex: 1; min-width: 0; }

.statusTitle {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.statusList {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.publishBtn {
  flex: 1;
  background: var(--color-brand-primary);
  border: none;
  color: var(--color-text-on-dark);
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  transition: background 120ms;
}
.publishBtn:hover:not(:disabled) { background: #372062; }
.publishBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.downloadBtn {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  transition: background 120ms;
}
.downloadBtn:hover { background: var(--color-bg-nav-active); }

.codeBlock {
  background: #1F1610;
  border-radius: var(--radius-md);
  padding: 14px;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: #E7E5E4;
  line-height: 1.55;
  position: relative;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.tagPunct  { color: #C9B79A; }
.attrName  { color: #A5C8A0; }
.attrValue { color: #FED7AA; }

.copyBtn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: #FBFAF9;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}
.copyBtn:hover { background: rgba(255,255,255,0.14); }

.errorPanel {
  margin-top: var(--space-3);
  padding: 10px 12px;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-error-text);
}

.errorPanel strong { display: block; margin-bottom: 2px; }

.hintBox {
  margin-top: var(--space-3);
  padding: 10px 12px;
  background: #FFF7E5;
  border: 1px solid #F5D58E;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: #6E4C0E;
}
```

- [ ] **Step 2: Create PublishTab.jsx**

```jsx
import GroupCard from '../admin/GroupCard.jsx';
import PanelHeader from '../admin/PanelHeader.jsx';
import styles from './PublishTab.module.css';

export default function PublishTab({
  hotelId,
  publishState,
  copied,
  onPublish,
  onDownload,
  onCopyEmbed,
  isDirty,
  changedFields,
}) {
  const canPublish = !!hotelId && hotelId.trim();

  return (
    <>
      <PanelHeader
        title="Publish"
        subtitle="Save the configuration so the widget can load it on the hotel website."
      />

      <GroupCard title="Status">
        <div className={styles.statusPanel}>
          <span className={`${styles.dot} ${isDirty ? styles.dirty : styles.clean}`} />
          <div className={styles.statusBody}>
            <div className={styles.statusTitle}>
              {isDirty
                ? `${changedFields.length} unpublished change${changedFields.length === 1 ? '' : 's'}`
                : 'All changes published'}
            </div>
            {isDirty && changedFields.length > 0 && (
              <div className={styles.statusList}>{changedFields.join(', ')}</div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.publishBtn}
            onClick={onPublish}
            disabled={publishState.status === 'publishing' || !canPublish}
          >
            {publishState.status === 'publishing' ? 'Publishing…' : 'Publish changes'}
          </button>
          <button type="button" className={styles.downloadBtn} onClick={onDownload}>
            Download JSON
          </button>
        </div>

        {!canPublish && (
          <div className={styles.hintBox}>
            Set a Hotel ID in the Identity tab before publishing.
          </div>
        )}

        {publishState.status === 'error' && (
          <div className={styles.errorPanel}>
            <strong>Publish failed</strong>
            {publishState.message}
          </div>
        )}
      </GroupCard>

      {canPublish && (
        <GroupCard
          title="Embed code"
          hint={
            <>
              Paste this just before the closing <code>&lt;/body&gt;</code> tag, or push it through GTM. The widget picks up the new config 1–2 minutes after publish.
            </>
          }
          last
        >
          <pre className={styles.codeBlock}>
            <span className={styles.tagPunct}>{'<script'}</span>
            {' '}
            <span className={styles.attrName}>async</span>
            {' '}
            <span className={styles.attrName}>src</span>
            <span className={styles.tagPunct}>=</span>
            <span className={styles.attrValue}>"https://vturlin.github.io/best-price-widget/widget.js?id={hotelId}"</span>
            <span className={styles.tagPunct}>{'></script>'}</span>
            <button type="button" className={styles.copyBtn} onClick={onCopyEmbed} aria-label="Copy embed code">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </pre>
        </GroupCard>
      )}
    </>
  );
}
```

The displayed snippet is rendered with syntax-tinted spans interpolating `hotelId` directly. The clipboard string lives in `ConfigForm.copyEmbedCode` (Task 30); both must stay in sync if the URL ever changes.

- [ ] **Step 3: Commit**

```bash
git add src/tabs/PublishTab.jsx src/tabs/PublishTab.module.css
git commit -m "feat(tabs): add PublishTab with status panel + dark embed code block"
```

### Task 24: DataTab

**Files:**
- Create: `src/tabs/DataTab.jsx`
- Create: `src/tabs/DataTab.module.css`

This one carries the most existing logic. The whole `handleTestApi` / `analyzeRatesResponse` / channel discovery / auto-fill block is preserved verbatim, only restyled.

- [ ] **Step 1: Create DataTab.module.css**

```css
.testBtn {
  background: transparent;
  border: 1px solid var(--color-brand-primary);
  color: var(--color-brand-primary);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  transition: background 120ms;
}
.testBtn:hover:not(:disabled) { background: rgba(67, 41, 117, 0.06); }
.testBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.banner {
  margin-top: var(--space-3);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  display: flex;
  gap: var(--space-2);
}

.bannerOk {
  background: var(--color-success-bg);
  border: 1px solid var(--color-success-border);
  color: var(--color-success-text);
}

.bannerOk .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  margin-top: 5px;
  flex-shrink: 0;
}

.bannerErr {
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  color: var(--color-error-text);
}

.bannerErr .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-error);
  margin-top: 5px;
  flex-shrink: 0;
}

.bannerTitle { font-weight: var(--font-weight-semibold); }
.bannerSub { margin-top: 2px; opacity: 0.85; }

.testing {
  margin-top: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-style: italic;
}

.detail {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border);
  font-size: var(--font-size-sm);
}

.detailSection { margin: var(--space-3) 0; }

.detailHeader {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
  margin: 0 0 6px;
}

.codeChip {
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--color-brand-primary);
  background: #F7F4FB;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.warnLine {
  color: #B45309;
  font-style: italic;
  font-size: var(--font-size-sm);
  margin: 4px 0;
}

.channelGroup { margin: var(--space-2) 0 var(--space-3); }

.channelGroupHeader {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin: 10px 0 6px;
  color: var(--color-text-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.channelCount {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-regular);
}

.roomList {
  list-style: none;
  margin: 0;
  padding: 8px 12px;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  max-height: 180px;
  overflow-y: auto;
}

.roomList li {
  padding: 3px 0;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.roomOccupancy {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-left: auto;
}

.directBadge {
  margin-left: 6px;
  padding: 1px 6px;
  background: var(--color-brand-light);
  color: var(--color-brand-text-light);
  font-size: 9px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  border-radius: var(--radius-xs);
  text-transform: uppercase;
  vertical-align: middle;
}

.emptyState {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-style: italic;
}

.inlineCode {
  background: #F2EFEC;
  padding: 0 4px;
  border-radius: var(--radius-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-family: var(--font-family-mono);
}
```

- [ ] **Step 2: Create DataTab.jsx**

```jsx
import { useState } from 'react';
import { API_CHANNELS } from '../constants.js';
import { analyzeRatesResponse } from '../utils.js';
import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';
import Select from '../components/forms/Select.jsx';
import Checkbox from '../components/forms/Checkbox.jsx';
import styles from './DataTab.module.css';

export default function DataTab({ form, updateField }) {
  const [testStatus, setTestStatus] = useState('idle');
  const [testError, setTestError] = useState('');
  const [apiAnalysis, setApiAnalysis] = useState(null);

  async function handleTestApi() {
    if (!form.apiHotelId) {
      setTestStatus('error');
      setTestError('Please enter an API Hotel ID first.');
      return;
    }
    setTestStatus('testing');
    setTestError('');
    setApiAnalysis(null);

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    try {
      const res = await fetch(
        `/api/rates/${encodeURIComponent(form.apiHotelId)}?year=${year}&month=${month}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      const analysis = analyzeRatesResponse(data);
      if (analysis.error) throw new Error(analysis.error);

      setApiAnalysis(analysis);
      setTestStatus('ok');

      if (analysis.detectedCompetitorId && !form.apiCompetitorId) {
        updateField('apiCompetitorId', String(analysis.detectedCompetitorId));
      }
      const currentEnabled = form.channelsEnabled || [];
      if (currentEnabled.length === 0 && analysis.availableChannels?.length) {
        updateField(
          'channelsEnabled',
          analysis.availableChannels.map((ch) => ch.id)
        );
      }
    } catch (err) {
      setTestStatus('error');
      setTestError(err.message);
    }
  }

  function toggleChannel(channelId) {
    const current = form.channelsEnabled || [];
    const enabled = current.includes(channelId)
      ? current.filter((c) => c !== channelId)
      : [...current, channelId];
    updateField('channelsEnabled', enabled);
  }

  return (
    <>
      <PanelHeader
        title="Data"
        subtitle="Rates are fetched live from the AvailPro RateScreener API."
      />

      <GroupCard
        title="API connection"
        hint="Identifiers provided by AvailPro for this property."
        action={
          <button
            type="button"
            className={styles.testBtn}
            onClick={handleTestApi}
            disabled={testStatus === 'testing' || !form.apiHotelId}
          >
            {testStatus === 'testing' ? 'Testing…' : 'Test connection'}
          </button>
        }
      >
        <Field label="API Hotel ID" hint="The unique hotel ID provided by AvailPro for this property.">
          <TextInput
            value={form.apiHotelId || ''}
            onChange={(v) => updateField('apiHotelId', v)}
            placeholder="e.g. 20917"
            monospace
          />
        </Field>

        <Field
          label="Competitor ID"
          hint={
            <>
              Auto-detected via <code className={styles.inlineCode}>myHotel: true</code>. Set manually only if detection fails.
            </>
          }
        >
          <TextInput
            value={form.apiCompetitorId || ''}
            onChange={(v) => updateField('apiCompetitorId', v)}
            placeholder="Auto-detected when you test the connection"
            monospace
          />
        </Field>

        {testStatus === 'testing' && <div className={styles.testing}>Testing…</div>}

        {testStatus === 'error' && (
          <div className={`${styles.banner} ${styles.bannerErr}`}>
            <span className={styles.dot} />
            <div>
              <div className={styles.bannerTitle}>Connection failed</div>
              <div className={styles.bannerSub}>{testError}</div>
            </div>
          </div>
        )}

        {testStatus === 'ok' && apiAnalysis && (
          <>
            <div className={`${styles.banner} ${styles.bannerOk}`}>
              <span className={styles.dot} />
              <div>
                <div className={styles.bannerTitle}>Connection OK</div>
                <div className={styles.bannerSub}>
                  Last screening:{' '}
                  {apiAnalysis.screeningDate
                    ? new Date(apiAnalysis.screeningDate).toLocaleString()
                    : 'n/a'}
                </div>
              </div>
            </div>

            <div className={styles.detail}>
              <div className={styles.detailSection}>
                <h4 className={styles.detailHeader}>Detected competitor (myHotel)</h4>
                {apiAnalysis.detectedCompetitorId ? (
                  <p>
                    <strong>{apiAnalysis.detectedCompetitorName}</strong>{' '}
                    <code className={styles.codeChip}>#{apiAnalysis.detectedCompetitorId}</code>
                  </p>
                ) : (
                  <p className={styles.warnLine}>
                    No <code className={styles.codeChip}>myHotel</code> flag. Please set the competitor ID manually.
                  </p>
                )}
              </div>

              <div className={styles.detailSection}>
                <h4 className={styles.detailHeader}>Rooms detected (informational)</h4>
                {Object.keys(apiAnalysis.roomsByChannel).length === 0 ? (
                  <p className={styles.warnLine}>
                    No rooms found. Check that the competitor ID is correct.
                  </p>
                ) : (
                  Object.entries(apiAnalysis.roomsByChannel).map(([chId, rooms]) => {
                    const meta = API_CHANNELS[chId];
                    return (
                      <div key={chId} className={styles.channelGroup}>
                        <h5 className={styles.channelGroupHeader}>
                          {meta?.name || `Channel ${chId}`}
                          <span className={styles.channelCount}>
                            {rooms.length} room{rooms.length !== 1 ? 's' : ''}
                          </span>
                        </h5>
                        <ul className={styles.roomList}>
                          {rooms.map((r) => (
                            <li key={r.roomCode}>
                              <code className={styles.codeChip}>{r.roomCode}</code>
                              <span>{r.roomName}</span>
                              {r.maxAdultOccupancy && (
                                <span className={styles.roomOccupancy}>
                                  max {r.maxAdultOccupancy} pax
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })
                )}
                <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Informational only. The widget shows the single cheapest price across all rooms and rate conditions.
                </p>
              </div>
            </div>
          </>
        )}
      </GroupCard>

      <GroupCard
        title="Channels to display"
        hint={
          apiAnalysis?.availableChannels?.length
            ? 'Only checked channels appear in the price comparison.'
            : 'Run "Test connection" to discover available channels for this hotel.'
        }
      >
        {apiAnalysis?.availableChannels?.length > 0 ? (
          <div>
            {apiAnalysis.availableChannels.map((ch) => {
              const preferred = API_CHANNELS[ch.id];
              const displayName = preferred?.name || ch.apiName;
              const isDirect = preferred?.isDirect || false;
              return (
                <Checkbox
                  key={ch.id}
                  checked={(form.channelsEnabled || []).includes(ch.id)}
                  onChange={() => toggleChannel(ch.id)}
                  label={
                    <span>
                      {displayName}
                      {isDirect && <span className={styles.directBadge}>direct</span>}
                    </span>
                  }
                  suffix={`${ch.roomCount} room${ch.roomCount !== 1 ? 's' : ''}`}
                />
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            No channels discovered yet. Channels detected by the rate shopper will appear here after you test the API connection.
          </div>
        )}
      </GroupCard>

      <GroupCard title="Booking link" last>
        <Field
          label="Reserve URL template"
          hint={
            <>
              Placeholders:{' '}
              <code className={styles.inlineCode}>{'{checkIn}'}</code>,{' '}
              <code className={styles.inlineCode}>{'{checkOut}'}</code>.
            </>
          }
        >
          <TextInput
            value={form.reserveUrl || ''}
            onChange={(v) => updateField('reserveUrl', v)}
            placeholder="https://book.hotel.com/?arrive={checkIn}&depart={checkOut}"
          />
        </Field>

        <Field label="Currency">
          <Select
            value={form.currency || 'EUR'}
            onChange={(v) => updateField('currency', v)}
            options={[
              { value: 'EUR', label: 'EUR €' },
              { value: 'USD', label: 'USD $' },
              { value: 'GBP', label: 'GBP £' },
              { value: 'CHF', label: 'CHF' },
            ]}
          />
        </Field>
      </GroupCard>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/tabs/DataTab.jsx src/tabs/DataTab.module.css
git commit -m "feat(tabs): add DataTab with full API test results panel"
```

---

## Phase 6 — Restyle moved components

These are existing components. We move them into their new folders, swap the styles to CSS Modules using the new tokens, and keep the JSX behavior intact.

### Task 25: Restyle PublishConfirmDialog

**Files:**
- Create: `src/admin/PublishConfirmDialog.jsx` (new location)
- Create: `src/admin/PublishConfirmDialog.module.css`
- Delete: `src/PublishConfirmDialog.jsx` (after wiring is complete in Task 30)

- [ ] **Step 1: Read the existing component to preserve behavior**

```bash
cat src/PublishConfirmDialog.jsx
```

Note its props (`hotelId`, `config`, `onConfirm`, `onCancel`, `isPublishing`), the diff list it renders (using `src/diff.js`), and the modal close behavior (Escape / backdrop click).

- [ ] **Step 2: Create src/admin/PublishConfirmDialog.module.css**

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(31, 22, 16, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 160ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.card {
  width: 100%;
  max-width: 640px;
  max-height: 85vh;
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-modal);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 200ms ease-out;
}

@keyframes slideIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.header {
  padding: 24px 28px 16px;
  border-bottom: 1px solid var(--color-border);
}

.title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 4px;
  color: var(--color-text-primary);
}

.subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0;
}

.body {
  padding: 20px 28px;
  overflow-y: auto;
  flex: 1;
}

.section { margin-bottom: 24px; }
.section:last-child { margin-bottom: 0; }

.sectionTitle {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px;
  color: var(--color-text-secondary);
}

.muted {
  font-size: var(--font-size-base);
  color: var(--color-text-tertiary);
  margin: 0;
  font-style: italic;
}

.summary {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px 16px;
  margin: 0;
  font-size: var(--font-size-base);
}

.summaryLabel {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.summaryValue {
  color: var(--color-text-primary);
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.mono {
  font-family: var(--font-family-mono);
  font-size: 12.5px;
  background: #F7F4FB;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  color: var(--color-brand-primary);
  display: inline-block;
}

.newBanner {
  padding: 14px 16px;
  background: #F7F4FB;
  border-left: 3px solid var(--color-brand-primary);
  border-radius: var(--radius-md);
}
.newBanner strong {
  display: block;
  color: var(--color-brand-primary);
  font-size: var(--font-size-base);
  margin-bottom: 2px;
}
.newBanner p {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}
.newBanner code {
  background: var(--color-bg-surface);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: var(--font-size-sm);
  color: var(--color-brand-primary);
  font-family: var(--font-family-mono);
}

.diffList {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.diffItem {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 10px 14px;
  font-size: 12.5px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-surface);
}
.diffItem:last-child { border-bottom: none; }

.diff_added    { background: var(--color-success-bg); }
.diff_removed  { background: var(--color-error-bg); }
.diff_modified { background: var(--color-bg-surface); }

.diffPath {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  min-width: 180px;
  flex-shrink: 0;
  word-break: break-word;
}

.diffValues {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.diffBefore {
  color: var(--color-error-text);
  text-decoration: line-through;
  font-family: var(--font-family-mono);
  word-break: break-all;
}

.diffAfter {
  color: var(--color-success-text);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-mono);
  word-break: break-all;
}

.diffArrow {
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-semibold);
}

.footer {
  padding: 16px 28px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-page);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancelBtn {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  transition: background 120ms;
}
.cancelBtn:hover { background: var(--color-bg-nav-active); }

.confirmBtn {
  padding: 10px 16px;
  background: var(--color-brand-primary);
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-on-dark);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  transition: background 120ms;
}
.confirmBtn:hover:not(:disabled) { background: #372062; }
.confirmBtn:disabled { opacity: 0.6; cursor: not-allowed; }
```

- [ ] **Step 3: Move + restyle PublishConfirmDialog.jsx**

Open `src/PublishConfirmDialog.jsx`, copy its contents into a new file `src/admin/PublishConfirmDialog.jsx`, and update:
- Import path for `diff.js`: `import { ... } from '../diff.js';` (one `..` instead of `./`).
- Replace each `className={styles.X}` from the old `App.module.css` with the matching name in the new module above. Class names match where possible; rename if the old code used unique class names not in the CSS above.
- Keep all behavior (Escape close, backdrop click close, isPublishing disabling) identical.

If the existing component uses class names not represented in the new module (e.g. some inline style that didn't survive), add the missing class to the CSS before importing.

- [ ] **Step 4: Commit**

```bash
git add src/admin/PublishConfirmDialog.jsx src/admin/PublishConfirmDialog.module.css
git commit -m "feat(admin): move and restyle PublishConfirmDialog with new tokens"
```

(The old `src/PublishConfirmDialog.jsx` stays in place for now — it's still imported by `App.jsx`. Task 30 swaps the import and Task 33 deletes it.)

### Task 26: Restyle ConfirmDeleteDialog

**Files:**
- Create: `src/landing/ConfirmDeleteDialog.jsx`
- Create: `src/landing/ConfirmDeleteDialog.module.css`

- [ ] **Step 1: Read the existing component**

```bash
cat src/ConfirmDeleteDialog.jsx
```

- [ ] **Step 2: Create src/landing/ConfirmDeleteDialog.module.css**

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(31, 22, 16, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 160ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.card {
  width: 100%;
  max-width: 480px;
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-modal);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header { padding: 24px 28px 12px; }
.title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 6px;
  color: var(--color-text-primary);
}
.subtitle {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.body { padding: 16px 28px; }

.input {
  width: 100%;
  padding: 10px 13px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  outline: none;
  transition: border-color 120ms;
}
.input:focus { border-color: var(--color-brand-primary); }

.footer {
  padding: 16px 28px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-page);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancelBtn {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}
.cancelBtn:hover { background: var(--color-bg-nav-active); }

.dangerBtn {
  padding: 10px 16px;
  background: var(--color-error);
  border: none;
  border-radius: var(--radius-md);
  color: #fff;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}
.dangerBtn:hover:not(:disabled) { background: #B91C1C; }
.dangerBtn:disabled { opacity: 0.4; cursor: not-allowed; }
```

- [ ] **Step 3: Move + restyle ConfirmDeleteDialog.jsx**

Copy `src/ConfirmDeleteDialog.jsx` to `src/landing/ConfirmDeleteDialog.jsx`. Replace its `import styles from './App.module.css'` (or whichever module it uses) with `import styles from './ConfirmDeleteDialog.module.css'`. Map the existing class names to the new module's class names (`modalBackdrop` → `backdrop`, `modalCard` → `card`, etc.).

- [ ] **Step 4: Commit**

```bash
git add src/landing/ConfirmDeleteDialog.jsx src/landing/ConfirmDeleteDialog.module.css
git commit -m "feat(landing): move and restyle ConfirmDeleteDialog"
```

### Task 27: Restyle HotelsLanding

**Files:**
- Create: `src/landing/HotelsLanding.jsx`
- Create: `src/landing/HotelsLanding.module.css`

- [ ] **Step 1: Read the existing component**

```bash
cat src/HotelsLanding.jsx
```

Note: it accepts `{ onOpen, onCreate, onDuplicate, onDelete }`, fetches the hotel list, renders cards in a grid, has an action menu per card, and an empty-state.

- [ ] **Step 2: Create src/landing/HotelsLanding.module.css**

```css
.wrap {
  min-height: 100vh;
  background: var(--color-bg-page);
  padding: 48px var(--space-6);
}

.inner {
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  gap: 20px;
}

.titleBlock { display: flex; flex-direction: column; gap: 4px; }

.title {
  font-size: 28px;
  font-weight: var(--font-weight-semibold);
  margin: 0;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin: 0;
}

.primaryBtn {
  background: var(--color-brand-primary);
  color: var(--color-text-on-dark);
  border: none;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  transition: background 120ms;
}
.primaryBtn:hover { background: #372062; }

.loading {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-md);
}

.empty {
  text-align: center;
  padding: 80px 20px;
  background: var(--color-bg-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}
.empty h3 {
  font-size: 18px;
  color: var(--color-text-primary);
  margin: 0 0 6px;
}
.empty p {
  color: var(--color-text-secondary);
  margin: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4);
}

.card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: border-color 160ms, box-shadow 160ms, transform 160ms;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.card:hover {
  border-color: var(--color-brand-light);
  box-shadow: 0 4px 12px rgba(67,41,117,0.08);
  transform: translateY(-1px);
}

.cardMain { display: flex; flex-direction: column; gap: 4px; }

.cardName {
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  margin: 0;
  color: var(--color-text-primary);
}

.cardUnnamed {
  color: var(--color-text-tertiary);
  font-style: italic;
  font-weight: var(--font-weight-regular);
}

.cardId {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-brand-text-light);
  background: var(--color-brand-light);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  align-self: flex-start;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cardDate {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.cardActions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  gap: var(--space-2);
}

.actionBtn {
  padding: 6px 12px;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: background 120ms;
}
.actionBtn:hover { background: var(--color-bg-nav-active); }

.menu { position: relative; }

.menuBtn {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 16px;
  line-height: 1;
}
.menuBtn:hover { background: var(--color-bg-page); border-color: var(--color-border); }

.menuPopup {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
  min-width: 140px;
  padding: 4px;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.menuPopup button {
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  text-align: left;
  transition: background 120ms;
}
.menuPopup button:hover { background: var(--color-bg-nav-active); }

.menuDanger { color: var(--color-error) !important; }
.menuDanger:hover { background: var(--color-error-bg) !important; }
```

- [ ] **Step 3: Move + restyle HotelsLanding.jsx**

Copy `src/HotelsLanding.jsx` to `src/landing/HotelsLanding.jsx`. Replace `import styles from '../App.module.css'` with `import styles from './HotelsLanding.module.css'`. Map old class names to new ones (`landingWrap` → `wrap`, `landingTitle` → `title`, `hotelCard` → `card`, etc.). Keep all data fetching, card click handlers, menu open/close, and create/duplicate/delete dispatches identical.

If the existing `HotelsLanding.jsx` uses any other component imports (e.g., a header), keep them — only the class-name origin changes.

- [ ] **Step 4: Commit**

```bash
git add src/landing/HotelsLanding.jsx src/landing/HotelsLanding.module.css
git commit -m "feat(landing): move and restyle HotelsLanding"
```

### Task 28: Extract + restyle AuthScreen

**Files:**
- Create: `src/auth/AuthScreen.jsx`
- Create: `src/auth/AuthScreen.module.css`

- [ ] **Step 1: Create src/auth/AuthScreen.module.css**

```css
.wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: var(--color-bg-page);
}

.card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.10);
}

.logo {
  align-self: center;
  margin-bottom: 8px;
}

.title {
  font-size: 22px;
  font-weight: var(--font-weight-semibold);
  margin: 0;
  text-align: center;
  color: var(--color-text-primary);
}

.subtitle {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin: 0 0 8px;
  text-align: center;
}

.input {
  padding: 12px 14px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  outline: none;
  transition: border-color 120ms;
}
.input:focus { border-color: var(--color-brand-primary); }

.btn {
  padding: 12px;
  background: var(--color-brand-primary);
  border: none;
  border-radius: var(--radius-md);
  color: #fff;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  transition: background 120ms;
}
.btn:hover { background: #372062; }

.error {
  padding: 10px 14px;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-md);
  color: var(--color-error-text);
  font-size: var(--font-size-base);
  text-align: center;
  font-weight: var(--font-weight-medium);
}
```

- [ ] **Step 2: Create src/auth/AuthScreen.jsx**

```jsx
import { useState } from 'react';
import DEdgeLogo from '../admin/DEdgeLogo.jsx';
import styles from './AuthScreen.module.css';

export default function AuthScreen({ onAuthed }) {
  const [pwdInput, setPwdInput] = useState('');
  const [authError, setAuthError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdInput }),
      });
      if (res.ok) {
        onAuthed();
      } else {
        setAuthError('Wrong password');
      }
    } catch {
      setAuthError('Server unreachable');
    }
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={handleLogin}>
        <div className={styles.logo}>
          <DEdgeLogo height={28} />
        </div>
        <h1 className={styles.title}>Hotel Widget Admin</h1>
        <p className={styles.subtitle}>Sign in to continue</p>
        <input
          type="password"
          className={styles.input}
          value={pwdInput}
          onChange={(e) => setPwdInput(e.target.value)}
          placeholder="Password"
          autoFocus
        />
        {authError && <div className={styles.error}>{authError}</div>}
        <button type="submit" className={styles.btn}>Sign in</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/auth/AuthScreen.jsx src/auth/AuthScreen.module.css
git commit -m "feat(auth): extract AuthScreen into its own component with new tokens"
```

---

## Phase 7 — Wire it all together

### Task 29: Slim down App.jsx — auth gate + view router only

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Replace src/App.jsx with the slimmed shell**

Keep the file at `src/App.jsx` (entry remains the same) but rewrite it to contain only the auth gate, the view router (`landing` ↔ `form`), and the high-level handlers (`handleOpen`, `handleCreate`, `handleDuplicate`, `handleDelete`, `handleDeleteConfirmed`, `handleBackToLanding`). All form / preview / publish logic moves into the new `ConfigForm` component (Task 30). All inline tab components are deleted from this file.

```jsx
import { useState } from 'react';
import AuthScreen from './auth/AuthScreen.jsx';
import HotelsLanding from './landing/HotelsLanding.jsx';
import ConfirmDeleteDialog from './landing/ConfirmDeleteDialog.jsx';
import ConfigForm from './ConfigForm.jsx';

export default function App() {
  const [authed, setAuthed] = useState(false);
  if (!authed) return <AuthScreen onAuthed={() => setAuthed(true)} />;
  return <AdminUI />;
}

function AdminUI() {
  const [view, setView] = useState('landing');
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function handleOpen(hotelId) {
    setEditingHotelId(hotelId);
    setView('form');
  }
  function handleCreate() {
    setEditingHotelId(null);
    setView('form');
  }
  async function handleDuplicate(sourceId) {
    const newId = prompt(
      `Duplicate "${sourceId}" to a new Hotel ID:`,
      `${sourceId}_copy`
    );
    if (!newId) return;
    if (!/^[a-zA-Z0-9_-]+$/.test(newId)) {
      alert('Invalid ID. Use letters, numbers, dashes and underscores only.');
      return;
    }
    try {
      const res = await fetch('/api/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, newId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplicate failed');
      setEditingHotelId(newId);
      setView('form');
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    }
  }
  function handleDelete(hotelId, hotelName) {
    setDeleteTarget({ hotelId, hotelName });
  }
  function handleDeleteConfirmed() {
    setDeleteTarget(null);
    setView('landing');
  }
  function handleBackToLanding() {
    setEditingHotelId(null);
    setView('landing');
  }

  if (view === 'landing') {
    return (
      <>
        <HotelsLanding
          key={Date.now()}
          onOpen={handleOpen}
          onCreate={handleCreate}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
        {deleteTarget && (
          <ConfirmDeleteDialog
            hotelId={deleteTarget.hotelId}
            hotelName={deleteTarget.hotelName}
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </>
    );
  }

  return (
    <ConfigForm editingHotelId={editingHotelId} onBack={handleBackToLanding} />
  );
}
```

- [ ] **Step 2: Do NOT delete the old `src/App.module.css` yet** (the new `ConfigForm` is built next; we delete `App.module.css` in Task 33 after verifying nothing references it).

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "refactor(app): slim App.jsx to auth gate + view router"
```

### Task 30: Create ConfigForm using AdminLayout + tabs + useUnpublishedDiff

**Files:**
- Create: `src/ConfigForm.jsx`

This is the heart of the wiring. The existing `ConfigForm` body inside `App.jsx` (state, edit-mode load effect, publish, download, copy, etc.) is preserved and rehoused here. The new bits are: snapshot ref, `useUnpublishedDiff` call, tab routing through `AdminLayout`, top-bar handlers.

- [ ] **Step 1: Create src/ConfigForm.jsx**

```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { WIDGET_PREVIEW_URL } from './constants.js';
import { buildConfig, buildPreviewUrl } from './utils.js';
import useUnpublishedDiff from './hooks/useUnpublishedDiff.js';
import AdminLayout from './admin/AdminLayout.jsx';
import PublishConfirmDialog from './admin/PublishConfirmDialog.jsx';
import IdentityTab from './tabs/IdentityTab.jsx';
import DataTab from './tabs/DataTab.jsx';
import AppearanceTab from './tabs/AppearanceTab.jsx';
import LanguagesTab from './tabs/LanguagesTab.jsx';
import AnalyticsTab from './tabs/AnalyticsTab.jsx';
import PublishTab from './tabs/PublishTab.jsx';

const DEFAULT_FORM = {
  hotelId: '',
  hotelName: '',
  hotelDomain: '',
  logoUrl: '',
  apiHotelId: '',
  apiCompetitorId: '',
  channelsEnabled: [],
  reserveUrl: '',
  currency: 'EUR',
  position: 'bottom-right',
  size: 'small',
  brandColor: '#8b5a3c',
  backgroundColor: '#faf7f2',
  enabledLocales: ['en', 'fr', 'es', 'de', 'it'],
  defaultLocale: 'en',
  autoOpenMode: 'time',
  autoOpenDelay: 8,
  autoOpenScrollPercent: 50,
  analyticsEnabled: true,
  dataLayerName: 'dataLayer',
};

export default function ConfigForm({ editingHotelId, onBack }) {
  const isEditMode = !!editingHotelId;

  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    hotelId: editingHotelId || '',
  });

  const lastSnapshotRef = useRef(null);

  const [device, setDevice] = useState('desktop');
  const [activeTab, setActiveTab] = useState('identity');
  const [publishState, setPublishState] = useState({ status: 'idle' });
  const [copied, setCopied] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [loadStatus, setLoadStatus] = useState(isEditMode ? 'loading' : 'ready');
  const [loadError, setLoadError] = useState('');

  // Load existing config in edit mode (preserves existing behavior)
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    fetch(`/api/current-config/${encodeURIComponent(editingHotelId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.exists) {
          setLoadError(`Configuration ${editingHotelId} not found`);
          setLoadStatus('error');
          return;
        }
        const c = data.config;
        const loaded = {
          hotelId: editingHotelId,
          hotelName: c.hotelName || '',
          hotelDomain: c.hotelDomain || '',
          logoUrl: c.logoUrl || '',
          apiHotelId: c.apiHotelId ? String(c.apiHotelId) : '',
          apiCompetitorId: c.apiCompetitorId ? String(c.apiCompetitorId) : '',
          channelsEnabled: c.channelsEnabled || [],
          reserveUrl: c.reserveUrl || '',
          currency: c.currency || 'EUR',
          position: c.position || 'bottom-right',
          size: c.size || 'small',
          brandColor: c.brandColor || '#8b5a3c',
          backgroundColor: c.backgroundColor || '#faf7f2',
          enabledLocales: c.enabledLocales || ['en'],
          defaultLocale: c.defaultLocale || 'en',
          autoOpenMode: c.autoOpenMode || 'disabled',
          autoOpenDelay: c.autoOpenDelay || 8,
          autoOpenScrollPercent: c.autoOpenScrollPercent || 50,
          analyticsEnabled: c.analytics?.enabled ?? true,
          dataLayerName: c.analytics?.dataLayerName || 'dataLayer',
        };
        setForm(loaded);
        lastSnapshotRef.current = loaded;
        setLoadStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message);
        setLoadStatus('error');
      });
    return () => { cancelled = true; };
  }, [isEditMode, editingHotelId]);

  const config = useMemo(() => buildConfig(form), [form]);
  const previewUrl = useMemo(
    () => buildPreviewUrl(WIDGET_PREVIEW_URL, config),
    [config]
  );
  const viewport =
    device === 'desktop' ? { w: 1280, h: 720 } : { w: 390, h: 844 };

  const { isDirty, changedFields } = useUnpublishedDiff(form, lastSnapshotRef.current);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleLocale(locale) {
    setForm((f) => {
      const enabled = f.enabledLocales.includes(locale)
        ? f.enabledLocales.filter((l) => l !== locale)
        : [...f.enabledLocales, locale];
      return {
        ...f,
        enabledLocales: enabled,
        defaultLocale: enabled.includes(f.defaultLocale)
          ? f.defaultLocale
          : enabled[0] || 'en',
      };
    });
  }

  function handlePublish() {
    if (!form.hotelId || !form.hotelId.trim()) {
      setPublishState({
        status: 'error',
        message: 'Hotel ID is required before publishing.',
      });
      return;
    }
    setPublishState({ status: 'idle' });
    setShowPublishDialog(true);
  }

  async function handleConfirmPublish() {
    setPublishState({ status: 'publishing' });
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: form.hotelId, config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      console.info('[admin] published', {
        hotelId: form.hotelId,
        commitSha: data.commit?.sha,
        commitUrl: data.commit?.html_url,
        fullResponse: data,
      });
      // Refresh snapshot — pill flips to clean
      lastSnapshotRef.current = form;
      setPublishState({ status: 'success' });
      setShowPublishDialog(false);
    } catch (err) {
      console.error('[admin] publish failed', err);
      setPublishState({ status: 'error', message: err.message });
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.hotelId || 'widget-config'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyEmbedCode() {
    const code = `<script async src="https://vturlin.github.io/best-price-widget/widget.js?id=${form.hotelId}"></script>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function previewLive() {
    if (!form.hotelId) return;
    window.open(previewUrl, '_blank', 'noopener');
  }

  if (loadStatus === 'loading') {
    return (
      <div style={{ padding: 40, color: 'var(--color-text-secondary)' }}>
        Loading configuration…
      </div>
    );
  }
  if (loadStatus === 'error') {
    return (
      <div style={{ padding: 40 }}>
        <div
          style={{
            padding: 16,
            background: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 6,
            color: 'var(--color-error-text)',
          }}
        >
          <strong>Couldn't load configuration</strong>
          <p>{loadError}</p>
          <button
            type="button"
            onClick={onBack}
            style={{
              marginTop: 12,
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: '8px 14px',
              color: 'var(--color-text-primary)',
            }}
          >
            ← Back to hotels
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminLayout
        hotelId={form.hotelId}
        hotelName={form.hotelName}
        onBackToHotels={onBack}
        unpublishedCount={changedFields.length}
        canAct={!!form.hotelId && !!form.hotelId.trim()}
        onPreviewLive={previewLive}
        onPublish={handlePublish}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        preview={{
          previewUrl,
          viewport,
          device,
          setDevice,
          clientDomain: form.hotelDomain,
        }}
      >
        {activeTab === 'identity' && (
          <IdentityTab form={form} updateField={updateField} isEditMode={isEditMode} />
        )}
        {activeTab === 'data' && (
          <DataTab form={form} updateField={updateField} />
        )}
        {activeTab === 'appearance' && (
          <AppearanceTab form={form} updateField={updateField} />
        )}
        {activeTab === 'languages' && (
          <LanguagesTab
            form={form}
            updateField={updateField}
            toggleLocale={toggleLocale}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab form={form} updateField={updateField} />
        )}
        {activeTab === 'publish' && (
          <PublishTab
            hotelId={form.hotelId}
            publishState={publishState}
            copied={copied}
            onPublish={handlePublish}
            onDownload={downloadJson}
            onCopyEmbed={copyEmbedCode}
            isDirty={isDirty}
            changedFields={changedFields}
          />
        )}
      </AdminLayout>

      {showPublishDialog && (
        <PublishConfirmDialog
          hotelId={form.hotelId}
          config={config}
          onConfirm={handleConfirmPublish}
          onCancel={() => setShowPublishDialog(false)}
          isPublishing={publishState.status === 'publishing'}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify the dev server still builds**

```bash
npm run dev
```

Expected: app starts. If you see an error like "Failed to resolve import './ConfigForm.jsx'", confirm Task 29's `App.jsx` import path matches the new file location.

Open `http://localhost:5173`, sign in, and confirm:
- Hotels landing renders with the new visual style.
- Open a hotel → admin shell renders. TopChrome shows logo, breadcrumb, hotel name, ID badge.
- Tabs switch correctly. Each tab shows the new GroupCard layout.
- Preview pane shows the screenshot + widget iframe stack inside the new BrowserChrome.
- Make a small change in the Identity tab → UnpublishedPill appears in the top bar. Switch to Publish tab → status panel shows the change name.
- Publish → diff dialog opens, restyled. Confirm → pill clears.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/ConfigForm.jsx
git commit -m "feat(form): wire ConfigForm to AdminLayout + tabs + unpublished-diff hook"
```

---

## Phase 8 — Cleanup

### Task 31: Remove dead files

**Files:**
- Delete: `src/App.module.css`
- Delete: `src/PublishConfirmDialog.jsx`
- Delete: `src/HotelsLanding.jsx`
- Delete: `src/ConfirmDeleteDialog.jsx`

- [ ] **Step 1: Confirm nothing imports the old files**

```bash
grep -RIn "from './App.module.css'\|from './PublishConfirmDialog'\|from './HotelsLanding'\|from './ConfirmDeleteDialog'" src/
```

Expected: no matches. If anything does, update the import to the new path.

- [ ] **Step 2: Delete the old files**

```bash
rm src/App.module.css src/PublishConfirmDialog.jsx src/HotelsLanding.jsx src/ConfirmDeleteDialog.jsx
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

Expected: Vite builds without errors. If anything is missing, the error message names the file that still references it — fix and re-run.

```bash
npm run dev
```

Open the app, sign in, and click through every tab once more to confirm nothing visually broke.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove App.module.css and migrated files now living under their new homes"
```

### Task 32: Final QA pass against acceptance checklist

**Files:** none. Manual verification only.

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

- [ ] **Step 2: Walk the spec's Section 8 acceptance checklist**

Open the app and verify each of the 25+ items below works. Tick the spec checklist as you go. If anything fails, file an issue (or fix inline if obvious) before declaring done.

**Auth**
- Sign in with wrong password → error shown.
- Sign in with right password → unlocks to landing.

**Hotels landing**
- List loads. Cards render with new style.
- Click card → opens admin in edit mode.
- "New configuration" → opens admin in create mode.
- "Duplicate" on a card → prompts for new ID, opens duplicate.
- "Delete" on a card → opens delete dialog; confirm → returns to landing, list refreshes.

**ConfigForm — load**
- Edit mode shows fields populated from API.
- 404'ing a hotel → error UI.

**Preview pane**
- Real screenshot loads for a valid client domain.
- Invalid/empty domain → demo backdrop placeholder.
- Widget iframe renders and updates as you change Brand color, Position, etc.
- Device toggle: Desktop → 1280×720 viewport; Mobile → 390×844.

**Identity tab**
- Hotel ID disabled in edit mode, editable in create mode.

**Data tab**
- "Test connection" disabled until API Hotel ID is filled.
- Hit a known good hotel ID → green banner + detected competitor + rooms-by-channel detail.
- Hit a bad ID → red banner with the error.
- Channels list appears after a successful test. Toggle one off → re-rendered.
- Auto-fill: empty competitor ID gets filled after a test that detected one.

**Appearance tab**
- Auto-open trigger = "After a delay" → only Delay field appears.
- Auto-open trigger = "On scroll" → only Scroll threshold appears.
- Auto-open trigger = "Delay or scroll (first wins)" → both appear.
- Auto-open trigger = "Disabled" → neither appears.

**Languages tab**
- Uncheck the current default → default switches to first remaining enabled locale.
- Default-language select only lists enabled locales.

**Analytics tab**
- Toggle off → DataLayer variable name field hides.

**Publish tab**
- Top-bar pill matches the in-tab status panel (both show / hide together).
- "Publish changes" opens the dialog.
- Dialog confirms → console log fires, dialog closes, pill clears, status panel flips to "All changes published".
- "Download JSON" downloads `<hotelId>.json` with the right shape.
- "Copy" copies the embed snippet, button text changes to "Copied" for 2s.

**Top bar**
- "Preview live" opens a new tab with the widget preview.
- Both top-bar buttons disabled when Hotel ID is empty.

- [ ] **Step 3: Commit any fixes from QA**

If you needed to tweak anything (e.g., a forgotten ARIA attribute, a too-small font), commit each fix as its own small commit:

```bash
git add <files>
git commit -m "fix(<area>): <what>"
```

- [ ] **Step 4: Final review of git log**

```bash
git log --oneline main..HEAD
```

Expected: a tidy series of `feat(*)` and `chore`/`refactor`/`fix` commits, one per task. No commits called "wip" or "fix later".

---

## Closing notes

- No backend changes were made. No `package.json` deps were added.
- The `src/utils.js`, `src/diff.js`, and `src/constants.js` files were modified zero times — only consumed.
- `design_handoff_widget_admin/` is untouched. It remains as reference. Decide separately whether to delete it or keep it in the repo as a historical artifact.
