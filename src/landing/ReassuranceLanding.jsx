import { useState, useEffect } from 'react';
import styles from './HotelsLanding.module.css';

/**
 * Landing page for the reassurance product. Same UX as the lead-gen
 * and stress landings; talks to /api/reassurance/list-configs and
 * points embed snippets at the reassurance-widget GitHub Pages
 * bundle.
 */
export default function ReassuranceLanding({
  onOpen,
  onCreate,
  onDuplicate,
  onDelete,
  onBackToProducts,
}) {
  const [hotels, setHotels] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    loadHotels();
  }, []);

  async function loadHotels() {
    setStatus('loading');
    try {
      const res = await fetch('/api/reassurance/list-configs');
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
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            {onBackToProducts && (
              <button
                type="button"
                onClick={onBackToProducts}
                className={styles.back}
              >
                ← Products
              </button>
            )}
            <h1 className={styles.title}>D-EDGE Reassurance</h1>
            <p className={styles.subtitle}>
              Manage multi-platform review-score toasts for your properties
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={onCreate}
              className={styles.primaryBtn}
            >
              + New configuration
            </button>
          </div>
        </header>

        {status === 'loading' && <div className={styles.loading}>Loading…</div>}

        {status === 'error' && (
          <div className={styles.errorBox}>
            <strong>Couldn't load configurations</strong>
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
          <div className={styles.empty}>
            <h3>No configurations yet</h3>
            <p>Create your first reassurance toast to get started.</p>
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
          <div className={styles.grid}>
            {hotels.map((h) => (
              <ReassuranceCard
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

function ReassuranceCard({ hotel, onOpen, onDuplicate, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', close);
    };
  }, [menuOpen]);

  function copyEmbed() {
    const code = `<script async src="https://vturlin.github.io/reassurance-widget/widget.js?id=${hotel.hotelId}"></script>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardMenu} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className={styles.menuBtn}
          aria-label="More actions"
        >
          ⋯
        </button>
        {menuOpen && (
          <div className={styles.menuPopup}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                copyEmbed();
              }}
            >
              {copied ? 'Copied' : 'Copy embed'}
            </button>
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
              className={styles.menuDanger}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className={styles.cardMain}>
        <h3 className={styles.cardName}>
          {hotel.hotelName || (
            <span className={styles.cardUnnamed}>Untitled</span>
          )}
        </h3>
        <span className={styles.cardId}>{hotel.hotelId}</span>
        {hotel.updatedAt && (
          <span className={styles.cardDate}>
            Updated {formatRelativeDate(hotel.updatedAt)}
          </span>
        )}
      </div>

      <div className={styles.cardActions}>
        <button
          type="button"
          onClick={onOpen}
          className={styles.primaryAction}
        >
          Config
        </button>
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
