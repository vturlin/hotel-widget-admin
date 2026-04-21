// Admin UI constants

export const WIDGET_PREVIEW_URL =
  'https://vturlin.github.io/best-price-widget/transparent.html';

// Rate screener API channels (from AvailPro)
export const API_CHANNELS = {
  17: { name: 'Direct', isDirect: true },
  10: { name: 'Booking.com', isDirect: false },
  9:  { name: 'Expedia', isDirect: false },
  27:  { name: 'Agoda', isDirect: false },
  };

// Tabs in the admin form
export const TABS = [
  { key: 'identity',   label: 'Identity' },
  { key: 'data',       label: 'Data' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'languages',  label: 'Languages' },
  { key: 'analytics',  label: 'Analytics' },
  { key: 'publish',    label: 'Publish' },
];

// Widget position on screen
export const POSITIONS = [
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'bottom-left',  label: 'Bottom left' },
  { value: 'top-right',    label: 'Top right' },
  { value: 'top-left',     label: 'Top left' },
];

// Widget size
export const SIZES = [
  { value: 'small',  label: 'Small (default)' },
  { value: 'medium', label: 'Medium' },
  { value: 'large',  label: 'Large' },
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

// Currencies
export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

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