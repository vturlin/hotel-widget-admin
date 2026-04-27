import { useState, useEffect } from 'react';
import styles from './PublishConfirmDialog.module.css';
import { diffConfigs, formatDiffValue } from '../diff.js';

/**
 * Modal shown before publishing. Contains:
 *   - A summary (A) of what's about to be published
 *   - A diff view (B) against the currently-live config, if any
 *
 * While the diff loads, the user already sees the summary and the
 * Confirm button — we don't want to block them on a network request
 * that's just informative.
 */
export default function PublishConfirmDialog({
  hotelId,
  config,
  onConfirm,
  onCancel,
  isPublishing,
}) {
  const [currentConfig, setCurrentConfig] = useState(null);
  const [diffStatus, setDiffStatus] = useState('loading'); // loading | new | ready | error

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/current-config/${encodeURIComponent(hotelId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.exists) {
          setDiffStatus('new');
        } else {
          setCurrentConfig(data.config);
          setDiffStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setDiffStatus('error');
      });
    return () => { cancelled = true; };
  }, [hotelId]);

  const changes = currentConfig ? diffConfigs(currentConfig, config) : [];

  // ESC to cancel
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !isPublishing) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, isPublishing]);

  return (
    <div
      className={styles.backdrop}
      onClick={isPublishing ? undefined : onCancel}
    >
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-dialog-title"
      >
        <header className={styles.header}>
          <h2 id="publish-dialog-title" className={styles.title}>
            Publish configuration
          </h2>
          <p className={styles.subtitle}>
            Review what's about to be pushed before confirming.
          </p>
        </header>

        <div className={styles.body}>
          {/* Summary section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Summary</h3>
            <dl className={styles.summary}>
              <SummaryRow label="Hotel ID" value={hotelId} mono />
              <SummaryRow label="Hotel name" value={config.hotelName} />
              <SummaryRow
                label="Languages"
                value={`${config.enabledLocales?.length || 0} enabled (default: ${config.defaultLocale})`}
              />
              <SummaryRow
                label="Auto-open"
                value={formatAutoOpen(config)}
              />
              <SummaryRow
                label="Analytics"
                value={config.analytics?.enabled ? 'Enabled' : 'Disabled'}
              />
            </dl>
          </section>

          {/* Diff section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Changes</h3>

            {diffStatus === 'loading' && (
              <p className={styles.muted}>Loading current version…</p>
            )}

            {diffStatus === 'error' && (
              <p className={styles.muted}>
                Couldn't fetch the current version. You can still publish.
              </p>
            )}

            {diffStatus === 'new' && (
              <div className={styles.newBanner}>
                <strong>First publication</strong>
                <p>
                  No config exists yet for <code>{hotelId}</code>. This will
                  create the file.
                </p>
              </div>
            )}

            {diffStatus === 'ready' && changes.length === 0 && (
              <p className={styles.muted}>
                No changes — the new config is identical to the live version.
              </p>
            )}

            {diffStatus === 'ready' && changes.length > 0 && (
              <ul className={styles.diffList}>
                {changes.map((c) => (
                  <li key={c.path} className={`${styles.diffItem} ${styles['diff_' + c.type]}`}>
                    <span className={styles.diffPath}>{c.path}</span>
                    <span className={styles.diffValues}>
                      {c.type === 'added' && (
                        <span className={styles.diffAfter}>
                          + {formatDiffValue(c.after)}
                        </span>
                      )}
                      {c.type === 'removed' && (
                        <span className={styles.diffBefore}>
                          − {formatDiffValue(c.before)}
                        </span>
                      )}
                      {c.type === 'modified' && (
                        <>
                          <span className={styles.diffBefore}>
                            {formatDiffValue(c.before)}
                          </span>
                          <span className={styles.diffArrow}>→</span>
                          <span className={styles.diffAfter}>
                            {formatDiffValue(c.after)}
                          </span>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPublishing}
            className={styles.cancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPublishing}
            className={styles.confirmBtn}
          >
            {isPublishing ? 'Publishing…' : 'Confirm and publish'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, mono }) {
  return (
    <>
      <dt className={styles.summaryLabel}>{label}</dt>
      <dd className={`${styles.summaryValue} ${mono ? styles.mono : ''}`}>
        {value}
      </dd>
    </>
  );
}

function formatAutoOpen(config) {
  const mode = config.autoOpenMode || 'disabled';
  if (mode === 'disabled') return 'Disabled';
  if (mode === 'time') return `After ${config.autoOpenDelay}s`;
  if (mode === 'scroll') return `At ${config.autoOpenScrollPercent}% scroll`;
  if (mode === 'time_or_scroll') {
    return `After ${config.autoOpenDelay}s or ${config.autoOpenScrollPercent}% scroll`;
  }
  return mode;
}
