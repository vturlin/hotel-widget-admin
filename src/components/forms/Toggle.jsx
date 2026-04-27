import styles from './Toggle.module.css';

export default function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className={styles.row}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`${styles.pill} ${checked ? styles.on : ''}`}
      >
        <span className={styles.knob} />
      </button>
      <div className={styles.body}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
    </div>
  );
}
