'use client';
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  UserPlus, 
  Video, 
  Search, 
  Settings, 
  CheckCircle2, 
  MoreVertical,
  Check,
  Camera,
  X
} from 'lucide-react';

export default function MobileNav({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab, 
  onLogout,
  dbStatus,
  user 
}) {
  const menuSections = [
    {
      title: 'MAIN MENU',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'CUSTOMERS & ORDERS',
      items: [
        { id: 'customers', label: 'Customer Records', icon: Users },
        { id: 'orders', label: 'All Orders', icon: ClipboardList },
        { id: 'add-customer', label: 'Add New Customer', icon: UserPlus },
      ]
    },
    {
      title: 'MEDIA & TOOLS',
      items: [
        { id: 'gallery', label: 'Video Gallery', icon: Video },
        { id: 'search', label: 'Search Customer', icon: Search },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  const bottomItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'add-customer', label: 'Record Order', icon: Camera, isCenterFab: true },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'gallery', label: 'Videos', icon: Video },
  ];

  return (
    <>
      {/* Mobile Drawer (Slide-out menu) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay backdrop */}
          <div 
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-[82%] bg-[#0d162b] text-slate-200 h-full p-4 justify-between shadow-2xl">
            <div className="overflow-y-auto">
              {/* Header with Close */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white leading-tight">Antra</h2>
                    <p className="text-[10px] text-slate-400">Customer Management</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Sections */}
              <div className="space-y-4">
                {menuSections.map((section, sIdx) => (
                  <div key={sIdx}>
                    <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      {section.title}
                    </p>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              onClose();
                            }}
                            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              isActive
                                ? 'bg-blue-600/15 text-blue-400 font-semibold'
                                : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                            }`}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r-full"></span>
                            )}
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Footer Info */}
            <div className="space-y-2.5 pt-4 mt-auto border-t border-slate-800">
              <div 
                onClick={() => {
                  setActiveTab('settings');
                  onClose();
                }}
                className="cursor-pointer bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 rounded-full px-3 py-1.5 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-[11px] text-emerald-300">PostgreSQL Active</span>
                </div>
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-300" />
                </div>
              </div>

              {/* User Profile Card - Click to Logout */}
              <div
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                title="Click to Logout"
                className="cursor-pointer bg-slate-900/90 hover:bg-slate-800/90 rounded-2xl p-2.5 border border-slate-800 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs shrink-0 group-hover:border-rose-400 group-hover:bg-rose-500/20 text-rose-200">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Admin'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@antra.com'}</p>
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-white shrink-0 p-1">
                  <MoreVertical className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Center Action Bar for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-slate-200/90 px-3 py-1.5 flex justify-around items-end shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isCenterFab) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center -mt-5 relative z-10 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/35 border-2 border-white transform active:scale-95 transition-all">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="text-[9px] font-bold text-blue-600 mt-1">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[9px] mt-0.5 ${isActive ? 'font-bold text-blue-600' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
