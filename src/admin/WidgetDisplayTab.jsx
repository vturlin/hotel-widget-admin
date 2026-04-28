import PanelHeader from './PanelHeader.jsx';
import GroupCard from './GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import Select from '../components/forms/Select.jsx';
import {
  POSITIONS,
  TRIGGER_MODES,
  AUTO_OPEN_DELAYS,
  SCROLL_THRESHOLDS,
} from '../constants.js';

/**
 * Display behaviour tab — shared by the toast widgets (reassurance,
 * stress) that have no closed-state toggle. Owns position on screen
 * and the trigger that controls when the toast first appears.
 *
 * The lead-gen and best-price flows have richer concerns (modal
 * vs. toast for lead-gen, separate auto-open inside Appearance for
 * best-price), so they keep their own tabs and do not share this
 * component.
 */
export default function WidgetDisplayTab({ form, updateField }) {
  const triggerMode = form.triggerMode || 'immediate';
  const showDelay = triggerMode === 'time' || triggerMode === 'time_or_scroll';
  const showScroll =
    triggerMode === 'scroll' || triggerMode === 'time_or_scroll';

  return (
    <>
      <PanelHeader
        title="Display"
        subtitle="Where the toast appears, and when."
      />

      <GroupCard
        title="Position"
        hint="The toast pins to the chosen corner. Mobile (≤ 480px) always reflows to a bottom-aligned sheet."
      >
        <Field label="Position on screen">
          <Select
            value={form.position || 'bottom-left'}
            onChange={(v) => updateField('position', v)}
            options={POSITIONS}
          />
        </Field>
      </GroupCard>

      <GroupCard
        title="Trigger"
        hint="When the toast becomes visible. Closing it dismisses the widget for the rest of the page session."
        last
      >
        <Field label="When to show">
          <Select
            value={triggerMode}
            onChange={(v) => updateField('triggerMode', v)}
            options={TRIGGER_MODES}
          />
        </Field>

        {showDelay && (
          <Field label="Delay before showing">
            <Select
              value={String(form.triggerDelaySec ?? 8)}
              onChange={(v) => updateField('triggerDelaySec', parseInt(v, 10))}
              options={AUTO_OPEN_DELAYS.map((d) => ({
                value: String(d.value),
                label: d.label,
              }))}
            />
          </Field>
        )}

        {showScroll && (
          <Field label="Scroll threshold">
            <Select
              value={String(form.triggerScrollPercent ?? 50)}
              onChange={(v) =>
                updateField('triggerScrollPercent', parseInt(v, 10))
              }
              options={SCROLL_THRESHOLDS.map((t) => ({
                value: String(t.value),
                label: t.label,
              }))}
            />
          </Field>
        )}
      </GroupCard>
    </>
  );
}
