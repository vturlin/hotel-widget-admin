'use client';

import { useState, useMemo, useEffect } from 'react';
import styles from './page.module.css';

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────

const SUPPORTED_LOCALES: Record<string, string> = {
  en: 'English', fr: 'Français', es: 'Español', de: 'Deutsch', it: 'Italiano',
  pt: 'Português', nl: 'Nederlands', pl: 'Polski', ru: 'Русский', cs: 'Čeština',
  sv: 'Svenska', da: 'Dansk', no: 'Norsk', fi: 'Suomi', el: 'Ελληνικά',
  tr: 'Türkçe', zh: '中文', ja: '日本語', ko: '한국어', ar: 'العربية',
};

const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY'];

const POSITIONS: Record<string, string> = {
  'bottom-right': 'Bottom right',
  'bottom-left': 'Bottom left',
  'center-right': 'Center right',
  'center-left': 'Center left',
};

const WIDGET_PREVIEW_URL =
  process.env.NEXT_PUBLIC_WIDGET_PREVIEW_URL ||
  'https://vturlin.github.io/best-price-widget/demo.html';

type TabKey = 'identity' | 'data' | 'appearance' | 'languages' | 'analytics' | 'publish';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'identity',    label: 'Identity',    icon: '🆔' },
  { key: 'data',        label: 'Data',        icon: '📊' },
  { key: 'appearance',  label: 'Appearance',  icon: '🎨' },
  { key: 'languages',   label: 'Languages',   icon: '🌍' },
  { key: 'analytics',   label: 'Analytics',   icon: '📈' },
  { key: 'publish',     label: 'Publish',     icon: '🚀' },
];

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

interface Room { id: string; name: string; }

interface FormState {
  hotelId: string;
  hotelName: string;
  hotelDomain: string;
  csvUrl: string;
  rooms: Room[];
  defaultRoomId: string;
  reserveUrl: string;
  currency: string;
  position: string;
  brandColor: string;
  backgroundColor: string;
  logoUrl: string;
  enabledLocales: string[];
  defaultLocale: string;
  channelLabels: Record<string, string>;
  analyticsEnabled: boolean;
  dataLayerName: string;
  eventPrefix: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────────────────

function generateHotelId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `hm_${suffix}`;
}

function parseRoomsText(text: string): Room[] {
  return text.trim().split('\n').map((line) => {
    const [id, name] = line.split('|').map((s) => s.trim());
    return id && name ? { id, name } : null;
  }).filter((r): r is Room => r !== null);
}

function buildConfig(form: FormState) {
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
      eventPrefix: form.eventPrefix,
    },
  };
}

function buildPreviewUrl(config: object): string {
  // UTF-8 safe base64 (the native btoa doesn't handle non-ASCII like 'ô')
  const json = JSON.stringify(config);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  const b64 = btoa(binary)
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${WIDGET_PREVIEW_URL}?preview=${b64}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [authError, setAuthError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
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
  }

  if (!authed) {
    return (
      <div className={styles.authWrap}>
        <form className={styles.authCard} onSubmit={handleLogin}>
          <h1>🔐 Hotel Widget Admin</h1>
          <p>Enter the admin password to continue.</p>
          <input
            type="password"
            value={pwdInput}
            onChange={(e) => setPwdInput(e.target.value)}
            placeholder="Password"
            autoFocus
          />
          {authError && <div className={styles.authError}>{authError}</div>}
          <button type="submit">Log in</button>
        </form>
      </div>
    );
  }

  return <AdminUI />;
}

// ─────────────────────────────────────────────────────────────────────────
// Admin UI
// ─────────────────────────────────────────────────────────────────────────

function AdminUI() {
  const [form, setForm] = useState<FormState>({
    hotelId: generateHotelId(),
    hotelName: 'Hôtel Demo',
    hotelDomain: 'hotel-client.com',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/.../pub?output=csv',
    rooms: [
      { id: 'deluxe-king', name: 'Deluxe King Room' },
      { id: 'superior-twin', name: 'Superior Twin Room' },
      { id: 'junior-suite', name: 'Junior Suite' },
    ],
    defaultRoomId: 'deluxe-king',
    reserveUrl: 'https://book.hotel-client.com/?arrive={checkIn}&depart={checkOut}&room={roomId}',
    currency: 'EUR',
    position: 'bottom-right',
    brandColor: '#8b5a3c',
    backgroundColor: '#faf7f2',
    logoUrl: '',
    enabledLocales: ['en', 'fr', 'es', 'de', 'it'],
    defaultLocale: 'en',
    channelLabels: {
      booking: 'Booking.com',
      expedia: 'Expedia',
      trivago: 'Trivago',
      hotels_com: 'Hotels.com',
      agoda: 'Agoda',
    },
    analyticsEnabled: true,
    dataLayerName: 'dataLayer',
    eventPrefix: 'hotel_widget_',
  });

  const [roomsText, setRoomsText] = useState(
    form.rooms.map((r) => `${r.id} | ${r.name}`).join('\n')
  );
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<TabKey>('identity');
  const [publishState, setPublishState] = useState<{
    status: 'idle' | 'publishing' | 'success' | 'error';
    message?: string;
    sha?: string;
  }>({ status: 'idle' });

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
  const previewUrl = useMemo(() => buildPreviewUrl(config), [config]);

  // Device viewport dims — real browser sizes we simulate inside the iframe
  const viewport = device === 'desktop' ? { w: 1280, h: 720 } : { w: 390, h: 844 };

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateChannelLabel(key: string, value: string) {
    setForm((f) => ({ ...f, channelLabels: { ...f.channelLabels, [key]: value } }));
  }

  function toggleLocale(locale: string) {
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

  async function handlePublish() {
    setPublishState({ status: 'publishing' });
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: form.hotelId, config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      setPublishState({ status: 'success', sha: data.commit?.sha?.substring(0, 7) });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPublishState({ status: 'error', message: msg });
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.hotelId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>🏨</span>
          <h1 className={styles.headerTitle}>Hotel Widget — Config Manager</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.idBadge}>{form.hotelId}</span>
        </div>
      </header>

      {/* Tabs */}
      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main split */}
      <div className={styles.main}>
        {/* ─── Preview area (fixed, centered) ─── */}
        <div className={styles.previewArea}>
          <PreviewFrame
            previewUrl={previewUrl}
            viewport={viewport}
            device={device}
            setDevice={setDevice}
          />
        </div>

        {/* ─── Config panel (scrollable) ─── */}
        <aside className={styles.configPanel}>
          <div className={styles.configInner}>
            {activeTab === 'identity' && (
              <IdentityTab form={form} updateField={updateField} />
            )}
            {activeTab === 'data' && (
              <DataTab
                form={form}
                updateField={updateField}
                roomsText={roomsText}
                setRoomsText={setRoomsText}
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
              <AnalyticsTab
                form={form}
                updateField={updateField}
                updateChannelLabel={updateChannelLabel}
              />
            )}
            {activeTab === 'publish' && (
              <PublishTab
                hotelId={form.hotelId}
                config={config}
                publishState={publishState}
                onPublish={handlePublish}
                onDownload={downloadJson}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PreviewFrame
// ─────────────────────────────────────────────────────────────────────────

function PreviewFrame({
  previewUrl,
  viewport,
  device,
  setDevice,
}: {
  previewUrl: string;
  viewport: { w: number; h: number };
  device: 'desktop' | 'mobile';
  setDevice: (d: 'desktop' | 'mobile') => void;
}) {
  // Scale the iframe so that its rendered viewport fits the available space
  const maxWidth = device === 'desktop' ? 760 : 320;
  const scale = maxWidth / viewport.w;
  const displayW = maxWidth;
  const displayH = viewport.h * scale;

  return (
    <div className={styles.previewWrap}>
      <div className={styles.browserFrame} style={{ width: displayW + 16 }}>
        <div className={styles.browserBar}>
          <span className={styles.browserDot} style={{ background: '#ff5f56' }} />
          <span className={styles.browserDot} style={{ background: '#ffbd2e' }} />
          <span className={styles.browserDot} style={{ background: '#27c93f' }} />
        </div>
        <div
          className={styles.browserViewport}
          style={{ width: displayW, height: displayH }}
        >
          <iframe
            key={previewUrl}
            src={previewUrl}
            style={{
              width: viewport.w,
              height: viewport.h,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              border: 0,
            }}
          />
        </div>
      </div>

      <div className={styles.deviceToggle}>
        <button
          className={device === 'desktop' ? styles.deviceActive : ''}
          onClick={() => setDevice('desktop')}
        >
          🖥️ Desktop
        </button>
        <button
          className={device === 'mobile' ? styles.deviceActive : ''}
          onClick={() => setDevice('mobile')}
        >
          📱 Mobile
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Tab components
// ─────────────────────────────────────────────────────────────────────────

function IdentityTab({
  form,
  updateField,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <>
      <h2 className={styles.tabTitle}>Identity</h2>
      <p className={styles.tabHint}>Basic information about the hotel.</p>

      <label className={styles.field}>
        <span>Hotel ID</span>
        <div className={styles.inputRow}>
          <input
            type="text"
            value={form.hotelId}
            onChange={(e) => updateField('hotelId', e.target.value)}
          />
          <button
            type="button"
            onClick={() => updateField('hotelId', generateHotelId())}
            className={styles.ghostBtn}
          >
            🎲
          </button>
        </div>
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
        />
        <small>Stored for reference — not used by the widget yet.</small>
      </label>
    </>
  );
}

function DataTab({
  form,
  updateField,
  roomsText,
  setRoomsText,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  roomsText: string;
  setRoomsText: (s: string) => void;
}) {
  return (
    <>
      <h2 className={styles.tabTitle}>Data source</h2>
      <p className={styles.tabHint}>
        Google Sheet CSV URL and the list of rooms to offer.
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
        <small>One per line, format: <code>id | name</code></small>
      </label>

      {form.rooms.length > 0 && (
        <label className={styles.field}>
          <span>Default room</span>
          <select
            value={form.defaultRoomId}
            onChange={(e) => updateField('defaultRoomId', e.target.value)}
          >
            {form.rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
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
          Use <code>{'{checkIn}'}</code>, <code>{'{checkOut}'}</code>,
          <code>{'{roomId}'}</code> as placeholders.
        </small>
      </label>
    </>
  );
}

function AppearanceTab({
  form,
  updateField,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <>
      <h2 className={styles.tabTitle}>Appearance</h2>
      <p className={styles.tabHint}>Colors and position of the widget.</p>

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
        <span>Position</span>
        <select
          value={form.position}
          onChange={(e) => updateField('position', e.target.value)}
        >
          {Object.entries(POSITIONS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Logo URL (optional)</span>
        <input
          type="text"
          value={form.logoUrl}
          onChange={(e) => updateField('logoUrl', e.target.value)}
        />
      </label>
    </>
  );
}

function LanguagesTab({
  form,
  updateField,
  toggleLocale,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggleLocale: (l: string) => void;
}) {
  return (
    <>
      <h2 className={styles.tabTitle}>Languages & currency</h2>
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
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
    </>
  );
}

function AnalyticsTab({
  form,
  updateField,
  updateChannelLabel,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  updateChannelLabel: (key: string, value: string) => void;
}) {
  return (
    <>
      <h2 className={styles.tabTitle}>Analytics & labels</h2>
      <p className={styles.tabHint}>dataLayer events and OTA channel labels.</p>

      <label className={styles.toggleLabel}>
        <input
          type="checkbox"
          checked={form.analyticsEnabled}
          onChange={(e) => updateField('analyticsEnabled', e.target.checked)}
        />
        <span>Enable dataLayer push</span>
      </label>

      {form.analyticsEnabled && (
        <>
          <label className={styles.field}>
            <span>dataLayer variable name</span>
            <input
              type="text"
              value={form.dataLayerName}
              onChange={(e) => updateField('dataLayerName', e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Event prefix</span>
            <input
              type="text"
              value={form.eventPrefix}
              onChange={(e) => updateField('eventPrefix', e.target.value)}
            />
          </label>
        </>
      )}

      <h3 className={styles.subTitle}>OTA labels</h3>
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

function PublishTab({
  hotelId,
  config,
  publishState,
  onPublish,
  onDownload,
}: {
  hotelId: string;
  config: object;
  publishState: {
    status: 'idle' | 'publishing' | 'success' | 'error';
    message?: string;
    sha?: string;
  };
  onPublish: () => void;
  onDownload: () => void;
}) {
  return (
    <>
      <h2 className={styles.tabTitle}>Publish</h2>
      <p className={styles.tabHint}>
        Push the config to GitHub, where the widget will fetch it.
      </p>

      <div className={styles.publishActions}>
        <button
          type="button"
          onClick={onPublish}
          disabled={publishState.status === 'publishing'}
          className={styles.primaryBtn}
        >
          {publishState.status === 'publishing'
            ? '⏳ Publishing...'
            : '🚀 Publish to GitHub'}
        </button>
        <button type="button" onClick={onDownload} className={styles.ghostBtn}>
          ⬇️ Download JSON
        </button>
      </div>

      {publishState.status === 'success' && (
        <div className={styles.successBox}>
          <strong>✅ Published!</strong>
          <div>
            Commit <code>{publishState.sha}</code>. Available in 1–2 min after
            GitHub Actions finishes.
          </div>
          <div className={styles.embedCode}>
            <strong>Embed code:</strong>
            <pre>
              {`<script async src="https://vturlin.github.io/best-price-widget/widget.js?id=${hotelId}"></script>`}
            </pre>
          </div>
        </div>
      )}

      {publishState.status === 'error' && (
        <div className={styles.errorBox}>
          <strong>❌ Failed:</strong> {publishState.message}
        </div>
      )}

      <details className={styles.jsonDetails}>
        <summary>📄 Preview JSON</summary>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </details>
    </>
  );
}