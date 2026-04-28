// Admin UI constants

export const WIDGET_PREVIEW_URL =
  'https://vturlin.github.io/best-price-widget/transparent.html';

// Lead-gen widget — same transparent.html pattern, different repo.
export const LEAD_GEN_PREVIEW_URL =
  'https://vturlin.github.io/lead-gen-widget/transparent.html';

// Tabs for the lead-gen config form. Trimmed compared to the best-price
// tabs because the widget has fewer dimensions to configure.
export const LEAD_GEN_TABS = [
  { key: 'identity',   label: 'Identity' },
  { key: 'content',    label: 'Content' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'publish',    label: 'Publish' },
];

// Lead-gen image-pane width presets (desktop only — mobile reflows
// the image to 100% width regardless). The card width tracks the
// chosen image size so the content pane stays at a comfortable
// 340px regardless of the preset. Values are bounded server-side
// in the widget loader to 180–500px.
export const LEAD_GEN_IMAGE_WIDTHS = [
  { value: 220, label: 'Compact (220px)' },
  { value: 300, label: 'Standard (300px)' },
  { value: 380, label: 'Large (380px)' },
  { value: 440, label: 'Wide (440px)' },
];

// ── Stress-marketing widget ─────────────────────────────────────────

export const STRESS_PREVIEW_URL =
  'https://vturlin.github.io/stress-widget/transparent.html';

export const STRESS_TABS = [
  { key: 'identity', label: 'Identity' },
  { key: 'content',  label: 'Content' },
  { key: 'publish',  label: 'Publish' },
];

// Three urgency / social-proof toast formats. The variant key drives
// which fields are shown in the Content tab and which sub-component
// the widget renders at runtime.
export const STRESS_VARIANTS = [
  { value: 'just-booked',  label: 'Just booked (live notification)' },
  { value: 'scarcity',     label: 'Scarcity (only X rooms left)' },
  { value: 'social-proof', label: 'Social proof (booking activity)' },
];

// Rate screener API channels (from AvailPro)
export const API_CHANNELS = {
  17: { name: 'Direct', isDirect: true },
  10: { name: 'Booking.com', isDirect: false },
  9:  { name: 'Expedia', isDirect: false },
  27:  { name: 'Agoda', isDirect: false },
  };

// Tabs in the admin form. Per-hotel stats live on a dedicated screen
// reached from the landing card's "Stats" button — not as a tab.
export const TABS = [
  { key: 'identity',   label: 'Identity' },
  { key: 'data',       label: 'Data' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'languages',  label: 'Languages' },
  { key: 'analytics',  label: 'Analytics' },
  { key: 'publish',    label: 'Publish' },
];

// Tracked widget events. Stats UI assumes this order for funnel display.
export const TRACKED_EVENTS = [
  { key: 'widget_loaded', label: 'Loaded' },
  { key: 'widget_opened', label: 'Opened' },
  { key: 'book_clicked',  label: 'Book clicked' },
  { key: 'sale',          label: 'Sale' },
];

// Widget position on screen
export const POSITIONS = [
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'bottom-left',  label: 'Bottom left' },
  { value: 'center-right', label: 'Middle right' },
  { value: 'center-left',  label: 'Middle left' },
  { value: 'top-right',    label: 'Top right' },
  { value: 'top-left',     label: 'Top left' },
];

// Widget size
export const SIZES = [
  { value: 'small',  label: 'Small (default)' },
  { value: 'medium', label: 'Medium' },
  { value: 'large',  label: 'Large' },
];

// Whole-widget design. 'default' = wax-seal toggle + standard
// floating panel. 'ticker' = full-width bottom rail with marquee
// + dark panel that expands upward (Bloomberg terminal aesthetic).
// 'vegas' = bordeaux/gold slot machine — three reels spin in cascade
// and settle on the direct rate as the cheapest. Switching this
// changes both the closed and the open state.
export const WIDGET_DESIGNS = [
  { value: 'default', label: 'Default (wax seal + panel)' },
  { value: 'ticker',  label: 'Ticker (bottom rail + dark panel)' },
  { value: 'vegas',   label: 'Vegas (slot machine)' },
];

// Sub-variants of the Vegas design — ornament density only, the slot
// behaviour is identical across all four. Ordered from sober to
// extravagant. Only consumed when widgetDesign === 'vegas'.
export const VEGAS_VARIANTS = [
  { value: 'sobre',       label: 'Sober (matte, no bulbs)' },
  { value: 'standard',    label: 'Standard (static bulbs, default)' },
  { value: 'riche',       label: 'Rich (double bulbs + ornaments)' },
  { value: 'extravagant', label: 'Extravagant (bulb chase + neon)' },
];

// Auto-open modes
export const AUTO_OPEN_MODES = [
  { value: 'disabled',       label: 'Disabled' },
  { value: 'time',           label: 'After a delay' },
  { value: 'scroll',         label: 'On scroll' },
  { value: 'time_or_scroll', label: 'Delay or scroll (first wins)' },
];

// Auto-open delay options
export const AUTO_OPEN_DELAYS = [
  { value: 3,  label: '3 seconds' },
  { value: 5,  label: '5 seconds' },
  { value: 8,  label: '8 seconds (recommended)' },
  { value: 15, label: '15 seconds' },
  { value: 30, label: '30 seconds' },
];

// Scroll thresholds
export const SCROLL_THRESHOLDS = [
  { value: 25, label: '25% of page' },
  { value: 50, label: '50% of page' },
];

// Supported locales
export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'he', name: 'עברית' },
  { code: 'ru', name: 'Русский' },
  { code: 'pl', name: 'Polski' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'sv', name: 'Svenska' },
  { code: 'no', name: 'Norsk' },
  { code: 'da', name: 'Dansk' },
  { code: 'fi', name: 'Suomi' },
  { code: 'el', name: 'Ελληνικά' },
];