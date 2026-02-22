// Login Page for Restaurant Admin
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './login.css';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { signIn, resetPassword, isAuthenticated, loading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');

    // Redirect if already logged in
    // useEffect(() => {
    //     if (!loading && isAuthenticated) {
    //         navigate('/dashboard');
    //     }
    // }, [isAuthenticated, loading, navigate]);

    // Bypass login and go straight to dashboard
    useEffect(() => {
        navigate('/dashboard');
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }

        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setIsLoading(true);

        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            const message = typeof err?.message === 'string' ? err.message : 'Failed to sign in. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetEmail.trim()) {
            setResetMessage('Please enter your email');
            return;
        }

        try {
            await resetPassword(resetEmail);
            setResetMessage('Password reset email sent! Check your inbox.');
        } catch (err: any) {
            setResetMessage(err.message || 'Failed to send reset email');
        }
    };

    if (loading) {
        return (
            <div className="login-loading">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="logo">🍕</div>
                    <h1>Restaurant Admin</h1>
                    <p>Sign in to manage your restaurant</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@restaurant.com"
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`login-button ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="spinner-small"></span>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <button
                        type="button"
                        className="forgot-password-link"
                        onClick={() => {
                            setShowResetModal(true);
                            setResetEmail(email);
                        }}
                    >
                        Forgot Password?
                    </button>
                </form>

                <div className="login-footer">
                    <p>For restaurant administrators only</p>
                    <p className="security-note">🔒 Secured by Supabase</p>
                </div>
            </div>

            {/* Password Reset Modal */}
            {showResetModal && (
                <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Reset Password</h3>
                        <p>Enter your email to receive a password reset link</p>

                        <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="your@email.com"
                        />

                        {resetMessage && (
                            <p className={resetMessage.includes('sent') ? 'success-message' : 'error-message'}>
                                {resetMessage}
                            </p>
                        )}

                        <div className="modal-buttons">
                            <button onClick={handleResetPassword}>Send Reset Email</button>
                            <button onClick={() => setShowResetModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
