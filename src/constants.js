export const SUPPORTED_LOCALES = {
  en: 'English', fr: 'Français', es: 'Español', de: 'Deutsch', it: 'Italiano',
  pt: 'Português', nl: 'Nederlands', pl: 'Polski', ru: 'Русский', cs: 'Čeština',
  sv: 'Svenska', da: 'Dansk', no: 'Norsk', fi: 'Suomi', el: 'Ελληνικά',
  tr: 'Türkçe', zh: '中文', ja: '日本語', ko: '한국어', ar: 'العربية',
};

export const SUPPORTED_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY',
];

export const POSITIONS = {
  'bottom-right': 'Bottom right',
  'bottom-left': 'Bottom left',
  'center-right': 'Center right',
  'center-left': 'Center left',
};

// Points to the deployed widget demo page. Overridable via build-time env
// var (prefixed VITE_ to be exposed to the browser by Vite).
export const WIDGET_PREVIEW_URL =
  'https://vturlin.github.io/best-price-widget/transparent.html';

export const TABS = [
  { key: 'identity',   label: 'Identity' },
  { key: 'data',       label: 'Data' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'languages',  label: 'Languages' },
  { key: 'analytics',  label: 'Analytics' },
  { key: 'publish',    label: 'Publish' },
];
