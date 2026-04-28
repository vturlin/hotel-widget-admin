import { useState } from 'react';
import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';
import Select from '../components/forms/Select.jsx';

const MESSAGE_TYPE_OPTIONS = [
  { value: 'exclusive-offers', label: 'Exclusive offers' },
  { value: 'hotel-news',       label: 'Hotel news' },
  { value: 'travel-tips',      label: 'Travel tips' },
  { value: 'early-access',     label: 'Early access to deals' },
];

const TONE_OPTIONS = [
  { value: 'formal',       label: 'Formal & professional' },
  { value: 'pedagogical',  label: 'Pedagogical (value-driven)' },
  { value: 'exclusive',    label: 'Exclusive & VIP' },
  { value: 'humorous',     label: 'Humorous & offbeat' },
  { value: 'urgent',       label: 'Urgent (FOMO)' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
];

// Copy + legal pointers. The top of the panel hosts an AI-generation
// block that writes straight into the title + message fields below
// when the operator clicks Generate.
export default function LeadGenContentTab({ form, updateField }) {
  const [messageType, setMessageType] = useState('exclusive-offers');
  const [tone, setTone] = useState('exclusive');
  const [language, setLanguage] = useState('en');
  const [genStatus, setGenStatus] = useState('idle'); // 'idle' | 'loading' | 'error'
  const [genError, setGenError] = useState('');

  async function handleGenerate() {
    setGenStatus('loading');
    setGenError('');
    try {
      const res = await fetch('/api/lead-gen/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType,
          tone,
          hotelName: form.hotelName,
          locale: language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      // Replace title + message in place. The unpublished-pill picks up
      // the diff automatically via useUnpublishedDiff, so the operator
      // sees the change as "pending publish" until they save.
      updateField('title', data.title);
      updateField('message', data.message);
      setGenStatus('idle');
    } catch (err) {
      setGenError(err.message);
      setGenStatus('error');
    }
  }

  const canGenerate = !!messageType && !!tone && genStatus !== 'loading';

  return (
    <>
      <PanelHeader
        title="Content"
        subtitle="Headline, body copy, and the link to your privacy policy."
      />

      <GroupCard
        title="Generate with AI"
        hint="Pick a focus and a tone — Gemini fills in the title and body for you. Edit freely afterwards."
      >
        <Field label="Message type">
          <Select
            value={messageType}
            onChange={setMessageType}
            options={MESSAGE_TYPE_OPTIONS}
          />
        </Field>

        <Field label="Tone">
          <Select
            value={tone}
            onChange={setTone}
            options={TONE_OPTIONS}
          />
        </Field>

        <Field label="Output language">
          <Select
            value={language}
            onChange={setLanguage}
            options={LANGUAGE_OPTIONS}
          />
        </Field>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            marginTop: 8,
            padding: '10px 16px',
            background: canGenerate ? 'var(--color-brand-primary)' : 'var(--color-bg-page)',
            color: canGenerate ? 'var(--color-text-on-dark)' : 'var(--color-text-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            transition: 'background 120ms',
          }}
        >
          {genStatus === 'loading' ? 'Generating…' : 'Generate'}
        </button>

        {genStatus === 'error' && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              background: 'var(--color-error-bg)',
              border: '1px solid var(--color-error-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-error-text)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <strong>Generation failed:</strong> {genError}
          </div>
        )}
      </GroupCard>

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
