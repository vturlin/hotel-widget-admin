# Admin V1 Design Port — Design Spec

**Date:** 2026-04-27
**Author:** Vincent (with Claude)
**Status:** Approved — ready for implementation planning

---

## 1. Overview

Port the V1 ("Classic split, polished") admin redesign from `design_handoff_widget_admin/` into the existing `hotel-widget-admin` React codebase. The redesign aligns the admin to the D-EDGE CRM design system (purple-led, Open Sans, warm-stone neutrals, dense operator UI).

**Scope:** full port in a single change. Tokens + fonts + form primitives + chrome shell + all 6 tab panels + restyled auth screen + restyled hotels landing + restyled publish/delete dialogs.

**Non-goals:**
- No autosave (the pill is repurposed as an "Unpublished changes" indicator instead).
- No new backend endpoints.
- No new functional features. Every existing feature is preserved.
- No replacement of the inline icons with Font Awesome (deferred — inline SVGs stay).

## 2. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Implementation cadence | Full port in one change | User preference. |
| Existing rich features (API test results, publish-diff dialog, auth, hotels landing) | All preserved functionally; restyled to new tokens | User instruction: "keep exactly the same features". |
| Save-status pill semantics | Repurposed as "Unpublished changes" indicator | No autosave exists today, and inventing one is out of scope. The pill drives off `useUnpublishedDiff` (form vs last loaded/published config). |
| File structure | Aggressive split: per-component JSX + co-located CSS Module | Volume of new components makes a 1500+ line `App.jsx` and a 1500+ line `App.module.css` unworkable. |
| Fonts | Self-host the Open Sans variable TTFs from the design handoff | README's prescribed pattern; avoids Google Fonts CDN. |
| Logo | Copy the design's `assets/logo.svg` into `src/assets/` | Local asset, replaces the current d-edge.com CDN URL. |
| Iconography | Keep inline SVGs (chevrons, checkmark, lock) | Font Awesome would add a dependency for marginal gain; inline SVGs already in use. |
| CSS approach | CSS Modules per component + a single global `tokens.css` | Matches existing convention. Inter is dropped, Open Sans takes over. |

## 3. Foundation (tokens, fonts, globals)

- Copy `design_handoff_widget_admin/tokens.css` to `src/tokens.css`. Import once globally from `src/main.jsx`. All CSS custom properties (`--color-brand-primary: #432975`, `--color-bg-page: #FBFAF9`, etc.) become the single source of truth.
- Copy the two Open Sans variable TTFs into `src/assets/fonts/`. Update the `@font-face` `url(...)` paths in `tokens.css` to point at `./assets/fonts/...` (relative to where `tokens.css` lives).
- Copy `design_handoff_widget_admin/assets/logo.svg` to `src/assets/logo.svg`.
- Delete the existing `:root { --brand: #4c1d95; ... }` token block at the top of `App.module.css`. Drop the Google Fonts `@import url('...Inter...')` line. Inter is gone.
- Move genuinely-global rules (body reset, `*{box-sizing:border-box}`, scrollbar styling) into `tokens.css` (or a new `src/styles/global.css` imported alongside it — implementer's choice).

**Acceptance:** Open Sans renders everywhere; `getComputedStyle(document.body).fontFamily` includes "Open Sans"; brand purple in DOM is `#432975` everywhere.

## 4. File structure

```
src/
  main.jsx                                 (existing, +import './tokens.css')
  App.jsx                                  (slimmed: auth gate + view router only)
  tokens.css                               (NEW — copied from design handoff)

  assets/
    logo.svg                               (NEW)
    fonts/
      OpenSans-VariableFont_wdth_wght.ttf
      OpenSans-Italic-VariableFont_wdth_wght.ttf

  auth/
    AuthScreen.jsx + .module.css           (extracted from App.jsx, restyled)

  landing/
    HotelsLanding.jsx                      (existing, restyled — moved here)
    HotelsLanding.module.css               (NEW)
    ConfirmDeleteDialog.jsx                (existing, restyled — moved here)
    ConfirmDeleteDialog.module.css         (NEW)

  admin/
    AdminLayout.jsx + .module.css          (top bar + tab bar + 1fr/460px grid)
    TopChrome.jsx + .module.css
    TabBar.jsx + .module.css
    UnpublishedPill.jsx + .module.css      (repurposed save-status pill)
    BrowserChrome.jsx + .module.css
    PreviewPane.jsx + .module.css          (existing PreviewFrame logic moves here)
    DeviceToggle.jsx + .module.css
    DEdgeLogo.jsx                          (small, no module)
    GroupCard.jsx + .module.css
    PanelHeader.jsx + .module.css
    PublishConfirmDialog.jsx + .module.css (existing, restyled — moved here)

  components/forms/
    Field.jsx + .module.css
    TextInput.jsx + .module.css
    Select.jsx + .module.css
    ColorInput.jsx + .module.css
    Toggle.jsx + .module.css
    Checkbox.jsx + .module.css

  tabs/
    IdentityTab.jsx + .module.css
    DataTab.jsx + .module.css
    AppearanceTab.jsx + .module.css
    LanguagesTab.jsx + .module.css
    AnalyticsTab.jsx + .module.css
    PublishTab.jsx + .module.css

  hooks/
    useUnpublishedDiff.js                  (NEW)

  constants.js                             (existing, unchanged)
  utils.js                                 (existing, unchanged)
  diff.js                                  (existing, unchanged)
```

After the port, `App.module.css` is deleted (its rules are migrated into the per-component CSS Modules above).

## 5. Component inventory

### 5.1 Form primitives (`src/components/forms/`)

Faithful to `shared.jsx`, converted from inline styles to CSS Modules.

- **`Field`** — `{ label, hint, htmlFor, optional, children }`. Wraps a control with a 13px / weight 600 label, optional inline "optional" tag (11px / `#999`), and a 12px / `#666` hint below. 16px bottom margin.
- **`TextInput`** — `{ value, onChange, placeholder, disabled, monospace, prefix }`. 1px `#E7E5E4` border, 6px radius, 38px height, 14px Open Sans font. Focus state: border `#432975`. Disabled: bg `#FBFAF9`, color `#999`. Optional inline `prefix` (e.g. `https://`) with vertical 1px divider before the input value.
- **`Select`** — `{ value, onChange, options }`. Native `<select appearance:none>` + custom chevron SVG positioned absolute right.
- **`ColorInput`** — `{ value, onChange, presets }`. Color swatch on the left (clickable to open native picker), monospace uppercase hex input on the right, preset row of 22×22 swatches below. Active preset gets a 2px `#432975` ring.
- **`Toggle`** — `{ checked, onChange, label, hint }`. 36×20 pill with white knob translating 16px on toggle. On = `#432975`, off = `#D7D3D0`.
- **`Checkbox`** — `{ checked, onChange, label, suffix }`. 16×16 box, 3px radius, `#432975` checked bg with white tick SVG. Hover row bg `#F7F7F7`. `label` and `suffix` accept ReactNodes (DataTab passes inline DIRECT badge as label content; LanguagesTab passes locale code as suffix).

### 5.2 Admin shell (`src/admin/`)

- **`AdminLayout`** — `{ activeTab, onTabChange, hotelMeta, isDirty, dirtyCount, onPublish, onPreviewLive, previewProps, children }`. Composes `<TopChrome>`, `<TabBar>`, and the `1fr 460px` grid. Page background `#FBFAF9`. Right `<aside>` slot holds `children` (the active tab panel).
- **`TopChrome`** — 56px, white, 1px `#E7E5E4` bottom border, 0/24px padding.
  - Left → right: `<DEdgeLogo height={20}/>`, 1px×20px divider (`#E7E5E4`, 8px left margin), `Hotels` breadcrumb button (13px / `#666`, click → back to landing), `›` separator (`#C9C5C2`), hotel name text (14px / weight 600 / `#424242`), hotel-ID badge (uppercase, 10px / weight 600 / letter-spacing 0.04em, padding 2/8, bg `#ECE2FF`, color `#8764C9`, radius 2).
  - Right cluster (margin-left: auto): `<UnpublishedPill>` (only when dirty), "Preview live" outline button (1px `#432975` border, transparent bg, 7/14 padding, 6px radius, 13px / weight 500), "Publish" primary button (`#432975` bg, white text, 8/16 padding, 6px radius).
- **`TabBar`** — 48px, white, 1px `#E7E5E4` bottom border, 0/24px padding. Six buttons: inactive 14px / weight 500 / `#666` / transparent border-bottom; active weight 600 / `#432975` / 2px solid `#432975` border-bottom (overlapping the chrome border via `marginBottom: -1`). Padding 0/16.
- **`UnpublishedPill`** — `{ count }` (rendered conditionally — caller hides when `count === 0`). Inline-flex pill: 6/12 padding, 999px radius, bg `#FBFAF9`, 1px `#E7E5E4` border. 7×7 amber dot (`#F59E0B`) with `0 0 0 3px #F59E0B22` ring, "Unpublished changes" label (13px / weight 500 / `#424242`), `· N field${s}` suffix (12px / `#999`).
- **`PreviewPane`** — wraps existing `PreviewFrame` logic (Thum.io URL build, `isValidPublicDomain` gate, ResizeObserver scaling, screenshot fallback, widget iframe). Renders `<BrowserChrome url={clientUrl || 'demo.hotel-widget.app'}>` with the screenshot `<img>` and the widget `<iframe>` stacked absolutely inside it. Below the browser card: `<DeviceToggle>`. 24px outer padding.
- **`BrowserChrome`** — `{ url, children }`. Card: 12px radius, 1px `#E7E5E4` border, white bg, soft shadow `0 2px 8px rgba(0,0,0,0.04)`. Header bar 36px, bg `#F2EFEC`, traffic-light dots (`#FF5F57`, `#FEBC2E`, `#28C840` — 12px circles), URL pill with lock icon. Body slot below the bar.
- **`DeviceToggle`** — `{ device, onChange }`. Inline-flex pill: 4px padding, 999px radius, white bg with `#E7E5E4` border, soft shadow. Two buttons (Desktop / Mobile): selected = `#432975` bg + white text, unselected = transparent + `#666` text. 6/18 padding per button.
- **`DEdgeLogo`** — `{ height = 20 }`. Renders `import logoUrl from '../assets/logo.svg'` as `<img src={logoUrl} style={{height}}/>`. Falls back to the inline JSX wordmark only if the SVG fails to load (handled with an `onError` swap, optional).
- **`GroupCard`** — `{ title, hint, action, children, last }`. Card: white, 1px `#E7E5E4` border, 12px radius, 20px padding, 16px bottom margin (0 if `last`). Header row uses flex with `flex: 1` on the title block + `action` slot top-right (used by DataTab's "Test connection" button). Title 13px / weight 600 / `#424242`; hint 12px / `#666` below.
- **`PanelHeader`** — `{ title, subtitle }`. h2 20px / weight 600 / `#424242` / line-height 1.2; subtitle 14px / `#666` / line-height 1.5 / margin-top 6px. Wrapper has 24px bottom margin.
- **`PublishConfirmDialog`** — existing logic, moved here, restyled. Props unchanged.

### 5.3 Reused (moved + restyled, no API change)

- `PublishConfirmDialog` (`src/admin/`)
- `HotelsLanding` (`src/landing/`)
- `ConfirmDeleteDialog` (`src/landing/`)
- `AuthScreen` (extracted from `App.jsx` into `src/auth/`)

## 6. Tab panels (`src/tabs/`)

Each tab is `{ form, updateField, ...extras }` → `<>{<PanelHeader/>}{<GroupCard>...}{...}</>`. No data-mutation logic changes — only the wrappers and primitives change.

### 6.1 `IdentityTab`

- `<PanelHeader title="Identity" subtitle="Basic information about the hotel and how to identify it." />`
- **GroupCard "Identification"** (`hint="Used internally and to fetch the right config."`)
  - Field "Hotel ID" → `<TextInput disabled={isEditMode} monospace>`. Hint per existing copy (different message in edit vs create).
  - Field "Hotel name" → `<TextInput>`.
- **GroupCard "Web presence"** (last) (`hint="Where the widget will be embedded."`)
  - Field "Client domain" → `<TextInput prefix="https://">`. Existing hint.
  - Field "Logo URL" `optional` → `<TextInput>`. Existing hint.

### 6.2 `DataTab`

All existing logic (`handleTestApi`, `analyzeRatesResponse`, `toggleChannel`, channel discovery gating, auto-fill rules) preserved.

- `<PanelHeader title="Data" subtitle="Rates are fetched live from the AvailPro RateScreener API." />`
- **GroupCard "API connection"** (`hint`, `action={<TestConnectionButton/>}`)
  - Field "API Hotel ID" → `<TextInput monospace>` (number-as-string).
  - Field "Competitor ID" → `<TextInput monospace>`. Hint about myHotel.
  - **Status banner area** (rendered below the fields, inside the same card):
    - Idle → nothing.
    - Testing → muted "Testing…" text.
    - Error → red panel: bg `#FEF2F2`, 1px border `#FECACA`, 6px radius, 12px text `#991B1B`. "Connection failed" weight 600 + error message.
    - OK → green panel per spec: bg `#ECFDF5`, 1px border `#BBF7D0`, 6px radius, 12px text `#1F5135`. 8px green dot + two-line text ("Connection OK" + "Last screening: ..."). **Below the green panel**, the existing rich detail (detected competitor with code chip, warning if no `myHotel`, rooms grouped by channel with code chips + occupancy + max-pax suffix) renders inline using the new code-chip style (`#432975` text on `#F7F4FB` bg).
- **GroupCard "Channels to display"** (`hint` from existing logic).
  - When channels not yet discovered → `<EmptyStateNote>` with "Run Test connection..." copy.
  - When discovered → `<Checkbox>` rows; `label` is `<>{name}{isDirect && <DirectBadge/>}</>`; `suffix` is `${ch.roomCount} rooms`.
- **GroupCard "Booking link"** (last)
  - Field "Reserve URL template" → `<TextInput>`. Hint with inline `<code>{checkIn}</code>` / `<code>{checkOut}</code>` chips (bg `#F2EFEC`, 0/4 padding, 2px radius).
  - Field "Currency" → `<Select options={[{EUR €}, {USD $}, {GBP £}, {CHF}]}>`.

### 6.3 `AppearanceTab`

- `<PanelHeader title="Appearance" subtitle="Colors, position, and opening behaviour." />`
- **GroupCard "Colors"** (`hint="Match the hotel's brand. Apply live to the preview."`)
  - Field "Brand color" → `<ColorInput presets={['#8B5A3C','#1F5135','#3E2D5A','#B43A2A','#1A1A1A']}>`. Hint "Buttons and accents."
  - Field "Background" → `<ColorInput presets={['#FAF7F2','#FFFFFF','#F4EFE8','#1A1A1A','#F0E9DD']}>`. Hint "Widget panel fill."
- **GroupCard "Placement"**
  - Field "Position on screen" → `<Select options={POSITIONS}>`.
  - Field "Widget size" → `<Select options={SIZES}>`. Hint per existing.
- **GroupCard "Auto-open behaviour"** (last) (`hint="When the widget opens itself for the first time in the session."`)
  - Field "Auto-open trigger" → `<Select options={AUTO_OPEN_MODES}>`.
  - Conditional Field "Delay before opening" (when mode is `time` or `time_or_scroll`) → `<Select>` with `AUTO_OPEN_DELAYS`.
  - Conditional Field "Scroll threshold" (when mode is `scroll` or `time_or_scroll`) → `<Select>` with `SCROLL_THRESHOLDS`. **Note:** the design's V1 prototype omits this field; the existing app has it; per "keep all features" it stays, in the same card.

### 6.4 `LanguagesTab`

- `<PanelHeader title="Languages" subtitle="Which languages the widget offers, and which one it falls back to." />`
- **GroupCard "Enabled languages"** (dynamic hint with enabled/total count + auto-detection note).
  - 2-column grid of `<Checkbox>` rows, one per entry in `SUPPORTED_LOCALES` from `constants.js` (currently 20 locales — not the 8 in the design prototype's `shared.jsx`); suffix = locale code in monospace.
  - `toggleLocale` keeps the auto-fallback logic (existing).
- **GroupCard "Fallback"** (last) (`hint="Used when the browser language is not in the enabled list."`)
  - Field "Default language" → `<Select>` filtered to currently-enabled locales.

### 6.5 `AnalyticsTab`

- `<PanelHeader title="Analytics" subtitle={<>DataLayer events ... <code>dedge_widget_</code>.</>} />`
- **GroupCard "Tracking"** (`hint="Connect to your existing analytics setup."`)
  - `<Toggle label="Enable dataLayer push" hint="Disable if you don't use Google Tag Manager or a compatible setup.">`.
  - Conditional Field "DataLayer variable name" (when enabled) → `<TextInput monospace>`. Hint with inline `<code>dataLayer</code>`.
- **GroupCard "Events emitted"** (last) (`hint="The widget pushes these events when relevant. No configuration needed."`)
  - Hard-coded list of 4 events: `dedge_widget_opened`, `dedge_widget_closed`, `dedge_widget_viewed`, `dedge_widget_book_click`. Each row: `<code>` chip + 13px description, 1px `#F2EFEC` bottom border between rows.

### 6.6 `PublishTab`

- `<PanelHeader title="Publish" subtitle="Save the configuration so the widget can load it on the hotel website." />`
- **GroupCard "Status"** (hint about "Last published ..." is omitted in v1 — no backend metadata yet).
  - Inner status panel (bg `#FBFAF9`, 1px `#E7E5E4` border, 8px radius, 12/14 padding) driven by `useUnpublishedDiff`:
    - Dirty: 8px amber dot (`#F59E0B`, `0 0 0 3px #F59E0B22` ring) + "N unpublished changes" (13px / weight 600) + comma-separated changed-field labels (12px / `#666`).
    - Clean: 8px green dot (`#10B981`, `0 0 0 3px #10B98122` ring) + "All changes published" (13px / weight 600).
  - Button row, 8px gap, 12px top margin:
    - **Publish changes** — primary, `flex: 1`, `#432975` bg, 10/16 padding, 6px radius, 14px / weight 600. Opens `PublishConfirmDialog`.
    - **Download JSON** — outline, 1px `#E7E5E4`, `#424242` text. Existing `downloadJson`.
- **GroupCard "Embed code"** (last) (`hint` about pasting before `</body>` or pushing through GTM).
  - Code block — bg `#1F1610`, 6px radius, 14px padding, 12px monospace, `#E7E5E4` text, line-height 1.55. Syntax-tinted spans: tags `#C9B79A`, attr names `#A5C8A0`, attr values `#FED7AA`. Same content as today (`<script async src="https://vturlin.github.io/best-price-widget/widget.js?id=${hotelId}"></script>`).
  - Copy button absolute top-right (8/8): bg `rgba(255,255,255,0.08)`, 1px `rgba(255,255,255,0.12)` border, white text, 4/10 padding, 4px radius, 11px. 2-second "Copied" confirmation (existing).

## 7. Behavioral changes

### 7.1 `useUnpublishedDiff` hook (NEW)

- Path: `src/hooks/useUnpublishedDiff.js`.
- Signature: `useUnpublishedDiff(form, lastSnapshot) → { isDirty, changedFields }` where `changedFields` is an array of human-readable labels (e.g. `["Brand color", "Position on screen"]`).
- Inside `ConfigForm`:
  - On successful load (`useEffect` for edit mode), stash the loaded form shape into a `useRef` snapshot.
  - On successful publish (`handleConfirmPublish` success branch), refresh the snapshot to match the just-published form shape.
  - In create mode, snapshot starts as `null` → treated as "any non-empty form is dirty".
- Reuses `diff.js` to compute changed top-level keys, then maps key → label via a small constant map (e.g. `brandColor → "Brand color"`). Keys not in the map fall back to a humanized version of the key.
- `UnpublishedPill` consumes `{ count: changedFields.length }`. Publish tab status panel consumes `{ isDirty, changedFields }`.

### 7.2 Top-bar buttons that exist visually but were never wired

- **Preview live** — opens the current in-progress preview in a new full-window tab: `window.open(buildPreviewUrl(WIDGET_PREVIEW_URL, config), '_blank')`. Reuses the same `buildPreviewUrl` helper and `WIDGET_PREVIEW_URL` (`https://vturlin.github.io/best-price-widget/transparent.html`) the embedded preview iframe already uses, so what you see in the new tab matches what's in the preview pane. Disabled when `!form.hotelId`.
- **Publish** — same handler as the Publish tab's primary button (`handlePublish`). Disabled when `!form.hotelId`.

### 7.3 Restyle scope (no logic change)

- **AuthScreen** — purple primary button, Open Sans, white card on `#FBFAF9` bg, focus ring `#432975`. Logo = imported SVG. Same `/api/auth` POST.
- **HotelsLanding** — page bg `#FBFAF9`. Hotel cards adopt `GroupCard`-style (12px radius, 1px `#E7E5E4`, white). Hotel-ID chip uses `#ECE2FF`/`#8764C9` badge. Hover bg `#F7F7F7`. Primary "New configuration" CTA = `#432975`.
- **PublishConfirmDialog** — modal card 12px radius, 1px border, design typography. Diff list rows: added `#ECFDF5`, removed `#FEF2F2`, modified white. Confirm = primary purple, Cancel = outline. Backdrop unchanged.
- **ConfirmDeleteDialog** — same modal shell. Danger button stays red (`--color-error: #EF4444`); Cancel = outline.

### 7.4 Removed visual elements

- Inline `successBox` after publish (replaced by pill + status panel pattern). The 1–2 minute caveat copy is folded into the GroupCard hint or the dialog confirmation text so it isn't lost.
- Per-tab `subTabTitle` h3 — replaced by `GroupCard` titles.
- `<hr className={sectionDivider}>` separators in DataTab — `GroupCard`s self-separate.
- `tabHint` paragraph at the top of each tab — replaced by `<PanelHeader subtitle>`.
- The current `App.module.css` `:root` palette + Inter `@import` — replaced by `tokens.css`.

## 8. Acceptance checklist (preserved features)

Every item below works **identically** after the change.

**Auth**
- [ ] `/api/auth` POST gates the admin. Wrong password → existing error UI (restyled). Success → unlocks.

**Hotels landing**
- [ ] List loads. Open a card → edit mode. New configuration → create mode. Duplicate → same `prompt()` + `/api/duplicate` flow. Delete → `ConfirmDeleteDialog` + same flow. List refreshes after delete.

**ConfigForm — load & save**
- [ ] Edit mode `GET /api/current-config/:id` populates form with the same field mapping (analytics.enabled → analyticsEnabled, etc.). 404 and network errors render restyled error UI. Loading state shown while fetching.

**Preview pane**
- [ ] Real Thum.io screenshot — same URL construction, same `isValidPublicDomain` gate, same `referrerPolicy="no-referrer"`, same `screenshotFailed` fallback to `previewBackdropDemo`-equivalent.
- [ ] Real widget iframe at `WIDGET_PREVIEW_URL` with `buildPreviewUrl(config)` — re-renders on every form change.
- [ ] ResizeObserver-driven scaling for desktop (1280×720) and mobile (390×844) viewports.
- [ ] Device toggle switches viewport sizes.

**Identity tab**
- [ ] Hotel ID disabled in edit mode, editable in create mode. All hint copy preserved.

**Data tab**
- [ ] Test connection → `GET /api/rates/:id?year=Y&month=M`. `analyzeRatesResponse` runs, errors propagate.
- [ ] On success: detected competitor (id+name) shown, no-myHotel warning shown when applicable, rooms grouped by channel with codes/names/occupancy, "informational only" caveat present.
- [ ] Auto-fill `apiCompetitorId` if empty. Auto-fill `channelsEnabled` if empty.
- [ ] Channels list only renders after a successful test. Empty-state note otherwise.
- [ ] `toggleChannel` mutates `channelsEnabled` array.

**Appearance tab**
- [ ] Conditional Delay field (mode = `time`/`time_or_scroll`). Conditional Scroll-threshold field (mode = `scroll`/`time_or_scroll`).

**Languages tab**
- [ ] `toggleLocale` keeps auto-fallback logic. Default-language select lists only enabled locales.

**Analytics tab**
- [ ] `dataLayerName` field only appears when `analyticsEnabled` is on.

**Publish tab**
- [ ] `PublishConfirmDialog` with full diff opens before push (same `diff.js`).
- [ ] `POST /api/publish` payload unchanged: `{ hotelId, config }`.
- [ ] Publishing / success / error states preserved (success now reflected by snapshot refresh + pill flipping to clean state).
- [ ] Download JSON unchanged (same `buildConfig(form)` blob, same filename).
- [ ] Copy embed code unchanged (same snippet, same 2s "Copied" confirmation).
- [ ] Same `console.info('[admin] published', ...)` log on success.

## 9. Implementation order (suggested)

Per the README's recommended order:

1. Foundation: drop in `tokens.css` + fonts + logo. Wire `@font-face`. Import tokens globally.
2. Build the 6 form primitives (`Field`, `TextInput`, `Select`, `ColorInput`, `Toggle`, `Checkbox`).
3. Build the chrome shell: `DEdgeLogo`, `TopChrome`, `TabBar`, `UnpublishedPill`, `AdminLayout`.
4. Build `BrowserChrome` + migrate `PreviewFrame` logic into `PreviewPane` + `DeviceToggle`.
5. Port each tab panel (Identity → Appearance → Data → Languages → Analytics → Publish).
6. Restyle `PublishConfirmDialog`, `HotelsLanding`, `ConfirmDeleteDialog`, `AuthScreen`.
7. Wire `useUnpublishedDiff` and the snapshot refs in `ConfigForm`.
8. Delete `App.module.css` once nothing imports it. Verify nothing references the old Inter / `--brand` tokens.
9. Manual QA against the Section 8 checklist in the dev server. Test happy path + edge cases for every tab.

## 10. Out of scope (explicitly)

- Routing changes (the existing tab state stays in React state; React Router `<Outlet>` migration is not part of this port).
- Real autosave (only the dirty indicator).
- Font Awesome integration.
- Floating help button.
- "Last published 2 days ago by ..." metadata in the Publish tab Status card (no backend field today).
- Any change to backend endpoints, payload shapes, or `constants.js`.
