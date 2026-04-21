/**
 * Build the config JSON that gets published to GitHub. API-only: no more
 * CSV mode, no more room options, no more channel labels. Channels are
 * hardcoded in the widget (see API_CHANNELS in constants.js).
 */
export function buildConfig(form) {
  return {
    hotelName: form.hotelName || '',
    hotelDomain: form.hotelDomain || '',
    logoUrl: form.logoUrl || '',
    // Data source — always API
    apiHotelId: parseInt(form.apiHotelId, 10) || null,
    apiCompetitorId: form.apiCompetitorId
      ? parseInt(form.apiCompetitorId, 10)
      : null,
    channelsEnabled: Array.isArray(form.channelsEnabled)
      ? form.channelsEnabled.map(Number).filter((n) => Number.isInteger(n))
      : [17, 10, 9],
    reserveUrl: form.reserveUrl || '',
    currency: form.currency || 'EUR',
    position: form.position || 'bottom-right',
    size: form.size || 'small',
    brandColor: form.brandColor || '#1a1a1a',
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
export function buildPreviewUrl(baseUrl, config) {
  const previewConfig = { ...config, _preview: true };
  const json = JSON.stringify(previewConfig);
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