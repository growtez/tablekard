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

  // Use the env-var redirect URL so Google OAuth always bounces back to
  // app.tablekard.com — the canonical whitelisted address in Google & Supabase.
  const oauthRedirectUrl = import.meta.env.VITE_SUPABASE_REDIRECT_URL || window.location.origin;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle(oauthRedirectUrl);
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
      await sendMagicLink(email, oauthRedirectUrl);
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
        <NavLink to="/" className="back-button" title="Go back">
          <ArrowLeft size={24} />
        </NavLink>
      </header>

      <main className="login-main">
        <div className="login-content-card">
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome</h1>
            <p className="welcome-subtitle">Sign in to discover premium dining experiences</p>
          </div>

          <button
            type="button"
            className={`signin-button ${isLoading ? 'loading' : ''}`}
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
                  className="social-icon"
                />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          <div className="email-signin-section">
            <div className="email-input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
                autoComplete="email"
              />
            </div>

            <button
              type="button"
              className={`signin-button primary ${isLoading ? 'loading' : ''}`}
              onClick={handleMagicLink}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <span>Email Magic Link</span>
              )}
            </button>

            {magicLinkSent && (
              <div className="success-message">
                ✨ Magic link sent! Please check your inbox.
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="login-footer">
            <p className="terms-text">
              By joining, you agree to our{' '}
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

