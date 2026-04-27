import styles from './ColorInput.module.css';

export default function ColorInput({ value, onChange, presets = [] }) {
  const safeValue = value || '#000000';
  return (
    <div>
      <div className={styles.wrap}>
        <label
          className={styles.swatch}
          style={{ background: safeValue }}
          aria-label="Pick a color"
        >
          <input
            type="color"
            className={styles.swatchPicker}
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <input
          type="text"
          className={styles.hex}
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {presets.length > 0 && (
        <div className={styles.presets}>
          {presets.map((p) => {
            const active = safeValue.toLowerCase() === p.toLowerCase();
            return (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                className={`${styles.preset} ${active ? styles.active : ''}`}
                style={{ background: p }}
                title={p}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
