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

/**
 * Validate that a string looks like a legitimate public domain.
 * Used to guard what we send to the screenshot service.
 *
 * Rejects:
 *   - localhost, 127.x.x.x, 0.0.0.0
 *   - RFC1918 private ranges (10.x, 172.16-31.x, 192.168.x)
 *   - IP addresses in general (Thum.io accepts them but we don't want
 *     to leak internal network topology)
 *   - URLs with paths, queries, or fragments (only bare host)
 *   - Anything that doesn't match a strict domain regex
 */
export function isValidPublicDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) return false;

  // Strip protocol if present
  let host = trimmed.replace(/^https?:\/\//, '');
  // Strip anything after the host (path/query/fragment)
  host = host.split('/')[0].split('?')[0].split('#')[0];
  if (!host) return false;

  // Reject localhost variants
  if (host === 'localhost' || host.endsWith('.localhost')) return false;
  if (host === '0.0.0.0') return false;

  // Reject IP addresses (private AND public — screenshots of IPs look
  // unprofessional and the field is meant for hotel domains)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  if (/^\[[0-9a-f:]+\]$/.test(host)) return false; // IPv6 literal

  // Must contain at least one dot (TLD)
  if (!host.includes('.')) return false;

  // Must match a basic domain regex:
  //   labels separated by dots, each label 1-63 chars, alphanumeric or
  //   hyphen (but not starting/ending with hyphen)
  const domainRe = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
  if (!domainRe.test(host)) return false;

  return true;
}