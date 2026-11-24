'use client';
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  ClipboardList, 
  ArrowRight, 
  Phone, 
  MapPin, 
  Eye, 
  Calendar 
} from 'lucide-react';

export default function SearchCustomerView({ onViewCustomer, onPlayVideo }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ customers: [], orders: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ customers: [], orders: [] });
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then(res => res.json())
        .then(data => {
          setResults(data);
          setHasSearched(true);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Input Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Search className="w-6 h-6 text-blue-600" />
            <span>Search Customer Database</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Instantly search across customer IDs, names, phone numbers, and order numbers.
          </p>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type Customer ID (e.g. CUST001), Name (e.g. Rahul), Phone, or Order #..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-inner"
          />
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Searching Antra database...
        </div>
      )}

      {/* Results Section */}
      {!loading && hasSearched && (
        <div className="space-y-6">
          {/* Matched Customers */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Customer Results ({results.customers?.length || 0})</span>
              </span>
            </h3>

            {results.customers?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No matching customer records found.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {results.customers.map(c => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                        {c.customer_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{c.customer_name}</h4>
                        <p className="text-xs text-slate-500">
                          <span className="font-bold text-blue-700">{c.customer_id}</span> • {c.phone_number}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">{c.address}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onViewCustomer(c.customer_id)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Profile</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matched Orders */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-600" />
                <span>Order Results ({results.orders?.length || 0})</span>
              </span>
            </h3>

            {results.orders?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No matching orders found.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {results.orders.map(o => (
                  <div key={o.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700 text-sm">Order #{o.order_number}</span>
                        <span className="text-xs text-slate-400 font-medium">{o.order_date}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Customer: <strong className="text-slate-800">{o.customer_name}</strong> ({o.customer_id})
                      </p>
                      {o.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 italic">{o.description}</p>
                      )}
                    </div>

                    <button
                      onClick={() => onViewCustomer(o.customer_id)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0"
                    >
                      View Order
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
