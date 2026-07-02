// Login Page for Restaurant Admin
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


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
            <div className="min-h-screen flex flex-col items-center justify-center bg-tk-bg text-tk-text gap-4 font-['Outfit']">
                <div className="w-6 h-6 border-[3px] border-[rgba(139,58,30,0.2)] border-t-tk-burgundy rounded-full animate-[spin_0.8s_linear_infinite]"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-tk-bg p-5 relative overflow-hidden font-['Outfit'] before:absolute before:top-[-10%] before:right-[-5%] before:w-[40%] before:h-[40%] before:bg-[radial-gradient(circle,#8B3A1E_0%,transparent_70%)] before:opacity-[0.06] before:blur-[80px] before:pointer-events-none after:absolute after:bottom-[-10%] after:left-[-5%] after:w-[40%] after:h-[40%] after:bg-[radial-gradient(circle,#8B3A1E_0%,transparent_70%)] after:opacity-[0.06] after:blur-[80px] after:pointer-events-none">
            <div className="bg-tk-bg-card rounded-[32px] p-12 w-full max-w-[440px] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border-[1.5px] border-tk-border relative z-10 animate-[loginFadeIn_0.5s_ease-out] max-sm:p-8 max-sm:rounded-[24px]">
                <div className="text-center mb-9">
                    <div className="font-['Syncopate'] font-bold text-2xl tracking-[6px] uppercase text-tk-burgundy mb-3.5 max-sm:text-xl max-sm:tracking-[4px]">TABLEKARD</div>
                    <h1 className="text-tk-text text-[22px] font-semibold m-0 mb-2 tracking-[-0.01em] max-sm:text-xl">Admin Console</h1>
                    <p className="text-tk-text-secondary text-sm m-0 font-normal">Sign in to manage your restaurant</p>
                </div>

                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                    {error && <div className="bg-[rgba(225,75,75,0.08)] border border-[rgba(225,75,75,0.3)] text-[#E14B4B] px-4 py-3 rounded-xl text-[13px] text-center font-medium">{error}</div>}

                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-[#3A3A3A] text-[13px] font-semibold uppercase tracking-[0.04em]">Email Address</label>
                        <input className="bg-tk-bg border-[1.5px] border-tk-border rounded-xl px-4 py-3.5 text-tk-text text-[15px] transition-all duration-300 focus:outline-none focus:border-tk-burgundy focus:shadow-[0_0_0_4px_rgba(139,58,30,0.12)] placeholder:text-tk-text-muted"
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@restaurant.com"
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="text-[#3A3A3A] text-[13px] font-semibold uppercase tracking-[0.04em]">Password</label>
                        <div className="relative flex items-center">
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
                                className="absolute right-3 bg-transparent border-none cursor-pointer p-1 text-lg opacity-50 transition-opacity duration-300 hover:opacity-100"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`bg-tk-burgundy text-white border-none rounded-xl p-4 text-[15px] font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 tracking-[0.02em] uppercase hover:not(:disabled):bg-tk-burgundy-dark hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_8px_20px_rgba(139,58,30,0.25)] active:not(:disabled):translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed ${isLoading ? 'bg-[rgba(139,58,30,0.6)]' : ''}` }
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-[2px] border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-[spin_0.8s_linear_infinite]"></span>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <button
                        type="button"
                        className="bg-transparent border-none text-tk-burgundy text-[13px] cursor-pointer no-underline mt-2 transition-all duration-300 opacity-80 font-semibold hover:opacity-100 hover:underline font-['Outfit']"
                        onClick={() => {
                            setShowResetModal(true);
                            setResetEmail(email);
                        }}
                    >
                        Forgot Password?
                    </button>
                </form>

                
            </div>

            {/* Password Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-5 animate-[modalFadeIn_0.2s_ease]" onClick={() => setShowResetModal(false)}>
                    <div className="bg-tk-bg rounded-[24px] p-8 w-full max-w-[400px] border-[1.5px] border-tk-border shadow-[0_24px_48px_rgba(0,0,0,0.12)] animate-[modalSlideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-tk-text m-0 mb-2 text-[20px] font-semibold">Reset Password</h3>
                        <p className="text-tk-text-secondary text-[13px] m-0 mb-5">Enter your email to receive a password reset link</p>

                        <input className="bg-tk-bg border-[1.5px] border-tk-border rounded-xl px-4 py-3.5 text-tk-text text-[15px] transition-all duration-300 focus:outline-none focus:border-tk-burgundy focus:shadow-[0_0_0_4px_rgba(139,58,30,0.12)] placeholder:text-tk-text-muted"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="your@email.com"
                        />

                        {resetMessage && (
                            <p className={resetMessage.includes('sent') ? 'bg-[rgba(76,175,80,0.08)] border border-[rgba(76,175,80,0.3)] text-[#4CAF50] px-4 py-3 rounded-xl text-[13px] text-center font-medium' : 'bg-[rgba(225,75,75,0.08)] border border-[rgba(225,75,75,0.3)] text-[#E14B4B] px-4 py-3 rounded-xl text-[13px] text-center font-medium'}>
                                {resetMessage}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button className="flex-1 p-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-tk-burgundy text-white border-none hover:bg-tk-burgundy-dark hover:shadow-[0_4px_12px_rgba(139,58,30,0.25)] hover:-translate-y-[1px] font-['Outfit']" onClick={handleResetPassword}>Send Reset Email</button>
                            <button className="flex-1 p-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-transparent text-tk-text-secondary border-[1.5px] border-tk-border hover:bg-tk-bg-hover hover:border-tk-burgundy hover:text-tk-burgundy font-['Outfit']" onClick={() => setShowResetModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
