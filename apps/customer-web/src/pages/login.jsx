import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import './login.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle, sendMagicLink, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState('');

  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const absoluteRedirect = `${window.location.origin}${redirectTo}`;
      await signInWithGoogle(absoluteRedirect);
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const absoluteRedirect = `${window.location.origin}${redirectTo}`;
      await sendMagicLink(email, absoluteRedirect);
      setMagicLinkSent(true);
    } catch (err) {
      console.error('Magic link error:', err);
      setError('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <NavLink to={redirectTo} className="back-button">
          <ArrowLeft size={24} />
        </NavLink>
      </header>

      <main className="login-main">
        <div className="login-content">
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome</h1>
            <p className="welcome-subtitle">Sign in to continue</p>
          </div>

          <button
            type="button"
            className={`google-signin-button ${isLoading ? 'loading' : ''}`}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="google-icon"
                />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <div className="email-signin-section">
            <div className="email-input-wrapper">
              <Mail size={18} className="email-icon" />
              <input
                type="email"
                placeholder="Email for magic link"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
              />
            </div>

            <button
              type="button"
              className={`google-signin-button ${isLoading ? 'loading' : ''}`}
              onClick={handleMagicLink}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <span>Send Magic Link</span>
              )}
            </button>

            {magicLinkSent && (
              <div className="success-message" style={{ marginTop: '12px' }}>
                Check your email for the sign-in link.
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          <div className="login-footer">
            <p className="terms-text">
              By continuing, you agree to our{' '}
              <a href="/terms" className="link">Terms</a> and{' '}
              <a href="/privacy" className="link">Privacy Policy</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
