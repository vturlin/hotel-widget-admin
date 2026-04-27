// Standard d-edge booking engine URL template. {BE_ID} is the per-hotel
// Booking Engine identifier; everything else is constant across the d-edge
// estate served by this admin.
const BE_URL_TEMPLATE =
  'https://www.secure-hotel-booking.com/d-edge/be/{BE_ID}/6671/fr-FR/RoomSelection?arrivalDate={checkIn}&departureDate={checkOut}';

const BE_URL_PATTERN =
  /^https:\/\/www\.secure-hotel-booking\.com\/d-edge\/be\/([^/]+)\/6671\/fr-FR\/RoomSelection\?arrivalDate=\{checkIn\}&departureDate=\{checkOut\}$/;

export function buildBookingEngineUrl(beId) {
  const id = (beId || '').toString().trim();
  if (!id) return '';
  return BE_URL_TEMPLATE.replace('{BE_ID}', encodeURIComponent(id));
}

// Returns the BE ID if `url` is a standard d-edge booking-engine URL,
// otherwise null. Used at load time to detect whether an existing config
// can be edited via the BE ID field or needs the custom-URL escape hatch.
export function parseBookingEngineUrl(url) {
  if (!url) return null;
  const m = String(url).match(BE_URL_PATTERN);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Build the config JSON that gets published to GitHub. API-only: no more
 * CSV mode, no more room options, no more channel labels. Channels are
 * hardcoded in the widget (see API_CHANNELS in constants.js).
 *
 * `reserveUrl` is derived from `bookingEngineId` unless `useCustomReserveUrl`
 * is true, in which case `form.reserveUrl` is shipped verbatim. Both source
 * fields are also persisted so the admin can restore the right edit mode.
 */
export function buildConfig(form) {
  const reserveUrl = form.useCustomReserveUrl
    ? (form.reserveUrl || '')
    : buildBookingEngineUrl(form.bookingEngineId);

  return {
    hotelName: form.hotelName || '',
    hotelDomain: form.hotelDomain || '',
    // Data source — always API
    apiHotelId: parseInt(form.apiHotelId, 10) || null,
    apiCompetitorId: form.apiCompetitorId
      ? parseInt(form.apiCompetitorId, 10)
      : null,
    channelsEnabled: Array.isArray(form.channelsEnabled)
      ? form.channelsEnabled.map(Number).filter((n) => Number.isInteger(n))
      : [17, 10, 9],
    reserveUrl,
    bookingEngineId: form.bookingEngineId || '',
    useCustomReserveUrl: !!form.useCustomReserveUrl,
    currency: form.currency || 'EUR',
    position: form.position || 'bottom-right',
    size: form.size || 'small',
    toggleDesign: form.toggleDesign === 'ticker' ? 'ticker' : 'default',
    brandColor: form.brandColor || '#1a1a1a',
    // Optional override for the closed-state wax-seal toggle.
    // Empty string lets the widget fall back to brandColor.
    toggleColor: (form.toggleColor || '').trim() || '',
    backgroundColor: form.backgroundColor || '#faf7f2',
    enabledLocales: form.enabledLocales || ['en'],
    defaultLocale: form.defaultLocale || 'en',
    autoOpenMode: form.autoOpenMode || 'disabled',
    autoOpenDelay: form.autoOpenDelay || 8,
    autoOpenScrollPercent: form.autoOpenScrollPercent || 50,
    analytics: {
      enabled: !!form.analyticsEnabled,
      dataLayerName: form.dataLayerName || 'dataLayer',
    },
    // First-party tracker (Phase 1). Just a flag: the actual endpoint
    // is fixed in the widget build, so the published JSON only needs
    // to know whether to opt in for this hotel.
    trackerEnabled: !!form.trackerEnabled,
  };
}

/**
 * Build the preview URL: encodes the current form's config as urlsafe
 * base64, passes it to the widget via ?preview=<b64>. The widget decodes
 * and uses this as the live config — real-time WYSIWYG.
 *
 * We always force _preview: true so the widget uses hardcoded demo prices
 * (never the real API). Otherwise publishing a broken config could leak
 * real prices from an unrelated hotel.
 */
export function buildPreviewUrl(baseUrl, config, opts = {}) {
  const previewConfig = { ...config, _preview: true };
  const json = JSON.stringify(previewConfig);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  // Preview-only state lives outside the encoded config: it's an admin
  // UI tool, not part of what gets published. The widget loader reads
  // this query param and forces the corresponding initial state. Sent
  // for both 'open' and 'closed' so the widget treats the toggle as
  // the source of truth instead of falling back to autoOpenMode.
  const stateParam =
    opts.previewState === 'closed' || opts.previewState === 'open'
      ? `&previewState=${opts.previewState}`
      : '';
  return `${baseUrl}?preview=${b64}${stateParam}`;
}

/**
 * Validate that a string looks like a legitimate public domain.
 * Rejects localhost, private IPs, malformed input, bare IPs, paths, etc.
 */
export function isValidPublicDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) return false;

  let host = trimmed.replace(/^https?:\/\//, '');
  host = host.split('/')[0].split('?')[0].split('#')[0];
  if (!host) return false;

  if (host === 'localhost' || host.endsWith('.localhost')) return false;
  if (host === '0.0.0.0') return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  if (/^\[[0-9a-f:]+\]$/.test(host)) return false;
  if (!host.includes('.')) return false;

  const domainRe = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
  if (!domainRe.test(host)) return false;

  return true;
}

/**
 * Analyze a rates API response (from /api/rates/:apiHotelId).
 * Extracts useful metadata for the admin UI:
 *   - detected competitor (via myHotel: true flag)
 *   - list of all competitors
 *   - rooms available per channel (for informational display)
 */
export function analyzeRatesResponse(apiData) {
  if (!apiData || !apiData.competitors) {
    return { error: 'Empty or invalid response' };
  }

  let detectedCompetitorId = null;
  let detectedCompetitorName = null;
  for (const [compId, comp] of Object.entries(apiData.competitors)) {
    if (comp.myHotel === true) {
      detectedCompetitorId = parseInt(compId, 10);
      detectedCompetitorName = comp.name || '';
      break;
    }
  }

  const competitorsList = Object.entries(apiData.competitors).map(
    ([id, comp]) => ({
      id: parseInt(id, 10),
      name: comp.name || '',
      shortName: comp.shortName || '',
      myHotel: comp.myHotel === true,
    })
  );

  const targetCompId = detectedCompetitorId || competitorsList[0]?.id;
  const roomsByChannel = {};

  if (targetCompId && apiData.competitorPrices) {
    const seen = new Map();

    for (const dayData of Object.values(apiData.competitorPrices)) {
      const compData = dayData.competitors?.[targetCompId];
      if (!compData || !compData.channels) continue;

      for (const [channelId, channelData] of Object.entries(compData.channels)) {
        if (!channelData.prices || channelData.prices.length === 0) continue;

        if (!seen.has(channelId)) seen.set(channelId, new Map());
        const channelRooms = seen.get(channelId);

        for (const price of channelData.prices) {
          const key = price.roomCode;
          if (!key || channelRooms.has(key)) continue;
          channelRooms.set(key, {
            roomCode: price.roomCode,
            roomName: price.roomName || '',
            maxAdultOccupancy: price.maxAdultOccupancy || null,
          });
        }
      }
    }

    for (const [channelId, roomMap] of seen.entries()) {
      roomsByChannel[channelId] = Array.from(roomMap.values());
    }
  }
// Build the list of channels that actually have data for this competitor,
  // enriched with names from apiData.channels metadata.
  const availableChannels = Object.keys(roomsByChannel).map((chId) => {
    const id = parseInt(chId, 10);
    const apiName = apiData.channels?.[chId]?.channelName || `Channel ${chId}`;
    return {
      id,
      apiName,
      roomCount: roomsByChannel[chId]?.length || 0,
    };
  });

  return {
    screeningDate: apiData.screeningDate || null,
    detectedCompetitorId,
    detectedCompetitorName,
    competitorsList,
    roomsByChannel,
    availableChannels,
  };
}