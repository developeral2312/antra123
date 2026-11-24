'use client';
import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Cloud, 
  Database, 
  User, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function SettingsView({ user, onLogout }) {
  // Profile State
  const [name, setName] = useState(user?.name || 'Admin');
  const [email, setEmail] = useState(user?.email || 'admin@antra.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Drive State
  const [driveConfig, setDriveConfig] = useState(null);
  const [authMode, setAuthMode] = useState('oauth');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [rootFolderName, setRootFolderName] = useState('CUSTOMER DATABASE');
  const [driveTestResult, setDriveTestResult] = useState(null);
  const [testingDrive, setTestingDrive] = useState(false);
  const [savingDrive, setSavingDrive] = useState(false);

  // DB State
  const [dbStatus, setDbStatus] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  // Fetch initial configs
  useEffect(() => {
    fetch('/api/settings/drive')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setDriveConfig(data.config);
          setAuthMode(data.config.auth_mode || 'oauth');
          setRootFolderName(data.config.root_folder_name || 'CUSTOMER DATABASE');
        }
      })
      .catch(e => console.error(e));

    fetch('/api/settings/database')
      .then(res => res.json())
      .then(data => {
        if (data.database) setDbStatus(data.database);
      })
      .catch(e => console.error(e));
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

  // Test Drive Connection
  const handleTestDrive = async () => {
    setTestingDrive(true);
    setDriveTestResult(null);

    try {
      const res = await fetch('/api/settings/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' })
      });
      const data = await res.json();
      setDriveTestResult(data);
    } catch (err) {
      setDriveTestResult({ success: false, message: err.message });
    } finally {
      setTestingDrive(false);
    }
  };

  // Save Drive Configuration
  const handleSaveDrive = async (e) => {
    e.preventDefault();
    setSavingDrive(true);
    setDriveTestResult(null);

    try {
      const res = await fetch('/api/settings/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_mode: authMode,
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          service_account_json: serviceAccountJson,
          root_folder_name: rootFolderName
        })
      });
      const data = await res.json();
      setDriveTestResult(data.connectionTest || { success: true, message: data.message });
      // Reload config
      const ref = await fetch('/api/settings/drive');
      const refData = await ref.json();
      if (refData.config) setDriveConfig(refData.config);
    } catch (err) {
      setDriveTestResult({ success: false, message: err.message });
    } finally {
      setSavingDrive(false);
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
        // Refresh DB status
        const dbRes = await fetch('/api/settings/database');
        const dbData = await dbRes.json();
        if (dbData.database) setDbStatus(dbData.database);
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
            Configure Google Drive API credentials, administrator security, and database diagnostics.
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

      {/* Section 1: Google Drive Integration Settings */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Google Drive API v3 Integration</h3>
              <p className="text-xs text-slate-500">
                Primary cloud storage for customer dossiers, order PDFs, and packaging videos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${driveConfig?.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {driveConfig?.enabled ? '● Connected' : '○ Ready for OAuth'}
            </span>

            <button
              type="button"
              disabled={testingDrive}
              onClick={handleTestDrive}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingDrive ? 'animate-spin' : ''}`} />
              <span>{testingDrive ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        {/* Live Drive Test Feedback */}
        {driveTestResult && (
          <div className={`p-4 rounded-xl text-xs border ${driveTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            <p className="font-bold flex items-center gap-2">
              {driveTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{driveTestResult.message}</span>
            </p>
            {driveTestResult.user && (
              <p className="mt-1 text-[11px]">
                Connected as: <strong>{driveTestResult.user.displayName}</strong> ({driveTestResult.user.emailAddress})
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSaveDrive} className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-xs font-bold text-slate-700">Authentication Mode:</label>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                <input
                  type="radio"
                  name="auth_mode"
                  value="oauth"
                  checked={authMode === 'oauth'}
                  onChange={() => setAuthMode('oauth')}
                />
                OAuth 2.0 (Client ID & Refresh Token)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                <input
                  type="radio"
                  name="auth_mode"
                  value="service_account"
                  checked={authMode === 'service_account'}
                  onChange={() => setAuthMode('service_account')}
                />
                Google Service Account (JSON Key)
              </label>
            </div>
          </div>

          {authMode === 'oauth' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Google Client ID {driveConfig?.client_id && <span className="text-emerald-600 font-normal">(Configured)</span>}
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. 123456789-xxx.apps.googleusercontent.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Google Client Secret {driveConfig?.has_client_secret && <span className="text-emerald-600 font-normal">(Saved)</span>}
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="GOCSPX-••••••••"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-[11px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">
                  OAuth Refresh Token {driveConfig?.has_refresh_token && <span className="text-emerald-600 font-normal">(Saved)</span>}
                </label>
                <input
                  type="password"
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  placeholder="1//04••••••••"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-[11px]"
                />
              </div>
            </div>
          ) : (
            <div className="text-xs">
              <label className="block text-slate-700 font-bold mb-1">
                Google Service Account JSON {driveConfig?.has_service_account && <span className="text-emerald-600 font-normal">(Key Loaded)</span>}
              </label>
              <textarea
                rows={4}
                value={serviceAccountJson}
                onChange={(e) => setServiceAccountJson(e.target.value)}
                placeholder='Paste content of your service-account-key.json {"type": "service_account", "client_email": "...", "private_key": "..."}'
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-[11px]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Main Root Folder Name</label>
              <input
                type="text"
                value={rootFolderName}
                onChange={(e) => setRootFolderName(e.target.value)}
                placeholder="CUSTOMER DATABASE"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Credentials can also be provided directly via <code>.env</code> file.</span>
            </div>

            <button
              type="submit"
              disabled={savingDrive}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
            >
              {savingDrive ? 'Saving...' : 'Save Drive Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Administrator Profile */}
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

      {/* Section 3: Database & Diagnostics */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Database Diagnostics</h3>
              <p className="text-xs text-slate-500">Relational SQLite storage status and record summary.</p>
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

        {seedMsg && (
          <div className="p-3 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs font-semibold">
            {seedMsg}
          </div>
        )}

        {dbStatus && (
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
              <span className="text-slate-400 font-medium">Database File Size</span>
              <p className="text-lg font-bold text-blue-700 mt-1">{dbStatus.sizeMb} MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
