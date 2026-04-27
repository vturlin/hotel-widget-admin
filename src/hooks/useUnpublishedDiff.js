import { useMemo } from 'react';

const FIELD_LABELS = {
  hotelId: 'Hotel ID',
  hotelName: 'Hotel name',
  hotelDomain: 'Client domain',
  apiHotelId: 'API Hotel ID',
  apiCompetitorId: 'Competitor ID',
  channelsEnabled: 'Channels',
  bookingEngineId: 'Booking Engine ID',
  useCustomReserveUrl: 'Custom URL mode',
  reserveUrl: 'Reserve URL',
  currency: 'Currency',
  position: 'Position on screen',
  size: 'Widget size',
  brandColor: 'Brand color',
  backgroundColor: 'Background color',
  enabledLocales: 'Enabled languages',
  defaultLocale: 'Default language',
  autoOpenMode: 'Auto-open trigger',
  autoOpenDelay: 'Delay before opening',
  autoOpenScrollPercent: 'Scroll threshold',
  analyticsEnabled: 'Analytics enabled',
  dataLayerName: 'DataLayer variable',
  trackerEndpoint: 'Tracker endpoint',
};

function shallowEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const sa = [...a].sort();
    const sb = [...b].sort();
    return sa.every((v, i) => v === sb[i]);
  }
  return false;
}

function humanize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

export default function useUnpublishedDiff(form, snapshot) {
  return useMemo(() => {
    // No baseline yet (e.g. edit mode pre-load) — nothing to diff against.
    if (!snapshot) return { isDirty: false, changedFields: [] };

    const changed = [];
    for (const key of Object.keys(form)) {
      if (!shallowEqual(form[key], snapshot[key])) {
        changed.push(FIELD_LABELS[key] || humanize(key));
      }
    }
    return {
      isDirty: changed.length > 0,
      changedFields: changed,
    };
  }, [form, snapshot]);
}
