import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';
import Select from '../components/forms/Select.jsx';
import { STRESS_VARIANTS } from '../constants.js';

// Identity for the stress-marketing flow. Holds the immutable hotelId,
// the friendly display name, and the variant — moving the variant out
// of the Content tab keeps it visible alongside the basics, since
// switching it changes the entire content layout.
export default function StressIdentityTab({ form, updateField, isEditing }) {
  return (
    <>
      <PanelHeader
        title="Identity"
        subtitle="Who is this configuration for, and which toast format are we showing?"
      />

      <GroupCard
        title="Hotel"
        hint="Hotel ID is permanent — it becomes the file name and the embed query parameter. The display name is just for the admin list."
      >
        <Field label="Hotel ID" hint="Letters, numbers, underscores, dashes only.">
          <TextInput
            value={form.hotelId}
            onChange={(v) => updateField('hotelId', v)}
            placeholder="hm_demo001"
            disabled={isEditing}
            monospace
          />
        </Field>

        <Field label="Display name">
          <TextInput
            value={form.hotelName}
            onChange={(v) => updateField('hotelName', v)}
            placeholder="Maison Lumière"
          />
        </Field>
      </GroupCard>

      <GroupCard
        title="Toast format"
        hint="Switching the variant rewires the Content tab — each format collects different fields."
        last
      >
        <Field label="Variant">
          <Select
            value={form.variant || 'just-booked'}
            onChange={(v) => updateField('variant', v)}
            options={STRESS_VARIANTS}
          />
        </Field>
      </GroupCard>
    </>
  );
}
