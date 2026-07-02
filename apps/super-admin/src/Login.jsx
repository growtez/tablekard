import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Sun, Moon } from 'lucide-react'
import './index.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      setIsDarkMode(true)
    }
  }, [])

  const toggleDarkMode = (event) => {
    const isDark = !isDarkMode;
    
    const updateTheme = () => {
      if (isDark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
        setIsDarkMode(true)
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
        setIsDarkMode(false)
      }
    };

    if (!document.startViewTransition) {
      updateTheme();
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    const transition = document.startViewTransition(updateTheme);

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 500,
          easing: 'ease-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  }

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
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#f5f5f5] dark:bg-[#050505] font-mono text-gray-800 dark:text-green-500 selection:bg-blue-500/20 dark:selection:bg-green-500/30 transition-colors duration-300">
      <div className="w-full max-w-[550px] bg-white dark:bg-[#0a0a0a] rounded-lg border border-gray-300 dark:border-green-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden transition-colors duration-300">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#e8e8e8] dark:bg-[#111] border-b border-gray-300 dark:border-green-500/20 transition-colors duration-300">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="text-gray-500 hover:text-gray-800 dark:text-green-700 dark:hover:text-green-400 transition-colors outline-none"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Terminal Body */}
        <div className="p-6 md:p-8">
          <div className="mb-8">
            <div className="text-2xl font-bold mb-2 flex items-center gap-3">
              <span className="text-gray-900 dark:text-green-400">TABLEKARD</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 text-sm flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border-l-2 border-red-500 p-3">
              <span className="text-red-600 dark:text-red-500 font-bold shrink-0">ERR!</span>
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </div>
          )}
          
          {message && (
            <div className="mb-6 text-sm flex items-start gap-3 bg-green-50 dark:bg-green-500/10 border-l-2 border-green-500 p-3">
              <span className="text-green-600 dark:text-green-500 font-bold shrink-0">OK!</span>
              <span className="text-green-700 dark:text-green-400">{message}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="group">
              <div className="flex items-center bg-[#f9f9f9] dark:bg-[#050505] border border-gray-200 dark:border-green-500/30 group-focus-within:border-gray-400 dark:group-focus-within:border-green-500 group-focus-within:bg-white dark:group-focus-within:bg-[#0a0a0a] p-3 rounded-sm transition-colors shadow-inner dark:shadow-none">
                <span className="text-gray-400 dark:text-green-700 mr-3 font-bold">{'>'}</span>
                <input
                  id="email"
                  type="email"
                  placeholder="<username>"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="flex-1 bg-transparent border-none outline-none ring-0 text-gray-900 dark:text-green-500 placeholder:text-gray-400 dark:placeholder:text-green-800 caret-gray-900 dark:caret-green-500 py-0"
                  spellCheck="false"
                />
              </div>
            </div>

            <div className="group">
              <div className="flex items-center bg-[#f9f9f9] dark:bg-[#050505] border border-gray-200 dark:border-green-500/30 group-focus-within:border-gray-400 dark:group-focus-within:border-green-500 group-focus-within:bg-white dark:group-focus-within:bg-[#0a0a0a] p-3 rounded-sm transition-colors shadow-inner dark:shadow-none">
                <span className="text-gray-400 dark:text-green-700 mr-3 font-bold">{'>'}</span>
                <input
                  id="password"
                  type="password"
                  placeholder="<password>"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="flex-1 bg-transparent border-none outline-none ring-0 text-gray-900 dark:text-green-500 placeholder:text-gray-400 dark:placeholder:text-green-800 caret-gray-900 dark:caret-green-500 py-0 tracking-widest"
                />
              </div>
            </div>

            <div className="mt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 bg-gray-50 dark:bg-transparent hover:bg-gray-100 dark:hover:bg-green-500/10 border border-gray-300 dark:border-green-500/50 text-gray-700 dark:text-green-500 transition-all flex justify-center items-center gap-3 group outline-none focus:border-gray-500 dark:focus:border-green-400 focus:bg-gray-100 dark:focus:bg-green-500/10 font-bold tracking-widest shadow-sm dark:shadow-none"
              >
                {loading ? (
                  <>
                    <span className="w-2 h-4 bg-gray-600 dark:bg-green-500 animate-pulse"></span>
                    <span>AUTHENTICATING_USER...</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-400 dark:text-green-700 group-hover:text-gray-600 dark:group-hover:text-green-500 transition-colors">./</span>
                    <span>EXECUTE_LOGIN</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
