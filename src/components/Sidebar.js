'use client';
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  UserPlus, 
  Video, 
  Search, 
  Settings, 
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2, 
  MoreVertical,
  Check
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout, dbStatus, user }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  return (
    <aside 
      className={`hidden lg:flex flex-col bg-[#0d162b] text-slate-300 h-screen overflow-y-auto shrink-0 justify-between border-r border-slate-800/80 shadow-xl select-none transition-all duration-300 sticky top-0 ${
        isCollapsed ? 'w-20 px-2.5 py-4' : 'w-64 p-4'
      }`}
    >
      <div>
        {/* Header: Logo, Brand & Collapse Button */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 mb-6">
            <div 
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0 cursor-pointer hover:scale-105 transition-transform"
              title="Expand Sidebar"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Expand Sidebar"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1 mb-6 pt-2 pb-1">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Antra
              </h1>
            </div>

            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
              title="Collapse Sidebar"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div className={isCollapsed ? 'space-y-4' : 'space-y-5'}>
          {menuSections.map((section, sIdx) => (
            <div key={sIdx}>
              {!isCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {section.title}
                </p>
              )}
              {isCollapsed && sIdx > 0 && (
                <div className="w-6 h-px bg-slate-800/80 mx-auto my-2" />
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  if (isCollapsed) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={item.label}
                        className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r-full"></span>
                      )}
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className={`pt-4 mt-auto border-t border-slate-800/80 ${isCollapsed ? 'space-y-3 flex flex-col items-center' : 'space-y-2.5'}`}>
        {isCollapsed ? (
          <>
            {/* PostgreSQL Status Button (Collapsed) */}
            <button
              onClick={() => setActiveTab('settings')}
              title={`PostgreSQL: ${dbStatus?.connected ? 'Connected' : 'Active'}`}
              className="w-10 h-10 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-all relative group"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0d162b]"></span>
            </button>

            {/* Admin Profile Button (Collapsed - Click to Logout) */}
            <button
              onClick={onLogout}
              title={`Admin (${user?.email || 'admin@antra.com'}) - Click to Logout`}
              className="w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/50 flex items-center justify-center transition-all group"
            >
              <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs group-hover:border-rose-400 group-hover:text-rose-200">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            </button>
          </>
        ) : (
          <>
            {/* PostgreSQL Status Pill (Expanded) */}
            <div 
              onClick={() => setActiveTab('settings')}
              title="PostgreSQL Database Diagnostics"
              className="cursor-pointer bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 rounded-full px-3 py-1.5 flex items-center justify-between text-xs transition-all"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-[11px] text-emerald-300">PostgreSQL Active</span>
              </div>
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-emerald-300" />
              </div>
            </div>

            {/* Admin User Profile Card (Expanded - Click to Logout) */}
            <div 
              onClick={onLogout}
              title="Click to Logout"
              className="cursor-pointer bg-slate-900/90 hover:bg-slate-800/90 hover:border-slate-700 rounded-2xl p-2.5 border border-slate-800 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs shrink-0 group-hover:border-rose-400 group-hover:bg-rose-500/20 group-hover:text-rose-200 transition-all">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user?.email || 'admin@antra.com'}
                  </p>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-white transition-colors shrink-0 p-1">
                <MoreVertical className="w-4 h-4" />
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
