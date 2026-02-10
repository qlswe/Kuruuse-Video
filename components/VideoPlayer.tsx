import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoData, VideoQuality } from '../types';
import { logger } from '../services/logger';

interface VideoPlayerProps {
  video: VideoData;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  const [quality, setQuality] = useState<VideoQuality>('auto');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('v_vol') || '0.7'));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isQualityMenuOpen) {
      controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying, isQualityMenuOpen]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleQualityChange = (e: React.MouseEvent, newQuality: VideoQuality) => {
    e.preventDefault();
    e.stopPropagation();
    const time = videoRef.current?.currentTime || 0;
    setQuality(newQuality);
    setIsLoading(true);
    setIsQualityMenuOpen(false);
    localStorage.setItem('v_last_time', time.toString());
    logger.log('info', `Stream switched to: ${newQuality}`);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setIsLoading(true);
    v.src = video.sources[quality];
    v.load();
    v.volume = volume;

    const onCanPlay = () => {
      setIsLoading(false);
      setDuration(v.duration);
      const saved = localStorage.getItem('v_last_time');
      if (saved) {
        v.currentTime = parseFloat(saved);
        localStorage.removeItem('v_last_time');
      }
      if (isPlaying) v.play().catch(() => {});
    };

    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('playing', () => { setIsPlaying(true); setIsLoading(false); });
    v.addEventListener('pause', () => setIsPlaying(false));
    v.addEventListener('waiting', () => setIsLoading(true));
    v.addEventListener('seeking', () => setIsSeeking(true));
    v.addEventListener('seeked', () => setIsSeeking(false));
    return () => v.removeEventListener('canplay', onCanPlay);
  }, [quality, video]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl md:rounded-3xl overflow-hidden shadow-2xl group select-none touch-none"
      onMouseMove={handleActivity}
      onTouchStart={handleActivity}
    >
      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 p-3 md:p-6 z-[100] bg-gradient-to-b from-black/90 to-transparent transition-all duration-500 flex justify-between items-center ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col">
          <span className="text-[7px] md:text-[9px] font-pixel text-purple-400 tracking-widest uppercase">Live_Feed</span>
          <h3 className="text-white font-orbitron text-[10px] md:text-sm truncate max-w-[150px] uppercase">{video.title}</h3>
        </div>
        <button onClick={onClose} className="w-8 h-8 md:w-10 md:h-10 bg-white/5 hover:bg-red-500/80 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all">
          <i className="fas fa-times text-xs md:text-base"></i>
        </button>
      </div>

      {/* Video Content */}
      <div className="w-full h-full relative flex items-center justify-center bg-black">
        {(isLoading || isSeeking) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
            <div className="w-10 h-10 border-2 border-purple-500/10 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full object-contain cursor-pointer"
          onTimeUpdate={() => !isSeeking && videoRef.current && setCurrentTime(videoRef.current.currentTime)}
          onClick={togglePlay}
          /* crossOrigin="anonymous" удален для исправления CORS на uCoz */
          playsInline
        />
      </div>

      {/* Quality Menu */}
      {isQualityMenuOpen && (
        <div className="absolute inset-0 z-[1000] pointer-events-none flex items-end justify-end p-4 md:p-8">
           <div className="fixed inset-0 pointer-events-auto bg-black/10" onClick={() => setIsQualityMenuOpen(false)}></div>
           <div className="relative pointer-events-auto w-32 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-2 duration-200 mb-14 md:mb-20">
              {(['auto', 'high', 'medium', 'low'] as VideoQuality[]).map(q => (
                <button 
                  key={q} 
                  onClick={(e) => handleQualityChange(e, q)}
                  className={`w-full px-4 py-3 text-left text-[10px] font-bold uppercase border-b border-white/5 last:border-0 transition-colors ${quality === q ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                >
                  {q === 'high' ? '1080P' : q === 'medium' ? '720P' : q === 'low' ? '360P' : 'AUTO'}
                </button>
              ))}
           </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 md:p-8 bg-gradient-to-t from-black via-black/40 to-transparent z-[200] transition-all duration-500 ${showControls || !isPlaying ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        
        {/* Timeline */}
        <div className="relative w-full h-6 mb-3 flex items-center group/timeline">
          <div className="absolute w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.7)]" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}></div>
          </div>
          <input type="range" min="0" max={duration || 0} step="0.01" value={currentTime} onMouseDown={() => setIsSeeking(true)} onMouseUp={() => setIsSeeking(false)} onChange={(e) => {
            const val = parseFloat(e.target.value);
            setCurrentTime(val);
            if (videoRef.current) videoRef.current.currentTime = val;
          }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
          <div className="absolute w-3 h-3 bg-white rounded-full shadow-lg pointer-events-none" style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white text-xl hover:text-purple-400">
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            <div className="text-[10px] font-mono text-zinc-400">
              <span className="text-white">{formatTime(currentTime)}</span>
              <span className="mx-1 opacity-20">/</span>
              <span>{formatTime(duration)}</span>
            </div>
            
            {/* Микшер громкости */}
            <div className="flex items-center gap-2 ml-4 group/volume">
              <button 
                onClick={() => {
                  const newVol = volume > 0 ? 0 : 0.7;
                  setVolume(newVol);
                  if (videoRef.current) videoRef.current.volume = newVol;
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <i className={`fas ${volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'}`}></i>
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={volume} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (videoRef.current) videoRef.current.volume = val;
                  localStorage.setItem('v_vol', val.toString());
                }}
                className="w-16 md:w-24 h-1 bg-white/10 rounded-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsQualityMenuOpen(!isQualityMenuOpen); }}
              className={`px-3 py-1 border rounded-lg text-[9px] font-bold uppercase transition-all ${isQualityMenuOpen ? 'bg-purple-600 text-white border-purple-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}
            >
              {quality === 'auto' ? 'AUTO' : quality === 'high' ? '1080P' : quality === 'medium' ? '720P' : '360P'}
            </button>
            <button onClick={toggleFullscreen} className="text-zinc-400 hover:text-white w-6 flex justify-center text-lg">
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
