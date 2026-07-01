import { useState } from 'react'
import { supabase } from './supabaseClient'
import './index.css'
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setMessage('Welcome back! Redirecting...')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err.message || 'Access denied. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-bg perspective-1000">
      <div className="w-full max-w-[440px] p-8 md:p-12 rounded-2xl bg-glass-bg backdrop-blur-xl border border-glass-border shadow-[0_25px_50px_-12px_rgba(0,0,0,1),0_0_0_1px_rgba(255,255,255,0.05)] animate-[cardEntrance_0.8s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="text-center mb-10">
          <h1 className="text-4xl text-text-main mb-2 font-bold font-poppins">TableKard</h1>
          <p className="text-text-muted text-base font-medium">Management Portal</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 animate-[shake_0.4s_cubic-bezier(0.36,0.07,0.19,0.97)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}
        
        {message && (
          <div className="p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col">
          <div className="mb-6 group">
            <label htmlFor="email" className="block text-xs tracking-widest text-text-muted mb-2 uppercase transition-colors group-focus-within:text-accent-primary">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. admin@tablekard.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              className="w-full bg-surface/50 backdrop-blur-sm h-14 rounded-xl px-5 text-base text-text-main border border-border focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/20 outline-none transition-all"
            />
          </div>

          <div className="mb-6 group">
            <label htmlFor="password" className="block text-xs tracking-widest text-text-muted mb-2 uppercase transition-colors group-focus-within:text-accent-primary">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              className="w-full bg-surface/50 backdrop-blur-sm h-14 rounded-xl px-5 text-base text-text-main border border-border focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/20 outline-none transition-all"
            />
          </div>

          <button type="submit" disabled={loading} className="group relative overflow-hidden w-full h-14 mt-8 text-lg tracking-wide bg-accent-primary text-black font-bold rounded-xl shadow-[0_4px_20px_rgba(5,150,105,0.15)] hover:shadow-[0_6px_25px_rgba(5,150,105,0.25)] transition-all flex items-center justify-center border-none cursor-pointer">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-500" />
            {loading ? (
              <span className="flex items-center gap-2 relative z-10">
                <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
                Authenticating...
              </span>
            ) : <span className="relative z-10">Sign In to Dashboard</span>}
          </button>
        </form>

        <div className="text-center mt-10 pt-8 border-t border-border text-sm text-text-muted font-medium">
          <p>© {new Date().getFullYear()} TableKard. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  )
}
