import { Home as HomeIcon, MessageCircle, PlaySquare, Bell, Menu, Search, Plus } from 'lucide-react';

// ... inside your component's return statement, replace the top section with:

<div className="min-h-screen bg-gray-900 text-white">
  {/* Top bar */}
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
    <h1 className="text-2xl font-bold text-blue-500">Uni.hub</h1>
    <div className="flex items-center gap-3">
      <button className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
        <Plus size={18} />
      </button>
      <button className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
        <Search size={18} />
      </button>
      <button className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
        <Menu size={18} />
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
  </div>

  {/* Composer bar */}
  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
    <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0" />
    <input
      type="text"
      placeholder="What's on your mind?"
      className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-300 placeholder-gray-500 outline-none"
    />
    <button className="text-green-500 text-sm font-semibold flex-shrink-0">
      📷 Photo
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

  {/* Your existing feed/posts list goes below this line — keep it as is */}
</div>
