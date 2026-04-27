import StatsView from './StatsView.jsx';
import styles from './GlobalStatsScreen.module.css';

// Top-level "all hotels" stats view, accessed from the hotels landing.
// Uses the same StatsView as the per-hotel tab, with hotelId=null so
// the server queries across all hotels.
export default function GlobalStatsScreen({ onBack }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <button type="button" onClick={onBack} className={styles.back}>
              ← Hotels
            </button>
            <h1 className={styles.title}>Stats — all hotels</h1>
            <p className={styles.subtitle}>
              First-party tracking events across every published configuration.
            </p>
          </div>
        </header>

        <StatsView hotelId={null} />
      </div>
    </div>
  );
}
