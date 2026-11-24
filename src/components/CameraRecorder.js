'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Video, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Upload, 
  SwitchCamera, 
  AlertCircle, 
  CheckCircle,
  FileVideo,
  Eye
} from 'lucide-react';

export default function CameraRecorder({ onVideoReady, uploadProgress, isSubmitting }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [facingMode, setFacingMode] = useState('environment'); // Prefer rear camera on mobile
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  const videoLiveRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check available cameras
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          if (videoInputs.length > 1) {
            setHasMultipleCameras(true);
          }
        })
        .catch(err => console.log('Enumerate devices error:', err));
    }
  }, []);

  // Stop camera stream tracks cleanly
  const stopStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [stopStream, previewUrl]);

  // Start Camera
  const startCamera = async (mode = facingMode) => {
    setErrorMessage('');
    stopStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Your browser does not support in-page camera access. Please use Chrome or Safari, or upload an existing video.');
      return;
    }

    try {
      // Try facingMode: environment first on mobile, fallback to generic
      let constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback without exact facingMode or audio if blocked
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .catch(() => navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
      }

      mediaStreamRef.current = stream;
      if (videoLiveRef.current) {
        videoLiveRef.current.srcObject = stream;
        videoLiveRef.current.play().catch(e => console.log('Video play error:', e));
      }
      setCameraActive(true);
      setRecordedBlob(null);
      setPreviewUrl(null);
      setSelectedFileName('');
    } catch (err) {
      console.error('Camera error:', err);
      let msg = 'Could not access camera. Please allow camera and microphone permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please enable camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera or microphone found on this device.';
      }
      setErrorMessage(msg);
      setCameraActive(false);
    }
  };

  // Toggle Front / Rear Camera
  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraActive && !isRecording) {
      await startCamera(nextMode);
    }
  };

  // Start Recording
  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    setErrorMessage('');
    recordedChunksRef.current = [];
    setDuration(0);

    // Pick best supported MIME type
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4'
    ];
    let selectedMime = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        selectedMime = type;
        break;
      }
    }

    try {
      const options = selectedMime ? { mimeType: selectedMime } : {};
      const recorder = new MediaRecorder(mediaStreamRef.current, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = selectedMime || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setPreviewUrl(url);
        stopStream();
        setCameraActive(false);

        // Notify parent
        onVideoReady(blob, {
          name: `recorded_order_video_${Date.now()}.${mime.includes('mp4') ? 'mp4' : 'webm'}`,
          mimeType: mime,
          duration: duration
        });
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // 1-second chunks
      setIsRecording(true);
      setIsPaused(false);

      // Start duration counter
      timerIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Recorder error:', err);
      setErrorMessage('Failed to start recording: ' + err.message);
    }
  };

  // Pause / Resume Recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (!isPaused && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      } else if (isPaused && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        timerIntervalRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      }
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // Retake video
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordedBlob(null);
    setPreviewUrl(null);
    setDuration(0);
    setSelectedFileName('');
    onVideoReady(null, null);
    startCamera();
  };

  // Handle local file selection
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopStream();
    setCameraActive(false);
    setIsRecording(false);

    const url = URL.createObjectURL(file);
    setRecordedBlob(file);
    setPreviewUrl(url);
    setSelectedFileName(file.name);
    setDuration(0);

    onVideoReady(file, {
      name: file.name,
      mimeType: file.type || 'video/mp4',
      duration: 0
    });
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            <span>Order Verification Video Recording</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Capture order assembly & packaging video. Saved permanently to Google Drive.
          </p>
        </div>

        {/* Action switch camera if supported */}
        {hasMultipleCameras && cameraActive && !isRecording && (
          <button
            type="button"
            onClick={toggleCameraFacing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs"
          >
            <SwitchCamera className="w-4 h-4 text-blue-600" />
            <span>Switch to {facingMode === 'environment' ? 'Front' : 'Rear'} Camera</span>
          </button>
        )}
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="mt-1 text-[11px] text-rose-600">
              You can also directly select and upload a video file from your device below.
            </p>
          </div>
        </div>
      )}

      {/* Video Viewport Area */}
      <div className="relative aspect-video max-h-[380px] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
        {/* State 1: Live Camera Stream */}
        <video
          ref={videoLiveRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraActive && !previewUrl ? 'block' : 'hidden'}`}
        />

        {/* State 2: Recorded Preview Video */}
        {previewUrl && (
          <video
            src={previewUrl}
            controls
            playsInline
            className="w-full h-full object-contain bg-black"
          />
        )}

        {/* State 3: Idle (Camera not opened yet) */}
        {!cameraActive && !previewUrl && (
          <div className="text-center p-6 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-blue-400">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Live Camera Offline</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Click &ldquo;Open Camera&rdquo; to start in-browser recording, or upload an existing video file.
              </p>
            </div>
          </div>
        )}

        {/* Live Recording Overlay Badge & Timer */}
        {isRecording && (
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-700 shadow-lg">
            <span className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-red-500 record-pulse'}`}></span>
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              {formatTime(duration)}
            </span>
            {isPaused && (
              <span className="text-[10px] uppercase font-bold text-amber-300 ml-1">PAUSED</span>
            )}
          </div>
        )}

        {/* Preview Verified Badge */}
        {previewUrl && (
          <div className="absolute top-4 left-4 bg-emerald-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg">
            <CheckCircle className="w-4 h-4" />
            <span>Video Ready for Submission</span>
          </div>
        )}
      </div>

      {/* Camera & Recording Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Open Camera Button */}
          {!cameraActive && !previewUrl && (
            <button
              type="button"
              onClick={() => startCamera()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Open Camera</span>
            </button>
          )}

          {/* Start Recording Button */}
          {cameraActive && !isRecording && (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-600/25 transition-all"
            >
              <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
              <span>Start Recording</span>
            </button>
          )}

          {/* Pause / Resume Button */}
          {isRecording && (
            <button
              type="button"
              onClick={pauseRecording}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-all"
            >
              {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          {/* Stop Recording Button */}
          {isRecording && (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all shadow-md"
            >
              <Square className="w-4 h-4 fill-white text-white" />
              <span>Stop Recording</span>
            </button>
          )}

          {/* Retake Video Button */}
          {previewUrl && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRetake}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Video</span>
            </button>
          )}
        </div>

        {/* Upload Existing Video Option */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/*"
            className="hidden"
          />
          <button
            type="button"
            disabled={isRecording || isSubmitting}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-2xs"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>{selectedFileName ? 'Change Video File' : 'Upload Existing Video'}</span>
          </button>
        </div>
      </div>

      {/* Selected File Name / Details Indicator */}
      {selectedFileName && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
          <FileVideo className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold text-slate-800">Selected File:</span>
          <span className="truncate">{selectedFileName}</span>
        </div>
      )}

      {/* Live Upload Progress Bar during order submission */}
      {isSubmitting && (
        <div className="mt-4 bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
              Uploading video & generating Drive records...
            </span>
            <span className="font-mono font-bold text-blue-800">{uploadProgress || 65}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress || 65}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
