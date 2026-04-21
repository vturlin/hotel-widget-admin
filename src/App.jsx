import { useState, useEffect, useRef, useMemo } from 'react';
import styles from './App.module.css';
import {
  WIDGET_PREVIEW_URL,
  TABS,
  SUPPORTED_LOCALES,
  API_CHANNELS,
  DEFAULT_CHANNELS_ENABLED,
  POSITIONS,
  SIZES,
  AUTO_OPEN_MODES,
  AUTO_OPEN_DELAYS,
  SCROLL_THRESHOLDS,
  SUPPORTED_CURRENCIES,
} from './constants.js';
import {
  buildConfig,
  buildPreviewUrl,
  isValidPublicDomain,
  analyzeRatesResponse,
} from './utils.js';
import PublishConfirmDialog from './PublishConfirmDialog.jsx';
import HotelsLanding from './HotelsLanding.jsx';
import ConfirmDeleteDialog from './ConfirmDeleteDialog.jsx';

// ──────────────────────────────────────────────────────────────────────
// Root component — handles auth gate and shows admin UI when unlocked
// ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [authError, setAuthError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdInput }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        setAuthError('Wrong password');
      }
    } catch {
      setAuthError('Server unreachable');
    }
  }

  if (!authed) {
    return (
      <div className={styles.authWrap}>
        <form className={styles.authCard} onSubmit={handleLogin}>
          <img
            src="https://www.d-edge.com/wp-content/themes/d-edge/img/logo_d-edge.svg"
            alt="D-EDGE"
            className={styles.authLogo}
          />
          <h1>Hotel Widget Admin</h1>
          <p>Sign in to continue</p>
          <input
            type="password"
            value={pwdInput}
            onChange={(e) => setPwdInput(e.target.value)}
            placeholder="Password"
            autoFocus
          />
          {authError && <div className={styles.authError}>{authError}</div>}
          <button type="submit">Sign in</button>
        </form>
      </div>
    );
  }

  return <AdminUI />;
}

// ──────────────────────────────────────────────────────────────────────
// Admin UI — the full form + preview once authenticated
// ──────────────────────────────────────────────────────────────────────

function AdminUI() {
  // Navigation state: 'landing' | 'form'
  const [view, setView] = useState('landing');
  // Passed to the form when opening an existing hotel, null for creation
  const [editingHotelId, setEditingHotelId] = useState(null);
  // Dialog states
  const [deleteTarget, setDeleteTarget] = useState(null);

  function handleOpen(hotelId) {
    setEditingHotelId(hotelId);
    setView('form');
  }

  function handleCreate() {
    setEditingHotelId(null);
    setView('form');
  }

  async function handleDuplicate(sourceId) {
    const newId = prompt(
      `Duplicate "${sourceId}" to a new Hotel ID:`,
      `${sourceId}_copy`
    );
    if (!newId) return;
    if (!/^[a-zA-Z0-9_-]+$/.test(newId)) {
      alert('Invalid ID. Use letters, numbers, dashes and underscores only.');
      return;
    }
    try {
      const res = await fetch('/api/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, newId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplicate failed');
      // Open the duplicate in the form
      setEditingHotelId(newId);
      setView('form');
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    }
  }

  function handleDelete(hotelId, hotelName) {
    setDeleteTarget({ hotelId, hotelName });
  }

  function handleDeleteConfirmed() {
    setDeleteTarget(null);
    // Force a remount of the landing to refresh the list
    setView('landing');
  }

  function handleBackToLanding() {
    setEditingHotelId(null);
    setView('landing');
  }

  if (view === 'landing') {
    return (
      <>
        <HotelsLanding
          key={Date.now()}  // Force refresh when returning
          onOpen={handleOpen}
          onCreate={handleCreate}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
        {deleteTarget && (
          <ConfirmDeleteDialog
            hotelId={deleteTarget.hotelId}
            hotelName={deleteTarget.hotelName}
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </>
    );
  }

  return (
    <ConfigForm
      editingHotelId={editingHotelId}
      onBack={handleBackToLanding}
    />
  );
}
function ConfigForm({ editingHotelId, onBack }) {
  const isEditMode = !!editingHotelId;

  const [form, setForm] = useState({
    hotelId: editingHotelId || '',
    hotelName: '',
    hotelDomain: '',
    logoUrl: '',
    apiHotelId: '',
    apiCompetitorId: '',
    channelsEnabled: [...DEFAULT_CHANNELS_ENABLED],
    reserveUrl: '',
    currency: 'EUR',
    position: 'bottom-right',
    size: 'small',
    brandColor: '#8b5a3c',
    backgroundColor: '#faf7f2',
    enabledLocales: ['en', 'fr', 'es', 'de', 'it'],
    defaultLocale: 'en',
    autoOpenMode: 'time',
    autoOpenDelay: 8,
    autoOpenScrollPercent: 50,
    analyticsEnabled: true,
    dataLayerName: 'dataLayer',
  });

  const [device, setDevice] = useState('desktop');
  const [activeTab, setActiveTab] = useState('identity');
  const [publishState, setPublishState] = useState({ status: 'idle' });
  const [copied, setCopied] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [loadStatus, setLoadStatus] = useState(isEditMode ? 'loading' : 'ready');
  const [loadError, setLoadError] = useState('');

  // Load existing config in edit mode
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
        // Convert config back to form shape
        setForm({
          hotelId: editingHotelId,
          hotelName: c.hotelName || '',
          hotelDomain: c.hotelDomain || '',
          logoUrl: c.logoUrl || '',
          apiHotelId: c.apiHotelId ? String(c.apiHotelId) : '',
          apiCompetitorId: c.apiCompetitorId ? String(c.apiCompetitorId) : '',
          channelsEnabled: c.channelsEnabled || [...DEFAULT_CHANNELS_ENABLED],
          reserveUrl: c.reserveUrl || '',
          currency: c.currency || 'EUR',
          position: c.position || 'bottom-right',
          size: c.size || 'small',
          brandColor: c.brandColor || '#8b5a3c',
          backgroundColor: c.backgroundColor || '#faf7f2',
          enabledLocales: c.enabledLocales || ['en'],
          defaultLocale: c.defaultLocale || 'en',
          autoOpenMode: c.autoOpenMode || 'disabled',
          autoOpenDelay: c.autoOpenDelay || 8,
          autoOpenScrollPercent: c.autoOpenScrollPercent || 50,
          analyticsEnabled: c.analytics?.enabled ?? true,
          dataLayerName: c.analytics?.dataLayerName || 'dataLayer',
        });
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
    () => buildPreviewUrl(WIDGET_PREVIEW_URL, config),
    [config]
  );

  const viewport =
    device === 'desktop' ? { w: 1280, h: 720 } : { w: 390, h: 844 };

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

  // Loading state for edit mode
  if (loadStatus === 'loading') {
    return (
      <div className={styles.app}>
        <div className={styles.landingLoading}>Loading configuration…</div>
      </div>
    );
  }
  if (loadStatus === 'error') {
    return (
      <div className={styles.app}>
        <div className={styles.errorBox} style={{ margin: 40 }}>
          <strong>Couldn't load configuration</strong>
          <p>{loadError}</p>
          <button
            type="button"
            onClick={onBack}
            className={styles.ghostBtn}
            style={{ marginTop: 12 }}
          >
            ← Back to hotels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img
            src="https://www.d-edge.com/wp-content/themes/d-edge/img/logo_d-edge.svg"
            alt="D-EDGE"
            className={styles.headerLogo}
          />
          <span className={styles.headerDivider} />
          <button
            type="button"
            onClick={onBack}
            className={styles.breadcrumbLink}
          >
            Hotels
          </button>
          <span className={styles.breadcrumbSep}>/</span>
          <h1 className={styles.headerTitle}>
            {isEditMode ? form.hotelName || form.hotelId : 'New configuration'}
          </h1>
        </div>
        <div className={styles.headerRight}>
          {form.hotelId && (
            <span className={styles.idBadge}>{form.hotelId}</span>
          )}
        </div>
      </header>

      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${
              activeTab === tab.key ? styles.tabActive : ''
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className={styles.main}>
        <div className={styles.previewArea}>
          <PreviewFrame
            previewUrl={previewUrl}
            viewport={viewport}
            device={device}
            setDevice={setDevice}
            clientDomain={form.hotelDomain}
          />
        </div>

        <aside className={styles.configPanel}>
          <div className={styles.configInner}>
            {activeTab === 'identity' && (
              <IdentityTab
                form={form}
                updateField={updateField}
                isEditMode={isEditMode}
              />
            )}
            {activeTab === 'data' && (
              <DataTab form={form} updateField={updateField} />
            )}
            {activeTab === 'appearance' && (
              <AppearanceTab form={form} updateField={updateField} />
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
              />
            )}
          </div>
        </aside>
      </div>

      {showPublishDialog && (
        <PublishConfirmDialog
          hotelId={form.hotelId}
          config={config}
          onConfirm={handleConfirmPublish}
          onCancel={() => setShowPublishDialog(false)}
          isPublishing={publishState.status === 'publishing'}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// PreviewFrame — the centered, scaled iframe with a fake browser chrome
// ──────────────────────────────────────────────────────────────────────

function PreviewFrame({ previewUrl, viewport, device, setDevice, clientDomain }) {
  const wrapRef = useRef(null);
  const [available, setAvailable] = useState({ w: 800, h: 600 });
  const [screenshotFailed, setScreenshotFailed] = useState(false);

  // Measure available space
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setAvailable({
        w: Math.max(320, rect.width - 40),
        h: Math.max(400, rect.height - 80),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Only build a screenshot URL if the client domain looks legitimate.
  // isValidPublicDomain rejects localhost, private IPs, malformed input, etc.
  const clientUrl = useMemo(() => {
    if (!isValidPublicDomain(clientDomain)) return null;
    const d = clientDomain.trim();
    if (d.startsWith('http://') || d.startsWith('https://')) return d;
    return `https://${d}`;
  }, [clientDomain]);

  // Reset the failure state when the URL changes — give the new domain
  // a chance to load instead of permanently sticking to the fallback.
  useEffect(() => {
    setScreenshotFailed(false);
  }, [clientUrl]);

  // Thum.io URL. Their cache key is the full input URL, so repeat views
  // of the same domain load instantly.
  const screenshotUrl = useMemo(() => {
    if (!clientUrl || screenshotFailed) return null;
    return `https://image.thum.io/get/width/${viewport.w}/crop/${viewport.h}/${clientUrl}`;
  }, [clientUrl, screenshotFailed, viewport.w, viewport.h]);

  const useScreenshot = screenshotUrl !== null;

  const maxWidth  = device === 'desktop' ? available.w : Math.min(320, available.w);
  const maxHeight = available.h;
  const scaleByWidth  = maxWidth / viewport.w;
  const scaleByHeight = maxHeight / viewport.h;
  const scale = Math.min(scaleByWidth, scaleByHeight, 1);
  const displayW = viewport.w * scale;
  const displayH = viewport.h * scale;

  return (
    <div ref={wrapRef} className={styles.previewWrap}>
      <div className={styles.browserFrame} style={{ width: displayW + 16 }}>
        <div className={styles.browserBar}>
          <span className={styles.browserDot} style={{ background: '#ff5f56' }} />
          <span className={styles.browserDot} style={{ background: '#ffbd2e' }} />
          <span className={styles.browserDot} style={{ background: '#27c93f' }} />
          <span className={styles.browserBarUrl}>
            {useScreenshot ? clientUrl : 'demo.hotel-widget.app'}
          </span>
        </div>
        <div
          className={styles.browserViewport}
          style={{ width: displayW, height: displayH, position: 'relative' }}
        >
          {useScreenshot ? (
            <img
              key={screenshotUrl}
              src={screenshotUrl}
              alt="Client website preview"
              onError={() => setScreenshotFailed(true)}
              style={{
                width: viewport.w,
                height: viewport.h,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                inset: 0,
                objectFit: 'cover',
                background: '#fff',
              }}
              // The referrer policy restricts what Thum.io learns about
              // our admin URL structure.
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={styles.previewBackdropDemo} />
          )}

          <iframe
            key={previewUrl}
            src={previewUrl}
            style={{
              width: viewport.w,
              height: viewport.h,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              border: 0,
              position: 'absolute',
              inset: 0,
              background: 'transparent',
            }}
            title="Widget preview"
            allowTransparency="true"
          />
        </div>
      </div>

      <div className={styles.deviceToggle}>
        <button
          className={device === 'desktop' ? styles.deviceActive : ''}
          onClick={() => setDevice('desktop')}
        >
          Desktop
        </button>
        <button
          className={device === 'mobile' ? styles.deviceActive : ''}
          onClick={() => setDevice('mobile')}
        >
          Mobile
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Tab components
// ──────────────────────────────────────────────────────────────────────

function IdentityTab({ form, updateField, isEditMode }) {
  return (
    <>
      <h2 className={styles.tabTitle}>Identity</h2>
      <p className={styles.tabHint}>
        Basic information about the hotel and how to identify it.
      </p>

      <label className={styles.field}>
        <span>Hotel ID</span>
        <input
          type="text"
          value={form.hotelId}
          onChange={(e) => updateField('hotelId', e.target.value)}
          placeholder="e.g. hm_myhotel_paris"
          disabled={isEditMode}
        />
        <small>
          {isEditMode
            ? 'Locked in edit mode. To change the ID, duplicate this configuration instead.'
            : 'Unique identifier used to fetch the config. Lowercase, alphanumeric, dashes and underscores only.'}
        </small>
      </label>

      <label className={styles.field}>
        <span>Hotel name</span>
        <input
          type="text"
          value={form.hotelName}
          onChange={(e) => updateField('hotelName', e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>Client domain</span>
        <input
          type="text"
          value={form.hotelDomain}
          onChange={(e) => updateField('hotelDomain', e.target.value)}
          placeholder="hotel-client.com"
        />
        <small>
          Used to fetch a screenshot of the hotel's homepage as the preview
          backdrop. Falls back to a neutral demo if empty or invalid.
        </small>
      </label>

      <label className={styles.field}>
        <span>Logo URL (optional)</span>
        <input
          type="text"
          value={form.logoUrl}
          onChange={(e) => updateField('logoUrl', e.target.value)}
          placeholder="https://..."
        />
        <small>If provided, shown in the widget header instead of the hotel name.</small>
      </label>
    </>
  );
}

function DataTab({ form, updateField }) {
  const [testStatus, setTestStatus] = useState('idle');
  const [testError, setTestError] = useState('');
  const [apiAnalysis, setApiAnalysis] = useState(null);

  async function handleTestApi() {
    if (!form.apiHotelId) {
      setTestStatus('error');
      setTestError('Please enter an API Hotel ID first.');
      return;
    }
    setTestStatus('testing');
    setTestError('');
    setApiAnalysis(null);

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    try {
      const res = await fetch(
        `/api/rates/${encodeURIComponent(form.apiHotelId)}?year=${year}&month=${month}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      const analysis = analyzeRatesResponse(data);
      if (analysis.error) throw new Error(analysis.error);

      setApiAnalysis(analysis);
      setTestStatus('ok');

      if (analysis.detectedCompetitorId && !form.apiCompetitorId) {
        updateField('apiCompetitorId', String(analysis.detectedCompetitorId));
      }
    } catch (err) {
      setTestStatus('error');
      setTestError(err.message);
    }
  }

  function toggleChannel(channelId) {
    const current = form.channelsEnabled || [];
    const enabled = current.includes(channelId)
      ? current.filter((c) => c !== channelId)
      : [...current, channelId];
    updateField('channelsEnabled', enabled);
  }

  return (
    <>
      <h2 className={styles.tabTitle}>Data</h2>
      <p className={styles.tabHint}>
        Rates are fetched live from the AvailPro RateScreener API.
      </p>

      <label className={styles.field}>
        <span>API Hotel ID</span>
        <input
          type="number"
          value={form.apiHotelId || ''}
          onChange={(e) => updateField('apiHotelId', e.target.value)}
          placeholder="e.g. 20917"
        />
        <small>
          The unique hotel ID provided by AvailPro for this property.
        </small>
      </label>

      <label className={styles.field}>
        <span>Competitor ID for this hotel</span>
        <input
          type="number"
          value={form.apiCompetitorId || ''}
          onChange={(e) => updateField('apiCompetitorId', e.target.value)}
          placeholder="Auto-detected when you test the connection"
        />
        <small>
          Normally detected automatically via <code>myHotel: true</code>.
          Set it here only if auto-detection fails.
        </small>
      </label>

      <div className={styles.fieldRow}>
        <button
          type="button"
          onClick={handleTestApi}
          disabled={testStatus === 'testing' || !form.apiHotelId}
          className={styles.secondaryBtn}
        >
          {testStatus === 'testing' ? 'Testing…' : 'Test API connection'}
        </button>
      </div>

      {testStatus === 'error' && (
        <div className={styles.errorBox}>
          <strong>Connection failed</strong>
          <p>{testError}</p>
        </div>
      )}

      {testStatus === 'ok' && apiAnalysis && (
        <div className={styles.apiTestResult}>
          <div className={styles.apiTestResultHeader}>
            <strong>✓ Connection OK</strong>
            <span>
              Screening:{' '}
              {apiAnalysis.screeningDate
                ? new Date(apiAnalysis.screeningDate).toLocaleString()
                : 'n/a'}
            </span>
          </div>

          <div className={styles.apiTestResultSection}>
            <h4>Detected competitor (myHotel)</h4>
            {apiAnalysis.detectedCompetitorId ? (
              <p>
                <strong>{apiAnalysis.detectedCompetitorName}</strong>{' '}
                <code>#{apiAnalysis.detectedCompetitorId}</code>
              </p>
            ) : (
              <p className={styles.apiTestResultWarn}>
                No <code>myHotel</code> flag. Please set the competitor ID
                manually.
              </p>
            )}
          </div>

          <div className={styles.apiTestResultSection}>
            <h4>Rooms detected (informational)</h4>
            {Object.keys(apiAnalysis.roomsByChannel).length === 0 ? (
              <p className={styles.apiTestResultWarn}>
                No rooms found. Check that the competitor ID is correct.
              </p>
            ) : (
              Object.entries(apiAnalysis.roomsByChannel).map(([chId, rooms]) => {
                const meta = API_CHANNELS[chId];
                return (
                  <div key={chId} className={styles.apiChannelGroup}>
                    <h5>
                      {meta?.name || `Channel ${chId}`}
                      <span className={styles.apiChannelCount}>
                        {rooms.length} room{rooms.length !== 1 ? 's' : ''}
                      </span>
                    </h5>
                    <ul className={styles.apiRoomList}>
                      {rooms.map((r) => (
                        <li key={r.roomCode}>
                          <code>{r.roomCode}</code>
                          <span>{r.roomName}</span>
                          {r.maxAdultOccupancy && (
                            <span className={styles.apiRoomOccupancy}>
                              max {r.maxAdultOccupancy} pax
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
            <p className={styles.tabHint} style={{ marginTop: 8 }}>
              Informational only. The widget shows the single cheapest price
              across all rooms and rate conditions.
            </p>
          </div>
        </div>
      )}

      <hr className={styles.sectionDivider} />

      <h3 className={styles.subTabTitle}>Channels to display</h3>
      <p className={styles.tabHint}>
        Only checked channels appear in the price comparison.
      </p>
      <div className={styles.checkboxGroup}>
        {Object.entries(API_CHANNELS).map(([id, meta]) => (
          <label key={id} className={styles.checkboxLine}>
            <input
              type="checkbox"
              checked={(form.channelsEnabled || []).includes(parseInt(id, 10))}
              onChange={() => toggleChannel(parseInt(id, 10))}
            />
            <span>
              {meta.name}
              {meta.isDirect && (
                <span className={styles.apiTestResultBadge}> direct</span>
              )}
            </span>
          </label>
        ))}
      </div>

      <hr className={styles.sectionDivider} />

      <label className={styles.field}>
        <span>Reserve URL template</span>
        <input
          type="text"
          value={form.reserveUrl || ''}
          onChange={(e) => updateField('reserveUrl', e.target.value)}
          placeholder="https://book.hotel.com/?arrive={checkIn}&depart={checkOut}"
        />
        <small>
          Placeholders available: <code>{'{checkIn}'}</code>,{' '}
          <code>{'{checkOut}'}</code>.
        </small>
      </label>

      <label className={styles.field}>
        <span>Currency</span>
        <select
          value={form.currency || 'EUR'}
          onChange={(e) => updateField('currency', e.target.value)}
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
          <option value="CHF">CHF</option>
        </select>
      </label>
    </>
  );
}

function AppearanceTab({ form, updateField }) {
  return (
    <>
      <h2 className={styles.tabTitle}>Appearance</h2>
      <p className={styles.tabHint}>
        Colors, position, and opening behaviour.
      </p>

      <div className={styles.fieldPair}>
        <label className={styles.field}>
          <span>Brand color</span>
          <input
            type="color"
            value={form.brandColor || '#1a1a1a'}
            onChange={(e) => updateField('brandColor', e.target.value)}
          />
          <small>Buttons and accents.</small>
        </label>

        <label className={styles.field}>
          <span>Background</span>
          <input
            type="color"
            value={form.backgroundColor || '#faf7f2'}
            onChange={(e) => updateField('backgroundColor', e.target.value)}
          />
          <small>Widget panel fill.</small>
        </label>
      </div>

      <label className={styles.field}>
        <span>Position on screen</span>
        <select
          value={form.position || 'bottom-right'}
          onChange={(e) => updateField('position', e.target.value)}
        >
          {POSITIONS.map((pos) => (
            <option key={pos.value} value={pos.value}>
              {pos.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Widget size</span>
        <select
          value={form.size || 'small'}
          onChange={(e) => updateField('size', e.target.value)}
        >
          {SIZES.map((sz) => (
            <option key={sz.value} value={sz.value}>
              {sz.label}
            </option>
          ))}
        </select>
        <small>
          Overall scale of the widget. Small is discreet, large draws more
          attention.
        </small>
      </label>

      <h3 className={styles.subTabTitle}>Auto-open behaviour</h3>

      <label className={styles.field}>
        <span>Auto-open trigger</span>
        <select
          value={form.autoOpenMode || 'disabled'}
          onChange={(e) => updateField('autoOpenMode', e.target.value)}
        >
          {AUTO_OPEN_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
        <small>
          When the widget opens itself for the first time in the session.
          Closing the widget suppresses auto-open for the rest of the session.
        </small>
      </label>

      {(form.autoOpenMode === 'time' ||
        form.autoOpenMode === 'time_or_scroll') && (
        <label className={styles.field}>
          <span>Delay before opening</span>
          <select
            value={form.autoOpenDelay || 8}
            onChange={(e) =>
              updateField('autoOpenDelay', parseInt(e.target.value, 10))
            }
          >
            {AUTO_OPEN_DELAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {(form.autoOpenMode === 'scroll' ||
        form.autoOpenMode === 'time_or_scroll') && (
        <label className={styles.field}>
          <span>Scroll threshold</span>
          <select
            value={form.autoOpenScrollPercent || 50}
            onChange={(e) =>
              updateField('autoOpenScrollPercent', parseInt(e.target.value, 10))
            }
          >
            {SCROLL_THRESHOLDS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}

function LanguagesTab({ form, updateField, toggleLocale }) {
  return (
    <>
      <h2 className={styles.tabTitle}>Languages &amp; currency</h2>
      <p className={styles.tabHint}>Click a chip to toggle a language.</p>

      <div className={styles.field}>
        <span>Enabled languages</span>
        <div className={styles.chipGrid}>
          {Object.entries(SUPPORTED_LOCALES).map(([code, name]) => (
            <button
              type="button"
              key={code}
              className={`${styles.chip} ${
                form.enabledLocales.includes(code) ? styles.chipActive : ''
              }`}
              onClick={() => toggleLocale(code)}
            >
              {code} · {name}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.field}>
        <span>Default language</span>
        <select
          value={form.defaultLocale}
          onChange={(e) => updateField('defaultLocale', e.target.value)}
        >
          {form.enabledLocales.map((code) => (
            <option key={code} value={code}>
              {code} · {SUPPORTED_LOCALES[code] || code}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Currency</span>
        <select
          value={form.currency}
          onChange={(e) => updateField('currency', e.target.value)}
        >
          {SUPPORTED_CURRENCIES.map((c) => {
            // Handle both shapes: string ('EUR') or object ({ code, name })
            const value = typeof c === 'string' ? c : c.code;
            const label = typeof c === 'string' ? c : (c.name || c.code);
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
      </label>
    </>
  );
}

function AnalyticsTab({ form, updateField }) {
  return (
    <>
      <h2 className={styles.tabTitle}>Analytics</h2>
      <p className={styles.tabHint}>
        DataLayer events pushed when users interact with the widget. Events
        use the prefix <code>dedge_widget_</code>.
      </p>

      <label className={styles.toggleLabel}>
        <input
          type="checkbox"
          checked={form.analyticsEnabled}
          onChange={(e) => updateField('analyticsEnabled', e.target.checked)}
        />
        <span>Enable dataLayer push</span>
      </label>

      {form.analyticsEnabled && (
        <label className={styles.field}>
          <span>DataLayer variable name</span>
          <input
            type="text"
            value={form.dataLayerName}
            onChange={(e) => updateField('dataLayerName', e.target.value)}
          />
          <small>
            Name of the global array. Default <code>dataLayer</code> (GTM standard).
          </small>
        </label>
      )}
    </>
  );
}

function PublishTab({ hotelId, publishState, copied, onPublish, onDownload, onCopyEmbed }) {
  const canPublish = hotelId && hotelId.trim();
  return (
    <>
      <h2 className={styles.tabTitle}>Publish</h2>
      <p className={styles.tabHint}>
        Save the configuration so the widget can load it on the hotel website.
      </p>

      <div className={styles.publishActions}>
        <button
          type="button"
          onClick={onPublish}
          disabled={publishState.status === 'publishing' || !canPublish}
          className={styles.primaryBtn}
        >
          {publishState.status === 'publishing' ? 'Publishing…' : 'Publish'}
        </button>
        <button type="button" onClick={onDownload} className={styles.ghostBtn}>
          Download JSON
        </button>
      </div>

      {!canPublish && (
        <div className={styles.hintBox}>
          Set a Hotel ID in the Identity tab before publishing.
        </div>
      )}

      {publishState.status === 'success' && (
        <div className={styles.successBox}>
          <strong>Configuration published</strong>
          <p>The widget will pick up the new config in 1–2 minutes.</p>
        </div>
      )}

      {publishState.status === 'error' && (
        <div className={styles.errorBox}>
          <strong>Publish failed</strong>
          <p>{publishState.message}</p>
        </div>
      )}

      {canPublish && (
        <>
          <h3 className={styles.subTitle}>Embed code</h3>
          <p className={styles.tabHint}>
            Paste this snippet on the hotel website (just before <code>&lt;/body&gt;</code>)
            or push it through Google Tag Manager.
          </p>
          <div className={styles.embedCodeWrap}>
            <pre className={styles.embedCode}>
{`<script async src="https://vturlin.github.io/best-price-widget/widget.js?id=${hotelId}"></script>`}
            </pre>
            <button
              type="button"
              onClick={onCopyEmbed}
              className={styles.ghostBtn}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </>
      )}
    </>
  );
}