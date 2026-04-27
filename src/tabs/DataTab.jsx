import { useState } from 'react';
import { API_CHANNELS } from '../constants.js';
import { analyzeRatesResponse } from '../utils.js';
import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';
import Select from '../components/forms/Select.jsx';
import Checkbox from '../components/forms/Checkbox.jsx';
import styles from './DataTab.module.css';

export default function DataTab({ form, updateField }) {
  const [testStatus, setTestStatus] = useState('idle');
  const [testError, setTestError] = useState('');
  const [apiAnalysis, setApiAnalysis] = useState(null);

  async function handleTestApi() {
    if (!form.apiHotelId) {
      setTestStatus('error');
      setTestError('Please enter an API Hotel ID first.');
      return;
    }
    setTestStatus('testing');
    setTestError('');
    setApiAnalysis(null);

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    try {
      const res = await fetch(
        `/api/rates/${encodeURIComponent(form.apiHotelId)}?year=${year}&month=${month}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      const analysis = analyzeRatesResponse(data);
      if (analysis.error) throw new Error(analysis.error);

      setApiAnalysis(analysis);
      setTestStatus('ok');

      if (analysis.detectedCompetitorId && !form.apiCompetitorId) {
        updateField('apiCompetitorId', String(analysis.detectedCompetitorId));
      }
      const currentEnabled = form.channelsEnabled || [];
      if (currentEnabled.length === 0 && analysis.availableChannels?.length) {
        updateField(
          'channelsEnabled',
          analysis.availableChannels.map((ch) => ch.id)
        );
      }
    } catch (err) {
      setTestStatus('error');
      setTestError(err.message);
    }
  }

  function toggleChannel(channelId) {
    const current = form.channelsEnabled || [];
    const enabled = current.includes(channelId)
      ? current.filter((c) => c !== channelId)
      : [...current, channelId];
    updateField('channelsEnabled', enabled);
  }

  return (
    <>
      <PanelHeader
        title="Data"
        subtitle="Rates are fetched live from the AvailPro RateScreener API."
      />

      <GroupCard
        title="API connection"
        hint="Identifiers provided by AvailPro for this property."
        action={
          <button
            type="button"
            className={styles.testBtn}
            onClick={handleTestApi}
            disabled={testStatus === 'testing' || !form.apiHotelId}
          >
            {testStatus === 'testing' ? 'Testing…' : 'Test connection'}
          </button>
        }
      >
        <Field label="API Hotel ID" hint="The unique hotel ID provided by AvailPro for this property.">
          <TextInput
            value={form.apiHotelId || ''}
            onChange={(v) => updateField('apiHotelId', v)}
            placeholder="e.g. 20917"
            inputMode="numeric"
            monospace
          />
        </Field>

        <Field
          label="Competitor ID"
          hint={
            <>
              Auto-detected via <code className={styles.inlineCode}>myHotel: true</code>. Set manually only if detection fails.
            </>
          }
        >
          <TextInput
            value={form.apiCompetitorId || ''}
            onChange={(v) => updateField('apiCompetitorId', v)}
            placeholder="Auto-detected when you test the connection"
            inputMode="numeric"
            monospace
          />
        </Field>

        {testStatus === 'testing' && <div className={styles.testing}>Testing…</div>}

        {testStatus === 'error' && (
          <div className={`${styles.banner} ${styles.bannerErr}`}>
            <span className={styles.dot} />
            <div>
              <div className={styles.bannerTitle}>Connection failed</div>
              <div className={styles.bannerSub}>{testError}</div>
            </div>
          </div>
        )}

        {testStatus === 'ok' && apiAnalysis && (
          <>
            <div className={`${styles.banner} ${styles.bannerOk}`}>
              <span className={styles.dot} />
              <div>
                <div className={styles.bannerTitle}>Connection OK</div>
                <div className={styles.bannerSub}>
                  Last screening:{' '}
                  {apiAnalysis.screeningDate
                    ? new Date(apiAnalysis.screeningDate).toLocaleString()
                    : 'n/a'}
                </div>
              </div>
            </div>

            <div className={styles.detail}>
              <div className={styles.detailSection}>
                <h4 className={styles.detailHeader}>Detected competitor (myHotel)</h4>
                {apiAnalysis.detectedCompetitorId ? (
                  <p>
                    <strong>{apiAnalysis.detectedCompetitorName}</strong>{' '}
                    <code className={styles.codeChip}>#{apiAnalysis.detectedCompetitorId}</code>
                  </p>
                ) : (
                  <p className={styles.warnLine}>
                    No <code className={styles.codeChip}>myHotel</code> flag. Please set the competitor ID manually.
                  </p>
                )}
              </div>

              <div className={styles.detailSection}>
                <h4 className={styles.detailHeader}>Rooms detected (informational)</h4>
                {Object.keys(apiAnalysis.roomsByChannel).length === 0 ? (
                  <p className={styles.warnLine}>
                    No rooms found. Check that the competitor ID is correct.
                  </p>
                ) : (
                  Object.entries(apiAnalysis.roomsByChannel).map(([chId, rooms]) => {
                    const meta = API_CHANNELS[chId];
                    return (
                      <div key={chId} className={styles.channelGroup}>
                        <h5 className={styles.channelGroupHeader}>
                          {meta?.name || `Channel ${chId}`}
                          <span className={styles.channelCount}>
                            {rooms.length} room{rooms.length !== 1 ? 's' : ''}
                          </span>
                        </h5>
                        <ul className={styles.roomList}>
                          {rooms.map((r) => (
                            <li key={r.roomCode}>
                              <code className={styles.codeChip}>{r.roomCode}</code>
                              <span>{r.roomName}</span>
                              {r.maxAdultOccupancy && (
                                <span className={styles.roomOccupancy}>
                                  max {r.maxAdultOccupancy} pax
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })
                )}
                <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Informational only. The widget shows the single cheapest price across all rooms and rate conditions.
                </p>
              </div>
            </div>
          </>
        )}
      </GroupCard>

      <GroupCard
        title="Channels to display"
        hint={
          apiAnalysis?.availableChannels?.length
            ? 'Only checked channels appear in the price comparison.'
            : 'Run "Test connection" to discover available channels for this hotel.'
        }
      >
        {apiAnalysis?.availableChannels?.length > 0 ? (
          <div>
            {apiAnalysis.availableChannels.map((ch) => {
              const preferred = API_CHANNELS[ch.id];
              const displayName = preferred?.name || ch.apiName;
              const isDirect = preferred?.isDirect || false;
              return (
                <Checkbox
                  key={ch.id}
                  checked={(form.channelsEnabled || []).includes(ch.id)}
                  onChange={() => toggleChannel(ch.id)}
                  label={
                    <span>
                      {displayName}
                      {isDirect && <span className={styles.directBadge}>direct</span>}
                    </span>
                  }
                  suffix={`${ch.roomCount} room${ch.roomCount !== 1 ? 's' : ''}`}
                />
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            No channels discovered yet. Channels detected by the rate shopper will appear here after you test the API connection.
          </div>
        )}
      </GroupCard>

      <GroupCard title="Booking link" last>
        <Field
          label="Reserve URL template"
          hint={
            <>
              Placeholders:{' '}
              <code className={styles.inlineCode}>{'{checkIn}'}</code>,{' '}
              <code className={styles.inlineCode}>{'{checkOut}'}</code>.
            </>
          }
        >
          <TextInput
            value={form.reserveUrl || ''}
            onChange={(v) => updateField('reserveUrl', v)}
            placeholder="https://book.hotel.com/?arrive={checkIn}&depart={checkOut}"
          />
        </Field>

        <Field label="Currency">
          <Select
            value={form.currency || 'EUR'}
            onChange={(v) => updateField('currency', v)}
            options={[
              { value: 'EUR', label: 'EUR €' },
              { value: 'USD', label: 'USD $' },
              { value: 'GBP', label: 'GBP £' },
              { value: 'CHF', label: 'CHF' },
            ]}
          />
        </Field>
      </GroupCard>
    </>
  );
}
