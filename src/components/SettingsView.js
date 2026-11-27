'use client';
import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  User, 
  LogOut, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function SettingsView({ user, onLogout }) {
  // Profile State
  const [name, setName] = useState(user?.name || 'Admin');
  const [email, setEmail] = useState(user?.email || 'admin@antra.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // DB State
  const [dbStatus, setDbStatus] = useState(null);
  const [dbError, setDbError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  // Fetch initial PostgreSQL diagnostics
  const fetchDbStatus = () => {
    setDbError('');
    fetch('/api/settings/database')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Database connection failed');
        if (data.database) setDbStatus(data.database);
      })
      .catch((e) => setDbError(e.message));
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  // Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setProfileMsg({ text: err.message, type: 'error' });
    }
  };

  // Seed Sample Data for Instant Testing
  const handleSeedDemo = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await fetch('/api/settings/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_demo' })
      });
      const data = await res.json();
      if (data.success) {
        setSeedMsg('Sample customers & orders populated successfully!');
        fetchDbStatus();
      }
    } catch (err) {
      setSeedMsg('Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <span>Application Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure administrator security, PostgreSQL database status, and diagnostics.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Section 1: Administrator Profile */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Administrator Profile & Security</h3>
            <p className="text-xs text-slate-500">Manage administrator email and update login password.</p>
          </div>
        </div>

        {profileMsg.text && (
          <div className={`p-3 rounded-xl text-xs ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Admin Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Current Password (if changing)</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Update Credentials
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: PostgreSQL Database & Diagnostics */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">PostgreSQL Database & Diagnostics</h3>
              <p className="text-xs text-slate-500">Relational PostgreSQL storage status and record summary.</p>
            </div>
          </div>

          <button
            type="button"
            disabled={seeding}
            onClick={handleSeedDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seeding ? 'Seeding...' : 'Seed Sample Data for Testing'}</span>
          </button>
        </div>

        {dbError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{dbError}</span>
          </div>
        )}

        {seedMsg && (
          <div className="p-3 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs font-semibold">
            {seedMsg}
          </div>
        )}

        {dbStatus && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected to {dbStatus.name}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                {dbStatus.version}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Customers</span>
                <p className="text-lg font-bold text-slate-800 mt-1">{dbStatus.counts.customers}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Orders</span>
                <p className="text-lg font-bold text-slate-800 mt-1">{dbStatus.counts.orders}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Video Archives</span>
                <p className="text-lg font-bold text-slate-800 mt-1">{dbStatus.counts.videos}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Database Size</span>
                <p className="text-lg font-bold text-blue-700 mt-1">{dbStatus.sizeMb} MB</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
