import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import './login.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, isAuthenticated } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Google sign-in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no error needed
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.');
      } else {
        setError('Sign in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Header */}
      <header className="login-header">
        <NavLink to="/" className="back-button">
          <ArrowLeft size={24} />
        </NavLink>
      </header>

      {/* Main Content */}
      <main className="login-main">
        <div className="login-content">
          {/* Welcome Text */}
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome</h1>
            <p className="welcome-subtitle">Sign in to continue</p>
          </div>

          {/* Google Sign In Button */}
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

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          {/* Terms */}
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