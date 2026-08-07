import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Home as HomeIcon,
  MessageCircle,
  PlaySquare,
  Bell,
  Menu,
  Search,
  Plus,
  Camera,
  ThumbsUp,
  Share2,
  Heart,
} from 'lucide-react';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error.message);
    } else {
      setPosts(data);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  async function handlePost() {
    if (!newPostText.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('posts').insert([
      {
        user_id: user.id,
        content: newPostText,
      },
    ]);

    if (error) {
      console.error('Error posting:', error.message);
    } else {
      setNewPostText('');
      fetchPosts();
    }
  }

  return (
    <div className={darkMode ? 'min-h-screen bg-gray-900 text-white' : 'min-h-screen bg-white text-gray-900'}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-500">Uni.hub</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center"
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-full bg-gray-800 text-sm"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Icon nav row */}
      <div className="flex justify-around items-center py-2 border-b border-gray-800">
        <button className="p-2">
          <HomeIcon size={24} className="text-blue-500" />
        </button>
        <button className="p-2">
          <MessageCircle size={24} className="text-gray-400" />
        </button>
        <button className="p-2">
          <PlaySquare size={24} className="text-gray-400" />
        </button>
        <button className="p-2 relative">
          <Bell size={24} className="text-gray-400" />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>
        <button className="p-2">
          <Menu size={24} className="text-gray-400" />
        </button>
      </div>

      {/* Composer bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0" />
        <input
          type="text"
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          placeholder="What's happening on campus?"
          className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-300 placeholder-gray-500 outline-none"
        />
        <button
          onClick={handlePost}
          className="text-green-500 text-sm font-semibold flex items-center gap-1 flex-shrink-0"
        >
          <Camera size={16} /> Photo
        </button>
      </div>

      {/* Section shortcuts strip */}
      <div className="flex gap-2 overflow-x-auto px-3 py-3">
        {[
          { label: 'Errands', color: 'bg-orange-600' },
          { label: 'Marketplace', color: 'bg-purple-600' },
          { label: 'Wallet', color: 'bg-green-600' },
          { label: 'Profile', color: 'bg-blue-600' },
        ].map((item) => (
          <div
            key={item.label}
            className={`min-w-[100px] h-[130px] rounded-xl ${item.color} flex items-end p-3 flex-shrink-0`}
          >
            <span className="text-white text-xs font-bold">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="px-3 py-2 space-y-3">
        {loading && <p className="text-center text-gray-500 py-6">Loading feed...</p>}

        {!loading && posts.length === 0 && (
          <p className="text-center text-gray-500 py-6">No posts yet. Be the first to share!</p>
        )}

        {posts.map((post) => (
          <div key={post.id} className="bg-gray-800 rounded-xl overflow-hidden">
            {/* Post header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                U
              </div>
              <div>
                <p className="font-semibold text-sm">Student</p>
                <p className="text-xs text-gray-500">
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Post content */}
            {post.content && (
              <p className="px-4 pb-3 text-sm">{post.content}</p>
            )}
            {post.image_url && (
              <img src={post.image_url} alt="post" className="w-full object-cover" />
            )}

            {/* Reaction summary row */}
            <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-400 border-t border-gray-700 mt-1">
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border border-gray-900">
                    <ThumbsUp size={10} className="text-white" />
                  </span>
                  <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-gray-900">
                    <Heart size={10} className="text-white" />
                  </span>
                </div>
                <span className="ml-1">{post.like_count || 0}</span>
              </div>
              <span>{post.comment_count || 0} comments</span>
            </div>

            {/* Action row */}
            <div className="flex border-t border-gray-700">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 text-sm font-medium active:bg-gray-700 transition-colors">
                <ThumbsUp size={18} />
                Like
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 text-sm font-medium active:bg-gray-700 transition-colors">
                <MessageCircle size={18} />
                Comment
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 text-sm font-medium active:bg-gray-700 transition-colors">
                <Share2 size={18} />
                Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
