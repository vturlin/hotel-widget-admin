import { useEffect, useState } from 'react';
import DEdgeLogo from '../admin/DEdgeLogo.jsx';
import styles from './AuthScreen.module.css';

// Persisted across visits so the operator doesn't have to re-type the
// password every time. The cookie holds the password verbatim — the
// server's /api/auth is stateless (no session token to issue), so the
// client must replay the password on each cold load. SameSite=Strict
// keeps it from leaking across origins; Secure is set on HTTPS.
const COOKIE_NAME = 'dems_session';
const COOKIE_DAYS = 30;

function readCookie(name) {
  const m = document.cookie.match(
    new RegExp('(?:^|; )' + name + '=([^;]*)')
  );
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name, value, days) {
  const exp = new Date();
  exp.setDate(exp.getDate() + days);
  const secure = typeof location !== 'undefined' && location.protocol === 'https:'
    ? '; Secure'
    : '';
  document.cookie =
    `${name}=${encodeURIComponent(value)}; expires=${exp.toUTCString()}; path=/; SameSite=Strict${secure}`;
}

function clearCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

async function submitPassword(password) {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function AuthScreen({ onAuthed }) {
  const [pwdInput, setPwdInput] = useState('');
  const [authError, setAuthError] = useState('');
  // 'checking' while we replay a saved cookie; 'idle' once we know we
  // need the user to type something.
  const [phase, setPhase] = useState('checking');

  useEffect(() => {
    const saved = readCookie(COOKIE_NAME);
    if (!saved) {
      setPhase('idle');
      return;
    }
    submitPassword(saved).then((ok) => {
      if (ok) {
        onAuthed();
      } else {
        clearCookie(COOKIE_NAME);
        setPhase('idle');
      }
    });
  }, [onAuthed]);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    const ok = await submitPassword(pwdInput);
    if (ok) {
      writeCookie(COOKIE_NAME, pwdInput, COOKIE_DAYS);
      onAuthed();
    } else {
      setAuthError('Wrong password');
    }
  }

  if (phase === 'checking') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <DEdgeLogo height={28} />
          </div>
          <h1 className={styles.title}>D-EDGE Marketing Suite</h1>
          <p className={styles.subtitle}>Signing in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={handleLogin}>
        <div className={styles.logo}>
          <DEdgeLogo height={28} />
        </div>
        <h1 className={styles.title}>D-EDGE Marketing Suite</h1>
        <p className={styles.subtitle}>Sign in to continue</p>
        <input
          type="password"
          className={styles.input}
          value={pwdInput}
          onChange={(e) => setPwdInput(e.target.value)}
          placeholder="Password"
          autoFocus
        />
        {authError && <div className={styles.error}>{authError}</div>}
        <button type="submit" className={styles.btn}>Sign in</button>
      </form>
    </div>
  );
}
