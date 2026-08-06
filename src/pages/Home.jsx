import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const sections = [
  { name: "Errands", emoji: "🏃" },
  { name: "Marketplace", emoji: "🛍️" },
  { name: "Wallet", emoji: "💳" },
  { name: "Profile", emoji: "👤" },
];

function initials(email) {
  return email ? email.charAt(0).toUpperCase() : "U";
}

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [dark, setDark] = useState(false);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        navigate("/login");
      } else {
        setEmail(data.user.email);
      }
    });
    fetchPosts();
  }, [navigate]);

  async function fetchPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts(data || []);
  }

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  async function handlePost() {
    if (!newPost.trim() && !imageFile) return;
    setPosting(true);

    const { data: userData } = await supabase.auth.getUser();
    let image_url = null;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${userData.user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, imageFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("posts").insert({
      user_id: userData.user.id,
      content: newPost.trim(),
      image_url,
    });

    setPosting(false);

    if (!error) {
      setNewPost("");
      clearImage();
      setShowComposer(false);
      fetchPosts();
    }
  }

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
          <button onClick={() => setDark(!dark)} className={`text-xs rounded-full px-3 py-2 border ${border} ${textMain}`}>
            {dark ? "☀️" : "🌙"}
          </button>
          <button onClick={handleLogout} className={`text-xs rounded-full px-3 py-2 border ${border} ${textMain}`}>
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
        <div className={`${cardBg} border ${border} rounded-lg p-3 shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#0B1D3A] text-[#F6F5F1] flex items-center justify-center text-sm font-bold shrink-0">
              {initials(email)}
            </div>
            {!showComposer ? (
              <button
                onClick={() => setShowComposer(true)}
                className={`flex-1 text-left rounded-full px-4 py-2 text-sm ${textSub} ${composerBg}`}
              >
                What's happening on campus?
              </button>
            ) : (
              <textarea
                autoFocus
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's happening on campus?"
                className={`flex-1 rounded-lg px-3 py-2 text-sm ${textMain} ${composerBg} outline-none resize-none`}
                rows={3}
              />
            )}
          </div>

          {showComposer && (
            <>
              {imagePreview && (
                <div className="relative mt-2">
                  <img src={imagePreview} alt="Preview" className="w-full rounded-lg max-h-64 object-cover" />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <label className={`text-xs px-3 py-2 rounded-lg cursor-pointer ${textSub} ${composerBg}`}>
                  📷 Photo
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowComposer(false); setNewPost(""); clearImage(); }}
                    className={`text-xs px-3 py-2 rounded-lg ${textSub}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={posting || (!newPost.trim() && !imageFile)}
                    className="text-xs px-4 py-2 rounded-lg bg-[#0B1D3A] text-[#F6F5F1] font-semibold disabled:opacity-50"
                  >
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Posts */}
        {posts.length === 0 && (
          <p className={`text-center text-sm ${textSub} py-8`}>
            No posts yet — be the first to share something!
          </p>
        )}
        {posts.map((post) => (
          <div key={post.id} className={`${cardBg} border ${border} rounded-lg shadow-sm overflow-hidden`}>
            <div className="flex items-center gap-3 px-4 pt-3 pb-2">
              <div className="h-10 w-10 rounded-full bg-[#0B1D3A] text-[#F6F5F1] flex items-center justify-center text-sm font-bold shrink-0">
                U
              </div>
              <div>
                <p className={`text-sm font-semibold ${textMain}`}>Student</p>
                <p className={`text-xs ${textSub}`}>{timeAgo(post.created_at)}</p>
              </div>
            </div>
            {post.content && (
              <p className={`px-4 pb-3 text-sm leading-relaxed ${textMain}`}>{post.content}</p>
            )}
            {post.image_url && (
              <img src={post.image_url} alt="Post" className="w-full max-h-96 object-cover" />
            )}
            <div className={`flex border-t ${border} mt-2`}>
              <button className={`flex-1 py-2 text-sm font-semibold ${textSub}`}>👍 Like</button>
              <button className={`flex-1 py-2 text-sm font-semibold ${textSub} border-l ${border}`}>💬 Comment</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
