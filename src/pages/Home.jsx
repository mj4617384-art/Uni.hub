import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Home as HomeIcon,
  MessageCircle,
  PlaySquare,
  Bell,
  Menu,
  Camera,
  ThumbsUp,
  Share2,
  X,
  MoreVertical,
  Trash2,
} from 'lucide-react';

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'care', emoji: '🥰', label: 'Care' },
  { type: 'haha', emoji: '😆', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😠', label: 'Angry' },
];

function reactionEmoji(type) {
  return REACTIONS.find((r) => r.type === type)?.emoji || '👍';
}

export default function Home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedMediaType, setSelectedMediaType] = useState('image');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [toast, setToast] = useState(null);

  const [myPostReactions, setMyPostReactions] = useState({});
  const [postReactionSummary, setPostReactionSummary] = useState({});
  const [openReactionPicker, setOpenReactionPicker] = useState(null);
  const [openPostMenu, setOpenPostMenu] = useState(null);

  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentText, setCommentText] = useState('');
  const [commentCounts, setCommentCounts] = useState({});
  const [myCommentReactions, setMyCommentReactions] = useState({});
  const [commentReactionSummary, setCommentReactionSummary] = useState({});
  const [openCommentReactionPicker, setOpenCommentReactionPicker] = useState(null);
  const [openCommentMenu, setOpenCommentMenu] = useState(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const pressTimer = useRef(null);

  useEffect(() => {
    init();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
    await fetchPosts(user?.id);
  }

  async function loadProfiles(userIds) {
    const missing = [...new Set(userIds)].filter((id) => id && !profiles[id]);
    if (missing.length === 0) return;
    const { data } = await supabase.from('profiles').select('id, display_name').in('id', missing);
    if (data) {
      const map = {};
      data.forEach((p) => { map[p.id] = p.display_name; });
      setProfiles((prev) => ({ ...prev, ...map }));
    }
  }

  function nameFor(userId) {
    return profiles[userId] || 'Student';
  }

  async function fetchPosts(userId) {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error.message);
      setLoading(false);
      return;
    }

    setPosts(data);
    loadProfiles(data.map((p) => p.user_id));

    const postIds = data.map((p) => p.id);
    if (postIds.length > 0) {
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id, user_id, reaction_type')
        .in('post_id', postIds);

      const summary = {};
      const mine = {};
      (likesData || []).forEach((like) => {
        if (!summary[like.post_id]) summary[like.post_id] = {};
        summary[like.post_id][like.reaction_type] = (summary[like.post_id][like.reaction_type] || 0) + 1;
        if (like.user_id === userId) mine[like.post_id] = like.reaction_type;
      });
      setPostReactionSummary(summary);
      setMyPostReactions(mine);

      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds);

      const cCounts = {};
      (commentsData || []).forEach((c) => {
        cCounts[c.post_id] = (cCounts[c.post_id] || 0) + 1;
      });
      setCommentCounts(cCounts);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setSelectedFile(file);
    setSelectedMediaType(isVideo ? 'video' : 'image');
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedMediaType('image');
  }

  async function handlePost() {
    if (!newPostText.trim() && !selectedFile) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    let imageUrl = null;
    const bucket = selectedMediaType === 'video' ? 'post-videos' : 'post-images';

    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, selectedFile);

      if (uploadError) {
        console.error('Error uploading media:', uploadError.message);
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from('posts').insert([
      {
        user_id: user.id,
        content: newPostText,
        image_url: imageUrl,
        media_type: selectedFile ? selectedMediaType : null,
      },
    ]);

    if (error) {
      console.error('Error posting:', error.message);
    } else {
      setNewPostText('');
      clearSelectedFile();
      fetchPosts(currentUserId);
    }
    setUploading(false);
  }

  async function deletePost(postId) {
    setOpenPostMenu(null);
    if (!window.confirm('Delete this post?')) return;
    await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUserId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
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
        // user cancelled, ignore
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      showToast('Link copied to clipboard');
    }
  }

  // ---- Post reactions ----

  async function setPostReaction(postId, reactionType) {
    if (!currentUserId) return;
    setOpenReactionPicker(null);

    const current = myPostReactions[postId];

    if (current === reactionType) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
      setMyPostReactions((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      setPostReactionSummary((prev) => {
        const next = { ...prev, [postId]: { ...(prev[postId] || {}) } };
        if (next[postId][reactionType] > 1) next[postId][reactionType] -= 1;
        else delete next[postId][reactionType];
        return next;
      });
    } else if (current) {
      await supabase.from('likes').update({ reaction_type: reactionType }).eq('post_id', postId).eq('user_id', currentUserId);
      setMyPostReactions((prev) => ({ ...prev, [postId]: reactionType }));
      setPostReactionSummary((prev) => {
        const next = { ...prev, [postId]: { ...(prev[postId] || {}) } };
        if (next[postId][current] > 1) next[postId][current] -= 1;
        else delete next[postId][current];
        next[postId][reactionType] = (next[postId][reactionType] || 0) + 1;
        return next;
      });
    } else {
      await supabase.from('likes').insert([{ post_id: postId, user_id: currentUserId, reaction_type: reactionType }]);
      setMyPostReactions((prev) => ({ ...prev, [postId]: reactionType }));
      setPostReactionSummary((prev) => {
        const next = { ...prev, [postId]: { ...(prev[postId] || {}) } };
        next[postId][reactionType] = (next[postId][reactionType] || 0) + 1;
        return next;
      });
    }
  }

  function handleLikePressStart(postId) {
    pressTimer.current = setTimeout(() => setOpenReactionPicker(postId), 400);
  }

  function handleLikePressEnd(postId) {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
      if (openReactionPicker !== postId) setPostReaction(postId, 'like');
    }
  }

  function totalReactions(summaryObj) {
    if (!summaryObj) return 0;
    return Object.values(summaryObj).reduce((a, b) => a + b, 0);
  }

  function topReactionTypes(summaryObj) {
    if (!summaryObj) return [];
    return Object.entries(summaryObj).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type]) => type);
  }

  // ---- Comments ----

  async function toggleCommentBox(postId) {
    if (openCommentPostId === postId) {
      setOpenCommentPostId(null);
      return;
    }
    setOpenCommentPostId(postId);
    setCommentText('');

    if (!commentsByPost[postId]) {
      const { data, error } = await supabase
        .from('comments')
        .select('id, content, user_id, created_at, parent_comment_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!error) {
        setCommentsByPost((prev) => ({ ...prev, [postId]: data }));
        loadProfiles(data.map((c) => c.user_id));

        const commentIds = data.map((c) => c.id);
        if (commentIds.length > 0) {
          const { data: cLikes } = await supabase
            .from('comment_likes')
            .select('comment_id, user_id, reaction_type')
            .in('comment_id', commentIds);

          const summary = {};
          const mine = {};
          (cLikes || []).forEach((like) => {
            if (!summary[like.comment_id]) summary[like.comment_id] = {};
            summary[like.comment_id][like.reaction_type] = (summary[like.comment_id][like.reaction_type] || 0) + 1;
            if (like.user_id === currentUserId) mine[like.comment_id] = like.reaction_type;
          });
          setCommentReactionSummary((prev) => ({ ...prev, ...summary }));
          setMyCommentReactions((prev) => ({ ...prev, ...mine }));
        }
      }
    }
  }

  async function submitComment(postId) {
    if (!commentText.trim() || !currentUserId) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: currentUserId, content: commentText, parent_comment_id: null }])
      .select()
      .single();

    if (!error && data) {
      setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), data] }));
      setCommentCounts((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      setCommentText('');
    }
  }

  async function submitReply(postId, parentCommentId) {
    if (!replyText.trim() || !currentUserId) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: currentUserId, content: replyText, parent_comment_id: parentCommentId }])
      .select()
      .single();

    if (!error && data) {
      setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), data] }));
      setCommentCounts((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      setReplyingToCommentId(null);
      setReplyText('');
    }
  }

  async function deleteComment(postId, commentId) {
    setOpenCommentMenu(null);
    await supabase.from('comments').delete().eq('id', commentId).eq('user_id', currentUserId);
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((c) => c.id !== commentId && c.parent_comment_id !== commentId),
    }));
    setCommentCounts((prev) => ({ ...prev, [postId]: Math.max((prev[postId] || 1) - 1, 0) }));
  }

  async function setCommentReaction(commentId, reactionType) {
    if (!currentUserId) return;
    setOpenCommentReactionPicker(null);

    const current = myCommentReactions[commentId];

    if (current === reactionType) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', currentUserId);
      setMyCommentReactions((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      setCommentReactionSummary((prev) => {
        const next = { ...prev, [commentId]: { ...(prev[commentId] || {}) } };
        if (next[commentId][reactionType] > 1) next[commentId][reactionType] -= 1;
        else delete next[commentId][reactionType];
        return next;
      });
    } else if (current) {
      await supabase.from('comment_likes').update({ reaction_type: reactionType }).eq('comment_id', commentId).eq('user_id', currentUserId);
      setMyCommentReactions((prev) => ({ ...prev, [commentId]: reactionType }));
      setCommentReactionSummary((prev) => {
        const next = { ...prev, [commentId]: { ...(prev[commentId] || {}) } };
        if (next[commentId][current] > 1) next[commentId][current] -= 1;
        else delete next[commentId][current];
        next[commentId][reactionType] = (next[commentId][reactionType] || 0) + 1;
        return next;
      });
    } else {
      await supabase.from('comment_likes').insert([{ comment_id: commentId, user_id: currentUserId, reaction_type: reactionType }]);
      setMyCommentReactions((prev) => ({ ...prev, [commentId]: reactionType }));
      setCommentReactionSummary((prev) => {
        const next = { ...prev, [commentId]: { ...(prev[commentId] || {}) } };
        next[commentId][reactionType] = (next[commentId][reactionType] || 0) + 1;
        return next;
      });
    }
  }

  function handleCommentLikePressStart(commentId) {
    pressTimer.current = setTimeout(() => setOpenCommentReactionPicker(commentId), 400);
  }

  function handleCommentLikePressEnd(commentId) {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
      if (openCommentReactionPicker !== commentId) setCommentReaction(commentId, 'like');
    }
  }

  return (
    <div className={darkMode ? 'min-h-screen bg-gray-900 text-white' : 'min-h-screen bg-white text-gray-900'}>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full z-50 shadow-lg">
          {toast}
        </div>
      )}

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
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-full bg-gray-800 text-sm">
            Log Out
          </button>
        </div>
      </div>

      {/* Icon nav row */}
      <div className="flex justify-around items-center py-2 border-b border-gray-800">
        <button className="p-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <HomeIcon size={24} className="text-blue-500" />
        </button>
        <button className="p-2" onClick={() => showToast('Messaging coming soon!')}>
          <MessageCircle size={24} className="text-gray-400" />
        </button>
        <button className="p-2" onClick={() => showToast('Reels coming soon!')}>
          <PlaySquare size={24} className="text-gray-400" />
        </button>
        <button className="p-2 relative" onClick={() => showToast('Notifications coming soon!')}>
          <Bell size={24} className="text-gray-400" />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>
        <button className="p-2" onClick={() => navigate('/profile')}>
          <Menu size={24} className="text-gray-400" />
        </button>
      </div>

      {/* Composer bar */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0" />
          <input
            type="text"
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="What's happening on campus?"
            className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-300 placeholder-gray-500 outline-none"
          />
          <label className="text-green-500 text-sm font-semibold flex items-center gap-1 flex-shrink-0 cursor-pointer">
            <Camera size={16} /> Photo/Video
            <input type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>

        {previewUrl && (
          <div className="relative mt-3">
            {selectedMediaType === 'video' ? (
              <video src={previewUrl} controls className="w-full rounded-lg max-h-64" />
            ) : (
              <img src={previewUrl} alt="preview" className="w-full rounded-lg max-h-64 object-cover" />
            )}
            <button onClick={clearSelectedFile} className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
              <X size={16} className="text-white" />
            </button>
          </div>
        )}

        {(newPostText.trim() || selectedFile) && (
          <button
            onClick={handlePost}
            disabled={uploading}
            className="mt-3 w-full bg-blue-600 disabled:bg-blue-800 text-white text-sm font-semibold py-2 rounded-lg"
          >
            {uploading ? 'Posting...' : 'Post'}
          </button>
        )}
      </div>

      {/* Section shortcuts strip */}
      <div className="flex gap-2 overflow-x-auto px-3 py-3">
        {[
          { label: 'Errands', color: 'bg-orange-600', action: () => showToast('Errands coming soon!') },
          { label: 'Marketplace', color: 'bg-purple-600', action: () => showToast('Marketplace coming soon!') },
          { label: 'Wallet', color: 'bg-green-600', action: () => showToast('Wallet coming soon!') },
          { label: 'Profile', color: 'bg-blue-600', action: () => navigate('/profile') },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`min-w-[100px] h-[130px] rounded-xl ${item.color} flex items-end p-3 flex-shrink-0 text-left`}
          >
            <span className="text-white text-xs font-bold">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="px-3 py-2 space-y-3">
        {loading && <p className="text-center text-gray-500 py-6">Loading feed...</p>}
        {!loading && posts.length === 0 && (
          <p className="text-center text-gray-500 py-6">No posts yet. Be the first to share!</p>
        )}

        {posts.map((post) => {
          const myReaction = myPostReactions[post.id];
          const summary = postReactionSummary[post.id];
          const total = totalReactions(summary);
          const topTypes = topReactionTypes(summary);
          const commentCount = commentCounts[post.id] || 0;
          const isCommentOpen = openCommentPostId === post.id;
          const allComments = commentsByPost[post.id] || [];
          const topLevelComments = allComments.filter((c) => !c.parent_comment_id);
          const repliesFor = (id) => allComments.filter((c) => c.parent_comment_id === id);
          const isPickerOpen = openReactionPicker === post.id;
          const isOwner = post.user_id === currentUserId;
          const isMenuOpen = openPostMenu === post.id;

          return (
            <div key={post.id} className="bg-gray-800 rounded-xl overflow-hidden relative">
              {/* Post header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                    {nameFor(post.user_id).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{nameFor(post.user_id)}</p>
                    <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenPostMenu(isMenuOpen ? null : post.id)}
                    className="text-gray-400 p-1"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 top-8 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-20 min-w-[140px] overflow-hidden">
                      {isOwner ? (
                        <button
                          onClick={() => deletePost(post.id)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800"
                        >
                          <Trash2 size={15} /> Delete Post
                        </button>
                      ) : (
                        <button
                          onClick={() => setOpenPostMenu(null)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800"
                        >
                          Report Post
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Post content */}
              {post.content && <p className="px-4 pb-3 text-sm">{post.content}</p>}
              {post.image_url && post.media_type === 'video' ? (
                <video src={post.image_url} controls className="w-full" />
              ) : post.image_url ? (
                <img src={post.image_url} alt="post" className="w-full object-cover" />
              ) : null}

              {/* Reaction summary row */}
              {total > 0 && (
                <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-400 border-t border-gray-700 mt-1">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      {topTypes.map((type) => (
                        <span key={type} className="text-sm">{reactionEmoji(type)}</span>
                      ))}
                    </div>
                    <span className="ml-1">{total}</span>
                  </div>
                  <span>{commentCount} comments</span>
                </div>
              )}

              {/* Reaction picker popup */}
              {isPickerOpen && (
                <div className="absolute bottom-16 left-4 bg-gray-900 border border-gray-700 rounded-full flex gap-1 px-2 py-1.5 shadow-lg z-10">
                  {REACTIONS.map((r) => (
                    <button key={r.type} onClick={() => setPostReaction(post.id, r.type)} className="text-2xl active:scale-125 transition-transform">
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Action row */}
              <div className="flex border-t border-gray-700">
                <button
                  onTouchStart={() => handleLikePressStart(post.id)}
                  onTouchEnd={() => handleLikePressEnd(post.id)}
                  onMouseDown={() => handleLikePressStart(post.id)}
                  onMouseUp={() => handleLikePressEnd(post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium active:bg-gray-700 transition-colors ${myReaction ? 'text-blue-500' : 'text-gray-400'}`}
                >
                  {myReaction ? <span className="text-base">{reactionEmoji(myReaction)}</span> : <ThumbsUp size={18} />}
                  {myReaction ? REACTIONS.find((r) => r.type === myReaction)?.label : 'Like'}
                </button>
                <button
                  onClick={() => toggleCommentBox(post.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 text-sm font-medium active:bg-gray-700 transition-colors"
                >
                  <MessageCircle size={18} />
                  Comment
                </button>
                <button
                  onClick={() => handleShare(post)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 text-sm font-medium active:bg-gray-700 transition-colors"
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>

              {/* Comment section */}
              {isCommentOpen && (
                <div className="border-t border-gray-700 px-4 py-3">
                  <div className="space-y-3 mb-3 max-h-72 overflow-y-auto">
                    {topLevelComments.length === 0 && (
                      <p className="text-xs text-gray-500">No comments yet. Say something!</p>
                    )}
                    {topLevelComments.map((c) => {
                      const myCReaction = myCommentReactions[c.id];
                      const cSummary = commentReactionSummary[c.id];
                      const cTotal = totalReactions(cSummary);
                      const cTopTypes = topReactionTypes(cSummary);
                      const isCPickerOpen = openCommentReactionPicker === c.id;
                      const isCommentOwner = c.user_id === currentUserId;
                      const isCMenuOpen = openCommentMenu === c.id;
                      const replies = repliesFor(c.id);

                      return (
                        <div key={c.id}>
                          <div className="relative">
                            <div className="bg-gray-700 rounded-lg px-3 py-2 flex justify-between items-start gap-2">
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">{nameFor(c.user_id)}</p>
                                <p className="text-sm">{c.content}</p>
                              </div>
                              <div className="relative flex-shrink-0">
                                <button
                                  onClick={() => setOpenCommentMenu(isCMenuOpen ? null : c.id)}
                                  className="text-gray-500"
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {isCMenuOpen && (
                                  <div className="absolute right-0 top-6 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-20 min-w-[120px] overflow-hidden">
                                    {isCommentOwner ? (
                                      <button
                                        onClick={() => deleteComment(post.id, c.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-gray-800"
                                      >
                                        <Trash2 size={13} /> Delete
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setOpenCommentMenu(null)}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800"
                                      >
                                        Report
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-1 ml-2">
                              <button
                                onTouchStart={() => handleCommentLikePressStart(c.id)}
                                onTouchEnd={() => handleCommentLikePressEnd(c.id)}
                                onMouseDown={() => handleCommentLikePressStart(c.id)}
                                onMouseUp={() => handleCommentLikePressEnd(c.id)}
                                className={`text-xs font-semibold ${myCReaction ? 'text-blue-500' : 'text-gray-400'}`}
                              >
                                {myCReaction ? reactionEmoji(myCReaction) + ' ' + REACTIONS.find((r) => r.type === myCReaction)?.label : 'Like'}
                              </button>
                              <button
                                onClick={() => { setReplyingToCommentId(c.id); setReplyText(''); }}
                                className="text-xs font-semibold text-gray-400"
                              >
                                Reply
                              </button>
                              {cTotal > 0 && (
                                <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                  {cTopTypes.map((t) => <span key={t}>{reactionEmoji(t)}</span>)}
                                  {cTotal}
                                </span>
                              )}
                            </div>

                            {isCPickerOpen && (
                              <div className="absolute -top-10 left-2 bg-gray-900 border border-gray-700 rounded-full flex gap-1 px-2 py-1 shadow-lg z-10">
                                {REACTIONS.map((r) => (
                                  <button key={r.type} onClick={() => setCommentReaction(c.id, r.type)} className="text-lg active:scale-125 transition-transform">
                                    {r.emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Replies */}
                          {replies.length > 0 && (
                            <div className="ml-6 mt-2 space-y-2">
                              {replies.map((r) => {
                                const isReplyOwner = r.user_id === currentUserId;
                                const isRMenuOpen = openCommentMenu === r.id;
                                return (
                                  <div key={r.id} className="bg-gray-700/60 rounded-lg px-3 py-2 flex justify-between items-start gap-2">
                                    <div>
                                      <p className="text-xs text-gray-400 mb-0.5">{nameFor(r.user_id)}</p>
                                      <p className="text-sm">{r.content}</p>
                                    </div>
                                    <div className="relative flex-shrink-0">
                                      <button
                                        onClick={() => setOpenCommentMenu(isRMenuOpen ? null : r.id)}
                                        className="text-gray-500"
                                      >
                                        <MoreVertical size={14} />
                                      </button>
                                      {isRMenuOpen && isReplyOwner && (
                                        <div className="absolute right-0 top-6 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-20 min-w-[120px] overflow-hidden">
                                          <button
                                            onClick={() => deleteComment(post.id, r.id)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-gray-800"
                                          >
                                            <Trash2 size={13} /> Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Reply input */}
                          {replyingToCommentId === c.id && (
                            <div className="ml-6 mt-2 flex gap-2">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to ${nameFor(c.user_id)}...`}
                                className="flex-1 bg-gray-700 rounded-full px-3 py-1.5 text-sm outline-none"
                              />
                              <button onClick={() => submitReply(post.id, c.id)} className="text-blue-500 text-sm font-semibold px-2">
                                Send
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-gray-700 rounded-full px-3 py-1.5 text-sm outline-none"
                    />
                    <button onClick={() => submitComment(post.id)} className="text-blue-500 text-sm font-semibold px-2">
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
