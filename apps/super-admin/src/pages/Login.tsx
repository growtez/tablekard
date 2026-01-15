// Login Page for Super Admin
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

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
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, loading, navigate]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true); // Moved up as per instruction

        // Validate email
        if (!email.trim()) {
            setError('Please enter your email');
            setIsLoading(false);
            return;
        }

        // Validate password
        if (!password.trim()) {
            setError('Please enter your password');
            setIsLoading(false);
            return;
        }

        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect password');
            } else if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError(err.message || 'Failed to sign in. Please try again.');
            }
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
                    <div className="logo">🏢</div>
                    <h1>Super Admin</h1>
                    <p>Restaurant SaaS Management Portal</p>
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
                            placeholder="admin@growtez.com"
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
                    <Link to="/signup" style={{
                        display: 'inline-block',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        opacity: 0.7
                    }}>
                        Create Account
                    </Link>
                    <p>Super Admin Access Only</p>
                    <p className="security-note">🔒 Secured by Firebase</p>
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
