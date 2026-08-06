import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const sections = [
  { name: "Errands", emoji: "🏃" },
  { name: "Marketplace", emoji: "🛍️" },
  { name: "Wallet", emoji: "💳" },
  { name: "Profile", emoji: "👤" },
];

const placeholderPosts = [
  {
    id: 1,
    author: "Campus Events",
    time: "2h ago",
    content: "Reminder: Career fair this Friday at the main hall, 10am–4pm. Bring your resume!",
    likes: 24,
    comments: 5,
  },
  {
    id: 2,
    author: "Amaka O.",
    time: "4h ago",
    content: "Selling a barely-used mini fridge, moving out this weekend. Check the marketplace 🛍️",
    likes: 12,
    comments: 3,
  },
  {
    id: 3,
    author: "Uni.hub",
    time: "1d ago",
    content: "Welcome to Uni.hub! This is where your campus comes together — errands, marketplace, and more.",
    likes: 41,
    comments: 8,
  },
];

function initials(email) {
  return email ? email.charAt(0).toUpperCase() : "U";
}

export default function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [dark, setDark] = useState(false);

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

  const bg = dark ? "bg-[#18191A]" : "bg-[#F0F2F5]";
  const headerBg = dark ? "bg-[#242526]" : "bg-white";
  const cardBg = dark ? "bg-[#242526]" : "bg-white";
  const textMain = dark ? "text-[#E4E6EB]" : "text-[#050505]";
  const textSub = dark ? "text-[#B0B3B8]" : "text-[#65676B]";
  const border = dark ? "border-[#3E4042]" : "border-[#E4E6EB]";
  const composerBg = dark ? "bg-[#3A3B3C]" : "bg-[#F0F2F5]";
  const iconBg = dark ? "bg-[#3A3B3C]" : "bg-[#F0F2F5]";

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 ${headerBg} border-b ${border} shadow-sm`}>
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: dark ? "#E4E6EB" : "#0B1D3A" }}>
          Uni.hub
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark(!dark)}
            className={`text-xs rounded-full px-3 py-2 border ${border} ${textMain}`}
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <button
            onClick={handleLogout}
            className={`text-xs rounded-full px-3 py-2 border ${border} ${textMain}`}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Section shortcuts */}
      <div className={`${cardBg} border-b ${border} px-4 py-4`}>
        <div className="grid grid-cols-4 gap-2">
          {sections.map((s) => (
            <button key={s.name} className="flex flex-col items-center gap-1.5">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl ${iconBg}`}>
                {s.emoji}
              </div>
              <span className={`text-[11px] ${textSub}`}>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-lg mx-auto px-3 py-4 space-y-3">
        {/* Composer */}
        <div className={`${cardBg} border ${border} rounded-lg p-3 flex items-center gap-3 shadow-sm`}>
          <div className="h-9 w-9 rounded-full bg-[#0B1D3A] text-[#F6F5F1] flex items-center justify-center text-sm font-bold shrink-0">
            {initials(email)}
          </div>
          <div className={`flex-1 rounded-full px-4 py-2 text-sm ${textSub} ${composerBg}`}>
            What's happening on campus?
          </div>
        </div>

        {/* Posts */}
        {placeholderPosts.map((post) => (
          <div key={post.id} className={`${cardBg} border ${border} rounded-lg shadow-sm overflow-hidden`}>
            <div className="flex items-center gap-3 px-4 pt-3 pb-2">
              <div className="h-10 w-10 rounded-full bg-[#0B1D3A] text-[#F6F5F1] flex items-center justify-center text-sm font-bold shrink-0">
                {post.author.charAt(0)}
              </div>
              <div>
                <p className={`text-sm font-semibold ${textMain}`}>{post.author}</p>
                <p className={`text-xs ${textSub}`}>{post.time}</p>
              </div>
            </div>
            <p className={`px-4 pb-3 text-sm leading-relaxed ${textMain}`}>{post.content}</p>
            <div className={`flex items-center justify-between px-4 py-2 text-xs ${textSub} border-t ${border}`}>
              <span>👍 {post.likes} likes</span>
              <span>{post.comments} comments</span>
            </div>
            <div className={`flex border-t ${border}`}>
              <button className={`flex-1 py-2 text-sm font-semibold ${textSub}`}>👍 Like</button>
              <button className={`flex-1 py-2 text-sm font-semibold ${textSub} border-l ${border}`}>💬 Comment</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
