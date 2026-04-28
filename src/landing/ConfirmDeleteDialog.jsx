import { useState } from 'react';
import styles from './ConfirmDeleteDialog.module.css';

/**
 * Confirmation modal for destructive actions. Requires the user to type
 * the hotelId to confirm — a standard pattern to prevent accidental
 * deletions (popularized by GitHub, Stripe, etc.).
 */
export default function ConfirmDeleteDialog({
  hotelId,
  hotelName,
  onConfirm,
  onCancel,
  // Override per product. Best-price defaults to /api/config/{id};
  // lead-gen passes /api/lead-gen/config/{id}.
  deleteEndpoint,
}) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const matches = typed === hotelId;

  async function handleDelete() {
    if (!matches) return;
    setDeleting(true);
    setError('');
    try {
      const url = deleteEndpoint || `/api/config/${encodeURIComponent(hotelId)}`;
      const res = await fetch(url, {
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
    <div className={styles.backdrop} onClick={deleting ? undefined : onCancel}>
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Delete configuration</h2>
          <p className={styles.subtitle}>
            This action cannot be undone. The widget will stop loading for
            hotels still using this ID.
          </p>
        </header>

        <div className={styles.body}>
          <p className={styles.intro}>
            You're about to delete{' '}
            <strong>{hotelName || 'this configuration'}</strong>.
          </p>
          <div>
            <span className={styles.fieldLabel}>Type the Hotel ID to confirm</span>
            <input
              type="text"
              className={styles.input}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={hotelId}
              autoFocus
              disabled={deleting}
            />
            <small className={styles.fieldHint}>
              Expected: <code>{hotelId}</code>
            </small>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <strong>Delete failed</strong>
              <p>{error}</p>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className={styles.cancelBtn}
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
