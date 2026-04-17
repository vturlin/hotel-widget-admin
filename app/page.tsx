'use client';

import { useState, useMemo, useEffect } from 'react';
import styles from './page.module.css';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Room {
  id: string;
  name: string;
}

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

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------

function generateHotelId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `hm_${suffix}`;
}

function parseRoomsText(text: string): Room[] {
  return text
    .trim()
    .split('\n')
    .map((line) => {
      const [id, name] = line.split('|').map((s) => s.trim());
      return id && name ? { id, name } : null;
    })
    .filter((r): r is Room => r !== null);
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
  const encoded = btoa(encodeURIComponent(JSON.stringify(config))
    .replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode(parseInt(p, 16))))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${WIDGET_PREVIEW_URL}?preview=${encoded}`;
}

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------

export default function Home() {
  // Auth gate
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

// -----------------------------------------------------------------------------
// Admin UI (shown after auth)
// -----------------------------------------------------------------------------

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
  const [publishState, setPublishState] = useState<{
    status: 'idle' | 'publishing' | 'success' | 'error';
    message?: string;
    sha?: string;
  }>({ status: 'idle' });

  // Sync rooms from text
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

  // Device dimensions
  const viewport = device === 'desktop' ? { w: 1280, h: 720 } : { w: 390, h: 844 };
  const displayWidth = 560;
  const scale = displayWidth / viewport.w;
  const displayHeight = viewport.h * scale;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateChannelLabel(key: string, value: string) {
    setForm((f) => ({
      ...f,
      channelLabels: { ...f.channelLabels, [key]: value },
    }));
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
      setPublishState({
        status: 'success',
        sha: data.commit?.sha?.substring(0, 7),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPublishState({ status: 'error', message: msg });
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.hotelId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.layout}>
      {/* =========== LEFT: form ============ */}
      <div className={styles.formColumn}>
        <h1 className={styles.title}>🏨 Hotel Widget — Config Manager</h1>
        <p className={styles.subtitle}>Changes update the preview live.</p>

        {/* Identification */}
        <section className={styles.section}>
          <h2>🆔 Identification</h2>

          <label>
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
                className={styles.secondaryBtn}
              >
                🎲 Regenerate
              </button>
            </div>
          </label>

          <label>
            <span>Hotel name</span>
            <input
              type="text"
              value={form.hotelName}
              onChange={(e) => updateField('hotelName', e.target.value)}
            />
          </label>

          <label>
            <span>Client domain</span>
            <input
              type="text"
              value={form.hotelDomain}
              onChange={(e) => updateField('hotelDomain', e.target.value)}
            />
          </label>
        </section>

        {/* Data source */}
        <section className={styles.section}>
          <h2>📊 Data source</h2>

          <label>
            <span>Google Sheet CSV URL</span>
            <input
              type="text"
              value={form.csvUrl}
              onChange={(e) => updateField('csvUrl', e.target.value)}
            />
          </label>

          <label>
            <span>Rooms (one per line, format: id | name)</span>
            <textarea
              rows={5}
              value={roomsText}
              onChange={(e) => setRoomsText(e.target.value)}
            />
          </label>

          {form.rooms.length > 0 && (
            <label>
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
        </section>

        {/* Booking */}
        <section className={styles.section}>
          <h2>🔗 Booking engine</h2>
          <label>
            <span>Reserve URL</span>
            <input
              type="text"
              value={form.reserveUrl}
              onChange={(e) => updateField('reserveUrl', e.target.value)}
            />
            <span className={styles.help}>
              Use {`{checkIn}`}, {`{checkOut}`}, {`{roomId}`} as placeholders.
            </span>
          </label>
        </section>

        {/* Appearance */}
        <section className={styles.section}>
          <h2>🎨 Appearance</h2>

          <div className={styles.twoCol}>
            <label>
              <span>Brand color (buttons)</span>
              <input
                type="color"
                value={form.brandColor}
                onChange={(e) => updateField('brandColor', e.target.value)}
              />
            </label>
            <label>
              <span>Background color (panel)</span>
              <input
                type="color"
                value={form.backgroundColor}
                onChange={(e) => updateField('backgroundColor', e.target.value)}
              />
            </label>
          </div>

          <label>
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

          <label>
            <span>Logo URL (optional)</span>
            <input
              type="text"
              value={form.logoUrl}
              onChange={(e) => updateField('logoUrl', e.target.value)}
            />
          </label>
        </section>

        {/* i18n */}
        <section className={styles.section}>
          <h2>🌍 Languages & currency</h2>

          <label>
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
          </label>

          <label>
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

          <label>
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
        </section>

        {/* OTA labels */}
        <section className={styles.section}>
          <h2>🏷️ OTA labels</h2>
          <div className={styles.twoCol}>
            {Object.entries(form.channelLabels).map(([key, value]) => (
              <label key={key}>
                <span>{key}</span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateChannelLabel(key, e.target.value)}
                />
              </label>
            ))}
          </div>
        </section>

        {/* Analytics */}
        <section className={styles.section}>
          <h2>📈 Analytics</h2>
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
              <label>
                <span>dataLayer variable name</span>
                <input
                  type="text"
                  value={form.dataLayerName}
                  onChange={(e) => updateField('dataLayerName', e.target.value)}
                />
              </label>
              <label>
                <span>Event prefix</span>
                <input
                  type="text"
                  value={form.eventPrefix}
                  onChange={(e) => updateField('eventPrefix', e.target.value)}
                />
              </label>
            </>
          )}
        </section>
      </div>

      {/* =========== RIGHT: sticky preview ============ */}
      <div className={styles.previewColumn}>
        <h2 className={styles.previewTitle}>👀 Live preview</h2>

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

        {/* Fake browser frame */}
        <div className={styles.browserFrame} style={{ width: displayWidth + 16 }}>
          <div className={styles.browserBar}>
            <span className={styles.browserDot} style={{ background: '#ff5f56' }} />
            <span className={styles.browserDot} style={{ background: '#ffbd2e' }} />
            <span className={styles.browserDot} style={{ background: '#27c93f' }} />
          </div>
          <div
            className={styles.browserViewport}
            style={{ width: displayWidth, height: displayHeight }}
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

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishState.status === 'publishing'}
            className={styles.primaryBtn}
          >
            {publishState.status === 'publishing'
              ? '⏳ Publishing...'
              : '🚀 Publish to GitHub'}
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className={styles.secondaryBtn}
          >
            ⬇️ Download JSON
          </button>
        </div>

        {publishState.status === 'success' && (
          <div className={styles.successBox}>
            <strong>✅ Published!</strong>
            <br />
            Commit <code>{publishState.sha}</code>. Available in 1–2 min after
            GitHub Actions finishes.
            <div className={styles.embedCode}>
              <strong>Embed code:</strong>
              <pre>{`<script async src="https://vturlin.github.io/best-price-widget/widget.js?id=${form.hotelId}"></script>`}</pre>
            </div>
          </div>
        )}

        {publishState.status === 'error' && (
          <div className={styles.errorBox}>
            <strong>❌ Failed:</strong> {publishState.message}
          </div>
        )}

        <details className={styles.jsonDetails}>
          <summary>📄 Generated JSON</summary>
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
}