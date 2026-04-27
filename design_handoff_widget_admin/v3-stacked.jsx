// V3 — Stacked. Inverted layout: the configuration sits in a wide
// LEFT rail (organized in collapsible sections + sub-sections), and the
// preview is a tall canvas on the right. Header is denser with a status
// strip below tabs.

const { useState: useStateV3 } = React;
const S3 = window.SHARED;

function V3Stacked() {
  const [form, setForm] = useStateV3(S3.DEFAULT_FORM);
  const [activeTab, setActiveTab] = useStateV3('appearance');
  const [device, setDevice] = useStateV3('desktop');
  const [widgetState, setWidgetState] = useStateV3('open');
  const [saveStatus, setSaveStatus] = useStateV3('saved');
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setSaveStatus('saved'); };

  return (
    <div style={{
      width: 1440, height: 900, background: '#FBFAF9',
      fontFamily: '"Open Sans", system-ui, sans-serif',
      color: '#424242', display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar combining brand, breadcrumb, tabs, status, actions */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E7E5E4',
        padding: '12px 24px 0', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <S3.DEdgeLogo height={20}/>
          <span style={{ width: 1, height: 18, background: '#E7E5E4' }}/>
          <span style={{ fontSize: 13, color: '#666' }}>Hotels</span>
          <span style={{ color: '#C9C5C2' }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Hôtel Demo</span>
          <span style={{
            padding: '2px 8px', background: '#ECE2FF', color: '#8764C9',
            fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', borderRadius: 2,
            textTransform: 'uppercase',
          }}>{form.hotelId}</span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <S3.SaveStatus status={saveStatus}/>
            <button style={{
              background: 'transparent', border: '1px solid #432975', color: '#432975',
              padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>View live</button>
            <button style={{
              background: '#432975', border: 'none', color: '#fff',
              padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Publish changes</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
          {S3.TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, padding: '10px 14px',
                  color: active ? '#432975' : '#666',
                  fontWeight: active ? 600 : 500,
                  borderBottom: active ? '2px solid #432975' : '2px solid transparent',
                  marginBottom: -1,
                }}>{t.label}</button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '480px 1fr', minHeight: 0 }}>
        {/* CONFIG (LEFT) */}
        <aside style={{
          background: '#fff', borderRight: '1px solid #E7E5E4',
          overflow: 'auto',
        }}>
          <div style={{ padding: '20px 24px 6px' }}>
            {activeTab === 'appearance' ? (
              <V3AppearancePanel form={form} set={set}/>
            ) : (
              <V3IdentityPanel form={form} set={set}/>
            )}
          </div>
        </aside>

        {/* PREVIEW (RIGHT) */}
        <div style={{
          padding: '24px 32px', display: 'flex', flexDirection: 'column',
          gap: 16, minHeight: 0, position: 'relative',
        }}>
          {/* Preview header strip */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#666',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>Live preview</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>
                {form.hotelDomain} · changes apply instantly
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Widget state */}
              <div style={{
                display: 'inline-flex', padding: 3, background: '#fff',
                border: '1px solid #E7E5E4', borderRadius: 999, gap: 2,
              }}>
                {[
                  { v: 'closed', l: 'Closed' },
                  { v: 'open', l: 'Open' },
                ].map((s) => (
                  <button key={s.v} onClick={() => setWidgetState(s.v)}
                    style={{
                      padding: '5px 14px', borderRadius: 999, border: 'none',
                      background: widgetState === s.v ? '#F2EDF8' : 'transparent',
                      color: widgetState === s.v ? '#432975' : '#666',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{s.l}</button>
                ))}
              </div>
              {/* Device */}
              <div style={{
                display: 'inline-flex', padding: 3, background: '#fff',
                border: '1px solid #E7E5E4', borderRadius: 999, gap: 2,
              }}>
                {['desktop', 'mobile'].map((d) => (
                  <button key={d} onClick={() => setDevice(d)}
                    style={{
                      padding: '5px 16px', borderRadius: 999, border: 'none',
                      background: device === d ? '#432975' : 'transparent',
                      color: device === d ? '#fff' : '#666',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      textTransform: 'capitalize',
                    }}>{d}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', minHeight: 0,
            justifyContent: device === 'mobile' ? 'center' : 'stretch' }}>
            <div style={{
              flex: 1,
              maxWidth: device === 'mobile' ? 420 : 'none',
              display: 'flex', minHeight: 0,
            }}>
            <S3.BrowserChrome
              url={form.hotelDomain || 'demo.hotel-widget.app'}
              height="100%"
            >
              <div style={{ position: 'absolute', inset: 0 }}>
                <S3.HotelBackdrop device={device}/>
                <div style={{
                  position: 'absolute',
                  bottom: form.position.includes('bottom') ? 20 : 'auto',
                  top: form.position.includes('top') ? 70 : 'auto',
                  right: form.position.includes('right') ? 20 : 'auto',
                  left: form.position.includes('left') ? 20 : 'auto',
                }}>
                  <S3.WidgetPreview form={form} state={widgetState} scale={1}/>
                </div>
              </div>
            </S3.BrowserChrome>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function V3SectionHeader({ children, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 12,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#432975',
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>{children}</div>
      {count != null && (
        <span style={{
          padding: '1px 7px', background: '#ECE2FF', color: '#8764C9',
          fontSize: 10, fontWeight: 700, borderRadius: 999,
        }}>{count}</span>
      )}
      <div style={{ flex: 1, height: 1, background: '#E7E5E4' }}/>
    </div>
  );
}

function V3IdentityPanel({ form, set }) {
  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Identity</h2>
      <p style={{ fontSize: 14, color: '#666', margin: '6px 0 0' }}>
        Basic information about the hotel and how to identify it.
      </p>
      <V3SectionHeader>Identification</V3SectionHeader>
      <S3.Field label="Hotel ID" hint="Locked in edit mode. Duplicate this configuration to change it.">
        <S3.TextInput value={form.hotelId} disabled monospace/>
      </S3.Field>
      <S3.Field label="Hotel name">
        <S3.TextInput value={form.hotelName} onChange={(v) => set('hotelName', v)}/>
      </S3.Field>
      <V3SectionHeader>Web presence</V3SectionHeader>
      <S3.Field label="Client domain" hint="Used to fetch a screenshot of the hotel's homepage as the preview backdrop.">
        <S3.TextInput value={form.hotelDomain} onChange={(v) => set('hotelDomain', v)} prefix="https://"/>
      </S3.Field>
      <S3.Field label="Logo URL" optional hint="Shown in the widget header instead of the hotel name.">
        <S3.TextInput value={form.logoUrl} onChange={(v) => set('logoUrl', v)}/>
      </S3.Field>
    </>
  );
}

function V3AppearancePanel({ form, set }) {
  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Appearance</h2>
      <p style={{ fontSize: 14, color: '#666', margin: '6px 0 0' }}>
        Colors, placement, and how the widget opens itself.
      </p>

      <V3SectionHeader>Colors</V3SectionHeader>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <S3.Field label="Brand color" hint="Buttons and accents.">
          <S3.ColorInput value={form.brandColor} onChange={(v) => set('brandColor', v)}
            presets={['#8B5A3C', '#1F5135', '#3E2D5A', '#B43A2A', '#1A1A1A']}/>
        </S3.Field>
        <S3.Field label="Background" hint="Widget panel fill.">
          <S3.ColorInput value={form.backgroundColor} onChange={(v) => set('backgroundColor', v)}
            presets={['#FAF7F2', '#FFFFFF', '#F4EFE8', '#1A1A1A', '#F0E9DD']}/>
        </S3.Field>
      </div>

      <V3SectionHeader>Placement</V3SectionHeader>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <S3.Field label="Position on screen">
          <S3.Select value={form.position} onChange={(v) => set('position', v)} options={S3.POSITIONS}/>
        </S3.Field>
        <S3.Field label="Widget size">
          <S3.Select value={form.size} onChange={(v) => set('size', v)} options={S3.SIZES}/>
        </S3.Field>
      </div>

      <V3SectionHeader>Auto-open behaviour</V3SectionHeader>
      <S3.Field label="Auto-open trigger" hint="When the widget opens itself for the first time. Closing suppresses auto-open for the rest of the session.">
        <S3.Select value={form.autoOpenMode} onChange={(v) => set('autoOpenMode', v)} options={S3.AUTO_OPEN_MODES}/>
      </S3.Field>
      {(form.autoOpenMode === 'time' || form.autoOpenMode === 'time_or_scroll') && (
        <S3.Field label="Delay before opening">
          <S3.Select value={String(form.autoOpenDelay)} onChange={(v) => set('autoOpenDelay', parseInt(v))} options={[
            { value: '3', label: '3 seconds' },
            { value: '5', label: '5 seconds' },
            { value: '8', label: '8 seconds (recommended)' },
            { value: '15', label: '15 seconds' },
          ]}/>
        </S3.Field>
      )}
    </>
  );
}

window.V3Stacked = V3Stacked;
