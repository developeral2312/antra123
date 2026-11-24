'use client';
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Play, 
  Download, 
  ExternalLink, 
  Calendar,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';

export default function AllOrdersView({ onPlayVideo, onViewCustomer }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);
    if (sort) params.append('sort', sort);

    fetch(`/api/orders?${params.toString()}`)
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            <span>All Customer Orders</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive archive of recorded customer orders and video verification logs.
          </p>
        </div>

        {/* Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order #, Customer..."
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 sm:w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Video Status</option>
            <option value="uploaded">Uploaded</option>
            <option value="saved_locally">Stored Locally</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Orders Found</p>
            <p className="text-xs text-slate-400">Try adjusting your filter or record a new order.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards (Visible on screens < md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      #{ord.order_number}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {ord.order_date || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <button
                      onClick={() => onViewCustomer(ord.customer_id)}
                      className="text-left group"
                    >
                      <p className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                        {ord.customer_name}
                      </p>
                      <p className="text-xs text-slate-400">{ord.customer_id}</p>
                    </button>
                    {ord.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {ord.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      {ord.upload_status || 'Uploaded'}
                    </span>

                    <div className="flex items-center gap-2">
                      {ord.video_id && (
                        <button
                          onClick={() => onPlayVideo(ord.video_id, ord.order_number)}
                          title="Play Video"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4 fill-blue-600" />
                        </button>
                      )}

                      <a
                        href={`/api/orders/${ord.order_number}/pdf`}
                        download
                        title="Download Order PDF"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 text-blue-600" />
                      </a>

                      <button
                        onClick={() => onViewCustomer(ord.customer_id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (Visible on screens >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Order Number</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Order Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Video Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-blue-700">{ord.order_number}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onViewCustomer(ord.customer_id)}
                          className="text-left group"
                        >
                          <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{ord.customer_name}</p>
                          <p className="text-[11px] text-slate-400">{ord.customer_id}</p>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{ord.order_date || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {ord.description || 'No description'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {ord.upload_status || 'Uploaded'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {ord.video_id && (
                            <button
                              onClick={() => onPlayVideo(ord.video_id, ord.order_number)}
                              title="Play Video"
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                            >
                              <Play className="w-4 h-4 fill-blue-600" />
                            </button>
                          )}

                          <a
                            href={`/api/orders/${ord.order_number}/pdf`}
                            download
                            title="Download Order PDF"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4 text-blue-600" />
                          </a>

                          <button
                            onClick={() => onViewCustomer(ord.customer_id)}
                            title="View Customer"
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
