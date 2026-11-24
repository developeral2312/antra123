'use client';
import React from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  ClipboardList, 
  Video, 
  Search, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Cloud,
  Layers
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout, driveStatus, user }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-customer', label: 'Add New Customer', icon: UserPlus },
    { id: 'customers', label: 'Customer Records', icon: Users },
    { id: 'orders', label: 'All Orders', icon: ClipboardList },
    { id: 'gallery', label: 'Video Gallery', icon: Video },
    { id: 'search', label: 'Search Customer', icon: Search },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0d162b] text-slate-300 min-h-screen p-4 justify-between border-r border-slate-800/80 shadow-xl select-none">
      <div>
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 px-3 py-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Antra
            </h1>
            <p className="text-[11px] font-medium text-slate-400 -mt-0.5 tracking-wider uppercase">
              Customer Management
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        {/* Google Drive Status Badge */}
        <div 
          onClick={() => setActiveTab('settings')}
          className="cursor-pointer bg-slate-800/70 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 flex items-center justify-center">
              {/* Google Drive 3-color triangle SVG */}
              <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Google Drive</p>
              <p className={`text-[10px] ${driveStatus?.connected ? 'text-emerald-400' : 'text-amber-400'} font-medium`}>
                {driveStatus?.connected ? 'Connected' : 'Drive Sync Ready'}
              </p>
            </div>
          </div>
          {driveStatus?.connected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse"></span>
          )}
        </div>

        {/* User Profile Card */}
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@antra.com'}</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
