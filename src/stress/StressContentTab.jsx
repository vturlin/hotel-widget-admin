import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';
import ColorInput from '../components/forms/ColorInput.jsx';

const ACCENT_PRESETS = ['#10B981', '#EF4444', '#432975', '#0F766E', '#D97706'];
const AVATAR_BG_PRESETS = ['#FBCFE8', '#DBEAFE', '#DCFCE7', '#FEF3C7', '#E5E7EB'];
const AVATAR_FG_PRESETS = ['#A41752', '#1E40AF', '#15803D', '#92400E', '#1F2937'];

// Content tab for the stress widget. Renders a different set of fields
// based on form.variant — each variant's published JSON shape mirrors
// the props of the corresponding sub-component in the widget.
export default function StressContentTab({ form, updateField }) {
  const variant = form.variant || 'just-booked';

  return (
    <>
      <PanelHeader
        title="Content"
        subtitle="Copy and accent colour for the chosen variant."
      />

      <GroupCard title="Accent">
        <Field
          label="Accent color"
          hint="Drives the eyebrow text, the icon tile, the live dot or the bar chart — depending on the variant."
        >
          <ColorInput
            value={form.accentColor}
            onChange={(v) => updateField('accentColor', v)}
            presets={ACCENT_PRESETS}
          />
        </Field>
      </GroupCard>

      {variant === 'just-booked' && (
        <JustBookedFields form={form} updateField={updateField} />
      )}
      {variant === 'scarcity' && (
        <ScarcityFields form={form} updateField={updateField} />
      )}
      {variant === 'social-proof' && (
        <SocialProofFields form={form} updateField={updateField} />
      )}
    </>
  );
}

// ── Variant 1: Just booked ──────────────────────────────────────────

function JustBookedFields({ form, updateField }) {
  return (
    <>
      <GroupCard title="Booking line">
        <Field label="Eyebrow title" hint="Tiny uppercase label above the booking line.">
          <TextInput
            value={form.title}
            onChange={(v) => updateField('title', v)}
            placeholder="Just booked"
          />
        </Field>

        <Field label="Guest name" hint="Use real consenting bookings only — fictitious names are flagged by the DGCCRF.">
          <TextInput
            value={form.guestName}
            onChange={(v) => updateField('guestName', v)}
            placeholder="Marie from Lyon"
          />
        </Field>

        <Field label="Room name">
          <TextInput
            value={form.roomName}
            onChange={(v) => updateField('roomName', v)}
            placeholder="Sea-View Suite"
          />
        </Field>

        <Field label="Time ago">
          <TextInput
            value={form.timeAgo}
            onChange={(v) => updateField('timeAgo', v)}
            placeholder="2 minutes ago"
          />
        </Field>
      </GroupCard>

      <GroupCard
        title="Avatar"
        hint="Two-letter initials on a tinted disc — no photo. Tweak the colours to match the booking line's energy."
        last
      >
        <Field label="Initials" hint="Up to 2 characters.">
          <TextInput
            value={form.initials}
            onChange={(v) => updateField('initials', String(v).slice(0, 2).toUpperCase())}
            placeholder="MD"
            monospace
          />
        </Field>

        <Field label="Avatar background">
          <ColorInput
            value={form.avatarBg}
            onChange={(v) => updateField('avatarBg', v)}
            presets={AVATAR_BG_PRESETS}
          />
        </Field>

        <Field label="Avatar text color">
          <ColorInput
            value={form.avatarFg}
            onChange={(v) => updateField('avatarFg', v)}
            presets={AVATAR_FG_PRESETS}
          />
        </Field>
      </GroupCard>
    </>
  );
}

// ── Variant 2: Scarcity ─────────────────────────────────────────────

function ScarcityFields({ form, updateField }) {
  return (
    <GroupCard title="Scarcity message" last>
      <Field label="Eyebrow title">
        <TextInput
          value={form.title}
          onChange={(v) => updateField('title', v)}
          placeholder="Almost gone"
        />
      </Field>

      <Field label="Count" hint="How many are left. Bound to a real availability number — don't fabricate.">
        <TextInput
          value={String(form.count ?? '')}
          onChange={(v) => {
            const n = parseInt(v, 10);
            updateField('count', Number.isFinite(n) ? n : 0);
          }}
          type="number"
          inputMode="numeric"
          placeholder="2"
        />
      </Field>

      <Field label="Unit" hint="What's running low: rooms, suites, slots, beds…">
        <TextInput
          value={form.unit}
          onChange={(v) => updateField('unit', v)}
          placeholder="rooms"
        />
      </Field>

      <Field label="Context" hint="Caption shown below the headline.">
        <TextInput
          value={form.context}
          onChange={(v) => updateField('context', v)}
          placeholder="for your selected dates"
        />
      </Field>
    </GroupCard>
  );
}

// ── Variant 3: Social proof ─────────────────────────────────────────

// The bars[] array holds a 10-day trend. We expose it as a CSV string
// in the admin so the operator can paste from a spreadsheet without
// fighting individual number inputs. The form keeps the array as the
// canonical shape; the input maintains a parallel string mirror only
// when its value isn't a clean comma-separated representation of the
// current array.
function SocialProofFields({ form, updateField }) {
  const barsCsv = Array.isArray(form.bars) ? form.bars.join(', ') : '';

  function onBarsChange(v) {
    const parts = String(v).split(',').map((s) => s.trim()).filter(Boolean);
    const nums = parts
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n >= 0)
      .map((n) => Math.round(n));
    updateField('bars', nums);
  }

  return (
    <>
      <GroupCard title="Headline">
        <Field label="Title" hint="Big number / lead phrase. Renders in the accent colour.">
          <TextInput
            value={form.title}
            onChange={(v) => updateField('title', v)}
            placeholder="12 travelers"
          />
        </Field>

        <Field label="Subtitle">
          <TextInput
            value={form.subtitle}
            onChange={(v) => updateField('subtitle', v)}
            placeholder="booked here today"
          />
        </Field>

        <Field label="Caption">
          <TextInput
            value={form.caption}
            onChange={(v) => updateField('caption', v)}
            placeholder="Trending up vs. last week"
          />
        </Field>
      </GroupCard>

      <GroupCard
        title="Trend chart"
        hint="Up to 24 daily counts — last value is highlighted as today. Comma-separated numbers."
        last
      >
        <Field label="Bars (comma-separated)">
          <TextInput
            value={barsCsv}
            onChange={onBarsChange}
            placeholder="3, 6, 4, 8, 5, 9, 7, 11, 8, 12"
          />
        </Field>
      </GroupCard>
    </>
  );
}
