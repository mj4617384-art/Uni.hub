import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';

const TABS = ['For You', 'Following', 'Sports', 'News', 'Clubs'];

export default function Discover() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('For You');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myLikes, setMyLikes] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (activeTab === 'For You') {
      init();
    } else {
      setLoading(false);
    }
  }, [activeTab]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function init() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error fetching discover feed:', error.message);
      setLoading(false);
      return;
    }

    setPosts(data);

    const userIds = [...new Set(data.map((p) => p.user_id))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);
      if (profileData) {
        const map = {};
        profileData.forEach((p) => { map[p.id] = p; });
        setProfiles(map);
      }
    }

    const postIds = data.map((p) => p.id);
    if (postIds.length > 0) {
      const [likesResult, commentsResult] = await Promise.all([
        supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
      ]);

      const lCounts = {};
      const mine = {};
      (likesResult.data || []).forEach((l) => {
        lCounts[l.post_id] = (lCounts[l.post_id] || 0) + 1;
        if (l.user_id === user?.id) mine[l.post_id] = true;
      });
      setLikeCounts(lCounts);
      setMyLikes(mine);

      const cCounts = {};
      (commentsResult.data || []).forEach((c) => {
        cCounts[c.post_id] = (cCounts[c.post_id] || 0) + 1;
      });
      setCommentCounts(cCounts);
    }

    setLoading(false);
  }

  function nameFor(userId) {
    return profiles[userId]?.display_name || 'Student';
  }

  function avatarFor(userId) {
    return profiles[userId]?.avatar_url || null;
  }

  function toggleLike(postId) {
    if (!currentUserId) return;
    const isLiked = myLikes[postId];

    if (isLiked) {
      setMyLikes((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      setLikeCounts((prev) => ({ ...prev, [postId]: Math.max((prev[postId] || 1) - 1, 0) }));
      supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId).eq('reaction_type', 'like');
    } else {
      setMyLikes((prev) => ({ ...prev, [postId]: true }));
      setLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      supabase.from('likes').insert([{ post_id: postId, user_id: currentUserId, reaction_type: 'like' }]);
    }
  }

  async function handleShare(post) {
    const shareData = {
      title: 'Uni.hub',
      text: post.content || 'Check this out on Uni.hub',
      url: `${window.location.origin}/home#post-${post.id}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // cancelled
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      showToast('Link copied to clipboard');
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0D] text-white pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-sm px-4 py-2 rounded-full z-50 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-900">
        <button onClick={() => navigate('/home')}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Discover</h1>
      </div>

      <div className="flex gap-1 px-4 py-3 overflow-x-auto border-b border-zinc-900">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeTab === tab ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab !== 'For You' && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="text-zinc-400 text-sm mb-1">{activeTab} is coming soon</p>
          <p className="text-zinc-600 text-xs">We're building this out — check back soon!</p>
        </div>
      )}

      {activeTab === 'For You' && (
        <div className="px-3 py-3 space-y-3">
          {loading && <p className="text-center text-zinc-500 py-6">Loading...</p>}
          {!loading && posts.length === 0 && (
            <p className="text-center text-zinc-500 py-6">Nothing to discover yet.</p>
          )}

          {posts.map((post) => (
            <div key={post.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
              <button
                onClick={() => navigate(`/profile/${post.user_id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-red-600 p-[2px]">
                  <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center font-bold overflow-hidden">
                    {avatarFor(post.user_id) ? (
                      <img src={avatarFor(post.user_id)} alt={nameFor(post.user_id)} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      nameFor(post.user_id).charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm">{nameFor(post.user_id)}</p>
                  <p className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </button>

              {post.content && <p className="px-4 pb-3 text-sm">{post.content}</p>}
              {post.image_url && post.media_type === 'video' ? (
                <video src={post.image_url} controls preload="metadata" playsInline className="w-full" />
              ) : post.image_url ? (
                <img src={post.image_url} alt="post" className="w-full object-cover" loading="lazy" />
              ) : null}

              <div className="flex border-t border-zinc-800">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium ${myLikes[post.id] ? 'text-red-500' : 'text-zinc-400'}`}
                >
                  <ThumbsUp size={17} fill={myLikes[post.id] ? 'currentColor' : 'none'} />
                  {likeCounts[post.id] || 0}
                </button>
                <button
                  onClick={() => navigate('/home')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-zinc-400 text-sm font-medium"
                >
                  <MessageCircle size={17} />
                  {commentCounts[post.id] || 0}
                </button>
                <button
                  onClick={() => handleShare(post)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-zinc-400 text-sm font-medium"
                >
                  <Share2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0D] border-t border-zinc-900 flex items-center justify-around py-2">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-0.5 text-zinc-500">
          <span className="text-[10px]">Home</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-red-500">
          <span className="text-[10px] font-semibold">Discover</span>
        </button>
        <button onClick={() => navigate('/home')} className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center -mt-4 shadow-lg">
          <span className="text-white text-2xl leading-none">+</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-zinc-500">
          <span className="text-[10px]">Messages</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-0.5 text-zinc-500">
          <span className="text-[10px]">Profile</span>
        </button>
      </div>
    </div>
  );
}
