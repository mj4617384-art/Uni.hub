import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const sections = [
  { name: "Errands", emoji: "🏃", color: "bg-amber-500/15 text-amber-200" },
  { name: "Marketplace", emoji: "🛍️", color: "bg-emerald-500/15 text-emerald-200" },
  { name: "Wallet", emoji: "💳", color: "bg-sky-500/15 text-sky-200" },
  { name: "Profile", emoji: "👤", color: "bg-purple-500/15 text-purple-200" },
];

const placeholderPosts = [
  {
    id: 1,
    author: "Campus Events",
    time: "2h ago",
    content: "Reminder: Career fair this Friday at the main hall, 10am–4pm. Bring your resume!",
  },
  {
    id: 2,
    author: "Amaka O.",
    time: "4h ago",
    content: "Selling a barely-used mini fridge, moving out this weekend. Check the marketplace 🛍️",
  },
  {
    id: 3,
    author: "Uni.hub",
    time: "1d ago",
    content: "Welcome to Uni.hub! This is where your campus comes together — errands, marketplace, and more.",
  },
];

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
    <div className="min-h-screen bg-gradient-to-b from-[#0B1D3A] to-[#13294B]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F6F5F1]/10">
        <div>
          <h1 className="text-lg font-bold text-[#F6F5F1]">Uni.hub</h1>
          <p className="text-xs text-[#F6F5F1]/50">{email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs rounded-lg bg-[#F6F5F1]/10 border border-[#F6F5F1]/20 text-[#F6F5F1] px-3 py-2"
        >
          Log Out
        </button>
      </div>

      {/* Section shortcuts */}
      <div className="grid grid-cols-4 gap-3 px-5 py-5">
        {sections.map((s) => (
          <button
            key={s.name}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${s.color}`}>
              {s.emoji}
            </div>
            <span className="text-[11px] text-[#F6F5F1]/70">{s.name}</span>
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="px-5 pb-10 space-y-3">
        <h2 className="text-sm font-semibold text-[#F6F5F1]/60 uppercase tracking-wide mb-1">
          Campus Feed
        </h2>
        {placeholderPosts.map((post) => (
          <div
            key={post.id}
            className="rounded-xl bg-[#F6F5F1]/5 border border-[#F6F5F1]/10 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#F6F5F1]">{post.author}</span>
              <span className="text-xs text-[#F6F5F1]/40">{post.time}</span>
            </div>
            <p className="text-sm text-[#F6F5F1]/80 leading-relaxed">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
