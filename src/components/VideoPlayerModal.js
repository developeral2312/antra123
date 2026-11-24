'use client';
import React, { useState, useRef } from 'react';
import { X, Download, Maximize, Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function VideoPlayerModal({ videoId, orderNumber, onClose }) {
  if (!videoId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Order Verification Video • {orderNumber ? `#${orderNumber}` : ''}
              </h3>
              <p className="text-[11px] text-slate-400">Streamed from Antra Cloud Storage Archive</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/videos/stream/${videoId}`}
              download={`order_video_${orderNumber || videoId}.mp4`}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Download Video"
            >
              <Download className="w-5 h-5" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Box */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          <video
            src={`/api/videos/stream/${videoId}`}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          >
            Your browser does not support HTML5 video streaming.
          </video>
        </div>
      </div>
    </div>
  );
}
