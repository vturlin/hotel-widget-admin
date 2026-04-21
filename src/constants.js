// Admin UI constants — kept separate from App.jsx for clarity.

// URL of the widget's preview page (transparent background, no demo content)
export const WIDGET_PREVIEW_URL =
  'https://vturlin.github.io/best-price-widget/transparent.html';

// Rate screener API channels (from AvailPro)
// These IDs match the API response; names are what we show in the widget.
export const API_CHANNELS = {
  17: { name: 'Direct', slug: 'direct',  isDirect: true },
  10: { name: 'Booking.com', slug: 'booking', isDirect: false },
  9:  { name: 'Expedia',  slug: 'expedia', isDirect: false },
};

// Default: show all channels
export const DEFAULT_CHANNELS_ENABLED = [17, 10, 9];

// Tabs in the admin form
export const TABS = [
  { key: 'identity',   label: 'Identity' },
  { key: 'data',       label: 'Data' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'languages',  label: 'Languages' },
  { key: 'analytics',  label: 'Analytics' },
  { key: 'publish',    label: 'Publish' },
];

// Supported locales in the widget
export const LOCALES = [
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