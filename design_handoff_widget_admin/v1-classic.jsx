// V1 — Classic split, polished. Tab-driven so we can render one artboard per tab.

const { useState } = React;
const {
  TABS, POSITIONS, SIZES, AUTO_OPEN_MODES, SUPPORTED_LOCALES, DEFAULT_FORM,
  Field, TextInput, Select, ColorInput, Toggle, Checkbox, SectionTitle,
  SaveStatus, HotelBackdrop, WidgetPreview, BrowserChrome, DEdgeLogo,
} = window.SHARED;

function V1Classic({ initialTab = 'identity' }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [device, setDevice] = useState('desktop');
  const [saveStatus, setSaveStatus] = useState('saved');
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setSaveStatus('saved'); };

  const widgetPos = {
    bottom: form.position.includes('bottom') ? 16 : 'auto',
    top: form.position.includes('top') ? 70 : 'auto',
    right: form.position.includes('right') ? 16 : 'auto',
    left: form.position.includes('left') ? 16 : 'auto',
  };

  return (
    <div style={{
      width: 1440, height: 900, background: '#FBFAF9',
      fontFamily: '"Open Sans", system-ui, sans-serif',
      color: '#424242', display: 'flex', flexDirection: 'column',
    }}>
      {/* TOP CHROME */}
      <div style={{
        height: 56, background: '#fff', borderBottom: '1px solid #E7E5E4',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
      }}>
        <DEdgeLogo height={20}/>
        <span style={{ width: 1, height: 20, background: '#E7E5E4', marginLeft: 8 }}/>
        <span style={{ fontSize: 13, color: '#666' }}>Hotels</span>
        <span style={{ color: '#C9C5C2' }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#424242' }}>Hôtel Demo</span>
        <span style={{
          marginLeft: 4, padding: '2px 8px', background: '#ECE2FF', color: '#8764C9',
          fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', borderRadius: 2,
          textTransform: 'uppercase',
        }}>{form.hotelId}</span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <SaveStatus status={saveStatus}/>
          <button style={{
            background: 'transparent', border: '1px solid #432975', color: '#432975',
            padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Preview live</button>
          <button style={{
            background: '#432975', border: 'none', color: '#fff',
            padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Publish</button>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{
        height: 48, background: '#fff', borderBottom: '1px solid #E7E5E4',
        display: 'flex', alignItems: 'stretch', padding: '0 24px', gap: 4,
      }}>
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14, padding: '0 16px',
                color: active ? '#432975' : '#666',
                fontWeight: active ? 600 : 500,
                borderBottom: active ? '2px solid #432975' : '2px solid transparent',
                marginBottom: -1,
              }}>{t.label}</button>
          );
        })}
      </div>

      {/* MAIN: preview LEFT, config RIGHT */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 460px', minHeight: 0 }}>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
          <BrowserChrome url={form.hotelDomain || 'demo.hotel-widget.app'} height="100%">
            <HotelBackdrop device={device}/>
            <div style={{ position: 'absolute', ...widgetPos }}>
              <WidgetPreview form={form} state="open" scale={1}/>
            </div>
          </BrowserChrome>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex', padding: 4, background: '#fff',
              border: '1px solid #E7E5E4', borderRadius: 999, gap: 2,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}>
              {['desktop', 'mobile'].map((d) => (
                <button key={d} onClick={() => setDevice(d)}
                  style={{
                    padding: '6px 18px', borderRadius: 999, border: 'none',
                    background: device === d ? '#432975' : 'transparent',
                    color: device === d ? '#fff' : '#666',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    textTransform: 'capitalize',
                  }}>{d}</button>
              ))}
            </div>
          </div>
        </div>

        <aside style={{
          background: '#fff', borderLeft: '1px solid #E7E5E4',
          overflow: 'auto', padding: '24px 24px 40px',
        }}>
          {activeTab === 'identity'   && <IdentityPanel form={form} set={set}/>}
          {activeTab === 'data'       && <DataPanel form={form} set={set}/>}
          {activeTab === 'appearance' && <AppearancePanel form={form} set={set}/>}
          {activeTab === 'languages'  && <LanguagesPanel form={form} set={set}/>}
          {activeTab === 'analytics'  && <AnalyticsPanel form={form} set={set}/>}
          {activeTab === 'publish'    && <PublishPanel form={form} set={set}/>}
        </aside>
      </div>
    </div>
  );
}

function PanelHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#424242', lineHeight: 1.2 }}>
        {title}
      </h2>
      <p style={{ margin: '6px 0 0', fontSize: 14, color: '#666', lineHeight: 1.5 }}>
        {subtitle}
      </p>
    </div>
  );
}

function GroupCard({ title, hint, children, last, action }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E7E5E4', borderRadius: 12,
      padding: 20, marginBottom: last ? 0 : 16,
    }}>
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#424242' }}>{title}</div>
          {hint && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 2, lineHeight: 1.45 }}>
              {hint}
            </div>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function IdentityPanel({ form, set }) {
  return (
    <>
      <PanelHeader title="Identity" subtitle="Basic information about the hotel and how to identify it."/>
      <GroupCard title="Identification" hint="Used internally and to fetch the right config.">
        <Field label="Hotel ID" hint="Locked in edit mode. To change the ID, duplicate this configuration instead.">
          <TextInput value={form.hotelId} onChange={(v) => set('hotelId', v)} disabled monospace/>
        </Field>
        <Field label="Hotel name">
          <TextInput value={form.hotelName} onChange={(v) => set('hotelName', v)}/>
        </Field>
      </GroupCard>
      <GroupCard title="Web presence" hint="Where the widget will be embedded." last>
        <Field label="Client domain" hint="Used to fetch a screenshot of the hotel's homepage as the preview backdrop. Falls back to a neutral demo if empty or invalid.">
          <TextInput value={form.hotelDomain} onChange={(v) => set('hotelDomain', v)} prefix="https://"/>
        </Field>
        <Field label="Logo URL" optional hint="If provided, shown in the widget header instead of the hotel name.">
          <TextInput value={form.logoUrl} onChange={(v) => set('logoUrl', v)}/>
        </Field>
      </GroupCard>
    </>
  );
}

function AppearancePanel({ form, set }) {
  return (
    <>
      <PanelHeader title="Appearance" subtitle="Colors, position, and opening behaviour."/>
      <GroupCard title="Colors" hint="Match the hotel's brand. Apply live to the preview.">
        <Field label="Brand color" hint="Buttons and accents.">
          <ColorInput value={form.brandColor} onChange={(v) => set('brandColor', v)}
            presets={['#8B5A3C', '#1F5135', '#3E2D5A', '#B43A2A', '#1A1A1A']}/>
        </Field>
        <Field label="Background" hint="Widget panel fill.">
          <ColorInput value={form.backgroundColor} onChange={(v) => set('backgroundColor', v)}
            presets={['#FAF7F2', '#FFFFFF', '#F4EFE8', '#1A1A1A', '#F0E9DD']}/>
        </Field>
      </GroupCard>
      <GroupCard title="Placement">
        <Field label="Position on screen">
          <Select value={form.position} onChange={(v) => set('position', v)} options={POSITIONS}/>
        </Field>
        <Field label="Widget size" hint="Overall scale of the widget. Small is discreet, large draws more attention.">
          <Select value={form.size} onChange={(v) => set('size', v)} options={SIZES}/>
        </Field>
      </GroupCard>
      <GroupCard title="Auto-open behaviour" hint="When the widget opens itself for the first time in the session." last>
        <Field label="Auto-open trigger">
          <Select value={form.autoOpenMode} onChange={(v) => set('autoOpenMode', v)} options={AUTO_OPEN_MODES}/>
        </Field>
        {(form.autoOpenMode === 'time' || form.autoOpenMode === 'time_or_scroll') && (
          <Field label="Delay before opening">
            <Select value={String(form.autoOpenDelay)} onChange={(v) => set('autoOpenDelay', parseInt(v))} options={[
              { value: '3', label: '3 seconds' },
              { value: '5', label: '5 seconds' },
              { value: '8', label: '8 seconds (recommended)' },
              { value: '15', label: '15 seconds' },
            ]}/>
          </Field>
        )}
      </GroupCard>
    </>
  );
}

// ── DATA TAB ────────────────────────────────────────────────────────

const MOCK_CHANNELS = [
  { id: 17, name: 'Direct',       isDirect: true,  rooms: 6 },
  { id: 10, name: 'Booking.com',  isDirect: false, rooms: 4 },
  { id: 9,  name: 'Expedia',      isDirect: false, rooms: 4 },
  { id: 27, name: 'Agoda',        isDirect: false, rooms: 3 },
];

function DataPanel({ form, set }) {
  return (
    <>
      <PanelHeader title="Data" subtitle="Rates are fetched live from the AvailPro RateScreener API."/>

      <GroupCard title="API connection"
        hint="Identifiers provided by AvailPro for this property."
        action={
          <button style={{
            background: 'transparent', border: '1px solid #432975', color: '#432975',
            padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>Test connection</button>
        }>
        <Field label="API Hotel ID" hint="The unique hotel ID provided by AvailPro.">
          <TextInput value={form.apiHotelId} onChange={(v) => set('apiHotelId', v)} monospace/>
        </Field>
        <Field label="Competitor ID" hint="Auto-detected via myHotel:true. Set manually only if detection fails.">
          <TextInput value={form.apiCompetitorId} onChange={(v) => set('apiCompetitorId', v)} monospace/>
        </Field>
        <div style={{
          padding: '10px 12px', background: '#ECFDF5', border: '1px solid #BBF7D0',
          borderRadius: 6, fontSize: 12, color: '#1F5135', display: 'flex', gap: 8,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', marginTop: 5, flexShrink: 0 }}/>
          <div>
            <div style={{ fontWeight: 600 }}>Connection OK</div>
            <div style={{ marginTop: 2, opacity: 0.85 }}>Last screening: Apr 27, 2026 · 06:14 UTC · 17 rooms detected across 4 channels</div>
          </div>
        </div>
      </GroupCard>

      <GroupCard title="Channels to display" hint="Only checked channels appear in the price comparison.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {MOCK_CHANNELS.map((ch) => (
            <Checkbox key={ch.id}
              checked={(form.channelsEnabled || []).includes(ch.id)}
              onChange={(v) => {
                const cur = form.channelsEnabled || [];
                set('channelsEnabled', v ? [...cur, ch.id] : cur.filter((c) => c !== ch.id));
              }}
              label={
                <span>
                  {ch.name}
                  {ch.isDirect && (
                    <span style={{
                      marginLeft: 6, padding: '1px 6px', background: '#ECE2FF', color: '#8764C9',
                      fontSize: 9, fontWeight: 600, letterSpacing: '0.04em',
                      borderRadius: 2, textTransform: 'uppercase',
                    }}>direct</span>
                  )}
                </span>
              }
              suffix={`${ch.rooms} rooms`}
            />
          ))}
        </div>
      </GroupCard>

      <GroupCard title="Booking link" last>
        <Field label="Reserve URL template" hint={<>Placeholders: <code style={{ background: '#F2EFEC', padding: '0 4px', borderRadius: 2 }}>{'{checkIn}'}</code>, <code style={{ background: '#F2EFEC', padding: '0 4px', borderRadius: 2 }}>{'{checkOut}'}</code></>}>
          <TextInput value={form.reserveUrl} onChange={(v) => set('reserveUrl', v)}/>
        </Field>
        <Field label="Currency">
          <Select value={form.currency} onChange={(v) => set('currency', v)} options={[
            { value: 'EUR', label: 'EUR €' },
            { value: 'USD', label: 'USD $' },
            { value: 'GBP', label: 'GBP £' },
            { value: 'CHF', label: 'CHF' },
          ]}/>
        </Field>
      </GroupCard>
    </>
  );
}

// ── LANGUAGES TAB ───────────────────────────────────────────────────

function LanguagesPanel({ form, set }) {
  const enabled = form.enabledLocales || [];
  const toggle = (code) => {
    const next = enabled.includes(code) ? enabled.filter((l) => l !== code) : [...enabled, code];
    set('enabledLocales', next);
    if (!next.includes(form.defaultLocale) && next.length > 0) set('defaultLocale', next[0]);
  };
  return (
    <>
      <PanelHeader title="Languages" subtitle="Which languages the widget offers, and which one it falls back to."/>
      <GroupCard title="Enabled languages" hint={`${enabled.length} of ${SUPPORTED_LOCALES.length} languages enabled. The widget auto-detects the browser language.`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {SUPPORTED_LOCALES.map((loc) => (
            <Checkbox key={loc.code}
              checked={enabled.includes(loc.code)}
              onChange={() => toggle(loc.code)}
              label={loc.name}
              suffix={loc.code}
            />
          ))}
        </div>
      </GroupCard>
      <GroupCard title="Fallback" hint="Used when the browser language is not in the enabled list." last>
        <Field label="Default language">
          <Select value={form.defaultLocale} onChange={(v) => set('defaultLocale', v)}
            options={SUPPORTED_LOCALES.filter((l) => enabled.includes(l.code)).map((l) => ({ value: l.code, label: l.name }))}/>
        </Field>
      </GroupCard>
    </>
  );
}

// ── ANALYTICS TAB ───────────────────────────────────────────────────

function AnalyticsPanel({ form, set }) {
  const events = [
    { name: 'dedge_widget_opened',     desc: 'User opens the widget' },
    { name: 'dedge_widget_closed',     desc: 'User dismisses the widget' },
    { name: 'dedge_widget_viewed',     desc: 'Widget enters the viewport' },
    { name: 'dedge_widget_book_click', desc: 'User clicks the Book CTA' },
  ];
  return (
    <>
      <PanelHeader title="Analytics" subtitle={<>DataLayer events pushed when users interact with the widget. All events are prefixed <code style={{ background: '#F2EFEC', padding: '1px 5px', borderRadius: 2, fontSize: 12 }}>dedge_widget_</code>.</>}/>
      <GroupCard title="Tracking" hint="Connect to your existing analytics setup.">
        <Toggle checked={form.analyticsEnabled}
          onChange={(v) => set('analyticsEnabled', v)}
          label="Enable dataLayer push"
          hint="Disable if you don't use Google Tag Manager or a compatible setup."/>
        {form.analyticsEnabled && (
          <Field label="DataLayer variable name" hint={<>Name of the global array. Default <code style={{ background: '#F2EFEC', padding: '0 4px', borderRadius: 2 }}>dataLayer</code> (GTM standard).</>}>
            <TextInput value={form.dataLayerName} onChange={(v) => set('dataLayerName', v)} monospace/>
          </Field>
        )}
      </GroupCard>
      <GroupCard title="Events emitted" hint="The widget pushes these events when relevant. No configuration needed." last>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map((e) => (
            <div key={e.name} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '8px 0', borderBottom: '1px solid #F2EFEC',
            }}>
              <code style={{
                fontSize: 12, color: '#432975', background: '#F7F4FB',
                padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                flexShrink: 0,
              }}>{e.name}</code>
              <span style={{ fontSize: 13, color: '#666', flex: 1, paddingTop: 2 }}>{e.desc}</span>
            </div>
          ))}
        </div>
      </GroupCard>
    </>
  );
}

// ── PUBLISH TAB ─────────────────────────────────────────────────────

function PublishPanel({ form, set }) {
  const embedCode = `<script async src="https://vturlin.github.io/best-price-widget/widget.js?id=${form.hotelId}"></script>`;
  return (
    <>
      <PanelHeader title="Publish" subtitle="Save the configuration so the widget can load it on the hotel website."/>

      <GroupCard title="Status" hint="Last published 2 days ago by adrien@d-edge.com.">
        <div style={{
          padding: '12px 14px', background: '#FBFAF9', border: '1px solid #E7E5E4',
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: '#F59E0B',
            boxShadow: '0 0 0 3px #F59E0B22', flexShrink: 0,
          }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>3 unpublished changes</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              Brand color, Position on screen, Auto-open delay
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button style={{
            flex: 1, background: '#432975', border: 'none', color: '#fff',
            padding: '10px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Publish changes</button>
          <button style={{
            background: 'transparent', border: '1px solid #E7E5E4', color: '#424242',
            padding: '10px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Download JSON</button>
        </div>
      </GroupCard>

      <GroupCard title="Embed code" hint="Paste this just before the closing </body> tag, or push it through GTM." last>
        <div style={{
          background: '#1F1610', borderRadius: 6, padding: 14,
          fontFamily: '"SF Mono", Menlo, monospace', fontSize: 12,
          color: '#E7E5E4', lineHeight: 1.55, position: 'relative',
        }}>
          <span style={{ color: '#C9B79A' }}>{'<script'}</span>
          {' '}
          <span style={{ color: '#A5C8A0' }}>async</span>{' '}
          <span style={{ color: '#A5C8A0' }}>src</span>
          <span style={{ color: '#C9B79A' }}>=</span>
          <span style={{ color: '#FED7AA' }}>"https://…/widget.js?id={form.hotelId}"</span>
          <span style={{ color: '#C9B79A' }}>{'></script>'}</span>
          <button style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#FBFAF9', padding: '4px 10px', borderRadius: 4,
            fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>Copy</button>
        </div>
      </GroupCard>
    </>
  );
}

window.V1Classic = V1Classic;
