import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate("/home");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0B1D3A] to-[#13294B] px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#F6F5F1] text-center mb-1">
          Create your account
        </h1>
        <p className="text-sm text-[#F6F5F1]/60 text-center mb-8">
          Join your campus community
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm text-[#F6F5F1]/80 mb-1">
              University Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-[#F6F5F1]/10 border border-[#F6F5F1]/20 px-4 py-3 text-[#F6F5F1] placeholder-[#F6F5F1]/40 focus:outline-none focus:border-[#F6F5F1]/50"
              placeholder="you@university.edu"
            />
          </div>

          <div>
            <label className="block text-sm text-[#F6F5F1]/80 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-[#F6F5F1]/10 border border-[#F6F5F1]/20 px-4 py-3 text-[#F6F5F1] placeholder-[#F6F5F1]/40 focus:outline-none focus:border-[#F6F5F1]/50"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#F6F5F1] text-[#0B1D3A] font-semibold py-3 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-[#F6F5F1]/60 text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#F6F5F1] underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
