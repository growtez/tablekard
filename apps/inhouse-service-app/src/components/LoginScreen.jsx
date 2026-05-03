import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setBusy(true);
    setLocalError(null);

    try {
      await signIn(email, password);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">TABLEKARD</div>
        <p className="login-subtitle">Kitchen &amp; Service Display</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            id="login-email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {displayError && <div className="login-error">{displayError}</div>}

          <button
            id="login-submit"
            type="submit"
            className="login-btn"
            disabled={busy}
          >
            {busy ? <Loader2 className="spin" size={18} /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
