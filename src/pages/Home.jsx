import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  MessageCircle,
  Bell,
  Menu,
  Camera,
  ThumbsUp,
  Share2,
  X,
  MoreVertical,
  Trash2,
  Bookmark,
  Flag,
  Link as LinkIcon,
  BellRing,
  User,
  ShoppingBag,
  Wallet as WalletIcon,
  Briefcase,
  Settings,
  LogOut,
  BookOpen,
  CalendarDays,
  Users,
  Flame,
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

const POSTS_PER_PAGE = 30;
const LONG_PRESS_MS = 400;
const TOUCH_GUARD_MS = 800;

function reactionEmoji(type) {
  return REACTIONS.find((r) => r.type === type)?.emoji || '👍';
}
function reactionLabel(type) {
  return REACTIONS.find((r) => r.type === type)?.label || 'Like';
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
  const [myAvatarUrl, setMyAvatarUrl] = useState(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [toast, setToast] = useState(null);
  const [openNavMenu, setOpenNavMenu] = useState(false);

  const [myPostReactions, setMyPostReactions] = useState({});
  const [postReactionSummary, setPostReactionSummary] = useState({});
  const [postLikesRaw, setPostLikesRaw] = useState({});
  const [openReactionPicker, setOpenReactionPicker] = useState(null);
  const [openPostMenu, setOpenPostMenu] = useState(null);
  const [openReactorsList, setOpenReactorsList] = useState(null);

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
  const longPressFired = useRef(false);
  const touchHandled = useRef(false);
  const videoRefs = useRef({});

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
            if (!video.paused) video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    Object.values(videoRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [posts]);

  function registerVideoRef(postId, el) {
    if (el) videoRefs.current[postId] = el;
    else delete videoRefs.current[postId];
  }

  function handleVideoPlay(postId) {
    Object.entries(videoRefs.current).forEach(([id, el]) => {
      if (id !== String(postId) && el && !el.paused) {
        el.pause();
      }
    });
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, phone_number, date_of_birth, house_location, faculty, department, level')
        .eq('id', user.id)
        .single();
      if (profile) {
        setMyAvatarUrl(profile.avatar_url);
        const incomplete = !profile.phone_number || !profile.date_of_birth || !profile.house_location || !profile.faculty || !profile.department || !profile.level;
        setProfileIncomplete(incomplete);
      }
    }
    await fetchPosts(user?.id);
  }

  async function loadProfiles(userIds) {
    const missing = [...new Set(userIds)].filter((id) => id && !profiles[id]);
    if (missing.length === 0) return;
    const { data } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', missing);
    if (data) {
      const map = {};
      data.forEach((p) => { map[p.id] = p; });
      setProfiles((prev) => ({ ...prev, ...map }));
    }
  }

  function nameFor(userId) {
    return profiles[userId]?.display_name || 'Student';
  }

  function avatarFor(userId) {
    return profiles[userId]?.avatar_url || null;
  }

  async function fetchPosts(userId) {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(POSTS_PER_PAGE);

    if (error) {
      console.error('Error fetching posts:', error.message);
      setLoading(false);
      return;
    }

    setPosts(data);
    loadProfiles(data.map((p) => p.user_id));

    const postIds = data.map((p) => p.id);
    if (postIds.length > 0) {
      const [likesResult, commentsResult] = await Promise.all([
        supabase.from('likes').select('post_id, user_id, reaction_type').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
      ]);

      const likesData = likesResult.data || [];
      const commentsData = commentsResult.data || [];

      const summary = {};
      const mine = {};
      const raw = {};
      likesData.forEach((like) => {
        if (!summary[like.post_id]) summary[like.post_id] = {};
        summary[like.post_id][like.reaction_type] = (summary[like.post_id][like.reaction_type] || 0) + 1;
        if (like.user_id === userId) mine[like.post_id] = like.reaction_type;
        if (!raw[like.post_id]) raw[like.post_id] = [];
        raw[like.post_id].push({ user_id: like.user_id, reaction_type: like.reaction_type });
      });
      setPostReactionSummary(summary);
      setMyPostReactions(mine);
      setPostLikesRaw(raw);
      loadProfiles(likesData.map((l) => l.user_id));

      const cCounts = {};
      commentsData.forEach((c) => {
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

  async function handleCopyLink(post) {
    setOpenPostMenu(null);
    const url = `${window.location.origin}/home#post-${post.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard');
    }
  }

  function handleSavePost() {
    setOpenPostMenu(null);
    showToast('Saved posts coming soon!');
  }

  function handleReportPost() {
    setOpenPostMenu(null);
    showToast('Thanks — report submitted.');
  }

  function handleTurnOnNotifications() {
    setOpenPostMenu(null);
    showToast('Notifications for this post turned on');
  }

  function setPostReaction(postId, reactionType) {
    if (!currentUserId) return;
    setOpenReactionPicker(null);

    const current = myPostReactions[postId];
    let dbCall;

    if (current === reactionType) {
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
      setPostLikesRaw((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((l) => l.user_id !== currentUserId),
      }));
      dbCall = supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
    } else if (current) {
      setMyPostReactions((prev) => ({ ...prev, [postId]: reactionType }));
      setPostReactionSummary((prev) => {
        const next = { ...prev, [postId]: { ...(prev[postId] || {}) } };
        if (next[postId][current] > 1) next[postId][current] -= 1;
        else delete next[postId][current];
        next[postId][reactionType] = (next[postId][reactionType] || 0) + 1;
        return next;
      });
      setPostLikesRaw((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((l) =>
          l.user_id === currentUserId ? { ...l, reaction_type: reactionType } : l
        ),
      }));
      dbCall = supabase.from('likes').update({ reaction_type: reactionType }).eq('post_id', postId).eq('user_id', currentUserId);
    } else {
      setMyPostReactions((prev) => ({ ...prev, [postId]: reactionType }));
      setPostReactionSummary((prev) => {
        const next = { ...prev, [postId]: { ...(prev[postId] || {}) } };
        next[postId][reactionType] = (next[postId][reactionType] || 0) + 1;
        return next;
      });
      setPostLikesRaw((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { user_id: currentUserId, reaction_type: reactionType }],
      }));
      dbCall = supabase.from('likes').insert([{ post_id: postId, user_id: currentUserId, reaction_type: reactionType }]);
    }

    dbCall.then(({ error }) => {
      if (error) console.error('Reaction save failed:', error.message);
    });
  }

  function handleLikePressStart(postId) {
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setOpenReactionPicker(postId);
    }, LONG_PRESS_MS);
  }

  function handleLikeTouchEnd(postId) {
    touchHandled.current = true;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (!longPressFired.current) {
      setPostReaction(postId, 'like');
    }
    setTimeout(() => { touchHandled.current = false; }, TOUCH_GUARD_MS);
  }

  function handleLikeMouseEnd(postId) {
    if (touchHandled.current) return;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (!longPressFired.current) {
      setPostReaction(postId, 'like');
    }
  }

  function handleLikeMouseStart(postId) {
    if (touchHandled.current) return;
    handleLikePressStart(postId);
  }

  function totalReactions(summaryObj) {
    if (!summaryObj) return 0;
    return Object.values(summaryObj).reduce((a, b) => a + b, 0);
  }

  function topReactionTypes(summaryObj) {
    if (!summaryObj) return [];
    return Object.entries(summaryObj).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type]) => type);
  }

  function toggleReactorsList(postId) {
    if (openReactorsList === postId) {
      setOpenReactorsList(null);
      return;
    }
    const reactorIds = (postLikesRaw[postId] || []).map((l) => l.user_id);
    loadProfiles(reactorIds);
    setOpenReactorsList(postId);
  }

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

  function setCommentReaction(commentId, reactionType) {
    if (!currentUserId) return;
    setOpenCommentReactionPicker(null);

    const current = myCommentReactions[commentId];
    let dbCall;

    if (current === reactionType) {
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
      dbCall = supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', currentUserId);
    } else if (current) {
      setMyCommentReactions((prev) => ({ ...prev, [commentId]: reactionType }));
      setCommentReactionSummary((prev) => {
        const next = { ...prev, [commentId]: { ...(prev[commentId] || {}) } };
        if (next[commentId][current] > 1) next[commentId][current] -= 1;
        else delete next[commentId][current];
        next[commentId][reactionType] = (next[commentId][reactionType] || 0) + 1;
        return next;
      });
      dbCall = supabase.from('comment_likes').update({ reaction_type: reactionType }).eq('comment_id', commentId).eq('user_id', currentUserId);
    } else {
      setMyCommentReactions((prev) => ({ ...prev, [commentId]: reactionType }));
      setCommentReactionSummary((prev) => {
        const next = { ...prev, [commentId]: { ...(prev[commentId] || {}) } };
        next[commentId][reactionType] = (next[commentId][reactionType] || 0) + 1;
        return next;
      });
      dbCall = supabase.from('comment_likes').insert([{ comment_id: commentId, user_id: currentUserId, reaction_type: reactionType }]);
    }

    dbCall.then(({ error }) => {
      if (error) console.error('Comment reaction save failed:', error.message);
    });
  }

  function handleCommentLikePressStart(commentId) {
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setOpenCommentReactionPicker(commentId);
    }, LONG_PRESS_MS);
  }

  function handleCommentLikeTouchEnd(commentId) {
    touchHandled.current = true;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (!longPressFired.current) {
      setCommentReaction(commentId, 'like');
    }
    setTimeout(() => { touchHandled.current = false; }, TOUCH_GUARD_MS);
  }

  function handleCommentLikeMouseEnd(commentId) {
    if (touchHandled.current) return;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (!longPressFired.current) {
      setCommentReaction(commentId, 'like');
    }
  }

  function handleCommentLikeMouseStart(commentId) {
    if (touchHandled.current) return;
    handleCommentLikePressStart(commentId);
  }

  const activeMenuPost = posts.find((p) => p.id === openPostMenu);
  const reactorsPost = posts.find((p) => p.id === openReactorsList);
  const reactorsList = reactorsPost ? (postLikesRaw[reactorsPost.id] || []) : [];

  const services = [
    { label: 'Errands', icon: Briefcase, gradient: 'from-orange-500 to-amber-400', action: () => showToast('Errands coming soon!') },
    { label: 'Marketplace', icon: ShoppingBag, gradient: 'from-fuchsia-500 to-pink-500', action: () => showToast('Marketplace coming soon!') },
    { label: 'Wallet', icon: WalletIcon, gradient: 'from-emerald-500 to-teal-400', action: () => showToast('Wallet coming soon!') },
    { label: 'Study Hub', icon: BookOpen, gradient: 'from-sky-500 to-cyan-400', action: () => showToast('Study Hub coming soon!') },
    { label: 'Events', icon: CalendarDays, gradient: 'from-violet-500 to-purple-400', action: () => showToast('Campus Events coming soon!') },
    { label: 'Communities', icon: Users, gradient: 'from-rose-500 to-red-400', action: () => showToast('Communities coming soon!') },
  ];

  return (
    <div className={darkMode ? 'min-h-screen bg-zinc-950 text-white' : 'min-h-screen bg-white text-gray-900'}>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-sm px-4 py-2 rounded-full z-50 shadow-lg">
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-fuchsia-400 via-violet-400 to-orange-300 bg-clip-text text-transparent">
          Uni.hub
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center"
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
          <button
            className="p-2 relative"
            onClick={() => showToast('Notifications coming soon!')}
          >
            <Bell size={22} className="text-zinc-400" />
            <span className="absolute top-1 right-1 bg-fuchsia-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>
          <button className="p-2" onClick={() => showToast('Messaging coming soon!')}>
            <MessageCircle size={22} className="text-zinc-400" />
          </button>
          <button onClick={() => setOpenNavMenu(true)} className="p-2">
            <Menu size={22} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {profileIncomplete && (
        <div className="mx-3 mt-3 bg-gradient-to-r from-amber-900/40 to-orange-900/30 border border-amber-700/60 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
          <p className="text-xs text-amber-300">Complete your profile to unlock all features</p>
          <button
            onClick={() => navigate('/profile')}
            className="text-xs font-semibold bg-amber-500 text-zinc-950 px-3 py-1 rounded-full flex-shrink-0"
          >
            Complete
          </button>
        </div>
      )}

      {/* Campus services dashboard */}
      <div className="px-3 pt-4 pb-2">
        <h2 className="text-sm font-bold text-zinc-300 px-1 mb-2">Campus Services</h2>
        <div className="grid grid-cols-3 gap-3">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={s.action}
                className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md active:scale-95 transition-transform"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md`}>
                  <Icon size={19} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-zinc-200">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending strip */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Flame size={15} className="text-orange-400" />
          <h2 className="text-sm font-bold text-zinc-300">Trending on Campus</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['#Freshers2026', '#ExamSZN', '#HostelLife', '#CampusFootball'].map((tag) => (
            <button
              key={tag}
              onClick={() => showToast('Campus trends coming soon!')}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Composer bar */}
      <div className="mx-3 mt-2 mb-1 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-orange-400 p-[2px] flex-shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800">
              {myAvatarUrl ? (
                <img src={myAvatarUrl} alt="me" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold">U</div>
              )}
            </div>
          </button>
          <input
            type="text"
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="What's happening on campus?"
            className="flex-1 min-w-0 bg-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none"
          />
        </div>

        <div className="mt-2 ml-[52px]">
          <label className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold cursor-pointer">
            <Camera size={16} className="flex-shrink-0" />
            <span className="whitespace-nowrap">Photo/Video</span>
            <input type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>

        {previewUrl && (
          <div className="relative mt-3">
            {selectedMediaType === 'video' ? (
              <video src={previewUrl} controls className="w-full rounded-xl max-h-64" />
            ) : (
              <img src={previewUrl} alt="preview" className="w-full rounded-xl max-h-64 object-cover" />
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
            className="mt-3 w-full bg-gradient-to-r from-fuchsia-500 to-orange-400 disabled:opacity-50 text-white font-semibold py-2 rounded-xl shadow-md"
          >
            {uploading ? 'Posting...' : 'Post'}
          </button>
        )}
      </div>

      {/* Feed */}
      <div className="px-3 py-2 space-y-3">
        <h2 className="text-sm font-bold text-zinc-300 px-1 pt-1">Campus Feed</h2>

        {loading && <p className="text-center text-zinc-500 py-6">Loading feed...</p>}
        {!loading && posts.length === 0 && (
          <p className="text-center text-zinc-500 py-6">No posts yet. Be the first to share!</p>
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
          const postAvatar = avatarFor(post.user_id);

          return (
            <div key={post.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative shadow-lg">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => navigate(`/profile/${post.user_id}`)}
                  className="flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-orange-400 p-[2px]">
                    <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center font-bold overflow-hidden">
                      {postAvatar ? (
                        <img src={postAvatar} alt={nameFor(post.user_id)} className="w-full h-full object-cover" loading="lazy" />
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
                <button onClick={() => setOpenPostMenu(post.id)} className="text-zinc-400 p-1">
                  <MoreVertical size={18} />
                </button>
              </div>

              {post.content && <p className="px-4 pb-3 text-sm">{post.content}</p>}
              {post.image_url && post.media_type === 'video' ? (
                <video
                  ref={(el) => registerVideoRef(post.id, el)}
                  onPlay={() => handleVideoPlay(post.id)}
                  src={post.image_url}
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full"
                />
              ) : post.image_url ? (
                <img src={post.image_url} alt="post" className="w-full object-cover" loading="lazy" />
              ) : null}

              {total > 0 && (
                <button
                  onClick={() => toggleReactorsList(post.id)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-zinc-400 border-t border-zinc-800 mt-1"
                >
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      {topTypes.map((type) => (
                        <span key={type} className="text-sm">{reactionEmoji(type)}</span>
                      ))}
                    </div>
                    <span className="ml-1 underline decoration-zinc-700">{total}</span>
                  </div>
                  <span>{commentCount} comments</span>
                </button>
              )}

              {isPickerOpen && (
                <div className="absolute bottom-16 left-4 bg-zinc-800 border border-zinc-700 rounded-full flex gap-1 px-2 py-1.5 shadow-xl z-10">
                  {REACTIONS.map((r) => (
                    <button key={r.type} onClick={() => setPostReaction(post.id, r.type)} className="text-2xl active:scale-125 transition-transform">
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex border-t border-zinc-800">
                <button
                  onTouchStart={() => handleLikePressStart(post.id)}
                  onTouchEnd={() => handleLikeTouchEnd(post.id)}
                  onMouseDown={() => handleLikeMouseStart(post.id)}
                  onMouseUp={() => handleLikeMouseEnd(post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium active:bg-zinc-800 transition-colors ${myReaction ? 'text-fuchsia-400' : 'text-zinc-400'}`}
                >
                  {myReaction ? <span className="text-base">{reactionEmoji(myReaction)}</span> : <ThumbsUp size={18} />}
                  {myReaction ? reactionLabel(myReaction) : 'Like'}
                </button>
                <button
                  onClick={() => toggleCommentBox(post.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-zinc-400 text-sm font-medium active:bg-zinc-800 transition-colors"
                >
                  <MessageCircle size={18} />
                  Comment
                </button>
                <button
                  onClick={() => handleShare(post)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-zinc-400 text-sm font-medium active:bg-zinc-800 transition-colors"
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>

              {isCommentOpen && (
                <div className="border-t border-zinc-800 px-4 py-3">
                  <div className="space-y-3 mb-3 max-h-72 overflow-y-auto">
                    {topLevelComments.length === 0 && (
                      <p className="text-xs text-zinc-500">No comments yet. Say something!</p>
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
                            <div className="bg-zinc-800 rounded-xl px-3 py-2 flex justify-between items-start gap-2">
                              <div>
                                <p className="text-xs text-zinc-400 mb-0.5">{nameFor(c.user_id)}</p>
                                <p className="text-sm">{c.content}</p>
                              </div>
                              <div className="relative flex-shrink-0">
                                <button
                                  onClick={() => setOpenCommentMenu(isCMenuOpen ? null : c.id)}
                                  className="text-zinc-500"
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {isCMenuOpen && (
                                  <div className="absolute right-0 top-6 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-20 min-w-[120px] overflow-hidden">
                                    {isCommentOwner ? (
                                      <button
                                        onClick={() => deleteComment(post.id, c.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-zinc-800"
                                      >
                                        <Trash2 size={13} /> Delete
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setOpenCommentMenu(null)}
                                        className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
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
                                onTouchEnd={() => handleCommentLikeTouchEnd(c.id)}
                                onMouseDown={() => handleCommentLikeMouseStart(c.id)}
                                onMouseUp={() => handleCommentLikeMouseEnd(c.id)}
                                className={`text-xs font-semibold ${myCReaction ? 'text-fuchsia-400' : 'text-zinc-400'}`}
                              >
                                {myCReaction ? reactionEmoji(myCReaction) + ' ' + reactionLabel(myCReaction) : 'Like'}
                              </button>
                              <button
                                onClick={() => { setReplyingToCommentId(c.id); setReplyText(''); }}
                                className="text-xs font-semibold text-zinc-400"
                              >
                                Reply
                              </button>
                              {cTotal > 0 && (
                                <span className="text-xs text-zinc-500 flex items-center gap-0.5">
                                  {cTopTypes.map((t) => <span key={t}>{reactionEmoji(t)}</span>)}
                                  {cTotal}
                                </span>
                              )}
                            </div>

                            {isCPickerOpen && (
                              <div className="absolute -top-10 left-2 bg-zinc-800 border border-zinc-700 rounded-full flex gap-1 px-2 py-1 shadow-xl z-10">
                                {REACTIONS.map((r) => (
                                  <button key={r.type} onClick={() => setCommentReaction(c.id, r.type)} className="text-lg active:scale-125 transition-transform">
                                    {r.emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {replies.length > 0 && (
                            <div className="ml-6 mt-2 space-y-2">
                              {replies.map((r) => {
                                const isReplyOwner = r.user_id === currentUserId;
                                const isRMenuOpen = openCommentMenu === r.id;
                                return (
                                  <div key={r.id} className="bg-zinc-800/60 rounded-xl px-3 py-2 flex justify-between items-start gap-2">
                                    <div>
                                      <p className="text-xs text-zinc-400 mb-0.5">{nameFor(r.user_id)}</p>
                                      <p className="text-sm">{r.content}</p>
                                    </div>
                                    <div className="relative flex-shrink-0">
                                      <button
                                        onClick={() => setOpenCommentMenu(isRMenuOpen ? null : r.id)}
                                        className="text-zinc-500"
                                      >
                                        <MoreVertical size={14} />
                                      </button>
                                      {isRMenuOpen && isReplyOwner && (
                                        <div className="absolute right-0 top-6 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-20 min-w-[120px] overflow-hidden">
                                          <button
                                            onClick={() => deleteComment(post.id, r.id)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-zinc-800"
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

                          {replyingToCommentId === c.id && (
                            <div className="ml-6 mt-2 flex gap-2">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to ${nameFor(c.user_id)}...`}
                                className="flex-1 bg-zinc-800 rounded-full px-3 py-1.5 text-sm outline-none"
                              />
                              <button onClick={() => submitReply(post.id, c.id)} className="text-fuchsia-400 text-sm font-semibold px-2">
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
                      className="flex-1 bg-zinc-800 rounded-full px-3 py-1.5 text-sm outline-none"
                    />
                    <button onClick={() => submitComment(post.id)} className="text-fuchsia-400 text-sm font-semibold px-2">
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeMenuPost && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenPostMenu(null)} />
          <div className="relative w-full bg-zinc-900 rounded-t-3xl pb-6 pt-2 border-t border-zinc-800">
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-2" />

            <button onClick={handleSavePost} className="w-full flex items-center gap-4 px-5 py-3.5 text-left">
              <Bookmark size={20} className="text-zinc-300" />
              <div>
                <p className="text-sm font-medium">Save post</p>
                <p className="text-xs text-zinc-500">Add this to your saved items</p>
              </div>
            </button>

            <button
              onClick={() => { setOpenPostMenu(null); handleShare(activeMenuPost); }}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
            >
              <Share2 size={20} className="text-zinc-300" />
              <p className="text-sm font-medium">Share</p>
            </button>

            <button onClick={() => handleCopyLink(activeMenuPost)} className="w-full flex items-center gap-4 px-5 py-3.5 text-left">
              <LinkIcon size={20} className="text-zinc-300" />
              <p className="text-sm font-medium">Copy link</p>
            </button>

            <button onClick={handleTurnOnNotifications} className="w-full flex items-center gap-4 px-5 py-3.5 text-left">
              <BellRing size={20} className="text-zinc-300" />
              <p className="text-sm font-medium">Turn on notifications for this post</p>
            </button>

            {activeMenuPost.user_id === currentUserId ? (
              <button
                onClick={() => deletePost(activeMenuPost.id)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left border-t border-zinc-800 mt-1"
              >
                <Trash2 size={20} className="text-red-400" />
                <p className="text-sm font-medium text-red-400">Delete Post</p>
              </button>
            ) : (
              <button
                onClick={handleReportPost}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left border-t border-zinc-800 mt-1"
              >
                <Flag size={20} className="text-red-400" />
                <p className="text-sm font-medium text-red-400">Report post</p>
              </button>
            )}
          </div>
        </div>
      )}

      {openReactorsList && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenReactorsList(null)} />
          <div className="relative w-full bg-zinc-900 rounded-t-3xl pb-6 pt-2 border-t border-zinc-800 max-h-[70vh] flex flex-col">
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-3 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-zinc-300 px-5 pb-2 flex-shrink-0">Reactions</h3>
            <div className="overflow-y-auto px-5 space-y-3">
              {reactorsList.length === 0 && (
                <p className="text-xs text-zinc-500 py-4">No reactions yet.</p>
              )}
              {reactorsList.map((r, idx) => (
                <div key={`${r.user_id}-${idx}`} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                    {avatarFor(r.user_id) ? (
                      <img src={avatarFor(r.user_id)} alt={nameFor(r.user_id)} className="w-full h-full object-cover" />
                    ) : (
                      nameFor(r.user_id).charAt(0).toUpperCase()
                    )}
                  </div>
                  <p className="text-sm flex-1">{nameFor(r.user_id)}</p>
                  <span className="text-lg">{reactionEmoji(r.reaction_type)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {openNavMenu && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenNavMenu(false)} />
          <div className="relative w-full bg-zinc-900 rounded-t-3xl pb-6 pt-2 border-t border-zinc-800">
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-2" />

            <button
              onClick={() => { setOpenNavMenu(false); navigate('/profile'); }}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
            >
              <User size={20} className="text-zinc-300" />
              <p className="text-sm font-medium">Profile</p>
            </button>

            <button
              onClick={() => { setOpenNavMenu(false); showToast('Settings coming soon!'); }}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
            >
              <Settings size={20} className="text-zinc-300" />
              <p className="text-sm font-medium">Settings</p>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left border-t border-zinc-800 mt-1"
            >
              <LogOut size={20} className="text-red-400" />
              <p className="text-sm font-medium text-red-400">Log Out</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
