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

  useEffect(() => {
    setScreenshotFailed(false);
  }, [clientUrl]);

  const screenshotUrl = useMemo(() => {
    if (!clientUrl || screenshotFailed) return null;
    return `https://image.thum.io/get/width/${viewport.w}/crop/${viewport.h}/${clientUrl}`;
  }, [clientUrl, screenshotFailed, viewport.w, viewport.h]);

  const useScreenshot = screenshotUrl !== null;

  const maxWidth = device === 'desktop' ? available.w : Math.min(320, available.w);
  const maxHeight = available.h;
  const scale = Math.min(maxWidth / viewport.w, maxHeight / viewport.h, 1);
  const displayW = viewport.w * scale;
  const displayH = viewport.h * scale;

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <BrowserChrome
        url={useScreenshot ? clientUrl : 'demo.hotel-widget.app'}
        width={displayW}
      >
        <div style={{ width: displayW, height: displayH, position: 'relative' }}>
          {useScreenshot ? (
            <img
              key={screenshotUrl}
              src={screenshotUrl}
              alt="Client website preview"
              onError={() => setScreenshotFailed(true)}
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
      </div>
    </div>
  );
}
