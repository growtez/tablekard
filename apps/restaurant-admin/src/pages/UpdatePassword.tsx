// Update Password Page for Restaurant Admin
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '@restaurant-saas/supabase';
import { Eye, EyeOff } from 'lucide-react';

const UpdatePasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { updatePassword, loading } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSessionValid, setIsSessionValid] = useState(false);

    useEffect(() => {
        // Verify if we have a valid session to update password
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setIsSessionValid(true);
            } else {
                setError('Invalid or expired password reset link.');
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await updatePassword(password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);
        } catch (err: any) {
            console.error('Update password error:', err);
            setError(err.message || 'Failed to update password. Please try again.');
        } finally {
            setIsLoading(false);
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
            {/* Dark Mode Toggle */}
            <button
                className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center rounded-full bg-tk-bg-elevated border-[1.5px] border-tk-border text-tk-text-secondary cursor-pointer transition-all duration-300 hover:bg-tk-bg-hover hover:text-tk-burgundy hover:border-tk-burgundy/30 shadow-sm z-50 hover:scale-105"
                onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    toggleTheme({
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                    });
                }}
                aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {isDark ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                )}
            </button>

            <div className="bg-tk-bg-card rounded-[32px] p-12 w-full max-w-[440px] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border-[1.5px] border-tk-border relative z-10 animate-[loginFadeIn_0.5s_ease-out] max-sm:p-8 max-sm:rounded-[24px]">
                <div className="text-center mb-9">
                    <div className="font-['Syncopate'] font-bold text-2xl tracking-[6px] uppercase text-tk-burgundy mb-3.5 max-sm:text-xl max-sm:tracking-[4px]">TABLEKARD</div>
                    <h1 className="text-tk-text text-[22px] font-semibold m-0 mb-2 tracking-[-0.01em] max-sm:text-xl">Update Password</h1>
                    <p className="text-tk-text-secondary text-sm m-0 font-normal">Enter a new secure password</p>
                </div>

                {!isSessionValid ? (
                    <div className="flex flex-col items-center gap-5">
                        <div className="bg-[rgba(225,75,75,0.08)] border border-[rgba(225,75,75,0.3)] text-[#E14B4B] px-4 py-3 rounded-xl text-[13px] text-center font-medium w-full">
                            {error || 'Validating session...'}
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-transparent border-[1.5px] border-tk-border text-tk-text-secondary rounded-xl p-4 w-full text-[15px] font-semibold cursor-pointer transition-all duration-300 hover:bg-tk-bg-hover hover:text-tk-burgundy hover:border-tk-burgundy"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : success ? (
                    <div className="flex flex-col items-center gap-5 text-center">
                        <div className="w-16 h-16 rounded-full bg-[rgba(76,175,80,0.1)] flex items-center justify-center mb-2">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h3 className="text-tk-text text-[18px] font-semibold m-0">Password Updated!</h3>
                        <p className="text-tk-text-secondary text-[14px] m-0 mb-4">You will be redirected to the dashboard in a moment.</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-tk-burgundy text-white border-none rounded-xl p-4 w-full text-[15px] font-bold cursor-pointer transition-all duration-300 tracking-[0.02em] uppercase hover:bg-tk-burgundy-dark"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                ) : (
                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        {error && <div className="bg-[rgba(225,75,75,0.08)] border border-[rgba(225,75,75,0.3)] text-[#E14B4B] px-4 py-3 rounded-xl text-[13px] text-center font-medium">{error}</div>}

                        <div className="flex flex-col gap-2">
                            <label htmlFor="password" className="text-tk-text-secondary text-[13px] font-semibold uppercase tracking-[0.04em]">New Password</label>
                            <div className="relative flex items-center">
                                <input
                                    className="w-full bg-tk-bg border-[1.5px] border-tk-border rounded-xl px-4 py-3.5 pr-12 text-tk-text text-[15px] transition-all duration-300 focus:outline-none focus:border-tk-burgundy focus:shadow-[0_0_0_4px_rgba(139,58,30,0.12)] placeholder:text-tk-text-muted disabled:opacity-60"
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your new password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 bg-transparent border-none cursor-pointer p-1 opacity-60 transition-all duration-300 hover:opacity-100 flex items-center justify-center text-tk-text-secondary hover:text-tk-text"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="confirmPassword" className="text-tk-text-secondary text-[13px] font-semibold uppercase tracking-[0.04em]">Confirm Password</label>
                            <div className="relative flex items-center">
                                <input
                                    className="w-full bg-tk-bg border-[1.5px] border-tk-border rounded-xl px-4 py-3.5 pr-12 text-tk-text text-[15px] transition-all duration-300 focus:outline-none focus:border-tk-burgundy focus:shadow-[0_0_0_4px_rgba(139,58,30,0.12)] placeholder:text-tk-text-muted disabled:opacity-60"
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your new password"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`bg-tk-burgundy text-white border-none rounded-xl p-4 text-[15px] font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 tracking-[0.02em] uppercase mt-2 hover:not(:disabled):bg-tk-burgundy-dark hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_8px_20px_rgba(139,58,30,0.25)] active:not(:disabled):translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed ${isLoading ? 'bg-[rgba(139,58,30,0.6)]' : ''}` }
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-[2px] border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-[spin_0.8s_linear_infinite]"></span>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UpdatePasswordPage;
