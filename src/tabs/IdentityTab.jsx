import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';

export default function IdentityTab({ form, updateField, isEditMode }) {
  return (
    <>
      <PanelHeader
        title="Identity"
        subtitle="Basic information about the hotel and how to identify it."
      />

      <GroupCard
        title="Identification"
        hint="Used internally and to fetch the right config."
      >
        <Field
          label="Hotel ID"
          hint={
            isEditMode
              ? 'Locked in edit mode. To change the ID, duplicate this configuration instead.'
              : 'Unique identifier used to fetch the config. Lowercase, alphanumeric, dashes and underscores only.'
          }
        >
          <TextInput
            value={form.hotelId}
            onChange={(v) => updateField('hotelId', v)}
            placeholder="e.g. hm_myhotel_paris"
            disabled={isEditMode}
            monospace
          />
        </Field>

        <Field label="Hotel name">
          <TextInput
            value={form.hotelName}
            onChange={(v) => updateField('hotelName', v)}
          />
        </Field>
      </GroupCard>

      <GroupCard
        title="Web presence"
        hint="Where the widget will be embedded."
        last
      >
        <Field
          label="Client domain"
          hint="Used to fetch a screenshot of the hotel's homepage as the preview backdrop. Falls back to a neutral demo if empty or invalid."
        >
          <TextInput
            value={form.hotelDomain}
            onChange={(v) => updateField('hotelDomain', v)}
            placeholder="hotel-client.com"
            prefix="https://"
          />
        </Field>

        <Field
          label="Logo URL"
          optional
          hint="If provided, shown in the widget header instead of the hotel name."
        >
          <TextInput
            value={form.logoUrl}
            onChange={(v) => updateField('logoUrl', v)}
            placeholder="https://..."
          />
        </Field>
      </GroupCard>
    </>
  );
}
