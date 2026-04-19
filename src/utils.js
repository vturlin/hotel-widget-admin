/**
 * Generate a short, unique hotel ID like 'hm_a1b2c3d4'.
 */
export function generateHotelId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `hm_${suffix}`;
}

/**
 * Parse a textarea value where each line is "id | name".
 */
export function parseRoomsText(text) {
  return text
    .trim()
    .split('\n')
    .map((line) => {
      const [id, name] = line.split('|').map((s) => s.trim());
      return id && name ? { id, name } : null;
    })
    .filter(Boolean);
}

/**
 * Build the widget config JSON from the form state.
 */
export function buildConfig(form) {
  return {
    position: form.position,
    csvUrl: form.csvUrl,
    roomOptions: form.rooms,
    default_room_id: form.defaultRoomId,
    reserveUrl: form.reserveUrl,
    currency: form.currency,
    locale: '',
    brandColor: form.brandColor,
    backgroundColor: form.backgroundColor,
    logoUrl: form.logoUrl,
    hotelName: form.hotelName,
    enabledLocales: form.enabledLocales,
    defaultLocale: form.defaultLocale,
    channelLabels: form.channelLabels,
    analytics: {
      enabled: form.analyticsEnabled,
      dataLayerName: form.dataLayerName,
    },
    autoOpenMode: form.autoOpenMode || 'disabled',
    autoOpenDelay: form.autoOpenDelay || 0,
    autoOpenScrollPercent: form.autoOpenScrollPercent || 0,
  };
}

/**
 * Encode the config as urlsafe base64 and build the preview URL.
 * We UTF-8 encode first because native btoa can't handle non-ASCII.
 */
/**
 * Build the URL for the admin preview iframe.
 *
 * Encodes the current form's config as urlsafe base64 and passes it via
 * ?preview=<b64> to the widget's demo page. The widget's loader decodes
 * this and uses it as the live config — this is how the admin gets
 * real-time WYSIWYG updates when the user edits colors, names, etc.
 *
 * We always force _preview: true on the config before encoding so the
 * widget knows to use hardcoded demo prices (never the real CSV). This
 * is critical: it prevents real-looking prices from appearing in the
 * admin from a half-configured hotel.
 *
 * UTF-8 safe via TextEncoder — a plain btoa() breaks on accented chars
 * like "Hôtel Marquise".
 */
export function buildPreviewUrl(baseUrl, config) {
  const previewConfig = { ...config, _preview: true };
  const json = JSON.stringify(previewConfig);

  // UTF-8 safe: encode string → bytes → base64, then make it urlsafe
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${baseUrl}?preview=${b64}`;
}