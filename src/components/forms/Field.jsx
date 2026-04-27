import styles from './Field.module.css';

export default function Field({ label, hint, htmlFor, optional, children }) {
  return (
    <label htmlFor={htmlFor} className={styles.field}>
      <span className={styles.label}>
        {label}
        {optional && <span className={styles.optional}>optional</span>}
      </span>
      {children}
      {hint && <div className={styles.hint}>{hint}</div>}
    </label>
  );
}
