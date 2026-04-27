import styles from './TextInput.module.css';

export default function TextInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  monospace = false,
  prefix,
  type = 'text',
  inputMode,
}) {
  const wrapClass = [styles.wrap, disabled && styles.disabled]
    .filter(Boolean)
    .join(' ');
  const inputClass = [
    styles.input,
    disabled && styles.disabled,
    monospace && styles.mono,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapClass}>
      {prefix && <span className={styles.prefix}>{prefix}</span>}
      <input
        type={type}
        inputMode={inputMode}
        className={inputClass}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
