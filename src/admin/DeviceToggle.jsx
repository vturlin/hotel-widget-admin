import styles from './DeviceToggle.module.css';

export default function DeviceToggle({ device, onChange }) {
  return (
    <div className={styles.wrap}>
      {['desktop', 'mobile'].map((d) => (
        <button
          key={d}
          type="button"
          className={`${styles.btn} ${device === d ? styles.active : ''}`}
          onClick={() => onChange(d)}
        >
          {d}
        </button>
      ))}
    </div>
  );
}
