import { useEffect, useMemo, useRef, useState } from 'react';
import { LEAD_GEN_PREVIEW_URL, LEAD_GEN_TABS } from '../constants.js';
import { buildPreviewUrl } from '../utils.js';
import useUnpublishedDiff from '../hooks/useUnpublishedDiff.js';
import AdminLayout from '../admin/AdminLayout.jsx';
import PublishConfirmDialog from '../admin/PublishConfirmDialog.jsx';
import PublishTab from '../tabs/PublishTab.jsx';
import LeadGenIdentityTab from './LeadGenIdentityTab.jsx';
import LeadGenContentTab from './LeadGenContentTab.jsx';
import LeadGenAppearanceTab from './LeadGenAppearanceTab.jsx';

// Empty strings + a single colour default. The widget loader strips
// blanks so each unset field falls back to the component's built-in
// default — operators only need to fill in what they want to override.
const DEFAULT_FORM = {
  hotelId: '',
  hotelName: '',
  title: '',
  message: '',
  imageUrl: '',
  imageAlt: '',
  imageWidth: 300,
  buttonColor: '#432975',
  buttonHoverColor: '',
  buttonLabel: '',
  badgeLabel: '',
  privacyPolicyUrl: '',
};

// Shape of the published JSON. Mirrors the LeadGenWidget prop names
// 1:1 so the loader can map straight through.
function buildLeadGenConfig(form) {
  return {
    hotelName: form.hotelName || '',
    title: form.title || '',
    message: form.message || '',
    imageUrl: form.imageUrl || '',
    imageAlt: form.imageAlt || '',
    imageWidth: Number.isFinite(form.imageWidth) ? form.imageWidth : 300,
    buttonColor: form.buttonColor || '',
    buttonHoverColor: form.buttonHoverColor || '',
    buttonLabel: form.buttonLabel || '',
    badgeLabel: form.badgeLabel || '',
    privacyPolicyUrl: form.privacyPolicyUrl || '',
  };
}

export default function LeadGenConfigForm({ editingHotelId, onBack }) {
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

  // Edit mode: hydrate form from the published config.
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    fetch(`/api/lead-gen/current-config/${encodeURIComponent(editingHotelId)}`)
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
          title: c.title || '',
          message: c.message || '',
          imageUrl: c.imageUrl || '',
          imageAlt: c.imageAlt || '',
          imageWidth: Number.isFinite(c.imageWidth) ? c.imageWidth : 300,
          buttonColor: c.buttonColor || '#432975',
          buttonHoverColor: c.buttonHoverColor || '',
          buttonLabel: c.buttonLabel || '',
          badgeLabel: c.badgeLabel || '',
          privacyPolicyUrl: c.privacyPolicyUrl || '',
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

  const config = useMemo(() => buildLeadGenConfig(form), [form]);
  const previewUrl = useMemo(
    () => buildPreviewUrl(LEAD_GEN_PREVIEW_URL, config),
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
      const res = await fetch('/api/lead-gen/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: form.hotelId, config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      console.info('[admin/lead-gen] published', {
        hotelId: form.hotelId,
        commitSha: data.commit?.sha,
      });
      lastSnapshotRef.current = form;
      setPublishState({ status: 'success' });
      setShowPublishDialog(false);
    } catch (err) {
      console.error('[admin/lead-gen] publish failed', err);
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
    a.download = `${form.hotelId || 'lead-widget-config'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyEmbedCode() {
    const code = `<script async src="https://vturlin.github.io/lead-gen-widget/widget.js?id=${form.hotelId}"></script>`;
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

  const embedScriptSrc = `https://vturlin.github.io/lead-gen-widget/widget.js?id=${form.hotelId}`;

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
        tabs={LEAD_GEN_TABS}
        preview={{
          previewUrl,
          viewport,
          device,
          setDevice,
          clientDomain: '',
        }}
      >
        {activeTab === 'identity' && (
          <LeadGenIdentityTab
            form={form}
            updateField={updateField}
            isEditing={isEditMode}
          />
        )}
        {activeTab === 'content' && (
          <LeadGenContentTab form={form} updateField={updateField} />
        )}
        {activeTab === 'appearance' && (
          <LeadGenAppearanceTab form={form} updateField={updateField} />
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
