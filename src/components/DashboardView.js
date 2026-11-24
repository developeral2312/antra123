'use client';
import React from 'react';
import { 
  Users, 
  ShoppingCart, 
  Video, 
  Calendar, 
  ArrowUpRight, 
  Zap, 
  Camera, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Clock, 
  ExternalLink 
} from 'lucide-react';

export default function DashboardView({ 
  stats, 
  setActiveTab, 
  onViewCustomer, 
  onPlayVideo 
}) {
  const metrics = stats?.metrics || {
    totalCustomers: 0,
    totalOrders: 0,
    totalVideos: 0,
    todayOrders: 0,
    customersTrend: '+12%',
    ordersTrend: '+18%',
    videosTrend: '+18%',
    todayTrend: '+8%'
  };

  const recentActivity = stats?.recentActivity || [];
  const recentCustomers = stats?.recentCustomers || [];
  const recentOrders = stats?.recentOrders || [];

  return (
    <div className="space-y-6">
      {/* 4 Top Metric Cards (matching screenshot design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Customers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center p-3">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customers</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {metrics.totalCustomers}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  ↑ {metrics.customersTrend}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center p-3">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {metrics.totalOrders}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  ↑ {metrics.ordersTrend}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Total Videos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center p-3">
              <Video className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Videos</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {metrics.totalVideos}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  ↑ {metrics.videosTrend}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Today's Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center p-3">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Orders</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {metrics.todayOrders}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  ↑ {metrics.todayTrend}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Recent Activity & Record New Order Promo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Recent Activity</span>
              </h2>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {recentActivity.length > 0 ? (
                recentActivity.map((act, i) => {
                  let iconBg = 'bg-blue-100 text-blue-600';
                  if (act.type === 'video_uploaded') iconBg = 'bg-emerald-100 text-emerald-600';
                  if (act.type === 'order_created') iconBg = 'bg-purple-100 text-purple-600';
                  if (act.type === 'customer_updated') iconBg = 'bg-amber-100 text-amber-600';

                  return (
                    <div key={act.id || i} className="flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                          {act.type === 'video_uploaded' ? <Video className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{act.title}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">{act.description}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                        {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No activity recorded yet. Start by recording your first order!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Record New Order Banner Card (from screenshot) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shadow-lg shadow-blue-600/20 flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Record New Order</h2>
                  <p className="text-xs text-blue-100">Add customer details and record order video</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('settings')}
                className="px-3 py-1 bg-white/15 hover:bg-white/25 rounded-full text-xs font-semibold backdrop-blur-xs transition-colors hidden sm:block"
              >
                ⚙ Setup Guide
              </button>
            </div>

            {/* Stepper (1 -> 2 -> 3) matching screenshot */}
            <div className="my-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-around text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center text-xs shadow-md">
                  1
                </div>
                <span className="text-[11px] font-medium text-blue-100 mt-1.5">Fill Details</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-200" />
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <span className="text-[11px] font-medium text-blue-100 mt-1.5">Record Video</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-200" />
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <span className="text-[11px] font-medium text-blue-100 mt-1.5">Submit Order</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('add-customer')}
              className="w-full py-3.5 px-6 bg-white hover:bg-blue-50 text-blue-700 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Start Recording →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Customers & Recent Orders (matching screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers Panel */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Recent Customers</span>
            </h2>
            <button
              onClick={() => setActiveTab('customers')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentCustomers.length > 0 ? (
              recentCustomers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {c.customer_name ? c.customer_name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">{c.customer_name}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {c.customer_id} • {c.phone_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 hidden sm:block">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                    </span>
                    <button
                      onClick={() => onViewCustomer(c.customer_id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No customer records found.
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Panel */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" />
              <span>Recent Orders</span>
            </h2>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Video thumbnail with play button overlay */}
                    <div 
                      onClick={() => ord.video_id && onPlayVideo(ord.video_id, ord.order_number)}
                      className="relative w-14 h-10 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center cursor-pointer group shrink-0"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="w-6 h-6 rounded-full bg-white/80 group-hover:bg-white text-slate-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-110">
                        <Play className="w-3 h-3 fill-slate-900 ml-0.5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                        Order #{ord.order_number} • {ord.customer_id}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {ord.order_date || 'Today'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      Uploaded
                    </span>
                    <button
                      onClick={() => onViewCustomer(ord.customer_id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No orders recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
