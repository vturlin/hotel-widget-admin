import {
  POSITIONS,
  SIZES,
  WIDGET_DESIGNS,
  VEGAS_VARIANTS,
  AUTO_OPEN_MODES,
  AUTO_OPEN_DELAYS,
  SCROLL_THRESHOLDS,
} from '../constants.js';
import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import Select from '../components/forms/Select.jsx';
import ColorInput from '../components/forms/ColorInput.jsx';
import Toggle from '../components/forms/Toggle.jsx';
import styles from './AppearanceTab.module.css';

const BRAND_PRESETS = ['#8B5A3C', '#1F5135', '#3E2D5A', '#B43A2A', '#1A1A1A'];
const BG_PRESETS = ['#FAF7F2', '#FFFFFF', '#F4EFE8', '#1A1A1A', '#F0E9DD'];

export default function AppearanceTab({
  form,
  updateField,
  previewState,
  setPreviewState,
}) {
  return (
    <>
      <PanelHeader
        title="Appearance"
        subtitle="Colors, position, and opening behaviour."
      />

      <GroupCard
        title="Preview state"
        hint="Toggle between the closed wax-seal and the open panel. Affects this preview only — not the published config."
      >
        <div className={styles.segmented} role="radiogroup" aria-label="Preview state">
          {[
            { value: 'closed', label: 'Closed' },
            { value: 'open', label: 'Open' },
          ].map((opt) => {
            const active = previewState === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPreviewState(opt.value)}
                className={`${styles.segmentedBtn} ${active ? styles.active : ''}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </GroupCard>

      <GroupCard
        title="Widget design"
        hint="Picks both the closed-state and the open-state visuals."
      >
        <Field label="Design">
          <Select
            value={form.widgetDesign || 'default'}
            onChange={(v) => updateField('widgetDesign', v)}
            options={WIDGET_DESIGNS}
          />
        </Field>

        {form.widgetDesign === 'vegas' && (
          <Field
            label="Vegas style"
            hint="Ornament density. The slot mechanic is identical across all four — only the chassis bling changes."
          >
            <Select
              value={form.vegasVariant || 'standard'}
              onChange={(v) => updateField('vegasVariant', v)}
              options={VEGAS_VARIANTS}
            />
          </Field>
        )}
      </GroupCard>

      <GroupCard
        title="Colors"
        hint="Match the hotel's brand. Apply live to the preview."
      >
        <Field label="Brand color" hint="Buttons and accents.">
          <ColorInput
            value={form.brandColor}
            onChange={(v) => updateField('brandColor', v)}
            presets={BRAND_PRESETS}
          />
        </Field>

        <Toggle
          checked={!!form.toggleColor}
          onChange={(v) =>
            updateField(
              'toggleColor',
              v ? form.toggleColor || form.brandColor || '#8B5A3C' : ''
            )
          }
          label="Use a custom toggle color"
          hint="When off, the wax-seal toggle reuses the Brand color above."
        />
        {form.toggleColor && (
          <Field label="Toggle color" hint="Drives the wax-seal medallion's gradient. The rest of the widget keeps using Brand color.">
            <ColorInput
              value={form.toggleColor}
              onChange={(v) => updateField('toggleColor', v)}
              presets={BRAND_PRESETS}
            />
          </Field>
        )}

        <Field label="Background" hint="Widget panel fill.">
          <ColorInput
            value={form.backgroundColor}
            onChange={(v) => updateField('backgroundColor', v)}
            presets={BG_PRESETS}
          />
        </Field>
      </GroupCard>

      <GroupCard title="Placement">
        <Field label="Position on screen">
          <Select
            value={form.position}
            onChange={(v) => updateField('position', v)}
            options={POSITIONS}
          />
        </Field>
        <Field
          label="Widget size"
          hint="Overall scale of the widget. Small is discreet, large draws more attention."
        >
          <Select
            value={form.size}
            onChange={(v) => updateField('size', v)}
            options={SIZES}
          />
        </Field>
      </GroupCard>

      <GroupCard
        title="Auto-open behaviour"
        hint="When the widget opens itself for the first time in the session. Closing the widget suppresses auto-open for the rest of the session."
        last
      >
        <Field label="Auto-open trigger">
          <Select
            value={form.autoOpenMode}
            onChange={(v) => updateField('autoOpenMode', v)}
            options={AUTO_OPEN_MODES}
          />
        </Field>

        {(form.autoOpenMode === 'time' || form.autoOpenMode === 'time_or_scroll') && (
          <Field label="Delay before opening">
            <Select
              value={String(form.autoOpenDelay)}
              onChange={(v) => updateField('autoOpenDelay', parseInt(v, 10))}
              options={AUTO_OPEN_DELAYS.map((d) => ({
                value: String(d.value),
                label: d.label,
              }))}
            />
          </Field>
        )}

        {(form.autoOpenMode === 'scroll' || form.autoOpenMode === 'time_or_scroll') && (
          <Field label="Scroll threshold">
            <Select
              value={String(form.autoOpenScrollPercent)}
              onChange={(v) => updateField('autoOpenScrollPercent', parseInt(v, 10))}
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
