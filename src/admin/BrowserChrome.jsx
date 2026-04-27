import styles from './BrowserChrome.module.css';

export default function BrowserChrome({ url, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.bar}>
        <span className={styles.dot} style={{ background: '#FF5F57' }} />
        <span className={styles.dot} style={{ background: '#FEBC2E' }} />
        <span className={styles.dot} style={{ background: '#28C840' }} />
        <div className={styles.url}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {url}
        </div>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
