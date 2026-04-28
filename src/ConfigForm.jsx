import { useEffect, useMemo, useRef, useState } from 'react';
import { WIDGET_PREVIEW_URL } from './constants.js';
import { buildConfig, buildPreviewUrl, parseBookingEngineUrl } from './utils.js';
import useUnpublishedDiff from './hooks/useUnpublishedDiff.js';
import AdminLayout from './admin/AdminLayout.jsx';
import PublishConfirmDialog from './admin/PublishConfirmDialog.jsx';
import IdentityTab from './tabs/IdentityTab.jsx';
import DataTab from './tabs/DataTab.jsx';
import AppearanceTab from './tabs/AppearanceTab.jsx';
import LanguagesTab from './tabs/LanguagesTab.jsx';
import AnalyticsTab from './tabs/AnalyticsTab.jsx';
import PublishTab from './tabs/PublishTab.jsx';

const DEFAULT_FORM = {
  hotelId: '',
  hotelName: '',
  hotelDomain: '',
  apiHotelId: '',
  apiCompetitorId: '',
  channelsEnabled: [],
  bookingEngineId: '',
  useCustomReserveUrl: false,
  reserveUrl: '',
  currency: 'EUR',
  position: 'bottom-right',
  size: 'small',
  widgetDesign: 'default',
  vegasVariant: 'standard',
  brandColor: '#8b5a3c',
  toggleColor: '',
  backgroundColor: '#faf7f2',
  enabledLocales: ['en', 'fr', 'es', 'de', 'it'],
  defaultLocale: 'en',
  autoOpenMode: 'time',
  autoOpenDelay: 8,
  autoOpenScrollPercent: 50,
  analyticsEnabled: true,
  dataLayerName: 'dataLayer',
  trackerEnabled: false,
};

export default function ConfigForm({ editingHotelId, onBack }) {
  const isEditMode = !!editingHotelId;

  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    hotelId: editingHotelId || '',
  });

  // In create mode, the snapshot starts as DEFAULT_FORM so the unpublished-pill
  // counts only fields the user actively changed. In edit mode, it stays null
  // until the API load resolves; the hook treats null as "no baseline yet".
  const lastSnapshotRef = useRef(isEditMode ? null : DEFAULT_FORM);

  const [device, setDevice] = useState('desktop');
  // Admin-only preview tool: 'open' shows the expanded panel,
  // 'closed' shows the wax-seal toggle. Not persisted to the config.
  const [previewState, setPreviewState] = useState('open');
  const [activeTab, setActiveTab] = useState('identity');
  const [publishState, setPublishState] = useState({ status: 'idle' });
  const [copied, setCopied] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [loadStatus, setLoadStatus] = useState(isEditMode ? 'loading' : 'ready');
  const [loadError, setLoadError] = useState('');

  // Load existing config in edit mode (preserves existing behavior)
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    fetch(`/api/current-config/${encodeURIComponent(editingHotelId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.exists) {
          setLoadError(`Configuration ${editingHotelId} not found`);
          setLoadStatus('error');
          return;
        }
        const c = data.config;
        // Resolve booking-engine vs custom-URL mode. Prefer the explicit
        // fields if the saved config carries them; otherwise migrate from a
        // standalone reserveUrl by trying to extract a BE ID from it.
        let bookingEngineId = c.bookingEngineId || '';
        let useCustomReserveUrl = !!c.useCustomReserveUrl;
        if (!bookingEngineId && !c.useCustomReserveUrl && c.reserveUrl) {
          const parsed = parseBookingEngineUrl(c.reserveUrl);
          if (parsed) {
            bookingEngineId = parsed;
            useCustomReserveUrl = false;
          } else {
            useCustomReserveUrl = true;
          }
        }
        const loaded = {
          hotelId: editingHotelId,
          hotelName: c.hotelName || '',
          hotelDomain: c.hotelDomain || '',
          apiHotelId: c.apiHotelId ? String(c.apiHotelId) : '',
          apiCompetitorId: c.apiCompetitorId ? String(c.apiCompetitorId) : '',
          channelsEnabled: c.channelsEnabled || [],
          bookingEngineId,
          useCustomReserveUrl,
          reserveUrl: c.reserveUrl || '',
          currency: c.currency || 'EUR',
          position: c.position || 'bottom-right',
          size: c.size || 'small',
          widgetDesign:
            c.widgetDesign === 'ticker'
              ? 'ticker'
              : c.widgetDesign === 'vegas'
                ? 'vegas'
                : 'default',
          vegasVariant:
            ['sobre', 'standard', 'riche', 'extravagant'].includes(c.vegasVariant)
              ? c.vegasVariant
              : 'standard',
          brandColor: c.brandColor || '#8b5a3c',
          toggleColor: c.toggleColor || '',
          backgroundColor: c.backgroundColor || '#faf7f2',
          enabledLocales: c.enabledLocales || ['en'],
          defaultLocale: c.defaultLocale || 'en',
          autoOpenMode: c.autoOpenMode || 'disabled',
          autoOpenDelay: c.autoOpenDelay || 8,
          autoOpenScrollPercent: c.autoOpenScrollPercent || 50,
          analyticsEnabled: c.analytics?.enabled ?? true,
          dataLayerName: c.analytics?.dataLayerName || 'dataLayer',
          trackerEnabled: c.trackerEnabled === true,
        };
        setForm(loaded);
        lastSnapshotRef.current = loaded;
        setLoadStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message);
        setLoadStatus('error');
      });
    return () => { cancelled = true; };
  }, [isEditMode, editingHotelId]);

  const config = useMemo(() => buildConfig(form), [form]);
  const previewUrl = useMemo(
    () => buildPreviewUrl(WIDGET_PREVIEW_URL, config, { previewState }),
    [config, previewState]
  );
  const viewport =
    device === 'desktop' ? { w: 1280, h: 720 } : { w: 390, h: 844 };

  const { isDirty, changedFields } = useUnpublishedDiff(form, lastSnapshotRef.current);

  // Wrap the parent's onBack so an accidental click on "Hotels" or
  // the back arrow doesn't silently throw away unpublished edits.
  function handleBack() {
    if (isDirty && !window.confirm('Discard unpublished changes?')) return;
    onBack();
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleLocale(locale) {
    setForm((f) => {
      const enabled = f.enabledLocales.includes(locale)
        ? f.enabledLocales.filter((l) => l !== locale)
        : [...f.enabledLocales, locale];
      return {
        ...f,
        enabledLocales: enabled,
        defaultLocale: enabled.includes(f.defaultLocale)
          ? f.defaultLocale
          : enabled[0] || 'en',
      };
    });
  }

  function handlePublish() {
    if (!form.hotelId || !form.hotelId.trim()) {
      setPublishState({
        status: 'error',
        message: 'Hotel ID is required before publishing.',
      });
      return;
    }
    // Block publish if apiHotelId is set but not numeric — without
    // this, buildConfig() in utils.js silently coerces "abc123" to
    // null and the widget falls into fallback mode without the
    // operator being aware.
    if (form.apiHotelId && !/^\d+$/.test(String(form.apiHotelId).trim())) {
      setPublishState({
        status: 'error',
        message: 'API Hotel ID must be a number — fix it on the Data tab before publishing.',
      });
      return;
    }
    setPublishState({ status: 'idle' });
    setShowPublishDialog(true);
  }

  async function handleConfirmPublish() {
    setPublishState({ status: 'publishing' });
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: form.hotelId, config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      console.info('[admin] published', {
        hotelId: form.hotelId,
        commitSha: data.commit?.sha,
        commitUrl: data.commit?.html_url,
        fullResponse: data,
      });
      // Refresh snapshot — pill flips to clean
      lastSnapshotRef.current = form;
      setPublishState({ status: 'success' });
      setShowPublishDialog(false);
    } catch (err) {
      console.error('[admin] publish failed', err);
      setPublishState({ status: 'error', message: err.message });
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.hotelId || 'widget-config'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyEmbedCode() {
    const code = `<script async src="https://vturlin.github.io/best-price-widget/widget.js?id=${form.hotelId}"></script>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function previewLive() {
    if (!form.hotelId) return;
    window.open(previewUrl, '_blank', 'noopener');
  }

  if (loadStatus === 'loading') {
    return (
      <div style={{ padding: 40, color: 'var(--color-text-secondary)' }}>
        Loading configuration…
      </div>
    );
  }
  if (loadStatus === 'error') {
    return (
      <div style={{ padding: 40 }}>
        <div
          style={{
            padding: 16,
            background: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 6,
            color: 'var(--color-error-text)',
          }}
        >
          <strong>Couldn't load configuration</strong>
          <p>{loadError}</p>
          <button
            type="button"
            onClick={onBack}
            style={{
              marginTop: 12,
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: '8px 14px',
              color: 'var(--color-text-primary)',
            }}
          >
            ← Back to hotels
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminLayout
        hotelId={form.hotelId}
        hotelName={form.hotelName}
        onBackToHotels={handleBack}
        unpublishedCount={changedFields.length}
        canAct={!!form.hotelId && !!form.hotelId.trim()}
        onPreviewLive={previewLive}
        onPublish={handlePublish}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        preview={{
          previewUrl,
          viewport,
          device,
          setDevice,
          clientDomain: form.hotelDomain,
        }}
      >
        {activeTab === 'identity' && (
          <IdentityTab form={form} updateField={updateField} isEditMode={isEditMode} />
        )}
        {activeTab === 'data' && (
          <DataTab form={form} updateField={updateField} />
        )}
        {activeTab === 'appearance' && (
          <AppearanceTab
            form={form}
            updateField={updateField}
            previewState={previewState}
            setPreviewState={setPreviewState}
          />
        )}
        {activeTab === 'languages' && (
          <LanguagesTab
            form={form}
            updateField={updateField}
            toggleLocale={toggleLocale}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab form={form} updateField={updateField} />
        )}
        {activeTab === 'publish' && (
          <PublishTab
            hotelId={form.hotelId}
            publishState={publishState}
            copied={copied}
            onPublish={handlePublish}
            onDownload={downloadJson}
            onCopyEmbed={copyEmbedCode}
            isDirty={isDirty}
            changedFields={changedFields}
          />
        )}
      </AdminLayout>

      {showPublishDialog && (
        <PublishConfirmDialog
          hotelId={form.hotelId}
          config={config}
          onConfirm={handleConfirmPublish}
          onCancel={() => setShowPublishDialog(false)}
          isPublishing={publishState.status === 'publishing'}
        />
      )}
    </>
  );
}
