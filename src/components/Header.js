'use client';
import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Menu, X, Check, Video, UserPlus, Package } from 'lucide-react';

export default function Header({ onToggleMobileNav, recentActivity = [] }) {
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    setCurrentDateStr(formatted);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title & App Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 hidden sm:flex items-center justify-center font-bold text-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Customer Order Management System
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Manage Customers • Record Orders • Store in Google Drive
          </p>
        </div>
      </div>

      {/* Header Right Controls */}
      <div className="flex items-center gap-3">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {recentActivity.length > 0 ? Math.min(recentActivity.length, 3) : 2}
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">Recent Notifications</span>
                <span className="text-xs font-semibold text-blue-600">Active</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((act, i) => (
                    <div key={i} className="px-4 py-2.5 hover:bg-slate-50 transition-colors">
                      <p className="text-xs font-semibold text-slate-800">{act.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Date Display Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>{currentDateStr || 'Today'}</span>
        </div>
      </div>
    </header>
  );
}
