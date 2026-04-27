import DEdgeLogo from './DEdgeLogo.jsx';
import UnpublishedPill from './UnpublishedPill.jsx';
import styles from './TopChrome.module.css';

export default function TopChrome({
  hotelId,
  hotelName,
  onBackToHotels,
  unpublishedCount,
  onPreviewLive,
  onPublish,
  canAct,
}) {
  return (
    <header className={styles.bar}>
      <DEdgeLogo height={20} />
      <span className={styles.divider} />
      <button type="button" className={styles.crumb} onClick={onBackToHotels}>
        Hotels
      </button>
      <span className={styles.sep}>›</span>
      <h1 className={styles.title}>{hotelName || 'New configuration'}</h1>
      {hotelId && <span className={styles.badge}>{hotelId}</span>}

      <div className={styles.right}>
        <UnpublishedPill count={unpublishedCount} />
        <button
          type="button"
          className={styles.outlineBtn}
          onClick={onPreviewLive}
          disabled={!canAct}
        >
          Preview live
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onPublish}
          disabled={!canAct}
        >
          Publish
        </button>
      </div>
    </header>
  );
}
