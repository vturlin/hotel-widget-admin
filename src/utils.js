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
      eventPrefix: form.eventPrefix,
    },
    autoOpenDelay: form.autoOpenDelay || 0,
  };
}

/**
 * Encode the config as urlsafe base64 and build the preview URL.
 * We UTF-8 encode first because native btoa can't handle non-ASCII.
 */
export function buildPreviewUrl(baseUrl /* , config — unused for now */) {
  return `${baseUrl}?id=preview`;
}