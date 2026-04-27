import styles from './UnpublishedPill.module.css';

export default function UnpublishedPill({ count }) {
  if (!count) return null;
  return (
    <div className={styles.pill}>
      <span className={styles.dot} />
      <span className={styles.label}>Unpublished changes</span>
      <span className={styles.suffix}>· {count} field{count === 1 ? '' : 's'}</span>
    </div>
  );
}
