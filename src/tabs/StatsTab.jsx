import PanelHeader from '../admin/PanelHeader.jsx';
import StatsView from '../stats/StatsView.jsx';

export default function StatsTab({ hotelId }) {
  return (
    <>
      <PanelHeader
        title="Stats"
        subtitle="First-party widget metrics for this hotel."
      />
      {hotelId ? (
        <StatsView hotelId={hotelId} />
      ) : (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
          Save the configuration first — stats are scoped by Hotel ID.
        </div>
      )}
    </>
  );
}
