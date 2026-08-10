      import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Splash() {
  const navigate = useNavigate();
  const [showText, setShowText] = useState(false);
  const [glow, setGlow] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowText(true), 100);
    const t2 = setTimeout(() => setGlow(true), 500);
    const t3 = setTimeout(() => setShowLoader(true), 1200);

    async function decide() {
      const [{ data: { session } }] = await Promise.all([
        supabase.auth.getSession(),
        sleep(1800),
      ]);
      navigate(session ? '/home' : '/login', { replace: true });
    }
    decide();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0A0A0D] text-white flex flex-col items-center justify-center relative overflow-hidden">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes softGlow {
          0%, 100% { filter: drop-shadow(0 0 0px rgba(220,38,38,0.4)); }
          50% { filter: drop-shadow(0 0 18px rgba(220,38,38,0.55)); }
        }
      `}</style>

      <div className="pointer-events-none absolute -top-32 -left-24 w-72 h-72 bg-red-600/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-80 h-80 bg-red-700/10 rounded-full blur-3xl" />

      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: showText ? 1 : 0,
          animation: showText ? 'fadeInUp 0.5s ease-out forwards' : 'none',
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mb-4"
          style={{ animation: glow ? 'softGlow 1.6s ease-in-out infinite' : 'none' }}
        >
          <span className="text-2xl font-extrabold text-white">U</span>
        </div>

        <h1 className="text-3xl font-extrabold mb-2">
          <span className="text-white">Uni</span><span className="text-red-500">.hub</span>
        </h1>
        <p className="text-zinc-400 text-sm text-center max-w-[220px] leading-relaxed">
          Your campus. Your community. Everything in one place.
        </p>

        <div className="h-10 flex items-center justify-center mt-6">
          {showLoader && (
            <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-red-500 animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}  
