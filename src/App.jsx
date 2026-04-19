import { useState, useEffect, useRef, useMemo } from 'react';
import styles from './App.module.css';
import {
  SUPPORTED_LOCALES,
  SUPPORTED_CURRENCIES,
  POSITIONS,
  WIDGET_PREVIEW_URL,
  TABS,
} from './constants.js';
import {
  parseRoomsText,
  buildConfig,
  buildPreviewUrl,
  isValidPublicDomain,   
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
    hotelName: 'Hôtel Demo',
    hotelDomain: 'hotel-client.com',
    logoUrl: '',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/.../pub?output=csv',
    rooms: [
      { id: 'deluxe-king', name: 'Deluxe King Room' },
      { id: 'superior-twin', name: 'Superior Twin Room' },
      { id: 'junior-suite', name: 'Junior Suite' },
    ],
    defaultRoomId: 'deluxe-king',
    reserveUrl:
      'https://book.hotel-client.com/?arrive={checkIn}&depart={checkOut}&room={roomId}',
    channelLabels: {
      booking: 'Booking.com',
      expedia: 'Expedia',
      trivago: 'Trivago',
      hotels_com: 'Hotels.com',
      agoda: 'Agoda',
    },
    currency: 'EUR',
    position: 'bottom-right',
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

  const [roomsText, setRoomsText] = useState(
    form.rooms.map((r) => `${r.id} | ${r.name}`).join('\n')
  );
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
          csvUrl: c.csvUrl || '',
          rooms: c.roomOptions || [],
          defaultRoomId: c.default_room_id || '',
          reserveUrl: c.reserveUrl || '',
          channelLabels: c.channelLabels || {},
          currency: c.currency || 'EUR',
          position: c.position || 'bottom-right',
          brandColor: c.brandColor || '#1a1a1a',
          backgroundColor: c.backgroundColor || '#faf7f2',
          enabledLocales: c.enabledLocales || ['en'],
          defaultLocale: c.defaultLocale || 'en',
          autoOpenMode: c.autoOpenMode || 'disabled',
          autoOpenDelay: c.autoOpenDelay || 8,
          autoOpenScrollPercent: c.autoOpenScrollPercent || 50,
          analyticsEnabled: c.analytics?.enabled ?? true,
          dataLayerName: c.analytics?.dataLayerName || 'dataLayer',
        });
        setRoomsText(
          (c.roomOptions || []).map((r) => `${r.id} | ${r.name}`).join('\n')
        );
        setLoadStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message);
        setLoadStatus('error');
      });
    return () => { cancelled = true; };
  }, [isEditMode, editingHotelId]);

  useEffect(() => {
    const parsed = parseRoomsText(roomsText);
    setForm((f) => ({
      ...f,
      rooms: parsed,
      defaultRoomId: parsed.find((r) => r.id === f.defaultRoomId)
        ? f.defaultRoomId
        : parsed[0]?.id || '',
    }));
  }, [roomsText]);

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

  function updateChannelLabel(key, value) {
    setForm((f) => ({
      ...f,
      channelLabels: { ...f.channelLabels, [key]: value },
    }));
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
              <DataTab
                form={form}
                updateField={updateField}
                roomsText={roomsText}
                setRoomsText={setRoomsText}
                updateChannelLabel={updateChannelLabel}
              />
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

function DataTab({ form, updateField, roomsText, setRoomsText, updateChannelLabel }) {
  return (
    <>
      <h2 className={styles.tabTitle}>Data source</h2>
      <p className={styles.tabHint}>
        Pricing CSV, room inventory, and channel labels.
      </p>

      <label className={styles.field}>
        <span>Google Sheet CSV URL</span>
        <input
          type="text"
          value={form.csvUrl}
          onChange={(e) => updateField('csvUrl', e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>Rooms</span>
        <textarea
          rows={6}
          value={roomsText}
          onChange={(e) => setRoomsText(e.target.value)}
          placeholder="deluxe-king | Deluxe King Room"
        />
        <small>
          One per line, format: <code>id | name</code>
        </small>
      </label>

      {form.rooms.length > 0 && (
        <label className={styles.field}>
          <span>Default room</span>
          <select
            value={form.defaultRoomId}
            onChange={(e) => updateField('defaultRoomId', e.target.value)}
          >
            {form.rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className={styles.field}>
        <span>Reserve URL</span>
        <input
          type="text"
          value={form.reserveUrl}
          onChange={(e) => updateField('reserveUrl', e.target.value)}
        />
        <small>
          Use <code>{'{checkIn}'}</code>, <code>{'{checkOut}'}</code>,{' '}
          <code>{'{roomId}'}</code> as placeholders.
        </small>
      </label>

      <h3 className={styles.subTitle}>OTA channel labels</h3>
      <p className={styles.tabHint}>
        Labels shown next to each OTA price. The key on the left must match
        the column name in your CSV.
      </p>
      <div className={styles.twoCol}>
        {Object.entries(form.channelLabels).map(([key, value]) => (
          <label key={key} className={styles.field}>
            <span>{key}</span>
            <input
              type="text"
              value={value}
              onChange={(e) => updateChannelLabel(key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </>
  );
}

function AppearanceTab({ form, updateField }) {
  return (
    <>
      <h2 className={styles.tabTitle}>Appearance</h2>
      <p className={styles.tabHint}>Colors, position, and opening behaviour.</p>

      <div className={styles.twoCol}>
        <label className={styles.field}>
          <span>Brand color</span>
          <input
            type="color"
            value={form.brandColor}
            onChange={(e) => updateField('brandColor', e.target.value)}
          />
          <small>Buttons and accents.</small>
        </label>

        <label className={styles.field}>
          <span>Background</span>
          <input
            type="color"
            value={form.backgroundColor}
            onChange={(e) => updateField('backgroundColor', e.target.value)}
          />
          <small>Widget panel fill.</small>
        </label>
      </div>

      <label className={styles.field}>
        <span>Position on screen</span>
        <select
          value={form.position}
          onChange={(e) => updateField('position', e.target.value)}
        >
          {Object.entries(POSITIONS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <h3 className={styles.subTitle}>Auto-open behaviour</h3>

      <label className={styles.field}>
        <span>Auto-open trigger</span>
        <select
          value={form.autoOpenMode || 'disabled'}
          onChange={(e) => updateField('autoOpenMode', e.target.value)}
        >
          <option value="disabled">Disabled</option>
          <option value="time">After a delay</option>
          <option value="scroll">When user scrolls</option>
          <option value="time_or_scroll">Delay or scroll (first wins)</option>
        </select>
        <small>
          When the widget opens itself for the first time in the session.
          Closing the widget suppresses auto-open for the rest of the session.
        </small>
      </label>

      {(form.autoOpenMode === 'time' || form.autoOpenMode === 'time_or_scroll') && (
        <label className={styles.field}>
          <span>Delay before opening</span>
          <select
            value={form.autoOpenDelay || 8}
            onChange={(e) => updateField('autoOpenDelay', parseInt(e.target.value, 10))}
          >
            <option value={3}>3 seconds</option>
            <option value={5}>5 seconds</option>
            <option value={8}>8 seconds (recommended)</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
            <option value={20}>20 seconds</option>
          </select>
        </label>
      )}

      {(form.autoOpenMode === 'scroll' || form.autoOpenMode === 'time_or_scroll') && (
        <label className={styles.field}>
          <span>Scroll threshold</span>
          <select
            value={form.autoOpenScrollPercent || 50}
            onChange={(e) => updateField('autoOpenScrollPercent', parseInt(e.target.value, 10))}
          >
            <option value={25}>After 25% of the page</option>
            <option value={50}>After 50% of the page (recommended)</option>
          </select>
          <small>On pages that don't scroll, this trigger won't fire.</small>
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
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
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