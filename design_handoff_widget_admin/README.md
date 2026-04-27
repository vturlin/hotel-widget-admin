# Handoff: Best Price Widget — Admin Redesign

## Overview

This package contains the redesigned admin section for the **Best Price Widget** — a React app where hotel operators configure how the widget will look and behave on their own website. The admin is composed of a top chrome (logo, breadcrumb, hotel-ID badge, save status, Publish CTA), a tab bar, a **left preview pane** showing the hotel's actual website (fetched as a screenshot via API) with the widget overlaid, and a **right configuration rail** with grouped form sections.

There are six tabs: **Identity, Data, Appearance, Languages, Analytics, Publish.**

The redesign aligns the entire admin to the **D-EDGE CRM design system** (formerly LoungeUp) — purple-led, dense operator UI, Open Sans, warm-stone neutrals.

## About the Design Files

The files in this bundle are **design references created in HTML/JSX** — prototypes showing intended look and behavior, **not production code to copy directly**. They run in the browser via `<script type="text/babel">` and use inline `style={…}` objects for speed.

Your task is to **recreate these designs in the existing React codebase** (`hotel-widget-configs`) using whatever component / styling conventions already exist there (CSS Modules, styled-components, Tailwind, vanilla CSS — adopt whatever the codebase uses). Don't ship the inline-style JSX as-is; convert to the project's pattern.

## Fidelity

**High-fidelity (hifi).** Pixel-perfect mockups with final colors, typography, spacing, radii, shadows, and interactions. Reproduce as closely as possible. Specific values are listed in **Design Tokens** below.

## Recommended Layout

The bundle includes three layout variations (V1, V2, V3) for comparison. **V1 — "Classic split, polished"** is the recommended direction and is what you should implement. V2 (full-bleed) and V3 (stacked rail) are alternates kept for reference. The README assumes V1 unless stated.

---

## Global Chrome (present on every tab)

### Top bar (height 56px, white, 1px bottom border `#E7E5E4`, padding 0 24px)

Left → right:
1. **D-EDGE logo** (height 20px) — wordmark `d·edge` with teal mid-dot. Use the SVG in `assets/logo.svg` if available; otherwise the markup in `shared.jsx → DEdgeLogo`.
2. 1px × 20px vertical divider (`#E7E5E4`).
3. Breadcrumb: `"Hotels"` (13px, `#666`) → `›` separator (`#C9C5C2`) → **`"Hôtel Demo"`** (14px, weight 600, `#424242`).
4. **Hotel-ID badge** — UPPERCASE, `hm_demo001`, 10px / weight 600 / letter-spacing 0.04em, padding 2/8px, background `#ECE2FF`, color `#8764C9`, radius 2px.
5. *Margin-left: auto* pushes the right cluster:
6. **Save status pill** — three states: `Saved` (green dot `#10B981`, "Saved 2s ago"), `Saving` (purple pulsing dot, "Saving…"), `Unsaved` (amber dot `#F59E0B`, "Unsaved changes"). 12px text, `#666`. Implementation in `shared.jsx → SaveStatus`.
7. **Preview live** — outline button: 1px `#432975` border, `#432975` text, transparent bg, 7/14px padding, 6px radius, 13px / weight 500.
8. **Publish** — primary button: `#432975` bg, white text, 8/16px padding, 6px radius.

### Tab bar (height 48px, white, 1px bottom border `#E7E5E4`, padding 0 24px)

Six tabs (sentence case): **Identity · Data · Appearance · Languages · Analytics · Publish**. Each is a button:
- Inactive: 14px / weight 500, `#666`, transparent border-bottom.
- Active: weight 600, color `#432975`, 2px solid `#432975` bottom border (overlapping the chrome border by `marginBottom: -1`).
- Padding: 0 16px.

### Main split

- CSS Grid `gridTemplateColumns: 1fr 460px`. Left = preview, right = config rail.
- Page background `#FBFAF9` (warm white).

### Preview pane (left)

- Padding 24px around.
- **Browser chrome card** (`shared.jsx → BrowserChrome`) — fills available height. Components: traffic-light dots (red `#FF5F57`, amber `#FEBC2E`, green `#28C840`, 12px circles), URL pill (the value of `form.hotelDomain`), 1px border `#E7E5E4`, 12px radius, white background.
- Inside the browser chrome: the **hotel-website backdrop** (in production, a screenshot fetched from your API; the prototype uses `HotelBackdrop` as a CSS-rendered placeholder).
- The **widget** (`shared.jsx → WidgetPreview`) is `position: absolute` inside, anchored per `form.position` (16px from the chosen corner).
- Below the preview, a **Desktop / Mobile segmented control** — pill style: 4px padding, 999px radius, white bg with `#E7E5E4` border, soft shadow. Selected button has `#432975` bg + white text; unselected is transparent + `#666` text. 6/18px padding per button.

### Config rail (right)

- Width 460px.
- Background white, 1px left border `#E7E5E4`, padding 24px (with extra 40px bottom for scroll comfort), `overflow: auto`.
- Each tab renders its own **panel** (Identity / Appearance / etc.). Panels share two layout primitives:
  - **`PanelHeader`** — h2 title (20px / weight 600 / `#424242` / line-height 1.2) + subtitle (14px / `#666` / line-height 1.5 / margin-top 6px). 24px bottom margin.
  - **`GroupCard`** — section card. Background `#fff`, 1px `#E7E5E4` border, 12px radius, 20px padding, 16px between cards. Header: 13px / weight 600 title + optional 12px / `#666` hint. Optional `action` slot in the top-right (used for "Test connection" button in Data).

---

## Form Primitives (in `shared.jsx`)

Reproduce these as real components in the codebase. Suggested file: `src/components/forms/`.

### `Field`
Wrapper for a labelled control.
- Label: 13px / weight 600 / `#424242` / 6px bottom margin. Optional inline "optional" tag (11px / weight 400 / `#999`).
- Children render the control.
- Optional **hint** below the control: 12px / `#666` / line-height 1.45 / margin-top 6px.
- 16px bottom margin between fields.

### `TextInput`
- Container: 1px `#E7E5E4` border, 4px radius, white bg, focus state = 2px `#432975` outline.
- Padding: 8/12px.
- Font: 14px / Open Sans (or 13px monospace `"SF Mono", Menlo` when `monospace` prop is set — used for IDs).
- Optional `prefix` (e.g. "https://") rendered inline before the input value, color `#999`.
- Disabled: bg `#F7F7F7`, color `#999`, cursor `not-allowed`.

### `Select`
- Same outer styling as TextInput.
- Custom chevron (Font Awesome `fa-chevron-down` or inline SVG) on the right, 12px, `#666`.
- Native `<select>` with `appearance: none` is fine.

### `ColorInput`
- Big swatch (full width, 36px tall, 4px radius, 1px `#E7E5E4` border) showing current color.
- Below: hex input (monospace, 13px) + a row of 5 preset swatches (24×24, 4px radius). Click a preset = set value. Brand presets shown for "Brand color" are `['#8B5A3C', '#1F5135', '#3E2D5A', '#B43A2A', '#1A1A1A']`; for "Background" are `['#FAF7F2', '#FFFFFF', '#F4EFE8', '#1A1A1A', '#F0E9DD']`. The first preset is the "current value" if it matches.

### `Toggle`
- 36×20 pill, 1px `#E7E5E4` border. On = `#432975` bg + white knob (16px, translates 16px right). Off = white bg + `#E7E5E4` knob.
- Label (14px / weight 500) + optional hint (12px / `#666`) to the right.

### `Checkbox`
- 16×16 box, 4px radius, 1px `#E7E5E4` border. Checked = `#432975` bg + white tick (Font Awesome `fa-check` or SVG, 10px).
- Label (14px / `#424242`) and optional `suffix` (12px / `#999`, right-aligned via `marginLeft: auto`). Whole row is hoverable: bg `#F7F7F7`. 8/4px padding, 2px between rows.

---

## Tab-by-Tab Specs

### 1. Identity

**Subtitle:** "Basic information about the hotel and how to identify it."

- **Card "Identification"** (hint: "Used internally and to fetch the right config.")
  - **Hotel ID** — disabled monospace TextInput. Hint: "Locked in edit mode. To change the ID, duplicate this configuration instead."
  - **Hotel name** — TextInput.
- **Card "Web presence"** (hint: "Where the widget will be embedded.")
  - **Client domain** — TextInput with `https://` prefix. Hint: "Used to fetch a screenshot of the hotel's homepage as the preview backdrop. Falls back to a neutral demo if empty or invalid."
  - **Logo URL** (optional) — TextInput. Hint: "If provided, shown in the widget header instead of the hotel name."

### 2. Data

**Subtitle:** "Rates are fetched live from the AvailPro RateScreener API."

- **Card "API connection"** (hint: "Identifiers provided by AvailPro for this property.", action button: "Test connection" — outline-purple, small).
  - **API Hotel ID** — monospace TextInput.
  - **Competitor ID** — monospace TextInput. Hint: "Auto-detected via myHotel:true. Set manually only if detection fails."
  - **Status banner** below — green panel: 10/12px padding, bg `#ECFDF5`, 1px border `#BBF7D0`, 6px radius, 12px text color `#1F5135`. Layout: 8px green dot + two-line text ("Connection OK" weight 600, then "Last screening: …" muted).
- **Card "Channels to display"** (hint: "Only checked channels appear in the price comparison.")
  - List of Checkbox rows. Each: channel name + optional UPPERCASE "DIRECT" badge (purple, identical to Hotel-ID badge) + suffix "N rooms" (right-aligned). Mock data: Direct (6 rooms, direct), Booking.com (4), Expedia (4), Agoda (3).
- **Card "Booking link"**
  - **Reserve URL template** — TextInput. Hint mentions placeholders `{checkIn}`, `{checkOut}` rendered as inline `<code>` (bg `#F2EFEC`, 0/4px padding, 2px radius).
  - **Currency** — Select (EUR €, USD $, GBP £, CHF).

### 3. Appearance

**Subtitle:** "Colors, position, and opening behaviour."

- **Card "Colors"** (hint: "Match the hotel's brand. Apply live to the preview.")
  - **Brand color** — ColorInput. Hint: "Buttons and accents."
  - **Background** — ColorInput. Hint: "Widget panel fill."
- **Card "Placement"**
  - **Position on screen** — Select (Bottom right / Bottom left / Top right / Top left).
  - **Widget size** — Select (Small (default) / Medium / Large). Hint: "Overall scale of the widget. Small is discreet, large draws more attention."
- **Card "Auto-open behaviour"** (hint: "When the widget opens itself for the first time in the session.")
  - **Auto-open trigger** — Select (Disabled / After a delay / On scroll / Delay or scroll (first wins)).
  - **Delay before opening** — Select, only shown when trigger is `time` or `time_or_scroll` (3s / 5s / 8s recommended / 15s).

### 4. Languages

**Subtitle:** "Which languages the widget offers, and which one it falls back to."

- **Card "Enabled languages"** — dynamic hint: `"${enabled.length} of ${total} languages enabled. The widget auto-detects the browser language."`
  - 2-column grid of Checkboxes, one per supported locale. Locale list: English, Français, Español, Deutsch, Italiano, Português, Nederlands, 日本語. Suffix column shows the locale code (`en`, `fr`, etc.).
  - When unchecking the locale that's currently the default fallback, auto-set fallback to first-still-enabled locale.
- **Card "Fallback"** (hint: "Used when the browser language is not in the enabled list.")
  - **Default language** — Select containing only currently-enabled locales.

### 5. Analytics

**Subtitle:** 'DataLayer events pushed when users interact with the widget. All events are prefixed `dedge_widget_`.' (the `dedge_widget_` part rendered as inline `<code>` with bg `#F2EFEC`).

- **Card "Tracking"** (hint: "Connect to your existing analytics setup.")
  - **Toggle** "Enable dataLayer push". Hint: "Disable if you don't use Google Tag Manager or a compatible setup."
  - **DataLayer variable name** — monospace TextInput. Only shown when toggle is on. Hint mentions default `dataLayer` (GTM standard) as inline `<code>`.
- **Card "Events emitted"** (hint: "The widget pushes these events when relevant. No configuration needed.")
  - List of 4 events. Each row: 8px vertical padding, 1px bottom border `#F2EFEC`. Layout = inline `<code>` chip (12px, `#432975` text, bg `#F7F4FB`, 2/8px padding, 4px radius, weight 500) + 13px description (`#666`).
  - Events:
    - `dedge_widget_opened` — User opens the widget
    - `dedge_widget_closed` — User dismisses the widget
    - `dedge_widget_viewed` — Widget enters the viewport
    - `dedge_widget_book_click` — User clicks the Book CTA

### 6. Publish

**Subtitle:** "Save the configuration so the widget can load it on the hotel website."

- **Card "Status"** (hint: "Last published 2 days ago by …" — replace with real metadata)
  - **Inner status panel** — bg `#FBFAF9`, 1px `#E7E5E4` border, 8px radius, 12/14px padding. Row: 8px amber dot (`#F59E0B`, with a 3px `#F59E0B22` ring via box-shadow) + two-line text ("3 unpublished changes" weight 600, then comma-separated list of changed fields, 12px / `#666`).
  - Below: button row, 8px gap, 12px top margin.
    - **Publish changes** — primary, `flex: 1`, `#432975` bg, 10/16px padding, 6px radius, 14px / weight 600.
    - **Download JSON** — secondary outline (1px `#E7E5E4` border, `#424242` text).
- **Card "Embed code"** (hint: "Paste this just before the closing `</body>` tag, or push it through GTM.")
  - **Code block** — bg `#1F1610`, 6px radius, 14px padding, 12px monospace `"SF Mono", Menlo`, color `#E7E5E4`, line-height 1.55, `position: relative`.
  - Syntax tinting (use a real syntax highlighter in production, e.g. Prism, Shiki — the prototype hard-codes spans):
    - tags / punctuation: `#C9B79A`
    - attribute names: `#A5C8A0`
    - attribute values: `#FED7AA`
  - **Copy button** absolute top-right (8/8): bg `rgba(255,255,255,0.08)`, 1px `rgba(255,255,255,0.12)` border, white text, 4/10px padding, 4px radius, 11px.

---

## Interactions & Behavior

- **Save flow.** Every form mutation should mark the form dirty and trigger autosave (debounced ~600ms). The save-status pill cycles `unsaved → saving → saved`. The Publish button takes the most-recently-saved state and pushes it live.
- **Live preview.** Every form mutation should immediately re-render `WidgetPreview` so colors, position, size, etc. update without a save round-trip.
- **Position picker.** Changing `position` moves the absolute-positioned widget to the chosen corner.
- **Device toggle.** Switches the backdrop between desktop and mobile screenshots fetched from your API. The widget itself can stay the same size or scale down on mobile — match your existing widget behavior.
- **Tab navigation.** Each tab is a separate route (e.g. `/hotels/:id/identity`, `/hotels/:id/appearance`). Use React Router's `<Outlet>` so the chrome and preview pane stay mounted across tab changes.
- **Channel checklist (Data tab).** Unchecking the last channel should be guarded — at least one channel required, or show a warning.
- **Locale checklist (Languages tab).** Same guard — at least one locale required. Auto-update the fallback `defaultLocale` if the current default is unchecked.
- **Conditional fields.** "Delay before opening" only appears when auto-open trigger is `time` or `time_or_scroll`. "DataLayer variable name" only appears when analytics toggle is on.
- **Animations.** Per D-EDGE design system: minimal — Chakra-default 120–150ms color/bg transitions on hover and focus. No scale transforms, no bounces.
- **Hover states.** Buttons darken slightly. Nav items shift to `#F7F7F7`. Table-like rows take a faint tint.
- **Focus rings.** 2px solid outline in `#432975` (or your existing focus token).
- **Floating help button.** Per D-EDGE system: bottom-right of viewport, fixed, 40px circle, white, red `?`. (Not in the prototype — add if your codebase already has one.)

## State Management

The form is one object — keep using whatever you have (Redux / Zustand / React Hook Form / `useReducer`). The shape used in the prototype is `DEFAULT_FORM` in `shared.jsx`:

```js
{
  hotelId, hotelName, hotelDomain, logoUrl,
  apiHotelId, apiCompetitorId, channelsEnabled: number[],
  reserveUrl, currency,
  position, size, brandColor, backgroundColor,
  enabledLocales: string[], defaultLocale,
  autoOpenMode, autoOpenDelay, autoOpenScrollPercent,
  analyticsEnabled, dataLayerName,
}
```

Add a separate `meta` slice for `saveStatus`, `lastSavedAt`, `lastPublishedAt`, `pendingFields`.

## Design Tokens

Source of truth: `tokens.css` (already aligned with D-EDGE CRM). Key values:

### Color
| Token | Value | Use |
|---|---|---|
| Brand purple | `#432975` | Buttons, active tabs, links, badge text |
| Mid purple | `#7E65AE` | Active-item highlight, hero tint |
| Light purple | `#ECE2FF` | Badge / tag background |
| Page bg | `#FBFAF9` | Page background |
| Surface | `#FFFFFF` | Cards |
| Border | `#E7E5E4` | All separators, input borders |
| Text primary | `#424242` | Body, headings |
| Text secondary | `#666666` | Hints, muted labels |
| Text disabled | `#999999` | Placeholders, "optional" tags |
| Hover bg | `#F7F7F7` | Row / button hover |
| Success | `#10B981` | OK dot |
| Success bg | `#ECFDF5` | OK banner bg |
| Success border | `#BBF7D0` | OK banner border |
| Success text | `#1F5135` | OK banner text |
| Warning | `#F59E0B` | Unsaved / pending dot |
| Error | `#EF4444` | Error dot |

### Typography
- Family: **Open Sans** (variable). Self-host from `fonts/`.
- Sizes: 10 (badge) · 11 (optional) · 12 (hint, table header, badge) · 13 (button, small label, field label) · 14 (body, input) · 20 (page H1).
- Weights used: 400, 500, 600, 700.
- Code: `"SF Mono", Menlo, monospace`, 12–13px.

### Spacing scale
4 / 8 / 12 / 16 / 24 px. Page padding 24px. Card padding 20px. Field bottom margin 16px. Card bottom margin 16px.

### Radius
- 2px — badges, small chips
- 4px — inputs, code chips
- 6px — buttons, tabs, status banners, primary cards, code blocks
- 12px — content cards (`GroupCard`), browser-chrome card
- 999px — segmented-control pills, avatars, dot rings

### Shadows
- Card shadow (primary widgets only): `0 4px 8px rgba(51,51,51,0.1), 0 0 1px rgba(51,51,51,0.3)`
- Segmented-control: `0 2px 6px rgba(0,0,0,0.04)`
- Otherwise: rely on 1px borders, no shadow.

## Assets

- `assets/logo.svg` — D-EDGE wordmark.
- `fonts/OpenSans-VariableFont_wdth_wght.ttf` and `OpenSans-Italic-VariableFont_wdth_wght.ttf` — self-hosted variable fonts.
- **Icons.** The prototype uses unicode `›` for the breadcrumb. Production should use **Font Awesome 6** per the D-EDGE system (solid for chrome, regular for content actions). Replace placeholder glyphs with `fa-solid fa-*` classes.
- **Hotel screenshot.** The prototype's `HotelBackdrop` is a CSS-rendered placeholder. Replace with the screenshot returned by your existing API. Render as a `background-image` on the inner content area of `BrowserChrome`.
- **Widget preview.** The prototype's `WidgetPreview` is a static recreation. Replace with your real widget component, mounted inside the preview frame and styled by the same `form` state.

## Files

| File | What it is |
|---|---|
| `Widget admin redesign.html` | Entry point — open in a browser to see all 3 layouts × 6 tabs in the design canvas. |
| `shared.jsx` | Tokens, mock data, primitives (`Field`, `TextInput`, `Select`, `ColorInput`, `Toggle`, `Checkbox`), preview parts (`HotelBackdrop`, `BrowserChrome`, `WidgetPreview`, `DEdgeLogo`, `SaveStatus`). |
| `v1-classic.jsx` | **Implement this one.** Tab-driven admin with all 6 panels. |
| `v2-floating.jsx` | Alternate layout (full-bleed preview, floating panel). Reference only. |
| `v3-stacked.jsx` | Alternate layout (config rail left, tall preview right). Reference only. |
| `design-canvas.jsx` | Canvas helper (pan/zoom). Not needed for the real app. |
| `tokens.css` | Design tokens as CSS custom properties. Drop into the codebase. |
| `fonts/` | Self-hosted Open Sans variable. |
| `assets/logo.svg` | D-EDGE wordmark. |

## Implementation Order (suggested)

1. Drop in `tokens.css` and `fonts/`. Wire Open Sans `@font-face` and import the tokens once globally.
2. Build the form primitives (`Field`, `TextInput`, `Select`, `ColorInput`, `Toggle`, `Checkbox`) as real components in your codebase's style convention.
3. Build the chrome shell (`AdminLayout`) — top bar, tab bar, grid split, preview pane, config rail. Wire React Router with `<Outlet>`.
4. Build `BrowserChrome` + integrate the real screenshot API + mount the live `WidgetPreview` inside.
5. Port each tab panel one at a time: Identity → Appearance → Data → Languages → Analytics → Publish.
6. Wire autosave + the `SaveStatus` indicator.
7. Replace placeholder icons with Font Awesome 6.

If anything is ambiguous, the inline-styled JSX prototype is the source of truth — match its values pixel for pixel.
