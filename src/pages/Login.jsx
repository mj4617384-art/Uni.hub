import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    navigate('/home');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center px-6 py-10 relative overflow-hidden">
      {/* Ambient gradient glow */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-72 h-72 bg-fuchsia-600/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />

      <div className="relative max-w-sm mx-auto w-full">
        <div className="flex flex-col items-center mb-1">
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-orange-400 flex items-center justify-center mb-3">
    <span className="text-lg font-extrabold text-white">U</span>
  </div>
  <h1 className="text-3xl font-extrabold bg-gradient-to-r from-fuchsia-400 via-violet-400 to-orange-300 bg-clip-text text-transparent">
    Uni.hub
  </h1>
</div>
        <p className="text-zinc-400 text-center text-sm mb-8">
          Your campus. Your community. Everything in one place.
        </p>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur">
          <h2 className="text-xl font-bold mb-1">Welcome back 👋</h2>
          <p className="text-zinc-500 text-sm mb-6">Sign in to continue to your campus.</p>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-2 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 font-medium">University Email</label>
              <div className="relative mt-1">
                <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-fuchsia-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">Password</label>
              <div className="relative mt-1">
                <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-fuchsia-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-fuchsia-500 to-orange-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg mt-2"
            >
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <p className="text-center text-sm text-zinc-500">
            Don't have an account?{' '}
            <a href="/signup" className="text-fuchsia-400 font-semibold">Create account</a>
          </p>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-zinc-400 mb-1">🏫 Connect with your campus</p>
          <p className="text-xs text-zinc-600">Discover students · Events · Marketplace · Errands</p>
        </div>
      </div>
    </div>
  );
}
