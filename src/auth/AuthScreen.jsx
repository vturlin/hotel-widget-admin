import { useEffect, useState } from 'react';
import DEdgeLogo from '../admin/DEdgeLogo.jsx';
import styles from './AuthScreen.module.css';

// Auth flow:
//   1. On mount, call /api/auth-check. If the server's HttpOnly
//      session cookie is still valid, skip the form.
//   2. Otherwise, prompt for the password. On success, the server
//      sets the session cookie; we never read or write it from JS.

async function checkSession() {
  try {
    const res = await fetch('/api/auth-check', { credentials: 'same-origin' });
    return res.ok;
  } catch {
    return false;
  }
}

async function submitPassword(password) {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      credentials: 'same-origin',
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
  // 'checking' while we probe for an existing session; 'idle' once
  // we know the user needs to type a password.
  const [phase, setPhase] = useState('checking');

  useEffect(() => {
    let cancelled = false;
    checkSession().then((ok) => {
      if (cancelled) return;
      if (ok) onAuthed();
      else setPhase('idle');
    });
    return () => { cancelled = true; };
  }, [onAuthed]);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    const ok = await submitPassword(pwdInput);
    if (ok) {
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
