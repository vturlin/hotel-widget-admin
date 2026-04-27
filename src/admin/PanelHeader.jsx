import styles from './PanelHeader.module.css';

export default function PanelHeader({ title, subtitle }) {
  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
}
