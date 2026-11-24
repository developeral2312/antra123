'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import LoginPage from '@/components/LoginPage';
import DashboardView from '@/components/DashboardView';
import AddCustomerView from '@/components/AddCustomerView';
import CustomerRecordsView from '@/components/CustomerRecordsView';
import AllOrdersView from '@/components/AllOrdersView';
import VideoGalleryView from '@/components/VideoGalleryView';
import SearchCustomerView from '@/components/SearchCustomerView';
import SettingsView from '@/components/SettingsView';
import VideoPlayerModal from '@/components/VideoPlayerModal';

export default function Home() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Dashboard Stats & Google Drive status
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Active Video Modal
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Customer ID to view directly if requested
  const [viewCustomerId, setViewCustomerId] = useState(null);

  // Check auth on initial mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  // Fetch Dashboard Stats whenever activeTab is dashboard or when order submitted
  const fetchStats = () => {
    setStatsLoading(true);
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.log('Stats error:', err))
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, activeTab]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setUser(null);
  };

  const handlePlayVideo = (videoId, orderNumber) => {
    setActiveVideoModal({ videoId, orderNumber });
  };

  const handleViewCustomer = (customerId) => {
    setViewCustomerId(customerId);
    setActiveTab('customers');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b132b] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 animate-pulse mx-auto"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Antra Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="h-screen overflow-hidden flex bg-slate-50 text-slate-800">
      {/* Desktop Navy Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        driveStatus={stats?.googleDrive}
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0 pb-16 lg:pb-0">
        <Header
          onToggleMobileNav={() => setMobileNavOpen(true)}
          recentActivity={stats?.recentActivity || []}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              setActiveTab={setActiveTab}
              onViewCustomer={handleViewCustomer}
              onPlayVideo={handlePlayVideo}
            />
          )}

          {activeTab === 'add-customer' && (
            <AddCustomerView
              onOrderSubmitted={() => {
                fetchStats();
                setActiveTab('orders');
              }}
              onViewCustomer={handleViewCustomer}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerRecordsView
              onViewCustomerDetails={handleViewCustomer}
              onPlayVideo={handlePlayVideo}
              onAddOrderForCustomer={(cId) => {
                setActiveTab('add-customer');
              }}
            />
          )}

          {activeTab === 'orders' && (
            <AllOrdersView
              onPlayVideo={handlePlayVideo}
              onViewCustomer={handleViewCustomer}
            />
          )}

          {activeTab === 'gallery' && (
            <VideoGalleryView
              onPlayVideo={handlePlayVideo}
              onViewCustomer={handleViewCustomer}
            />
          )}

          {activeTab === 'search' && (
            <SearchCustomerView
              onViewCustomer={handleViewCustomer}
              onPlayVideo={handlePlayVideo}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={user}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Mobile Drawer & Bottom Navigation */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        driveStatus={stats?.googleDrive}
        user={user}
      />

      {/* Global Video Player Modal */}
      {activeVideoModal && (
        <VideoPlayerModal
          videoId={activeVideoModal.videoId}
          orderNumber={activeVideoModal.orderNumber}
          onClose={() => setActiveVideoModal(null)}
        />
      )}
    </div>
  );
}
