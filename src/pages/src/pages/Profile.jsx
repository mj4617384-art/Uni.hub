import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [savedName, setSavedName] = useState('');
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUserId(user.id);

    const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
    if (profile) {
      setDisplayName(profile.display_name || '');
      setSavedName(profile.display_name || '');
    }

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setMyPosts(posts || []);
    setLoading(false);
  }

  async function saveName() {
    if (!displayName.trim()) return;
    await supabase.from('profiles').update({ display_name: displayName }).eq('id', userId);
    setSavedName(displayName);
    setEditing(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button onClick={() => navigate('/home')}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">My Profile</h1>
      </div>

      <div className="px-4 py-6 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold mb-3">
          {savedName.charAt(0).toUpperCase() || 'U'}
        </div>

        {editing ? (
          <div className="flex gap-2 w-full max-w-xs">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-sm outline-none"
            />
            <button onClick={saveName} className="text-blue-500 text-sm font-semibold px-2">
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold">{savedName || 'Student'}</p>
            <button onClick={() => setEditing(true)} className="text-xs text-blue-500">
              Edit
            </button>
          </div>
        )}

        <button onClick={handleLogout} className="mt-4 px-4 py-1.5 rounded-full bg-gray-800 text-sm">
          Log Out
        </button>
      </div>

      <div className="px-3 py-2">
        <h2 className="text-sm font-semibold text-gray-400 px-1 mb-2">My Posts</h2>
        {loading && <p className="text-center text-gray-500 py-6">Loading...</p>}
        {!loading && myPosts.length === 0 && (
          <p className="text-center text-gray-500 py-6">You haven't posted anything yet.</p>
        )}
        <div className="space-y-3">
          {myPosts.map((post) => (
            <div key={post.id} className="bg-gray-800 rounded-xl overflow-hidden">
              {post.content && <p className="px-4 py-3 text-sm">{post.content}</p>}
              {post.image_url && post.media_type === 'video' ? (
                <video src={post.image_url} controls className="w-full" />
              ) : post.image_url ? (
                <img src={post.image_url} alt="post" className="w-full object-cover" />
              ) : null}
              <p className="px-4 py-2 text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
