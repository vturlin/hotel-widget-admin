import { useEffect, useMemo, useRef, useState } from 'react';
import { isValidPublicDomain } from '../utils.js';
import BrowserChrome from './BrowserChrome.jsx';
import DeviceToggle from './DeviceToggle.jsx';
import styles from './PreviewPane.module.css';

export default function PreviewPane({
  previewUrl,
  viewport,
  device,
  setDevice,
  clientDomain,
}) {
  const wrapRef = useRef(null);
  const [available, setAvailable] = useState({ w: 800, h: 600 });
  // Per-device counter: 0 = not yet captured, >0 = captured (and used as
  // a remount key so clicking "Refresh" re-fetches even when the URL
  // would otherwise be identical).
  const [captureCounts, setCaptureCounts] = useState({ desktop: 0, mobile: 0 });
  const [loading, setLoading] = useState(false);
  const [screenshotFailed, setScreenshotFailed] = useState(false);

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      // Reserve room for everything that wraps the actual viewport:
      //   horizontal: 24px*2 wrap padding + 2px card border = 50
      //   vertical:   24px*2 wrap padding + 16px gap + ~40px device toggle
      //               + 36px BrowserChrome bar + 2px card border = 142
      // Bumped slightly for safety.
      setAvailable({
        w: Math.max(320, rect.width - 56),
        h: Math.max(400, rect.height - 150),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const clientUrl = useMemo(() => {
    if (!isValidPublicDomain(clientDomain)) return null;
    const d = clientDomain.trim();
    if (d.startsWith('http://') || d.startsWith('https://')) return d;
    return `https://${d}`;
  }, [clientDomain]);

  // Editing the domain invalidates any previous capture: the URL the user
  // typed no longer corresponds to what's on screen.
  useEffect(() => {
    setCaptureCounts({ desktop: 0, mobile: 0 });
    setScreenshotFailed(false);
    setLoading(false);
  }, [clientUrl]);

  const captured = captureCounts[device] > 0;
  const useScreenshot = !!clientUrl && captured && !screenshotFailed;
  const screenshotUrl = useScreenshot
    ? `https://image.thum.io/get/width/${viewport.w}/crop/${viewport.h}/${clientUrl}`
    : null;

  const maxWidth = device === 'desktop' ? available.w : Math.min(320, available.w);
  const maxHeight = available.h;
  const scale = Math.min(maxWidth / viewport.w, maxHeight / viewport.h, 1);
  const displayW = viewport.w * scale;
  const displayH = viewport.h * scale;

  function handleCapture() {
    if (!clientUrl) return;
    setScreenshotFailed(false);
    setLoading(true);
    setCaptureCounts((c) => ({ ...c, [device]: c[device] + 1 }));
  }

  const captureLabel = loading
    ? 'Capturing…'
    : captured
      ? 'Refresh screenshot'
      : 'Capture screenshot';

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <BrowserChrome
        url={useScreenshot ? clientUrl : 'demo.hotel-widget.app'}
        width={displayW}
      >
        <div style={{ width: displayW, height: displayH, position: 'relative' }}>
          {useScreenshot ? (
            <img
              key={`${screenshotUrl}-${captureCounts[device]}`}
              src={screenshotUrl}
              alt="Client website preview"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setScreenshotFailed(true);
              }}
              style={{
                width: viewport.w,
                height: viewport.h,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                inset: 0,
                objectFit: 'cover',
                background: '#fff',
              }}
            />
          ) : (
            <div className={styles.demoBackdrop} />
          )}
          <iframe
            key={previewUrl}
            src={previewUrl}
            title="Widget preview"
            style={{
              width: viewport.w,
              height: viewport.h,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              border: 0,
              position: 'absolute',
              inset: 0,
              background: 'transparent',
            }}
            allowTransparency="true"
          />
        </div>
      </BrowserChrome>

      <div className={styles.toggleRow}>
        <DeviceToggle device={device} onChange={setDevice} />
        <button
          type="button"
          className={captured ? styles.captureBtnOutline : styles.captureBtnPrimary}
          onClick={handleCapture}
          disabled={!clientUrl || loading}
          title={!clientUrl ? 'Set a valid Client domain in Identity to enable' : undefined}
        >
          {captureLabel}
        </button>
      </div>
    </div>
  );
}
