import { useEffect, useMemo, useRef, useState } from 'react';
import { STRESS_PREVIEW_URL, STRESS_TABS } from '../constants.js';
import { buildPreviewUrl } from '../utils.js';
import useUnpublishedDiff from '../hooks/useUnpublishedDiff.js';
import AdminLayout from '../admin/AdminLayout.jsx';
import PublishConfirmDialog from '../admin/PublishConfirmDialog.jsx';
import PublishTab from '../tabs/PublishTab.jsx';
import WidgetDisplayTab from '../admin/WidgetDisplayTab.jsx';
import StressIdentityTab from './StressIdentityTab.jsx';
import StressContentTab from './StressContentTab.jsx';

// Shared meta + sane variant defaults. Each variant only consumes a
// subset of these fields — empty / unused values are still published
// so duplicate + variant-switch flows don't lose state.
const DEFAULT_FORM = {
  hotelId: '',
  hotelName: '',
  variant: 'just-booked',

  // Shared
  title: 'Just booked',
  accentColor: '#10B981',

  // Just booked
  guestName: 'Marie from Lyon',
  roomName: 'Sea-View Suite',
  initials: 'MD',
  avatarBg: '#FBCFE8',
  avatarFg: '#A41752',
  timeAgo: '2 minutes ago',

  // Scarcity
  count: 2,
  unit: 'rooms',
  context: 'for your selected dates',

  // Social proof
  subtitle: 'booked here today',
  caption: 'Trending up vs. last week',
  bars: [3, 6, 4, 8, 5, 9, 7, 11, 8, 12],

  // Display behaviour (shared across variants)
  position: 'bottom-left',
  triggerMode: 'immediate',
  triggerDelaySec: 8,
  triggerScrollPercent: 50,
};

function buildStressConfig(form) {
  return {
    hotelName: form.hotelName || '',
    variant: form.variant || 'just-booked',
    title: form.title || '',
    accentColor: form.accentColor || '',
    guestName: form.guestName || '',
    roomName: form.roomName || '',
    initials: form.initials || '',
    avatarBg: form.avatarBg || '',
    avatarFg: form.avatarFg || '',
    timeAgo: form.timeAgo || '',
    count: Number.isFinite(form.count) ? form.count : 0,
    unit: form.unit || '',
    context: form.context || '',
    subtitle: form.subtitle || '',
    caption: form.caption || '',
    bars: Array.isArray(form.bars) ? form.bars : [],
    position: form.position || 'bottom-left',
    triggerMode: form.triggerMode || 'immediate',
    triggerDelaySec: Number.isFinite(form.triggerDelaySec)
      ? form.triggerDelaySec
      : 8,
    triggerScrollPercent: Number.isFinite(form.triggerScrollPercent)
      ? form.triggerScrollPercent
      : 50,
  };
}

export default function StressConfigForm({ editingHotelId, onBack }) {
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

  // Edit mode: hydrate from the published config, falling back to the
  // default for any field the previous variant didn't carry.
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    fetch(`/api/stress/current-config/${encodeURIComponent(editingHotelId)}`)
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
          variant: ['just-booked', 'scarcity', 'social-proof'].includes(c.variant)
            ? c.variant
            : 'just-booked',
          title: c.title || DEFAULT_FORM.title,
          accentColor: c.accentColor || DEFAULT_FORM.accentColor,
          guestName: c.guestName || DEFAULT_FORM.guestName,
          roomName: c.roomName || DEFAULT_FORM.roomName,
          initials: c.initials || DEFAULT_FORM.initials,
          avatarBg: c.avatarBg || DEFAULT_FORM.avatarBg,
          avatarFg: c.avatarFg || DEFAULT_FORM.avatarFg,
          timeAgo: c.timeAgo || DEFAULT_FORM.timeAgo,
          count: Number.isFinite(c.count) ? c.count : DEFAULT_FORM.count,
          unit: c.unit || DEFAULT_FORM.unit,
          context: c.context || DEFAULT_FORM.context,
          subtitle: c.subtitle || DEFAULT_FORM.subtitle,
          caption: c.caption || DEFAULT_FORM.caption,
          bars: Array.isArray(c.bars) && c.bars.length > 0 ? c.bars : DEFAULT_FORM.bars,
          position: c.position || DEFAULT_FORM.position,
          triggerMode: c.triggerMode || DEFAULT_FORM.triggerMode,
          triggerDelaySec: Number.isFinite(c.triggerDelaySec)
            ? c.triggerDelaySec
            : DEFAULT_FORM.triggerDelaySec,
          triggerScrollPercent: Number.isFinite(c.triggerScrollPercent)
            ? c.triggerScrollPercent
            : DEFAULT_FORM.triggerScrollPercent,
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

  const config = useMemo(() => buildStressConfig(form), [form]);
  const previewUrl = useMemo(
    () => buildPreviewUrl(STRESS_PREVIEW_URL, config),
    [config]
  );
  const viewport =
    device === 'desktop' ? { w: 1280, h: 720 } : { w: 390, h: 844 };

  const { isDirty, changedFields } = useUnpublishedDiff(
    form,
    lastSnapshotRef.current
  );

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
      const res = await fetch('/api/stress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: form.hotelId, config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      console.info('[admin/stress] published', {
        hotelId: form.hotelId,
        commitSha: data.commit?.sha,
      });
      lastSnapshotRef.current = form;
      setPublishState({ status: 'success' });
      setShowPublishDialog(false);
    } catch (err) {
      console.error('[admin/stress] publish failed', err);
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
    a.download = `${form.hotelId || 'stress-widget-config'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyEmbedCode() {
    const code = `<script async src="https://vturlin.github.io/stress-widget/widget.js?id=${form.hotelId}"></script>`;
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

  const embedScriptSrc = `https://vturlin.github.io/stress-widget/widget.js?id=${form.hotelId}`;

  return (
    <>
      <AdminLayout
        hotelId={form.hotelId}
        hotelName={form.hotelName}
        onBackToHotels={onBack}
        unpublishedCount={changedFields.length}
        canAct={!!form.hotelId && !!form.hotelId.trim()}
        onPreviewLive={previewLive}
        onPublish={handlePublish}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={STRESS_TABS}
        preview={{
          previewUrl,
          viewport,
          device,
          setDevice,
          clientDomain: '',
        }}
      >
        {activeTab === 'identity' && (
          <StressIdentityTab
            form={form}
            updateField={updateField}
            isEditing={isEditMode}
          />
        )}
        {activeTab === 'content' && (
          <StressContentTab form={form} updateField={updateField} />
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
          isUpdate={isEditMode}
          publishState={publishState}
          onConfirm={handleConfirmPublish}
          onCancel={() => setShowPublishDialog(false)}
        />
      )}
    </>
  );
}
