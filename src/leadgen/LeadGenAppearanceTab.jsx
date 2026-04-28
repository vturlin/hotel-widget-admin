import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';
import ColorInput from '../components/forms/ColorInput.jsx';

const BRAND_PRESETS = ['#432975', '#0F766E', '#8B5A3C', '#1F5135', '#1A1A1A'];

// Visual identity — image on the left pane and the brand colour
// powering the submit button, the toggle ON state, and the success
// check tint. buttonHoverColor is optional; the widget auto-darkens
// buttonColor by ~10% when it's blank.
export default function LeadGenAppearanceTab({ form, updateField }) {
  return (
    <>
      <PanelHeader
        title="Appearance"
        subtitle="Image and brand colour."
      />

      <GroupCard title="Image" hint="A 220×280 hospitality photo works best — the popup crops to fit.">
        <Field label="Image URL">
          <TextInput
            value={form.imageUrl}
            onChange={(v) => updateField('imageUrl', v)}
            placeholder="https://example.com/images/lobby.jpg"
            type="url"
          />
        </Field>

        <Field
          label="Alt text"
          hint="Descriptive label for screen readers. Leave blank for a decorative image."
          optional
        >
          <TextInput
            value={form.imageAlt}
            onChange={(v) => updateField('imageAlt', v)}
            placeholder="Hotel lobby at sunset"
          />
        </Field>
      </GroupCard>

      <GroupCard
        title="Colors"
        hint="The brand colour drives the submit button, the consent toggle, the success check tint, and links inside the popup."
        last
      >
        <Field label="Brand color">
          <ColorInput
            value={form.buttonColor}
            onChange={(v) => updateField('buttonColor', v)}
            presets={BRAND_PRESETS}
          />
        </Field>

        <Field
          label="Hover color"
          hint="Optional — leave blank to auto-darken the brand colour by ~10%."
          optional
        >
          <ColorInput
            value={form.buttonHoverColor}
            onChange={(v) => updateField('buttonHoverColor', v)}
            presets={BRAND_PRESETS}
          />
        </Field>
      </GroupCard>
    </>
  );
}
