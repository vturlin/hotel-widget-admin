import { useMemo, useState } from 'react';
import { TRACKED_EVENTS } from '../constants.js';
import styles from './StatsChart.module.css';

// Multi-line daily chart, vanilla SVG. No external dep. Hover-tooltip
// shows the exact day + counts per event. Designed for ~7-90 days of
// data; with 365 days the X-axis crowds but stays readable.
const COLORS = {
  widget_loaded: '#7E65AE',
  widget_opened: '#432975',
  book_clicked: '#F59E0B',
  sale: '#10B981',
};
const PADDING = { top: 16, right: 16, bottom: 36, left: 44 };
const HEIGHT = 240;

export default function StatsChart({ series }) {
  const [hover, setHover] = useState(null); // { dayIdx, x, y }

  const { width, points, yMax, daysCount } = useMemo(() => {
    const w = Math.max(420, (series?.length || 30) * 12 + PADDING.left + PADDING.right);
    let max = 0;
    for (const row of series || []) {
      for (const ev of TRACKED_EVENTS) {
        const v = row.events[ev.key] || 0;
        if (v > max) max = v;
      }
    }
    if (max === 0) max = 1;
    const innerW = w - PADDING.left - PADDING.right;
    const innerH = HEIGHT - PADDING.top - PADDING.bottom;
    const xStep = (series?.length || 1) > 1
      ? innerW / (series.length - 1)
      : 0;

    const pts = {};
    for (const ev of TRACKED_EVENTS) {
      pts[ev.key] = (series || []).map((row, i) => {
        const v = row.events[ev.key] || 0;
        return {
          x: PADDING.left + i * xStep,
          y: PADDING.top + innerH - (v / max) * innerH,
          v,
          day: row.day,
        };
      });
    }
    return { width: w, points: pts, yMax: max, daysCount: series?.length || 0 };
  }, [series]);

  if (!series || series.length === 0) {
    return <div className={styles.empty}>No data in this range yet.</div>;
  }

  // Y-axis ticks: 0 / 25% / 50% / 75% / 100% of max
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    label: Math.round(yMax * f),
    y: PADDING.top + (HEIGHT - PADDING.top - PADDING.bottom) * (1 - f),
  }));

  // X-axis: show first, middle, last day labels (avoid clutter)
  const xLabels = (() => {
    if (daysCount <= 7) {
      return series.map((row, i) => ({ label: shortDate(row.day), x: points.widget_loaded[i].x }));
    }
    const idxs = [0, Math.floor(daysCount / 2), daysCount - 1];
    return idxs.map((i) => ({
      label: shortDate(series[i].day),
      x: points.widget_loaded[i].x,
    }));
  })();

  return (
    <div className={styles.wrap}>
      <div className={styles.legend}>
        {TRACKED_EVENTS.map((ev) => (
          <span key={ev.key} className={styles.legendItem}>
            <span
              className={styles.swatch}
              style={{ background: COLORS[ev.key] || '#666' }}
            />
            {ev.label}
          </span>
        ))}
      </div>

      <div className={styles.scroll}>
        <svg
          width={width}
          height={HEIGHT}
          className={styles.svg}
          onMouseLeave={() => setHover(null)}
        >
          {/* Y grid + labels */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={t.y}
                y2={t.y}
                className={styles.gridLine}
              />
              <text
                x={PADDING.left - 6}
                y={t.y + 3}
                className={styles.axisLabel}
                textAnchor="end"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* X labels */}
          {xLabels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={HEIGHT - PADDING.bottom + 16}
              className={styles.axisLabel}
              textAnchor="middle"
            >
              {l.label}
            </text>
          ))}

          {/* Series lines */}
          {TRACKED_EVENTS.map((ev) => {
            const pts = points[ev.key];
            const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
            return (
              <path
                key={ev.key}
                d={d}
                fill="none"
                stroke={COLORS[ev.key] || '#666'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Hover columns (transparent rects to capture mouse) */}
          {series.map((row, i) => {
            const x = points.widget_loaded[i].x;
            const colW = i === series.length - 1 || daysCount === 1
              ? 16
              : points.widget_loaded[i + 1]?.x - x;
            return (
              <rect
                key={i}
                x={x - colW / 2}
                y={PADDING.top}
                width={Math.max(colW, 1)}
                height={HEIGHT - PADDING.top - PADDING.bottom}
                fill="transparent"
                onMouseEnter={() => setHover({ idx: i, x })}
              />
            );
          })}

          {/* Hover marker line */}
          {hover && (
            <line
              x1={hover.x}
              x2={hover.x}
              y1={PADDING.top}
              y2={HEIGHT - PADDING.bottom}
              className={styles.hoverLine}
            />
          )}
        </svg>
      </div>

      {hover && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipDay}>{series[hover.idx].day}</div>
          {TRACKED_EVENTS.map((ev) => (
            <div key={ev.key} className={styles.tooltipRow}>
              <span className={styles.swatch} style={{ background: COLORS[ev.key] || '#666' }} />
              <span className={styles.tooltipLabel}>{ev.label}</span>
              <span className={styles.tooltipValue}>
                {series[hover.idx].events[ev.key] || 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function shortDate(iso) {
  // 'YYYY-MM-DD' → 'MMM D'
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
