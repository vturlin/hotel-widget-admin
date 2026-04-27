import styles from './Checkbox.module.css';

export default function Checkbox({ checked, onChange, label, suffix }) {
  return (
    <label className={`${styles.row} ${checked ? styles.checked : ''}`}>
      <input
        type="checkbox"
        className={styles.native}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={`${styles.box} ${checked ? styles.checked : ''}`}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" aria-hidden="true">
            <path
              d="M1 4L4 7L9 1"
              stroke="#fff"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className={styles.label}>{label}</span>
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </label>
  );
}
