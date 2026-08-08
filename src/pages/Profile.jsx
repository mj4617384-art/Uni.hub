import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Camera, MessageCircle } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams();
  const [authUserId, setAuthUserId] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [savedName, setSavedName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    init();
  }, [routeUserId]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function init() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setAuthUserId(user.id);

    const viewingId = routeUserId || user.id;
    setIsOwnProfile(viewingId === user.id);

    const { data: profile } = await supabase.from('profiles').select('display_name, avatar_url').eq('id', viewingId).single();
    if (profile) {
      setDisplayName(profile.display_name || '');
      setSavedName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || null);
    }

    const { data: userPosts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', viewingId)
      .order('created_at', { ascending: false });

    setPosts(userPosts || []);
    setLoading(false);
  }

  async function saveName() {
    if (!displayName.trim()) return;
    await supabase.from('profiles').update({ display_name: displayName }).eq('id', authUserId);
    setSavedName(displayName);
    setEditing(false);
  }

  async function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file || !authUserId) return;

    setUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${authUserId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const newUrl = publicUrlData.publicUrl;

    await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', authUserId);
    setAvatarUrl(newUrl);
    setUploadingAvatar(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full z-50 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button onClick={() => navigate('/home')}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">{isOwnProfile ? 'My Profile' : 'Profile'}</h1>
      </div>

      <div className="px-4 py-6 flex flex-col items-center">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={savedName || 'user'} className="w-full h-full object-cover" />
            ) : (
              savedName.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          {isOwnProfile && (
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer border-2 border-gray-900">
              <Camera size={13} className="text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
            </label>
          )}
        </div>
        {uploadingAvatar && <p className="text-xs text-gray-500 mb-2">Uploading...</p>}

        {isOwnProfile && editing ? (
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
            {isOwnProfile && (
              <button onClick={() => setEditing(true)} className="text-xs text-blue-500">
                Edit
              </button>
            )}
          </div>
        )}

        {isOwnProfile ? (
          <button onClick={handleLogout} className="mt-4 px-4 py-1.5 rounded-full bg-gray-800 text-sm">
            Log Out
          </button>
        ) : (
          <button
            onClick={() => showToast('Messaging coming soon!')}
            className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-sm font-semibold"
          >
            <MessageCircle size={15} /> Message
          </button>
        )}
      </div>

      <div className="px-3 py-2">
        <h2 className="text-sm font-semibold text-gray-400 px-1 mb-2">{isOwnProfile ? 'My Posts' : 'Posts'}</h2>
        {loading && <p className="text-center text-gray-500 py-6">Loading...</p>}
        {!loading && posts.length === 0 && (
          <p className="text-center text-gray-500 py-6">
            {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
          </p>
        )}
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-800 rounded-xl overflow-hidden">
              {post.content && <p className="px-4 py-3 text-sm">{post.content}</p>}
              {post.image_url && post.media_type === 'video' ? (
                <video src={post.image_url} controls playsInline preload="metadata" className="w-full" />
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
