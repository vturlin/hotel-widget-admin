import { useEffect, useMemo, useRef, useState } from 'react';
import { REASSURANCE_PREVIEW_URL, REASSURANCE_TABS } from '../constants.js';
import { buildPreviewUrl } from '../utils.js';
import useUnpublishedDiff from '../hooks/useUnpublishedDiff.js';
import AdminLayout from '../admin/AdminLayout.jsx';
import PublishConfirmDialog from '../admin/PublishConfirmDialog.jsx';
import PublishTab from '../tabs/PublishTab.jsx';
import WidgetDisplayTab from '../admin/WidgetDisplayTab.jsx';
import ReassuranceIdentityTab from './ReassuranceIdentityTab.jsx';
import ReassuranceContentTab from './ReassuranceContentTab.jsx';

// Defaults mirror the widget component's defaults — the operator
// gets a working preview the moment they create a config and only
// has to overwrite the bits they care about.
const DEFAULT_FORM = {
  hotelId: '',
  hotelName: '',
  aggregateScore: '4.8',
  totalReviews: '1,347',
  accentColor: '#432975',
  footerText: 'Verified guest reviews · Updated daily',
  position: 'bottom-left',
  triggerMode: 'immediate',
  triggerDelaySec: 8,
  triggerScrollPercent: 50,
  platforms: [
    { id: 'booking',     name: 'Booking.com',  short: 'B.', score: '8.9', scale: '/10', color: '#003580', count: '842' },
    { id: 'google',      name: 'Google',       short: 'G',  score: '4.8', scale: '/5',  color: '#4285F4', count: '316' },
    { id: 'tripadvisor', name: 'Tripadvisor',  short: 'TA', score: '4.7', scale: '/5',  color: '#34E0A1', count: '189' },
  ],
};

function buildReassuranceConfig(form) {
  return {
    hotelName: form.hotelName || '',
    aggregateScore: form.aggregateScore || '',
    totalReviews: form.totalReviews || '',
    accentColor: form.accentColor || '',
    footerText: form.footerText || '',
    position: form.position || 'bottom-left',
    triggerMode: form.triggerMode || 'immediate',
    triggerDelaySec: Number.isFinite(form.triggerDelaySec)
      ? form.triggerDelaySec
      : 8,
    triggerScrollPercent: Number.isFinite(form.triggerScrollPercent)
      ? form.triggerScrollPercent
      : 50,
    platforms: Array.isArray(form.platforms) ? form.platforms : [],
  };
}

export default function ReassuranceConfigForm({ editingHotelId, onBack }) {
  const isEditMode = !!editingHotelId;

  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    hotelId: editingHotelId || '',
  });

  const lastSnapshotRef = useRef(isEditMode ? null : DEFAULT_FORM);

  const [device, setDevice] = useState('desktop');
  const [activeTab, setActiveTab] = useState('identity');
  const [publishState, setPublishState] = useState({ status: 'idle' });
  const [copied, setCopied] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [loadStatus, setLoadStatus] = useState(isEditMode ? 'loading' : 'ready');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    fetch(`/api/reassurance/current-config/${encodeURIComponent(editingHotelId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.exists) {
          setLoadError(`Configuration ${editingHotelId} not found`);
          setLoadStatus('error');
          return;
        }
        const c = data.config;
        const loaded = {
          hotelId: editingHotelId,
          hotelName: c.hotelName || '',
          aggregateScore: c.aggregateScore || DEFAULT_FORM.aggregateScore,
          totalReviews: c.totalReviews || DEFAULT_FORM.totalReviews,
          accentColor: c.accentColor || DEFAULT_FORM.accentColor,
          footerText: c.footerText || DEFAULT_FORM.footerText,
          position: c.position || DEFAULT_FORM.position,
          triggerMode: c.triggerMode || DEFAULT_FORM.triggerMode,
          triggerDelaySec: Number.isFinite(c.triggerDelaySec)
            ? c.triggerDelaySec
            : DEFAULT_FORM.triggerDelaySec,
          triggerScrollPercent: Number.isFinite(c.triggerScrollPercent)
            ? c.triggerScrollPercent
            : DEFAULT_FORM.triggerScrollPercent,
          platforms:
            Array.isArray(c.platforms) && c.platforms.length > 0
              ? c.platforms.map((p) => ({
                  id: typeof p.id === 'string' ? p.id : '',
                  name: typeof p.name === 'string' ? p.name : '',
                  short: typeof p.short === 'string' ? p.short : '',
                  score: typeof p.score === 'string' ? p.score : String(p.score ?? ''),
                  scale: p.scale === '/5' || p.scale === '/10' ? p.scale : '/10',
                  color: typeof p.color === 'string' ? p.color : '#999999',
                  count: typeof p.count === 'string' ? p.count : String(p.count ?? ''),
                }))
              : DEFAULT_FORM.platforms,
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
    return () => {
      cancelled = true;
    };
  }, [isEditMode, editingHotelId]);

  const config = useMemo(() => buildReassuranceConfig(form), [form]);
  const previewUrl = useMemo(
    () => buildPreviewUrl(REASSURANCE_PREVIEW_URL, config),
    [config]
  );
  const viewport =
    device === 'desktop' ? { w: 1280, h: 720 } : { w: 390, h: 844 };

  const { isDirty, changedFields } = useUnpublishedDiff(
    form,
    lastSnapshotRef.current
  );

  function handleBack() {
    if (isDirty && !window.confirm('Discard unpublished changes?')) return;
    onBack();
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handlePublish() {
    if (!form.hotelId || !form.hotelId.trim()) {
      setPublishState({
        status: 'error',
        message: 'Hotel ID is required before publishing.',
      });
      return;
    }
    setPublishState({ status: 'idle' });
    setShowPublishDialog(true);
  }

  async function handleConfirmPublish() {
    setPublishState({ status: 'publishing' });
    try {
      const res = await fetch('/api/reassurance/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: form.hotelId, config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      console.info('[admin/reassurance] published', {
        hotelId: form.hotelId,
        commitSha: data.commit?.sha,
      });
      lastSnapshotRef.current = form;
      setPublishState({ status: 'success' });
      setShowPublishDialog(false);
    } catch (err) {
      console.error('[admin/reassurance] publish failed', err);
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
    a.download = `${form.hotelId || 'reassurance-widget-config'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyEmbedCode() {
    const code = `<script async src="https://vturlin.github.io/reassurance-widget/widget.js?id=${form.hotelId}"></script>`;
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
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const embedScriptSrc = `https://vturlin.github.io/reassurance-widget/widget.js?id=${form.hotelId}`;

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
        tabs={REASSURANCE_TABS}
        preview={{
          previewUrl,
          viewport,
          device,
          setDevice,
          clientDomain: '',
        }}
      >
        {activeTab === 'identity' && (
          <ReassuranceIdentityTab
            form={form}
            updateField={updateField}
            isEditing={isEditMode}
          />
        )}
        {activeTab === 'content' && (
          <ReassuranceContentTab form={form} updateField={updateField} />
        )}
        {activeTab === 'display' && (
          <WidgetDisplayTab form={form} updateField={updateField} />
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
            embedScriptSrc={embedScriptSrc}
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
