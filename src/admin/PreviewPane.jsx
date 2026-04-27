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
  const fileInputRef = useRef(null);
  const [available, setAvailable] = useState({ w: 800, h: 600 });
  // { url, name } from URL.createObjectURL on a user-uploaded file.
  // The only way to get a real-website backdrop in the preview — there is
  // no live-iframe attempt because most hotel sites block embedding via
  // X-Frame-Options / CSP, so the live mode would be empty more often
  // than not. Cleared via "Remove screenshot".
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      // Reserve room for everything that wraps the actual viewport:
      //   horizontal: 24px*2 wrap padding + 2px card border = 50
      //   vertical:   24px*2 wrap padding + 16px gap + ~40px device toggle
      //               + 36px BrowserChrome bar + 2px card border = 142
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

  // Free the previous object URL whenever the upload changes or unmounts.
  useEffect(() => {
    return () => {
      if (uploadedImage?.url) URL.revokeObjectURL(uploadedImage.url);
    };
  }, [uploadedImage]);

  const clientUrl = useMemo(() => {
    if (!isValidPublicDomain(clientDomain)) return null;
    const d = clientDomain.trim();
    if (d.startsWith('http://') || d.startsWith('https://')) return d;
    return `https://${d}`;
  }, [clientDomain]);

  const maxWidth = device === 'desktop' ? available.w : Math.min(320, available.w);
  const maxHeight = available.h;
  const scale = Math.min(maxWidth / viewport.w, maxHeight / viewport.h, 1);
  const displayW = viewport.w * scale;
  const displayH = viewport.h * scale;

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImage({ url, name: file.name });
    // Reset so the same file can be picked again after a clear.
    e.target.value = '';
  }

  function handleClearUpload() {
    setUploadedImage(null);
  }

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <BrowserChrome
        url={clientUrl || 'demo.hotel-widget.app'}
        width={displayW}
      >
        <div style={{ width: displayW, height: displayH, position: 'relative' }}>
          {uploadedImage ? (
            <img
              src={uploadedImage.url}
              alt="Uploaded client website"
              style={{
                width: '100%',
                height: '100%',
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
          className={styles.uploadBtn}
          onClick={handleUploadClick}
          title="Upload a screenshot of the hotel website to use as the preview backdrop"
        >
          {uploadedImage ? 'Replace screenshot' : 'Upload screenshot'}
        </button>
        {uploadedImage && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClearUpload}
          >
            × Remove
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
