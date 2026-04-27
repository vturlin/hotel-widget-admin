import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';
import Toggle from '../components/forms/Toggle.jsx';
import styles from './AnalyticsTab.module.css';

const EVENTS = [
  { name: 'dedge_widget_opened',     desc: 'User opens the widget' },
  { name: 'dedge_widget_closed',     desc: 'User dismisses the widget' },
  { name: 'dedge_widget_viewed',     desc: 'Widget enters the viewport' },
  { name: 'dedge_widget_book_click', desc: 'User clicks the Book CTA' },
];

export default function AnalyticsTab({ form, updateField }) {
  return (
    <>
      <PanelHeader
        title="Analytics"
        subtitle={
          <>
            DataLayer events pushed when users interact with the widget. All events are prefixed{' '}
            <code className={styles.inlineCode}>dedge_widget_</code>.
          </>
        }
      />

      <GroupCard title="Tracking" hint="Connect to your existing analytics setup.">
        <Toggle
          checked={form.analyticsEnabled}
          onChange={(v) => updateField('analyticsEnabled', v)}
          label="Enable dataLayer push"
          hint="Disable if you don't use Google Tag Manager or a compatible setup."
        />
        {form.analyticsEnabled && (
          <Field
            label="DataLayer variable name"
            hint={
              <>
                Name of the global array. Default <code className={styles.inlineCode}>dataLayer</code> (GTM standard).
              </>
            }
          >
            <TextInput
              value={form.dataLayerName}
              onChange={(v) => updateField('dataLayerName', v)}
              monospace
            />
          </Field>
        )}
      </GroupCard>

      <GroupCard
        title="Events emitted"
        hint="The widget pushes these events when relevant. No configuration needed."
        last
      >
        <div className={styles.eventList}>
          {EVENTS.map((e) => (
            <div key={e.name} className={styles.eventRow}>
              <code className={styles.eventCode}>{e.name}</code>
              <span className={styles.eventDesc}>{e.desc}</span>
            </div>
          ))}
        </div>
      </GroupCard>
    </>
  );
}
