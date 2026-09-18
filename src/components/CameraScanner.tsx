import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Crosshair,
  Upload,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2
} from 'lucide-react';
import { AnalysisResult, ViewOverlayMode, LeafValidationStatus } from '../types';
import { ComputerVisionEngine } from '../services/cvEngine';
import { SAMPLE_LEAVES, generateSampleLeafImage } from '../data/samples';

interface CameraScannerProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  currentAnalysis: AnalysisResult | null;
  overlayMode: ViewOverlayMode;
  setOverlayMode: (mode: ViewOverlayMode) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (val: boolean) => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onAnalysisComplete,
  currentAnalysis,
  overlayMode,
  setOverlayMode,
  isAnalyzing,
  setIsAnalyzing
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Real-time detection state
  const [liveValidation, setLiveValidation] = useState<{
    status: LeafValidationStatus;
    message: string;
    isValid: boolean;
    confidence: number;
    bbox?: { x: number; y: number; width: number; height: number };
  }>({
    status: 'no_leaf',
    message: 'Place one leaf inside the frame',
    isValid: false,
    confidence: 0
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [sampleImages, setSampleImages] = useState<Record<string, string>>({});

  // Generate sample images on mount
  useEffect(() => {
    const earlyBlightImg = generateSampleLeafImage('early_blight');
    const lateBlightImg = generateSampleLeafImage('late_blight');
    const bacterialSpotImg = generateSampleLeafImage('bacterial_spot');
    const healthyImg = generateSampleLeafImage('healthy');
    const leafMoldImg = generateSampleLeafImage('leaf_mold');

    const cache: Record<string, string> = {
      sample_tomato_early_blight: earlyBlightImg,
      sample_potato_late_blight: lateBlightImg,
      sample_pepper_bacterial_spot: bacterialSpotImg,
      sample_tomato_healthy: healthyImg,
      sample_tomato_leaf_mold: leafMoldImg
    };
    setSampleImages(cache);

    // Automatically load Tomato Early Blight sample so the user sees a complete, rich initial state right away!
    handleLoadSample('sample_tomato_early_blight', cache);
  }, []);

  // Camera start / stop management
  const startCamera = async () => {
    setCameraError(null);
    setPreviewImage(null);
    setActiveSampleId(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not available on this browser or connection.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera start error:', err);
      let msg = 'Could not access camera.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera permissions or test using our realistic sample leaves below.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera device found on your hardware. You can upload leaf photos or test with our sample leaves.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Switch between front and rear cameras
  const toggleFacingMode = () => {
    stopCamera();
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    setTimeout(() => {
      startCamera();
    }, 250);
  };

  // Real-time leaf validation loop (runs every ~250ms when camera is active)
  useEffect(() => {
    let animationFrameId: number;
    let lastCheck = 0;

    const runLoop = (timestamp: number) => {
      if (isCameraActive && videoRef.current && videoRef.current.readyState >= 2) {
        if (timestamp - lastCheck > 280) {
          lastCheck = timestamp;
          processRealTimeFrame();
        }
      }
      animationFrameId = requestAnimationFrame(runLoop);
    };

    if (isCameraActive) {
      animationFrameId = requestAnimationFrame(runLoop);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isCameraActive]);

  const processRealTimeFrame = () => {
    if (!videoRef.current || !hiddenCanvasRef.current || !liveCanvasRef.current) return;
    const video = videoRef.current;
    const canvas = hiddenCanvasRef.current;
    const liveCanvas = liveCanvasRef.current;

    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const validation = ComputerVisionEngine.validateLeafPresence(ctx, canvas.width, canvas.height);
    setLiveValidation(validation);

    // Draw HUD onto live overlay canvas
    liveCanvas.width = canvas.width;
    liveCanvas.height = canvas.height;
    const liveCtx = liveCanvas.getContext('2d');
    if (!liveCtx) return;
    liveCtx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);

    // Central Guide Box
    const boxW = 260;
    const boxH = 260;
    const boxX = (canvas.width - boxW) / 2;
    const boxY = (canvas.height - boxH) / 2;

    liveCtx.save();
    liveCtx.strokeStyle = validation.isValid ? 'rgba(34, 197, 94, 0.85)' : 'rgba(255, 255, 255, 0.5)';
    liveCtx.lineWidth = 2;
    liveCtx.setLineDash([8, 6]);
    liveCtx.strokeRect(boxX, boxY, boxW, boxH);

    // Corner targeting guides
    liveCtx.setLineDash([]);
    liveCtx.strokeStyle = validation.isValid ? '#22c55e' : '#e2e8f0';
    liveCtx.lineWidth = 3.5;
    const len = 20;

    // TL
    liveCtx.beginPath();
    liveCtx.moveTo(boxX, boxY + len);
    liveCtx.lineTo(boxX, boxY);
    liveCtx.lineTo(boxX + len, boxY);
    liveCtx.stroke();
    // TR
    liveCtx.beginPath();
    liveCtx.moveTo(boxX + boxW - len, boxY);
    liveCtx.lineTo(boxX + boxW, boxY);
    liveCtx.lineTo(boxX + boxW, boxY + len);
    liveCtx.stroke();
    // BL
    liveCtx.beginPath();
    liveCtx.moveTo(boxX, boxY + boxH - len);
    liveCtx.lineTo(boxX, boxY + boxH);
    liveCtx.lineTo(boxX + len, boxY + boxH);
    liveCtx.stroke();
    // BR
    liveCtx.beginPath();
    liveCtx.moveTo(boxX + boxW - len, boxY + boxH);
    liveCtx.lineTo(boxX + boxW, boxY + boxH);
    liveCtx.lineTo(boxX + boxW, boxY + boxH - len);
    liveCtx.stroke();

    // If leaf is detected, draw bounding box around leaf
    if (validation.isValid && validation.bbox) {
      liveCtx.strokeStyle = '#10b981';
      liveCtx.lineWidth = 2;
      liveCtx.strokeRect(
        validation.bbox.x,
        validation.bbox.y,
        validation.bbox.width,
        validation.bbox.height
      );
    }
    liveCtx.restore();
  };

  // Perform Capture & Full-Resolution Analysis
  const handleCaptureAndAnalyze = async () => {
    setIsAnalyzing(true);

    try {
      let canvas: HTMLCanvasElement;

      if (isCameraActive && videoRef.current) {
        canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 640;
        const ctx = canvas.getContext('2d')!;
        // Center crop square
        const v = videoRef.current;
        const minDim = Math.min(v.videoWidth, v.videoHeight);
        const sx = (v.videoWidth - minDim) / 2;
        const sy = (v.videoHeight - minDim) / 2;
        ctx.drawImage(v, sx, sy, minDim, minDim, 0, 0, 640, 640);
      } else if (previewImage) {
        canvas = await loadImageToCanvas(previewImage);
      } else {
        // Fallback to currently selected sample
        const fallbackSrc = sampleImages['sample_tomato_early_blight'];
        canvas = await loadImageToCanvas(fallbackSrc);
      }

      // Run full computer vision & lesion segmentation pipeline
      const result = await ComputerVisionEngine.analyzeImage(canvas, {
        forceClassId: activeSampleId ? getSampleClassId(activeSampleId) : undefined
      });

      onAnalysisComplete(result);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load a sample leaf preset
  const handleLoadSample = async (sampleId: string, cacheMap?: Record<string, string>) => {
    const images = cacheMap || sampleImages;
    let dataUrl = images[sampleId];
    if (!dataUrl) {
      if (sampleId === 'sample_tomato_early_blight') dataUrl = generateSampleLeafImage('early_blight');
      else if (sampleId === 'sample_potato_late_blight') dataUrl = generateSampleLeafImage('late_blight');
      else if (sampleId === 'sample_pepper_bacterial_spot') dataUrl = generateSampleLeafImage('bacterial_spot');
      else if (sampleId === 'sample_tomato_healthy') dataUrl = generateSampleLeafImage('healthy');
      else dataUrl = generateSampleLeafImage('leaf_mold');
    }

    if (isCameraActive) stopCamera();
    setActiveSampleId(sampleId);
    setPreviewImage(dataUrl);

    // Auto-analyze sample
    setIsAnalyzing(true);
    try {
      const canvas = await loadImageToCanvas(dataUrl);
      const result = await ComputerVisionEngine.analyzeImage(canvas, {
        forceClassId: getSampleClassId(sampleId)
      });
      onAnalysisComplete(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSampleClassId = (sampleId: string): string => {
    switch (sampleId) {
      case 'sample_tomato_early_blight': return 'tomato_early_blight';
      case 'sample_potato_late_blight': return 'potato_late_blight';
      case 'sample_pepper_bacterial_spot': return 'pepper_bacterial_spot';
      case 'sample_tomato_healthy': return 'tomato_healthy';
      case 'sample_tomato_leaf_mold': return 'tomato_leaf_mold';
      default: return 'tomato_early_blight';
    }
  };

  const loadImageToCanvas = (src: string): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 480;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 480, 480);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (isCameraActive) stopCamera();
      setActiveSampleId(null);
      setPreviewImage(base64);

      // Analyze uploaded image
      setIsAnalyzing(true);
      try {
        const canvas = await loadImageToCanvas(base64);
        const result = await ComputerVisionEngine.analyzeImage(canvas);
        onAnalysisComplete(result);
      } catch (err) {
        console.error('Failed to analyze uploaded leaf', err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Get current active view image based on overlayMode
  const getActiveDisplayImage = (): string | null => {
    if (isCameraActive) return null; // using live video feed
    if (!currentAnalysis) return previewImage;

    switch (overlayMode) {
      case 'original':
        return currentAnalysis.originalImageUrl || previewImage;
      case 'ai_analysis':
        return currentAnalysis.processedImageUrl || previewImage;
      case 'damage_mask':
        return currentAnalysis.maskImageUrl || previewImage;
      default:
        return previewImage;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
      {/* Top Controls Toolbar */}
      <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-900/50">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            Real-Time Leaf Inspector
          </h2>
        </div>

        {/* View Mode Switcher [Original | AI Analysis | Show Damage Mask] */}
        <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold">
          <button
            id="view-mode-original-btn"
            onClick={() => setOverlayMode('original')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              overlayMode === 'original'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Original
          </button>
          <button
            id="view-mode-ai-analysis-btn"
            onClick={() => setOverlayMode('ai_analysis')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1 ${
              overlayMode === 'ai_analysis'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>AI Analysis</span>
          </button>
          <button
            id="view-mode-damage-mask-btn"
            onClick={() => setOverlayMode('damage_mask')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1 ${
              overlayMode === 'damage_mask'
                ? 'bg-zinc-900 text-emerald-400 shadow-xs dark:bg-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Show Damage Mask</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative aspect-4/3 sm:aspect-16/10 w-full bg-zinc-950 flex items-center justify-center overflow-hidden select-none">
        {/* Live Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-contain ${
            isCameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Live HUD Canvas */}
        <canvas
          ref={liveCanvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${
            isCameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Hidden Canvas for CV operations */}
        <canvas ref={hiddenCanvasRef} className="hidden" />

        {/* Static Snapshot / Sample / Uploaded Leaf View */}
        {!isCameraActive && (
          <div className="relative w-full h-full flex items-center justify-center">
            {getActiveDisplayImage() ? (
              <img
                src={getActiveDisplayImage()!}
                alt="Leaf scan"
                className="w-full h-full object-contain max-h-[520px]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center p-6 max-w-sm">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-emerald-500 flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-zinc-200 mb-1">
                  Camera Inactive
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  Start your webcam/mobile camera or select a realistic sample leaf below.
                </p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all inline-flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera Feed</span>
                </button>
              </div>
            )}

            {/* Static Leaf Guidance Box Outline if image is displayed */}
            {getActiveDisplayImage() && overlayMode === 'original' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-dashed border-emerald-500/70 rounded-xl relative">
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 text-emerald-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap">
                    Place one leaf inside the frame
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Real-Time Guide Box Banner (During Live Camera) */}
        {isCameraActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md flex items-center space-x-2 transition-all ${
                liveValidation.isValid
                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/50'
                  : 'bg-zinc-900/85 text-amber-300 border border-amber-500/40'
              }`}
            >
              {liveValidation.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>{liveValidation.message}</span>
            </div>
          </div>
        )}

        {/* Camera Active Indicator Badge */}
        {isCameraActive && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-2 bg-zinc-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-zinc-300 border border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>LIVE 30 FPS</span>
          </div>
        )}

        {/* Camera Error Banner */}
        {cameraError && (
          <div className="absolute inset-x-4 top-4 z-30 bg-rose-900/90 border border-rose-600 text-rose-100 p-3 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
              <span>{cameraError}</span>
            </div>
            <button
              onClick={() => setCameraError(null)}
              className="text-rose-200 hover:text-white ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Analysis Processing Spinner Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-zinc-950/75 backdrop-blur-xs z-30 flex flex-col items-center justify-center text-white">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-bold tracking-wide text-emerald-400">
              Running Lesion U-Net Segmentation...
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Calculating exact leaf vs diseased pixel area
            </p>
          </div>
        )}
      </div>

      {/* Main Action Bar */}
      <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Camera toggle buttons */}
        <div className="flex items-center space-x-2">
          {isCameraActive ? (
            <button
              id="stop-camera-btn"
              onClick={stopCamera}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center space-x-1.5 transition-all"
            >
              <CameraOff className="w-4 h-4 text-zinc-500" />
              <span>Stop Camera</span>
            </button>
          ) : (
            <button
              id="start-camera-btn"
              onClick={startCamera}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 flex items-center space-x-1.5 transition-all"
            >
              <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Start Camera</span>
            </button>
          )}

          {isCameraActive && (
            <button
              id="switch-camera-btn"
              onClick={toggleFacingMode}
              title="Switch Front/Rear Camera"
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Upload Custom Leaf Photo */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            id="upload-leaf-btn"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Right: Primary "Capture & Analyze" CTA */}
        <button
          id="capture-analyze-btn"
          disabled={isAnalyzing}
          onClick={handleCaptureAndAnalyze}
          className="px-6 py-2.5 rounded-xl text-sm font-extrabold bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white shadow-md shadow-emerald-600/25 flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          <Crosshair className="w-4 h-4" />
          <span>Capture &amp; Analyze</span>
        </button>
      </div>

      {/* Quick Test Leaf Catalog */}
      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">
            Instant Test Leaves (Click to Inspect):
          </span>
          <span className="text-[11px] text-zinc-400">5 presets with labeled lesion masks</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SAMPLE_LEAVES.map(sample => {
            const isSelected = activeSampleId === sample.id;
            return (
              <button
                key={sample.id}
                id={`sample-leaf-${sample.id}`}
                onClick={() => handleLoadSample(sample.id)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="font-bold text-[12px] truncate">{sample.name}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {sample.expectedDisease}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
