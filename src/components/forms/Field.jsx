import styles from './Field.module.css';

// Renders as a <div>, not <label>, so it can wrap controls (like ColorInput,
// Toggle, Checkbox) that already contain their own <label>/<button>. Nested
// <label> elements are invalid HTML and trigger a React warning.
export default function Field({ label, hint, optional, error, children }) {
  return (
    <div className={styles.field}>
      <div className={styles.label}>
        {label}
        {optional && <span className={styles.optional}>optional</span>}
      </div>
      {children}
      {error
        ? <div className={styles.error}>{error}</div>
        : hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
