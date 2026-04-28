import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';

// Copy + legal pointers. All fields fall back to the widget's own
// defaults when left blank (the loader simply omits empty strings).
export default function LeadGenContentTab({ form, updateField }) {
  return (
    <>
      <PanelHeader
        title="Content"
        subtitle="Headline, body copy, and the link to your privacy policy."
      />

      <GroupCard title="Headline">
        <Field label="Title" hint="One sentence, ideally under 35 characters.">
          <TextInput
            value={form.title}
            onChange={(v) => updateField('title', v)}
            placeholder="Stay close to the coast."
          />
        </Field>

        <Field label="Message" hint="Two short sentences max — what readers gain by subscribing.">
          <TextInput
            value={form.message}
            onChange={(v) => updateField('message', v)}
            placeholder="Seasonal offers, local recommendations, and quiet weekends — delivered once a month. No filler."
          />
        </Field>
      </GroupCard>

      <GroupCard title="Labels" hint="Small text shown on the badge and the submit button.">
        <Field label="Badge label">
          <TextInput
            value={form.badgeLabel}
            onChange={(v) => updateField('badgeLabel', v)}
            placeholder="Newsletter"
          />
        </Field>

        <Field label="Submit button">
          <TextInput
            value={form.buttonLabel}
            onChange={(v) => updateField('buttonLabel', v)}
            placeholder="Subscribe"
          />
        </Field>
      </GroupCard>

      <GroupCard
        title="Privacy"
        hint="Linked from the consent caption next to the toggle. Required for GDPR compliance."
        last
      >
        <Field label="Privacy policy URL">
          <TextInput
            value={form.privacyPolicyUrl}
            onChange={(v) => updateField('privacyPolicyUrl', v)}
            placeholder="https://example.com/legal/privacy"
            type="url"
          />
        </Field>
      </GroupCard>
    </>
  );
}
