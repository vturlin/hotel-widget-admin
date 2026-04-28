import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import TextInput from '../components/forms/TextInput.jsx';
import Select from '../components/forms/Select.jsx';
import ColorInput from '../components/forms/ColorInput.jsx';
import {
  REASSURANCE_PLATFORM_PRESETS,
  REASSURANCE_SCALES,
} from '../constants.js';

const ACCENT_PRESETS = ['#432975', '#0F766E', '#8B5A3C', '#1F5135', '#1A1A1A'];

// Generate a unique key when the operator adds a "Custom…" platform.
// The widget loader requires `id`+`name` to be present, so we seed
// both with a placeholder the user can rename. Uniqueness within the
// list is the operator's responsibility — duplicate ids still
// render but identical React keys would warn in dev.
function nextCustomId(platforms) {
  let n = 1;
  const ids = new Set((platforms || []).map((p) => p.id));
  while (ids.has(`custom-${n}`)) n += 1;
  return `custom-${n}`;
}

export default function ReassuranceContentTab({ form, updateField }) {
  const platforms = Array.isArray(form.platforms) ? form.platforms : [];

  function patchPlatform(index, patch) {
    const next = platforms.map((p, i) => (i === index ? { ...p, ...patch } : p));
    updateField('platforms', next);
  }
  function removePlatform(index) {
    updateField('platforms', platforms.filter((_, i) => i !== index));
  }
  function movePlatform(index, dir) {
    const j = index + dir;
    if (j < 0 || j >= platforms.length) return;
    const next = platforms.slice();
    const tmp = next[index];
    next[index] = next[j];
    next[j] = tmp;
    updateField('platforms', next);
  }
  function addPreset(presetId) {
    const preset = REASSURANCE_PLATFORM_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    updateField('platforms', [
      ...platforms,
      {
        id: preset.id,
        name: preset.name,
        short: preset.short,
        scale: preset.scale,
        color: preset.color,
        score: '',
        count: '',
      },
    ]);
  }
  function addCustom() {
    const id = nextCustomId(platforms);
    updateField('platforms', [
      ...platforms,
      {
        id,
        name: 'Custom platform',
        short: '?',
        scale: '/10',
        color: '#999999',
        score: '',
        count: '',
      },
    ]);
  }

  // Presets that aren't already in the list — keeps the "Add" row tidy.
  const usedIds = new Set(platforms.map((p) => p.id));
  const availablePresets = REASSURANCE_PLATFORM_PRESETS.filter(
    (p) => !usedIds.has(p.id)
  );

  return (
    <>
      <PanelHeader
        title="Content"
        subtitle="Aggregate score on top, per-platform breakdown below."
      />

      <GroupCard title="Header">
        <Field
          label="Aggregate score"
          hint="The big number — typically a normalized average across platforms."
        >
          <TextInput
            value={form.aggregateScore}
            onChange={(v) => updateField('aggregateScore', v)}
            placeholder="4.8"
          />
        </Field>

        <Field label="Total reviews">
          <TextInput
            value={form.totalReviews}
            onChange={(v) => updateField('totalReviews', v)}
            placeholder="1,347"
          />
        </Field>

        <Field label="Accent color" hint="Drives the aggregate-score colour.">
          <ColorInput
            value={form.accentColor}
            onChange={(v) => updateField('accentColor', v)}
            presets={ACCENT_PRESETS}
          />
        </Field>
      </GroupCard>

      <GroupCard
        title="Platforms"
        hint="Order top-to-bottom is the order shown in the toast. Add up to ~5 — the loader caps at 8."
      >
        {platforms.length === 0 && (
          <div
            style={{
              padding: '12px 14px',
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              background: 'var(--color-bg-page)',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
            No platforms yet — add one below.
          </div>
        )}

        {platforms.map((p, i) => (
          <PlatformRow
            key={`${p.id}-${i}`}
            platform={p}
            index={i}
            isFirst={i === 0}
            isLast={i === platforms.length - 1}
            onPatch={(patch) => patchPlatform(i, patch)}
            onRemove={() => removePlatform(i)}
            onMoveUp={() => movePlatform(i, -1)}
            onMoveDown={() => movePlatform(i, +1)}
          />
        ))}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: platforms.length === 0 ? 12 : 8,
            paddingTop: platforms.length === 0 ? 0 : 12,
            borderTop: platforms.length === 0 ? 'none' : '1px solid var(--color-border)',
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              alignSelf: 'center',
              marginRight: 6,
            }}
          >
            Add:
          </span>
          {availablePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => addPreset(preset.id)}
              style={addBtnStyle}
            >
              + {preset.name}
            </button>
          ))}
          <button
            type="button"
            onClick={addCustom}
            style={{ ...addBtnStyle, fontStyle: 'italic' }}
          >
            + Custom…
          </button>
        </div>
      </GroupCard>

      <GroupCard
        title="Footer"
        hint="One-line trust message shown below the platform list."
        last
      >
        <Field label="Footer text">
          <TextInput
            value={form.footerText}
            onChange={(v) => updateField('footerText', v)}
            placeholder="Verified guest reviews · Updated daily"
          />
        </Field>
      </GroupCard>
    </>
  );
}

const addBtnStyle = {
  padding: '6px 10px',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 12,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'background 120ms',
};

function PlatformRow({
  platform,
  index,
  isFirst,
  isLast,
  onPatch,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'var(--color-bg-page)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        {/* Letter dot preview */}
        <span
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: platform.color || '#999',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {platform.short || '?'}
        </span>
        <strong style={{ fontSize: 13, color: 'var(--color-text-primary)', flex: 1, minWidth: 0 }}>
          {platform.name || platform.id}
        </strong>
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          style={iconBtnStyle(isFirst)}
          aria-label="Move up"
          title="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          style={iconBtnStyle(isLast)}
          aria-label="Move down"
          title="Move down"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          style={{ ...iconBtnStyle(false), color: 'var(--color-error)' }}
          aria-label="Remove platform"
          title="Remove"
        >
          ×
        </button>
      </div>

      <Field label="Platform name">
        <TextInput
          value={platform.name}
          onChange={(v) => onPatch({ name: v })}
          placeholder="Booking.com"
        />
      </Field>

      <Field label="Letter mark" hint="Up to 4 characters — shown on the round dot.">
        <TextInput
          value={platform.short}
          onChange={(v) => onPatch({ short: String(v).slice(0, 4) })}
          placeholder="B."
          monospace
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Score">
          <TextInput
            value={platform.score}
            onChange={(v) => onPatch({ score: v })}
            placeholder="8.9"
          />
        </Field>

        <Field label="Scale">
          <Select
            value={platform.scale || '/10'}
            onChange={(v) => onPatch({ scale: v })}
            options={REASSURANCE_SCALES}
          />
        </Field>
      </div>

      <Field label="Reviews count">
        <TextInput
          value={platform.count}
          onChange={(v) => onPatch({ count: v })}
          placeholder="842"
        />
      </Field>

      <Field label="Brand color">
        <ColorInput
          value={platform.color}
          onChange={(v) => onPatch({ color: v })}
        />
      </Field>
    </div>
  );
}

function iconBtnStyle(disabled) {
  return {
    width: 24,
    height: 24,
    padding: 0,
    background: disabled ? 'transparent' : 'var(--color-bg-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: disabled ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    lineHeight: 1,
    fontFamily: 'inherit',
  };
}
