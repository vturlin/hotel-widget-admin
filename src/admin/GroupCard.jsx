import styles from './GroupCard.module.css';

export default function GroupCard({ title, hint, action, children, last }) {
  return (
    <section className={`${styles.card} ${last ? styles.last : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.title}>{title}</div>
          {hint && <div className={styles.hint}>{hint}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
