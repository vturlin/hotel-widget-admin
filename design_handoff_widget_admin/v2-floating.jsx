// V2 — Floating panel. The preview goes FULL-BLEED (whole window is
// the hotel website), and the configuration is a movable, glass-style
// panel anchored top-left. Top chrome is just a slim brand bar.

const { useState: useStateV2 } = React;
const S2 = window.SHARED;

function V2Floating() {
  const [form, setForm] = useStateV2(S2.DEFAULT_FORM);
  const [activeTab, setActiveTab] = useStateV2('appearance');
  const [device, setDevice] = useStateV2('desktop');
  const [saveStatus, setSaveStatus] = useStateV2('saved');
  const [collapsed, setCollapsed] = useStateV2(false);
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setSaveStatus('saved'); };

  return (
    <div style={{
      width: 1440, height: 900, position: 'relative',
      fontFamily: '"Open Sans", system-ui, sans-serif',
      color: '#424242', overflow: 'hidden', background: '#1F1610',
    }}>
      {/* FULL-BLEED PREVIEW */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <S2.HotelBackdrop device={device}/>
        {/* Widget overlaid bottom-right */}
        <div style={{ position: 'absolute', bottom: 32, right: 32 }}>
          <S2.WidgetPreview form={form} state="open" scale={1.05}/>
        </div>
      </div>

      {/* SLIM TOP BAR */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 48,
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)', zIndex: 10,
      }}>
        <S2.DEdgeLogo height={18}/>
        <span style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)' }}/>
        <span style={{ fontSize: 13, color: '#666' }}>Hotels</span>
        <span style={{ color: '#C9C5C2' }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#424242' }}>Hôtel Demo</span>
        <span style={{
          padding: '2px 8px', background: '#ECE2FF', color: '#8764C9',
          fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', borderRadius: 2,
          textTransform: 'uppercase',
        }}>{form.hotelId}</span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Device pill */}
          <div style={{
            display: 'inline-flex', padding: 3, background: 'rgba(0,0,0,0.06)',
            borderRadius: 999, gap: 2,
          }}>
            {['desktop', 'mobile'].map((d) => (
              <button key={d} onClick={() => setDevice(d)}
                style={{
                  padding: '4px 12px', borderRadius: 999, border: 'none',
                  background: device === d ? '#fff' : 'transparent',
                  color: device === d ? '#432975' : '#666',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  textTransform: 'capitalize',
                  boxShadow: device === d ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}>{d}</button>
            ))}
          </div>
          <S2.SaveStatus status={saveStatus}/>
          <button style={{
            background: '#432975', border: 'none', color: '#fff',
            padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Publish</button>
        </div>
      </div>

      {/* FLOATING CONFIG PANEL */}
      <div style={{
        position: 'absolute', top: 68, left: 20, bottom: 20, width: 380,
        background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14,
        boxShadow: '0 16px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 5,
      }}>
        {/* Drag handle / header */}
        <div style={{
          padding: '10px 14px 10px 16px', display: 'flex', alignItems: 'center',
          gap: 8, borderBottom: '1px solid #E7E5E4', cursor: 'grab',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.6), transparent)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ width: 24, height: 2, background: '#C9C5C2', borderRadius: 1 }}/>
            <span style={{ width: 24, height: 2, background: '#C9C5C2', borderRadius: 1 }}/>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#424242', marginLeft: 4 }}>
            Configuration
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button onClick={() => setCollapsed(!collapsed)} style={{
              width: 24, height: 24, border: 'none', background: 'transparent',
              borderRadius: 4, cursor: 'pointer', color: '#666',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>—</button>
          </div>
        </div>

        {/* Vertical tabs */}
        <div style={{
          padding: '8px', borderBottom: '1px solid #E7E5E4',
          display: 'flex', flexWrap: 'wrap', gap: 2,
        }}>
          {S2.TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{
                  flex: '1 0 auto', minWidth: 'fit-content',
                  padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: active ? '#432975' : 'transparent',
                  color: active ? '#fff' : '#666',
                  fontSize: 12, fontWeight: active ? 600 : 500, fontFamily: 'inherit',
                }}>{t.label}</button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
          {activeTab === 'appearance' && <V2AppearanceBody form={form} set={set}/>}
          {activeTab === 'identity' && <V2IdentityBody form={form} set={set}/>}
        </div>
      </div>
    </div>
  );
}

function V2Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useStateV2(defaultOpen);
  return (
    <div style={{
      marginBottom: 12, border: '1px solid #E7E5E4',
      borderRadius: 8, overflow: 'hidden', background: '#fff',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '10px 12px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: '#432975',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        <span>{title}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" style={{
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 120ms',
        }}>
          <path d="M1 1L5 5L9 1" stroke="#432975" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: '4px 12px 14px', borderTop: '1px solid #F2EFEC' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function V2IdentityBody({ form, set }) {
  return (
    <>
      <V2Section title="Identification">
        <S2.Field label="Hotel ID" hint="Locked in edit mode.">
          <S2.TextInput value={form.hotelId} disabled monospace/>
        </S2.Field>
        <S2.Field label="Hotel name">
          <S2.TextInput value={form.hotelName} onChange={(v) => set('hotelName', v)}/>
        </S2.Field>
      </V2Section>
      <V2Section title="Web presence">
        <S2.Field label="Client domain" hint="Used for the preview backdrop.">
          <S2.TextInput value={form.hotelDomain} onChange={(v) => set('hotelDomain', v)} prefix="https://"/>
        </S2.Field>
        <S2.Field label="Logo URL" optional>
          <S2.TextInput value={form.logoUrl} onChange={(v) => set('logoUrl', v)}/>
        </S2.Field>
      </V2Section>
    </>
  );
}

function V2AppearanceBody({ form, set }) {
  return (
    <>
      <V2Section title="Colors">
        <S2.Field label="Brand color" hint="Buttons and accents.">
          <S2.ColorInput value={form.brandColor} onChange={(v) => set('brandColor', v)}
            presets={['#8B5A3C', '#1F5135', '#3E2D5A', '#B43A2A', '#1A1A1A']}/>
        </S2.Field>
        <S2.Field label="Background">
          <S2.ColorInput value={form.backgroundColor} onChange={(v) => set('backgroundColor', v)}
            presets={['#FAF7F2', '#FFFFFF', '#F4EFE8', '#1A1A1A', '#F0E9DD']}/>
        </S2.Field>
      </V2Section>
      <V2Section title="Placement">
        <S2.Field label="Position on screen">
          <PositionPicker value={form.position} onChange={(v) => set('position', v)}/>
        </S2.Field>
        <S2.Field label="Widget size">
          <S2.Select value={form.size} onChange={(v) => set('size', v)} options={S2.SIZES}/>
        </S2.Field>
      </V2Section>
      <V2Section title="Auto-open behaviour" defaultOpen={false}>
        <S2.Field label="Auto-open trigger">
          <S2.Select value={form.autoOpenMode} onChange={(v) => set('autoOpenMode', v)} options={S2.AUTO_OPEN_MODES}/>
        </S2.Field>
      </V2Section>
    </>
  );
}

// Visual position picker — 4 corners
function PositionPicker({ value, onChange }) {
  const positions = [
    { v: 'top-left',     row: 0, col: 0 },
    { v: 'top-right',    row: 0, col: 1 },
    { v: 'bottom-left',  row: 1, col: 0 },
    { v: 'bottom-right', row: 1, col: 1 },
  ];
  return (
    <div style={{
      width: '100%', aspectRatio: '16 / 10',
      border: '1px solid #E7E5E4', borderRadius: 6,
      background: 'repeating-linear-gradient(45deg, #FBFAF9, #FBFAF9 6px, #fff 6px, #fff 12px)',
      position: 'relative', padding: 8,
    }}>
      {positions.map((p) => (
        <button key={p.v} onClick={() => onChange(p.v)}
          style={{
            position: 'absolute',
            top: p.row === 0 ? 8 : 'auto',
            bottom: p.row === 1 ? 8 : 'auto',
            left: p.col === 0 ? 8 : 'auto',
            right: p.col === 1 ? 8 : 'auto',
            width: 38, height: 24, borderRadius: 4,
            background: value === p.v ? '#432975' : '#fff',
            border: value === p.v ? '1px solid #432975' : '1px solid #C9C5C2',
            cursor: 'pointer', padding: 0,
          }}
          title={p.v}
        />
      ))}
    </div>
  );
}

window.V2Floating = V2Floating;
