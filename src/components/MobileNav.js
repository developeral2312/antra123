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
  X
} from 'lucide-react';

export default function MobileNav({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab, 
  onLogout,
  driveStatus,
  user 
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-customer', label: 'Add New Customer', icon: UserPlus },
    { id: 'customers', label: 'Customer Records', icon: Users },
    { id: 'orders', label: 'All Orders', icon: ClipboardList },
    { id: 'gallery', label: 'Video Gallery', icon: Video },
    { id: 'search', label: 'Search Customer', icon: Search },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const bottomItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-customer', label: 'Add Order', icon: UserPlus },
    { id: 'customers', label: 'Customers', icon: Users },
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
          <div className="relative flex flex-col w-72 max-w-[80%] bg-[#0d162b] text-slate-200 h-full p-4 justify-between shadow-2xl">
            <div>
              {/* Header with Close */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white">
                    A
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Antra</h2>
                    <p className="text-[10px] text-slate-400">Order & Video Management</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation list */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Footer Info */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="bg-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Google Drive</span>
                <span className={`font-semibold ${driveStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {driveStatus?.connected ? 'Connected' : 'Ready'}
                </span>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 rounded-lg hover:bg-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex justify-around items-center shadow-lg">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-full ${isActive ? 'bg-blue-50 text-blue-600' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
