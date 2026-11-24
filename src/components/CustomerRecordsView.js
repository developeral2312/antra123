'use client';
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Calendar, 
  ArrowUpDown, 
  FileText, 
  Play, 
  Download, 
  ExternalLink, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  X,
  Plus,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';

export default function CustomerRecordsView({ onViewCustomerDetails, onPlayVideo, onAddOrderForCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Customer Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Edit Customer Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const fetchCustomers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (sortOrder) params.append('sort', sortOrder);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    fetch(`/api/customers?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setCustomers(data.customers || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [sortOrder, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  // Open Customer Detail Modal
  const openCustomerModal = (customerId) => {
    setModalLoading(true);
    fetch(`/api/customers/${customerId}`)
      .then(res => res.json())
      .then(data => {
        setSelectedCustomer(data.customer);
        setCustomerOrders(data.orders || []);
        setEditName(data.customer.customer_name);
        setEditPhone(data.customer.phone_number);
        setEditAddress(data.customer.address);
      })
      .catch(e => console.error(e))
      .finally(() => setModalLoading(false));
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.customer_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: editName,
          phone_number: editPhone,
          address: editAddress
        })
      });
      if (res.ok) {
        setIsEditing(false);
        openCustomerModal(selectedCustomer.customer_id);
        fetchCustomers();
      }
    } catch (err) {
      console.error('Save edit error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Title and Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Customer Records</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse all registered customers, download official PDF dossiers, and view order histories.
          </p>
        </div>

        {/* Search & Filter Form */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Name, Phone..."
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-52 sm:w-64"
            />
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Customers List View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading customer records...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Customers Found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or register a new customer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-blue-700">{c.customer_id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{c.customer_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.phone_number}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                        {c.total_orders || 0} Orders
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openCustomerModal(c.customer_id)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Full Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                  {selectedCustomer.customer_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">
                    {selectedCustomer.customer_name}
                  </h3>
                  <p className="text-xs text-blue-600 font-bold">
                    {selectedCustomer.customer_id} • Registered {new Date(selectedCustomer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={`/api/customers/${selectedCustomer.customer_id}/pdf`}
                download
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Download Customer Dossier (PDF)</span>
              </a>

              {selectedCustomer.google_drive_folder_id ? (
                <a
                  href={`https://drive.google.com/drive/folders/${selectedCustomer.google_drive_folder_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                  <span>Open in Google Drive</span>
                </a>
              ) : (
                <span className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-xs font-medium border border-slate-200">
                  📁 Stored in CUSTOMER DATABASE/{selectedCustomer.customer_id}
                </span>
              )}

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ml-auto"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Customer'}</span>
              </button>
            </div>

            {/* Customer Details Section / Edit Form */}
            {isEditing ? (
              <div className="bg-slate-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Edit Customer Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">Full Address</label>
                    <textarea
                      rows={2}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Phone Number</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedCustomer.phone_number}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Customer ID</span>
                  <p className="font-bold text-blue-700 text-sm mt-0.5">{selectedCustomer.customer_id}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-medium">Registered Address</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedCustomer.address}</p>
                </div>
              </div>
            )}

            {/* Order History Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900">
                  Order History ({customerOrders.length})
                </h4>
              </div>

              {customerOrders.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                  No orders recorded for this customer yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-blue-700 text-sm">Order #{ord.order_number}</span>
                          <span className="text-xs text-slate-400 ml-2 font-medium">
                            {ord.order_date || 'N/A'}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {ord.upload_status || 'Uploaded'}
                        </span>
                      </div>

                      {ord.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {ord.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                        {ord.video_id ? (
                          <button
                            onClick={() => onPlayVideo(ord.video_id, ord.order_number)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Play Verification Video ({Math.round(ord.duration_seconds || 0)}s)</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No video recorded</span>
                        )}

                        <a
                          href={`/api/orders/${ord.order_number}/pdf`}
                          download
                          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Order PDF</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
