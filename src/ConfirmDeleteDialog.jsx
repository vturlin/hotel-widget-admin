import { useState } from 'react';
import styles from './App.module.css';

/**
 * Confirmation modal for destructive actions. Requires the user to type
 * the hotelId to confirm — a standard pattern to prevent accidental
 * deletions (popularized by GitHub, Stripe, etc.).
 */
export default function ConfirmDeleteDialog({ hotelId, hotelName, onConfirm, onCancel }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const matches = typed === hotelId;

  async function handleDelete() {
    if (!matches) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/config/${encodeURIComponent(hotelId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      onConfirm();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className={styles.modalBackdrop} onClick={deleting ? undefined : onCancel}>
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 460 }}
      >
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Delete configuration</h2>
          <p className={styles.modalSubtitle}>
            This action cannot be undone. The widget will stop loading for
            hotels still using this ID.
          </p>
        </header>

        <div className={styles.modalBody}>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-primary)' }}>
            You're about to delete{' '}
            <strong>{hotelName || 'this configuration'}</strong>.
          </p>
          <label className={styles.field}>
            <span>Type the Hotel ID to confirm</span>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={hotelId}
              autoFocus
              disabled={deleting}
            />
            <small>
              Expected: <code>{hotelId}</code>
            </small>
          </label>

          {error && (
            <div className={styles.errorBox} style={{ marginTop: 12 }}>
              <strong>Delete failed</strong>
              <p>{error}</p>
            </div>
          )}
        </div>

        <footer className={styles.modalFooter}>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className={styles.ghostBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!matches || deleting}
            className={styles.dangerBtn}
          >
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </footer>
      </div>
    </div>
  );
}