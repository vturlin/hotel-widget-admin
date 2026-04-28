import GroupCard from '../admin/GroupCard.jsx';
import PanelHeader from '../admin/PanelHeader.jsx';
import styles from './PublishTab.module.css';

export default function PublishTab({
  hotelId,
  publishState,
  copied,
  onPublish,
  onDownload,
  onCopyEmbed,
  isDirty,
  changedFields,
  // Override per product. The lead-gen flow points at a different
  // GitHub Pages bundle; defaulting to best-price keeps existing
  // callers unchanged.
  embedScriptSrc,
}) {
  const canPublish = !!hotelId && hotelId.trim();
  const scriptSrc = embedScriptSrc
    || `https://vturlin.github.io/best-price-widget/widget.js?id=${hotelId}`;

  return (
    <>
      <PanelHeader
        title="Publish"
        subtitle="Save the configuration so the widget can load it on the hotel website."
      />

      <GroupCard title="Status">
        <div className={styles.statusPanel}>
          <span className={`${styles.dot} ${isDirty ? styles.dirty : styles.clean}`} />
          <div className={styles.statusBody}>
            <div className={styles.statusTitle}>
              {isDirty
                ? `${changedFields.length} unpublished change${changedFields.length === 1 ? '' : 's'}`
                : 'All changes published'}
            </div>
            {isDirty && changedFields.length > 0 && (
              <div className={styles.statusList}>{changedFields.join(', ')}</div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.publishBtn}
            onClick={onPublish}
            disabled={publishState.status === 'publishing' || !canPublish}
          >
            {publishState.status === 'publishing' ? 'Publishing…' : 'Publish changes'}
          </button>
          <button type="button" className={styles.downloadBtn} onClick={onDownload}>
            Download JSON
          </button>
        </div>

        {!canPublish && (
          <div className={styles.hintBox}>
            Set a Hotel ID in the Identity tab before publishing.
          </div>
        )}

        {publishState.status === 'error' && (
          <div className={styles.errorPanel}>
            <strong>Publish failed</strong>
            {publishState.message}
          </div>
        )}
      </GroupCard>

      {canPublish && (
        <GroupCard
          title="Embed code"
          hint={
            <>
              Paste this just before the closing <code>&lt;/body&gt;</code> tag, or push it through GTM. The widget picks up the new config 1–2 minutes after publish.
            </>
          }
          last
        >
          <pre className={styles.codeBlock}>
            <span className={styles.tagPunct}>{'<script'}</span>
            {' '}
            <span className={styles.attrName}>async</span>
            {' '}
            <span className={styles.attrName}>src</span>
            <span className={styles.tagPunct}>=</span>
            <span className={styles.attrValue}>"{scriptSrc}"</span>
            <span className={styles.tagPunct}>{'></script>'}</span>
            <button type="button" className={styles.copyBtn} onClick={onCopyEmbed} aria-label="Copy embed code">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </pre>
        </GroupCard>
      )}
    </>
  );
}
