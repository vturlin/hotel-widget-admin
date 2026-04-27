import styles from './Select.module.css';

export default function Select({ value, onChange, options }) {
  return (
    <div className={styles.wrap}>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className={styles.chevron}
        width="10"
        height="6"
        viewBox="0 0 10 6"
        aria-hidden="true"
      >
        <path
          d="M1 1L5 5L9 1"
          stroke="#666"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
