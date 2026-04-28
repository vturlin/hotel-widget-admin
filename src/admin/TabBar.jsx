import { TABS } from '../constants.js';
import styles from './TabBar.module.css';

// `tabs` falls back to the best-price TABS so existing callers keep
// working unchanged. Per-product config forms (lead-gen, future ones)
// pass their own list to swap the bar content without forking the
// component.
export default function TabBar({ activeTab, onTabChange, tabs = TABS }) {
  return (
    <nav className={styles.bar}>
      {tabs.map((t) => (
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
