import { SUPPORTED_LOCALES } from '../constants.js';
import PanelHeader from '../admin/PanelHeader.jsx';
import GroupCard from '../admin/GroupCard.jsx';
import Field from '../components/forms/Field.jsx';
import Select from '../components/forms/Select.jsx';
import Checkbox from '../components/forms/Checkbox.jsx';
import styles from './LanguagesTab.module.css';

export default function LanguagesTab({ form, updateField, toggleLocale }) {
  const enabled = form.enabledLocales || [];
  return (
    <>
      <PanelHeader
        title="Languages"
        subtitle="Which languages the widget offers, and which one it falls back to."
      />

      <GroupCard
        title="Enabled languages"
        hint={`${enabled.length} of ${SUPPORTED_LOCALES.length} languages enabled. The widget auto-detects the browser language.`}
      >
        <div className={styles.localeGrid}>
          {SUPPORTED_LOCALES.map((loc) => (
            <Checkbox
              key={loc.code}
              checked={enabled.includes(loc.code)}
              onChange={() => toggleLocale(loc.code)}
              label={loc.name}
              suffix={loc.code}
            />
          ))}
        </div>
      </GroupCard>

      <GroupCard
        title="Fallback"
        hint="Used when the browser language is not in the enabled list."
        last
      >
        <Field label="Default language">
          <Select
            value={form.defaultLocale}
            onChange={(v) => updateField('defaultLocale', v)}
            options={SUPPORTED_LOCALES.filter((l) => enabled.includes(l.code)).map(
              (l) => ({ value: l.code, label: l.name })
            )}
          />
        </Field>
      </GroupCard>
    </>
  );
}
