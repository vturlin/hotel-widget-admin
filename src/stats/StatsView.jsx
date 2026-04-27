import { useEffect, useState, useMemo } from 'react';
import { TRACKED_EVENTS } from '../constants.js';
import GroupCard from '../admin/GroupCard.jsx';
import StatsChart from './StatsChart.jsx';
import styles from './StatsView.module.css';

// Reusable stats view. Renders date pickers, totals cards, funnel and
// a daily multi-series chart. Used both from the per-hotel Stats tab
// (`hotelId` set) and from the global stats screen (`hotelId` null).
export default function StatsView({ hotelId }) {
  const [dateFrom, setDateFrom] = useState(() => isoDaysAgo(30));
  const [dateTo, setDateTo] = useState(() => isoDaysAgo(-1));
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError('');
    const path = hotelId
      ? `/api/stats/${encodeURIComponent(hotelId)}`
      : '/api/stats';
    const url = `${path}?from=${dateFrom}&to=${dateTo}`;
    fetch(url)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
        return body;
      })
      .then((body) => {
        if (cancelled) return;
        setData(body);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [hotelId, dateFrom, dateTo]);

  const funnel = useMemo(() => buildFunnel(data?.totals), [data]);

  return (
    <>
      <GroupCard
        title="Date range"
        action={
          <div className={styles.presets}>
            {[
              { label: '7d', from: 7 },
              { label: '30d', from: 30 },
              { label: '90d', from: 90 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                className={styles.presetBtn}
                onClick={() => {
                  setDateFrom(isoDaysAgo(p.from));
                  setDateTo(isoDaysAgo(-1));
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      >
        <div className={styles.dateRow}>
          <label className={styles.dateLabel}>
            <span>From</span>
            <input
              type="date"
              className={styles.dateInput}
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label className={styles.dateLabel}>
            <span>To</span>
            <input
              type="date"
              className={styles.dateInput}
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
        </div>
      </GroupCard>

      {status === 'loading' && (
        <GroupCard title="Loading…">
          <div className={styles.muted}>Querying BigQuery…</div>
        </GroupCard>
      )}

      {status === 'error' && (
        <GroupCard title="Couldn't load stats">
          <div className={styles.error}>{error}</div>
          {error.includes('not configured') && (
            <div className={styles.muted}>
              Set <code>BQ_PROJECT_ID</code> on the admin server (see SETUP-TRACKER.md).
            </div>
          )}
        </GroupCard>
      )}

      {status === 'ready' && data && (
        <>
          <GroupCard title="Totals" hint={hotelId ? `Hotel: ${hotelId}` : 'All hotels combined'}>
            <div className={styles.totalsGrid}>
              {TRACKED_EVENTS.map((ev) => {
                const t = data.totals?.[ev.key];
                const count = t?.count || 0;
                const uniques = t?.uniqueUsers || 0;
                return (
                  <div key={ev.key} className={styles.totalCard}>
                    <div className={styles.totalLabel}>{ev.label}</div>
                    <div className={styles.totalCount}>{formatNumber(count)}</div>
                    <div className={styles.totalSub}>
                      {formatNumber(uniques)} unique user{uniques === 1 ? '' : 's'}
                    </div>
                  </div>
                );
              })}
            </div>
          </GroupCard>

          <GroupCard title="Funnel" hint="Conversion rate from one step to the next.">
            <div className={styles.funnel}>
              {funnel.map((step, i) => (
                <div key={step.event} className={styles.funnelStep}>
                  <div className={styles.funnelLabel}>{step.label}</div>
                  <div className={styles.funnelCount}>{formatNumber(step.count)}</div>
                  {i > 0 && (
                    <div className={styles.funnelRate}>
                      {step.rate == null ? '—' : `${(step.rate * 100).toFixed(1)}%`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GroupCard>

          <GroupCard title="Daily breakdown" last>
            <StatsChart series={data.series} />
          </GroupCard>
        </>
      )}
    </>
  );
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatNumber(n) {
  return new Intl.NumberFormat().format(n || 0);
}

function buildFunnel(totals) {
  if (!totals) return [];
  return TRACKED_EVENTS.map((ev, i) => {
    const count = totals[ev.key]?.count || 0;
    const prev = i > 0 ? totals[TRACKED_EVENTS[i - 1].key]?.count || 0 : null;
    return {
      event: ev.key,
      label: ev.label,
      count,
      rate: prev != null && prev > 0 ? count / prev : null,
    };
  });
}
