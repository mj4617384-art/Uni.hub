import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export default function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        navigate("/login");
      } else {
        setEmail(data.user.email);
      }
    });
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1D3A] to-[#13294B] px-6 py-10">
      <div className="max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold text-[#F6F5F1] mb-2">
          Welcome to Uni.hub
        </h1>
        <p className="text-sm text-[#F6F5F1]/70 mb-8">
          Logged in as {email}
        </p>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-[#F6F5F1]/10 border border-[#F6F5F1]/20 text-[#F6F5F1] px-6 py-3"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
