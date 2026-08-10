import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Settings,
  User,
  FileText,
  Bookmark,
  Package,
  Wallet,
  Bell,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export default function Menu() {
  const navigate = useNavigate();
  const [name, setName] = useState('Student');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    init();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setEmail(user.email || '');

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (profile) {
      setName(profile.display_name || 'Student');
      setAvatarUrl(profile.avatar_url || null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const items = [
    { label: 'My Profile', icon: User, action: () => navigate('/profile') },
    { label: 'My Posts', icon: FileText, action: () => navigate('/profile') },
    { label: 'Saved Items', icon: Bookmark, action: () => showToast('Saved Items coming soon!') },
    { label: 'My Orders', icon: Package, action: () => showToast('My Orders coming soon!') },
    { label: 'My Wallet', icon: Wallet, action: () => showToast('Wallet coming soon!') },
    { label: 'Notifications', icon: Bell, badge: 3, action: () => showToast('Notifications coming soon!') },
    { label: 'Messages', icon: MessageCircle, action: () => showToast('Messaging coming soon!') },
  ];

  const supportItems = [
    { label: 'Help & Support', icon: HelpCircle, action: () => showToast('Help & Support coming soon!') },
    { label: 'Terms & Privacy', icon: ShieldCheck, action: () => showToast('Terms & Privacy coming soon!') },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0D] text-white pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-sm px-4 py-2 rounded-full z-50 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/home')}>
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold">More</h1>
        </div>
        <button onClick={() => showToast('Settings coming soon!')}>
          <Settings size={20} className="text-zinc-400" />
        </button>
      </div>

      <button
        onClick={() => navigate('/profile')}
        className="w-full flex items-center gap-3 px-4 py-4 mt-2"
      >
        <div className="w-14 h-14 rounded-full bg-red-600 p-[2px] flex-shrink-0">
          <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-lg">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-zinc-500">{email}</p>
          <p className="text-xs text-red-500 mt-0.5">View your profile ›</p>
        </div>
      </button>

      <div className="mt-3 border-t border-zinc-900">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-zinc-900"
            >
              <Icon size={19} className="text-zinc-400" />
              <span className="flex-1 text-left text-sm">{item.label}</span>
              {item.badge && (
                <span className="bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              <ChevronRight size={16} className="text-zinc-600" />
            </button>
          );
        })}
      </div>

      <div className="mt-3 border-t border-zinc-900">
        {supportItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-zinc-900"
            >
              <Icon size={19} className="text-zinc-400" />
              <span className="flex-1 text-left text-sm">{item.label}</span>
              <ChevronRight size={16} className="text-zinc-600" />
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500"
        >
          <LogOut size={19} />
          <span className="text-sm font-semibold">Log Out</span>
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0D] border-t border-zinc-900 flex items-center justify-around py-2">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-0.5 text-zinc-500">
          <span className="text-[10px]">Home</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-zinc-500">
          <span className="text-[10px]">Discover</span>
        </button>
        <button className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center -mt-4 shadow-lg">
          <span className="text-white text-2xl leading-none">+</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-zinc-500">
          <span className="text-[10px]">Messages</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-0.5 text-red-500">
          <span className="text-[10px] font-semibold">Profile</span>
        </button>
      </div>
    </div>
  );
}
