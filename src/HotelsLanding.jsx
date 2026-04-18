import { useState, useEffect } from 'react';
import styles from './App.module.css';

/**
 * Landing page shown right after login. Lists all published hotel configs,
 * offers actions (open, duplicate, delete) + a button to create a new one.
 *
 * The list is fetched from GitHub via the admin backend. While loading,
 * we show a lightweight spinner. On error, we show an inline banner.
 */
export default function HotelsLanding({ onOpen, onCreate, onDuplicate, onDelete }) {
  const [hotels, setHotels] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  useEffect(() => {
    loadHotels();
  }, []);

  async function loadHotels() {
    setStatus('loading');
    try {
      const res = await fetch('/api/list-configs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setHotels(data.hotels);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  return (
    <div className={styles.landingWrap}>
      <div className={styles.landingInner}>
        <header className={styles.landingHeader}>
          <div>
            <h1 className={styles.landingTitle}>Hotels</h1>
            <p className={styles.landingSubtitle}>
              Manage widget configurations for your properties
            </p>
          </div>
          <button
            type="button"
            onClick={onCreate}
            className={styles.primaryBtn}
          >
            + New configuration
          </button>
        </header>

        {status === 'loading' && (
          <div className={styles.landingLoading}>Loading hotels…</div>
        )}

        {status === 'error' && (
          <div className={styles.errorBox}>
            <strong>Couldn't load hotels</strong>
            <p>{error}</p>
            <button
              type="button"
              onClick={loadHotels}
              className={styles.ghostBtn}
              style={{ marginTop: 12 }}
            >
              Retry
            </button>
          </div>
        )}

        {status === 'ready' && hotels.length === 0 && (
          <div className={styles.landingEmpty}>
            <h3>No hotels yet</h3>
            <p>Create your first configuration to get started.</p>
            <button
              type="button"
              onClick={onCreate}
              className={styles.primaryBtn}
              style={{ marginTop: 16 }}
            >
              + New configuration
            </button>
          </div>
        )}

        {status === 'ready' && hotels.length > 0 && (
          <div className={styles.hotelGrid}>
            {hotels.map((h) => (
              <HotelCard
                key={h.hotelId}
                hotel={h}
                onOpen={() => onOpen(h.hotelId)}
                onDuplicate={() => onDuplicate(h.hotelId)}
                onDelete={() => onDelete(h.hotelId, h.hotelName)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HotelCard({ hotel, onOpen, onDuplicate, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    // Let the click that opened the menu propagate first
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', close);
    };
  }, [menuOpen]);

  function copyEmbed(e) {
    e.stopPropagation();
    const code = `<script async src="https://vturlin.github.io/best-price-widget/widget.js?id=${hotel.hotelId}"></script>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={styles.hotelCard} onClick={onOpen}>
      <div className={styles.hotelCardMain}>
        <h3 className={styles.hotelCardName}>
          {hotel.hotelName || <span className={styles.hotelCardUnnamed}>Untitled</span>}
        </h3>
        <span className={styles.hotelCardId}>{hotel.hotelId}</span>
        {hotel.updatedAt && (
          <span className={styles.hotelCardDate}>
            Updated {formatRelativeDate(hotel.updatedAt)}
          </span>
        )}
      </div>

      <div className={styles.hotelCardActions} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={copyEmbed}
          className={styles.hotelCardActionBtn}
          title="Copy embed code"
        >
          {copied ? 'Copied' : 'Copy embed'}
        </button>
        <div className={styles.hotelCardMenu}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className={styles.hotelCardMenuBtn}
            aria-label="More actions"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className={styles.hotelCardMenuPopup}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDuplicate();
                }}
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
                className={styles.hotelCardMenuDanger}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeDate(iso) {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return then.toLocaleDateString();
}