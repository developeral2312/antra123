'use client';
import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Play, 
  Download, 
  ExternalLink, 
  Search, 
  Clock, 
  Calendar, 
  User, 
  CheckCircle, 
  X,
  FileVideo
} from 'lucide-react';

export default function VideoGalleryView({ onPlayVideo, onViewCustomer }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchVideos = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    fetch(`/api/videos?${params.toString()}`)
      .then(res => res.json())
      .then(data => setVideos(data.videos || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVideos();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Video className="w-6 h-6 text-blue-600" />
            <span>Order Video Gallery</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse, stream, and download high-definition order packaging and verification recordings.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order # or Customer..."
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-56 sm:w-64"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Search
          </button>
        </form>
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading video recordings...
        </div>
      ) : videos.length === 0 ? (
        <div className="p-16 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
          <FileVideo className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Videos Found</p>
          <p className="text-xs text-slate-400">Record an order with the in-page camera to archive videos here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Video Card Thumbnail Area */}
                <div 
                  onClick={() => onPlayVideo(vid.id, vid.order_number)}
                  className="relative aspect-video bg-slate-900 flex items-center justify-center cursor-pointer group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  {/* Big Play Overlay */}
                  <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-white text-blue-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 z-10">
                    <Play className="w-5 h-5 fill-blue-600 ml-0.5" />
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600/90 text-white backdrop-blur-xs">
                      #{vid.order_number}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-xs">
                      {vid.upload_status || 'Uploaded'}
                    </span>
                  </div>

                  {/* Duration Badge Bottom Right */}
                  <div className="absolute bottom-2.5 right-3 z-10 text-[11px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded-md">
                    {Math.round(vid.duration_seconds || 0)}s
                  </div>
                </div>

                {/* Video Info Body */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 leading-tight">
                        {vid.customer_name}
                      </h3>
                      <p className="text-xs text-blue-600 font-semibold mt-0.5">
                        {vid.customer_id}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {vid.created_at ? new Date(vid.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>

                  {vid.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {vid.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => onViewCustomer(vid.customer_id)}
                  className="font-bold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Customer Record →
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={`/api/videos/stream/${vid.id}`}
                    download={vid.video_name || `order_${vid.order_number}.mp4`}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 transition-colors shadow-2xs"
                    title="Download Video File"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onPlayVideo(vid.id, vid.order_number)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Watch</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
