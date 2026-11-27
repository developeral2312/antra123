'use client';
import React, { useState, useEffect } from 'react';
import CameraRecorder from './CameraRecorder';
import { 
  UserPlus, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  UserCheck, 
  Hash, 
  Phone, 
  MapPin, 
  Calendar, 
  AlignLeft, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';

export default function AddCustomerView({ onOrderSubmitted, onViewCustomer }) {
  // Form State
  const [customerMode, setCustomerMode] = useState('new'); // 'new' or 'existing'
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');

  // Video State
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoMeta, setVideoMeta] = useState(null);

  // Status & Progress
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Load existing customers & generate IDs
  useEffect(() => {
    // Default order date to today YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    setOrderDate(today);

    // Auto-generate IDs
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (data.customers) {
          setExistingCustomers(data.customers);
          const nextCustNum = data.customers.length + 1;
          setCustomerId(`CUST${String(nextCustNum).padStart(3, '0')}`);
        }
      })
      .catch(e => console.log('Error fetching customers:', e));

    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (data.orders) {
          const nextOrdNum = data.orders.length + 1;
          setOrderNumber(`ORD-${String(nextOrdNum).padStart(3, '0')}`);
        }
      })
      .catch(e => console.log('Error fetching orders:', e));
  }, []);

  // When an existing customer is selected
  const handleSelectExisting = (cId) => {
    setSelectedCustomerId(cId);
    const found = existingCustomers.find(c => c.customer_id === cId);
    if (found) {
      setCustomerId(found.customer_id);
      setCustomerName(found.customer_name);
      setPhoneNumber(found.phone_number);
      setAddress(found.address);
    }
  };

  // Video ready callback from CameraRecorder
  const handleVideoReady = (blob, meta) => {
    setVideoBlob(blob);
    setVideoMeta(meta);
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter Customer Name.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter Phone Number.');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Please enter Customer Address.');
      return;
    }
    if (!orderNumber.trim()) {
      setErrorMessage('Please enter Order Number.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append('customer_name', customerName);
      formData.append('customer_id', customerId);
      formData.append('phone_number', phoneNumber);
      formData.append('address', address);

      formData.append('order_number', orderNumber);
      formData.append('order_date', orderDate);
      formData.append('description', description);
      formData.append('remarks', remarks);

      if (videoBlob) {
        formData.append('video', videoBlob, videoMeta?.name || `video_${orderNumber}.mp4`);
        formData.append('duration_seconds', videoMeta?.duration || 0);
      }

      setUploadProgress(45);

      const res = await fetch('/api/orders', {
        method: 'POST',
        body: formData
      });

      setUploadProgress(85);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }

      setUploadProgress(100);
      setSuccessInfo(data);

    } catch (err) {
      console.error('Order submit error:', err);
      setErrorMessage(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successInfo) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md text-center max-w-2xl mx-auto space-y-6">
        <div className="w-18 h-18 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
            Order Submitted & Verified
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            Order #{successInfo.order_number} Successfully Recorded!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Customer dossier updated for <strong>{customerId}</strong>. All documents and video file are saved in PostgreSQL and local verified storage.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Customer:</span>
            <p className="font-bold text-slate-800">{customerName} ({customerId})</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Order Number:</span>
            <p className="font-bold text-blue-600">{successInfo.order_number}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Video Archive:</span>
            <p className="font-bold text-emerald-600">{videoBlob ? 'Verified & Stored' : 'No Video Attached'}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Database Engine:</span>
            <p className="font-bold text-slate-800">PostgreSQL Verified</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onViewCustomer(customerId)}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>View Customer Profile & PDFs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSuccessInfo(null);
              setCustomerName('');
              setPhoneNumber('');
              setAddress('');
              setDescription('');
              setRemarks('');
              setVideoBlob(null);
              setVideoMeta(null);
              // refresh IDs
              const nextId = parseInt(customerId.replace('CUST', ''), 10) + 1;
              setCustomerId(`CUST${String(nextId).padStart(3, '0')}`);
              const nextOrd = parseInt(orderNumber.replace('ORD-', ''), 10) + 1;
              setOrderNumber(`ORD-${String(nextOrd).padStart(3, '0')}`);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
          >
            Record Another Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <UserPlus className="w-6 h-6 text-blue-600" />
            <span>Add New Customer & Order</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Fill customer credentials, capture in-browser video verification, and save to PostgreSQL database.
          </p>
        </div>

        {/* Mode Selector: New Customer vs Existing Customer */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setCustomerMode('new');
              setCustomerName('');
              setPhoneNumber('');
              setAddress('');
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              customerMode === 'new' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            New Customer
          </button>
          <button
            type="button"
            onClick={() => setCustomerMode('existing')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              customerMode === 'existing' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Existing Customer ({existingCustomers.length})
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Customer Details Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                1
              </span>
              <span>Customer Registration Details</span>
            </h3>

            {customerMode === 'existing' && (
              <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                <UserCheck className="w-4 h-4" /> Adding new order to existing ID
              </span>
            )}
          </div>

          {/* If existing customer mode */}
          {customerMode === 'existing' && (
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Existing Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectExisting(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- Choose Customer --</option>
                {existingCustomers.map(c => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.customer_id} • {c.customer_name} ({c.phone_number})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer ID <span className="text-slate-400 font-normal">(Auto-generated / Editable)</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value.toUpperCase())}
                  placeholder="CUST001"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Full Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Customer Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, PIN"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Order Information Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                2
              </span>
              <span>Order Details</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Order Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Order Number <span className="text-slate-400 font-normal">(Auto-generated / Editable)</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="ORD-001"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Order Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Order Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Order Description
              </label>
              <div className="relative">
                <AlignLeft className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details of the items, serial numbers, customizations, or packaging specifications..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Additional Remarks */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Additional Remarks
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Delivery notes, special verification instructions, warranty notes..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Camera & Video Recording Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                3
              </span>
              <span>Camera Video Verification</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              High Definition • Resumable Upload
            </span>
          </div>

          <CameraRecorder 
            onVideoReady={handleVideoReady}
            uploadProgress={uploadProgress}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            <span>{isSubmitting ? 'Processing & Archiving Order...' : 'Submit Order & Save Record'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
