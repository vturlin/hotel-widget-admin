import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';

export default function ReassuranceIdentityTab({ form, updateField, isEditing }) {
  return (
    <>
      <PanelHeader
        title="Identity"
        subtitle="Who is this configuration for?"
      />

      <GroupCard
        title="Hotel"
        hint="Hotel ID is permanent — it becomes the file name and the embed query parameter. The display name is just for the admin list."
        last
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
    </>
  );
}
