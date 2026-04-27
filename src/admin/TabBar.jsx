import { TABS } from '../constants.js';
import styles from './TabBar.module.css';

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className={styles.bar}>
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`${styles.tab} ${activeTab === t.key ? styles.active : ''}`}
          onClick={() => onTabChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
