import { useState } from 'react';
import DEdgeLogo from '../admin/DEdgeLogo.jsx';
import styles from './AuthScreen.module.css';

export default function AuthScreen({ onAuthed }) {
  const [pwdInput, setPwdInput] = useState('');
  const [authError, setAuthError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdInput }),
      });
      if (res.ok) {
        onAuthed();
      } else {
        setAuthError('Wrong password');
      }
    } catch {
      setAuthError('Server unreachable');
    }
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={handleLogin}>
        <div className={styles.logo}>
          <DEdgeLogo height={28} />
        </div>
        <h1 className={styles.title}>Hotel Widget Admin</h1>
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
