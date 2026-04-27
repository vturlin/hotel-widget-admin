// Shared bits used by all 3 variations: tokens, mock data, primitives,
// the widget preview, the hotel-website backdrop placeholder.

const TABS = [
  { key: 'identity',   label: 'Identity' },
  { key: 'data',       label: 'Data' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'languages',  label: 'Languages' },
  { key: 'analytics',  label: 'Analytics' },
  { key: 'publish',    label: 'Publish' },
];

const POSITIONS = [
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'bottom-left',  label: 'Bottom left' },
  { value: 'top-right',    label: 'Top right' },
  { value: 'top-left',     label: 'Top left' },
];

const SIZES = [
  { value: 'small',  label: 'Small (default)' },
  { value: 'medium', label: 'Medium' },
  { value: 'large',  label: 'Large' },
];

const AUTO_OPEN_MODES = [
  { value: 'disabled',       label: 'Disabled' },
  { value: 'time',           label: 'After a delay' },
  { value: 'scroll',         label: 'On scroll' },
  { value: 'time_or_scroll', label: 'Delay or scroll (first wins)' },
];

const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'ja', name: '日本語' },
];

const DEFAULT_FORM = {
  hotelId: 'hm_demo001',
  hotelName: 'Hôtel Demo',
  hotelDomain: 'astotel.com',
  logoUrl: 'https://vturlin.github.io/best-price-widget/demo.htm',
  apiHotelId: '20917',
  apiCompetitorId: '12483',
  channelsEnabled: [17, 10, 9],
  reserveUrl: 'https://book.astotel.com/?arrive={checkIn}&depart={checkOut}',
  currency: 'EUR',
  position: 'bottom-right',
  size: 'small',
  brandColor: '#8B5A3C',
  backgroundColor: '#FAF7F2',
  enabledLocales: ['en', 'fr', 'es', 'de', 'it'],
  defaultLocale: 'en',
  autoOpenMode: 'time_or_scroll',
  autoOpenDelay: 8,
  autoOpenScrollPercent: 50,
  analyticsEnabled: true,
  dataLayerName: 'dataLayer',
};

// ── Primitives ───────────────────────────────────────────────────────

const cssVar = (n) => `var(--${n})`;

function Field({ label, hint, children, htmlFor, optional }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', marginBottom: 16 }}>
      <div style={{
        fontSize: 13, fontWeight: 600, color: '#424242', marginBottom: 6,
        display: 'flex', alignItems: 'baseline', gap: 6,
      }}>
        {label}
        {optional && (
          <span style={{ fontSize: 11, fontWeight: 400, color: '#999' }}>optional</span>
        )}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: 12, color: '#666', marginTop: 6, lineHeight: 1.45 }}>
          {hint}
        </div>
      )}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, disabled, monospace, prefix }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      border: '1px solid #E7E5E4', borderRadius: 6,
      background: disabled ? '#FBFAF9' : '#fff',
      transition: 'border-color 120ms, box-shadow 120ms',
      overflow: 'hidden',
    }}
    onFocus={(e) => e.currentTarget.style.borderColor = '#432975'}
    onBlur={(e) => e.currentTarget.style.borderColor = '#E7E5E4'}
    >
      {prefix && (
        <span style={{
          padding: '0 10px', display: 'inline-flex', alignItems: 'center',
          background: '#FBFAF9', borderRight: '1px solid #E7E5E4',
          color: '#666', fontSize: 13,
        }}>{prefix}</span>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1, height: 38, padding: '0 12px', border: 'none', outline: 'none',
          background: 'transparent', fontSize: 14, fontFamily: 'inherit',
          color: disabled ? '#999' : '#424242',
          fontFeatureSettings: monospace ? '"tnum"' : 'normal',
          letterSpacing: monospace ? '0.01em' : 'normal',
        }}
      />
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          width: '100%', height: 38, padding: '0 36px 0 12px',
          border: '1px solid #E7E5E4', borderRadius: 6, background: '#fff',
          fontSize: 14, fontFamily: 'inherit', color: '#424242', cursor: 'pointer',
          outline: 'none',
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = '#432975'}
        onBlur={(e) => e.currentTarget.style.borderColor = '#E7E5E4'}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg width="10" height="6" viewBox="0 0 10 6" style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none',
      }}>
        <path d="M1 1L5 5L9 1" stroke="#666" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function ColorInput({ value, onChange, presets = [] }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'stretch',
        border: '1px solid #E7E5E4', borderRadius: 6, overflow: 'hidden',
      }}>
        <label style={{
          width: 56, position: 'relative', cursor: 'pointer',
          background: value, borderRight: '1px solid #E7E5E4',
        }}>
          <input
            type="color" value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
          />
        </label>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1, height: 38, padding: '0 12px', border: 'none', outline: 'none',
            background: '#fff', fontSize: 13, fontFamily: 'inherit', color: '#424242',
            fontFeatureSettings: '"tnum"', letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        />
      </div>
      {presets.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {presets.map((p) => (
            <button key={p} type="button" onClick={() => onChange(p)}
              style={{
                width: 22, height: 22, borderRadius: 4, background: p,
                border: value.toLowerCase() === p.toLowerCase() ? '2px solid #432975' : '1px solid #E7E5E4',
                cursor: 'pointer', padding: 0,
              }}
              title={p}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 999,
          background: checked ? '#432975' : '#D7D3D0',
          border: 'none', position: 'relative', cursor: 'pointer',
          flexShrink: 0, marginTop: 2, transition: 'background 120ms',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 120ms', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}/>
      </button>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#424242' }}>{label}</div>
        {hint && (
          <div style={{ fontSize: 12, color: '#666', marginTop: 2, lineHeight: 1.4 }}>
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange, label, suffix }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
      borderRadius: 6, cursor: 'pointer',
      background: checked ? '#F7F4FB' : 'transparent',
      transition: 'background 120ms',
    }}
    onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = '#F7F7F7'; }}
    onMouseLeave={(e) => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: 'none' }}
      />
      <span style={{
        width: 16, height: 16, borderRadius: 3,
        background: checked ? '#432975' : '#fff',
        border: checked ? '1px solid #432975' : '1px solid #C9C5C2',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8">
            <path d="M1 4L4 7L9 1" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span style={{ flex: 1, fontSize: 14, color: '#424242' }}>{label}</span>
      {suffix && (
        <span style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>{suffix}</span>
      )}
    </label>
  );
}

function SectionTitle({ children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#666',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>{children}</div>
      {hint && (
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{hint}</div>
      )}
    </div>
  );
}

// ── Save status pill ─────────────────────────────────────────────────

function SaveStatus({ status }) {
  // status: 'saved' | 'saving' | 'unsaved'
  const map = {
    saved:   { dot: '#10B981', label: 'All changes saved', sub: 'Auto-saved a moment ago' },
    saving:  { dot: '#F59E0B', label: 'Saving…',          sub: 'Syncing your changes' },
    unsaved: { dot: '#EF4444', label: 'Unsaved changes',  sub: 'Auto-save in 2s' },
  };
  const v = map[status];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 12px', borderRadius: 999,
      background: '#FBFAF9', border: '1px solid #E7E5E4',
      fontSize: 13, color: '#424242',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: v.dot,
        boxShadow: `0 0 0 3px ${v.dot}22`,
        animation: status === 'saving' ? 'pulse 1.4s infinite' : 'none',
      }}/>
      <span style={{ fontWeight: 500 }}>{v.label}</span>
      <span style={{ color: '#999', fontSize: 12 }}>· {v.sub}</span>
    </div>
  );
}

// ── Hotel website backdrop (mock screenshot) ─────────────────────────

function HotelBackdrop({ device = 'desktop' }) {
  // A faux-photo aerial hospitality hero for the preview canvas.
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'linear-gradient(135deg, #C9B79A 0%, #8E6F4E 50%, #5A4630 100%)',
    }}>
      {/* Sun glow */}
      <div style={{
        position: 'absolute', top: -120, right: -100, width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,235,180,0.7) 0%, rgba(255,200,140,0.2) 40%, transparent 70%)',
      }}/>
      {/* Pool/water plane */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%',
        background: 'linear-gradient(180deg, rgba(120,160,180,0.55) 0%, rgba(60,90,110,0.85) 100%)',
      }}/>
      {/* Building silhouettes */}
      <div style={{
        position: 'absolute', bottom: '36%', left: '8%', width: 180, height: 90,
        background: 'linear-gradient(180deg, #3E2D1E 0%, #1F1610 100%)',
        clipPath: 'polygon(0 30%, 25% 30%, 25% 0, 70% 0, 70% 30%, 100% 30%, 100% 100%, 0 100%)',
        opacity: 0.85,
      }}/>
      <div style={{
        position: 'absolute', bottom: '36%', right: '12%', width: 140, height: 70,
        background: 'linear-gradient(180deg, #4A3725 0%, #2A1E13 100%)',
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        opacity: 0.8,
      }}/>
      {/* Palm hint */}
      <div style={{
        position: 'absolute', bottom: '34%', left: '40%', width: 6, height: 80,
        background: '#1F1610', opacity: 0.7,
      }}/>
      <div style={{
        position: 'absolute', bottom: '54%', left: '36%', width: 60, height: 30,
        background: 'radial-gradient(ellipse, #2D5036 0%, transparent 70%)',
        opacity: 0.75, borderRadius: '50%',
      }}/>
      {/* Header bar of website */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 56,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', padding: '0 32px',
        gap: 32, borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <span style={{ fontFamily: 'serif', fontSize: 18, fontWeight: 600, color: '#3E2D1E', letterSpacing: '0.15em' }}>
          ASTOTEL
        </span>
        {device === 'desktop' && (
          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <span>Hotels</span><span>Offers</span><span>Paris</span><span>Contact</span>
          </div>
        )}
        <div style={{ marginLeft: 'auto', padding: '6px 16px', border: '1px solid #3E2D1E', fontSize: 11, color: '#3E2D1E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Book
        </div>
      </div>
      {/* Hero copy */}
      <div style={{
        position: 'absolute', top: '38%', left: '8%', right: '40%',
        color: '#fff',
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', opacity: 0.9, textTransform: 'uppercase' }}>
          Paris · 5★
        </div>
        <div style={{ fontFamily: 'serif', fontSize: 36, fontWeight: 400, lineHeight: 1.1, marginTop: 12 }}>
          Where Parisian elegance meets timeless comfort
        </div>
      </div>
    </div>
  );
}

// ── The actual widget preview (closed pill or open card) ─────────────

function WidgetPreview({ form, state = 'open', scale = 1 }) {
  const sizeMul = form.size === 'large' ? 1.15 : form.size === 'medium' ? 1.05 : 1;
  const w = 280 * sizeMul * scale;

  if (state === 'closed') {
    return (
      <div style={{
        background: form.brandColor, color: '#fff',
        padding: '12px 18px', borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui',
        display: 'inline-flex', alignItems: 'center', gap: 10,
        fontSize: 14, fontWeight: 600,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 2"/>
        </svg>
        See best price
      </div>
    );
  }

  return (
    <div style={{
      width: w, background: form.backgroundColor,
      borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 12px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
      fontFamily: 'system-ui',
    }}>
      {/* Stay header */}
      <div style={{ padding: '14px 16px 8px', position: 'relative' }}>
        <div style={{ fontSize: 9, color: '#666', letterSpacing: '0.18em', fontWeight: 600 }}>
          YOUR STAY
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>
            Apr 24 <span style={{ color: '#999', margin: '0 4px' }}>→</span> Apr 25
          </div>
          <div style={{
            fontSize: 9, color: '#666', padding: '3px 7px',
            border: '1px solid #ddd', borderRadius: 999, fontWeight: 500,
          }}>1 night</div>
        </div>
        <button style={{
          position: 'absolute', top: 8, right: 10, background: 'transparent', border: 'none',
          fontSize: 14, color: '#999', cursor: 'pointer', padding: 0,
        }}>×</button>
      </div>

      {/* Price block */}
      <div style={{ padding: '4px 16px 14px', textAlign: 'center', borderBottom: '1px dashed #e8dccc' }}>
        <div style={{ fontSize: 9, color: '#888', letterSpacing: '0.16em', fontWeight: 600, textTransform: 'uppercase' }}>
          Price on official website
        </div>
        <div style={{ fontSize: 32, fontWeight: 600, color: '#222', marginTop: 4, fontFamily: 'serif' }}>
          €744
        </div>
        <div style={{ fontSize: 10, color: '#888', marginTop: -2 }}>total for 1 night</div>
        <div style={{
          marginTop: 8, padding: '4px 10px', display: 'inline-block',
          background: '#C5E8D5', color: '#1F5135', borderRadius: 999,
          fontSize: 10, fontWeight: 600,
        }}>
          You save €146 (16%) vs Booking.com
        </div>
      </div>

      {/* Comparison rows */}
      <div style={{ padding: '8px 16px' }}>
        {[
          { name: 'Booking.com', price: '€890', diff: '+€146' },
          { name: 'Expedia',     price: '€904', diff: '+€160' },
        ].map((r) => (
          <div key={r.name} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 0', fontSize: 11,
          }}>
            <span style={{ color: '#666' }}>{r.name}</span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: '#999', textDecoration: 'line-through' }}>{r.price}</span>
              <span style={{
                color: '#B43A2A', background: '#FBE5E1',
                padding: '1px 6px', borderRadius: 3, fontWeight: 600, fontSize: 10,
              }}>{r.diff}</span>
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '4px 16px 14px' }}>
        <button style={{
          width: '100%', padding: '10px 16px', background: form.brandColor,
          color: '#fff', border: 'none', borderRadius: 6,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', cursor: 'pointer',
        }}>
          Book now →
        </button>
      </div>
      <div style={{
        padding: '6px 0 10px', textAlign: 'center', fontSize: 7,
        color: '#999', letterSpacing: '0.2em', fontWeight: 700,
      }}>
        POWERED BY D-EDGE
      </div>
    </div>
  );
}

// Browser chrome
function BrowserChrome({ url = 'astotel.com', children, height, width }) {
  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      background: '#fff', border: '1px solid #E7E5E4',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column',
      height: height || 'auto',
      width: width || '100%',
      flex: height === '100%' ? 1 : 'initial',
    }}>
      <div style={{
        height: 36, background: '#F2EFEC', borderBottom: '1px solid #E7E5E4',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56' }}/>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }}/>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F' }}/>
        <div style={{
          marginLeft: 8, flex: 1, height: 22, background: '#fff', borderRadius: 4,
          padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: '#666', fontFamily: 'system-ui',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          {url}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>{children}</div>
    </div>
  );
}

// Logo
function DEdgeLogo({ height = 22 }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 1,
      fontFamily: '"Open Sans", sans-serif',
    }}>
      <span style={{ fontSize: height, fontWeight: 700, color: '#432975', letterSpacing: '-0.02em', lineHeight: 1 }}>d</span>
      <span style={{ fontSize: height * 0.45, fontWeight: 700, color: '#2DC2BC', lineHeight: 1 }}>·</span>
      <span style={{ fontSize: height, fontWeight: 700, color: '#432975', letterSpacing: '-0.02em', lineHeight: 1 }}>edge</span>
    </div>
  );
}

window.SHARED = {
  TABS, POSITIONS, SIZES, AUTO_OPEN_MODES, SUPPORTED_LOCALES, DEFAULT_FORM,
  Field, TextInput, Select, ColorInput, Toggle, Checkbox, SectionTitle,
  SaveStatus, HotelBackdrop, WidgetPreview, BrowserChrome, DEdgeLogo,
};
