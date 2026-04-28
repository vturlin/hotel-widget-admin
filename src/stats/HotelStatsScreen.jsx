import StatsView from './StatsView.jsx';
import styles from './GlobalStatsScreen.module.css';

// Per-hotel stats screen, accessed from the hotel score card.
// Mirrors GlobalStatsScreen but scopes the StatsView to a single hotel
// and shows the hotel name in the title when available.
export default function HotelStatsScreen({ hotelId, hotelName, onBack }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <button type="button" onClick={onBack} className={styles.back}>
              ← Hotels
            </button>
            <h1 className={styles.title}>
              Stats — {hotelName || hotelId}
            </h1>
            <p className={styles.subtitle}>
              First-party tracking events for this hotel.
            </p>
          </div>
        </header>

        <StatsView hotelId={hotelId} />
      </div>
    </div>
  );
}
