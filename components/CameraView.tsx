import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Aperture } from 'lucide-react';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [flashEffect, setFlashEffect] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Try environment camera first (mobile)
      try {
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        if (videoRef.current) {
            videoRef.current.srcObject = newStream;
        }
        setError('');
        return;
      } catch (e) {
        console.warn("Environment camera failed, trying fallback", e);
      }

      // Fallback to any available video source (PC/Laptop)
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false 
      });
      setStream(fallbackStream);
      if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
      }
      setError('');

    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied or unavailable.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(imageData);
    }
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col items-center justify-center font-sans">
      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover transition-opacity duration-300 ${stream ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-[60] p-6 text-center border-2 border-red-500/20 m-4 rounded-lg backdrop-blur">
          <div>
            <p className="text-red-500 mb-6 text-lg font-bold tracking-widest uppercase">{error}</p>
            <button 
              onClick={startCamera}
              className="px-8 py-3 bg-red-500/10 border border-red-500 text-red-500 font-bold hover:bg-red-500/20 transition-all uppercase tracking-wider cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Flash Effect Overlay */}
      <div 
        className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 ${flashEffect ? 'opacity-80' : 'opacity-0'} z-20`}
      />

      {/* HUD Overlays - Low Z-Index */}
      <div className="absolute inset-0 pointer-events-none p-6 z-10 flex flex-col justify-between">
         {/* Top HUD */}
         <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1 bg-black/40 p-2 rounded backdrop-blur-sm border border-cyan-500/20">
               <span className="text-cyan-400 font-bold text-xl tracking-wider">VISUAL</span>
               <span className="text-white text-xs tracking-[0.3em] font-medium">INTELLIGENCE</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-cyan-500/20 backdrop-blur-sm">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               <span className="text-cyan-400 text-[10px] font-bold">ONLINE</span>
            </div>
         </div>
      </div>

      {/* Controls - High Z-Index */}
      <div className="absolute bottom-24 w-full flex justify-center items-center z-50 pointer-events-auto">
         {/* Shutter Button */}
         <button 
          onClick={handleCapture}
          className="group relative h-20 w-20 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
         >
           <div className="absolute inset-0 rounded-full border-2 border-cyan-500/50 group-hover:border-cyan-400/80 transition-colors" />
           <div className="absolute inset-1 rounded-full border border-cyan-500/30 group-hover:scale-95 transition-transform duration-300" />
           <div className="h-16 w-16 bg-cyan-500/20 backdrop-blur-sm rounded-full border-2 border-cyan-400 flex items-center justify-center group-active:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              <Aperture size={28} className="text-cyan-200 group-active:text-black" />
           </div>
         </button>
      </div>
    </div>
  );
};