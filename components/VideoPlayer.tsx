import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoData, VideoQuality, Reactions, Comment } from '../types';
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
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- ЛОГИКА ОГРАНИЧЕНИЙ ---
  
  const [reactions, setReactions] = useState<Reactions>(() => {
    const saved = localStorage.getItem(`v_global_reactions_${video.id}`);
    return saved ? JSON.parse(saved) : { like: 0, love: 0, wow: 0 };
  });

  const [userReaction, setUserReaction] = useState<keyof Reactions | null>(() => {
    return localStorage.getItem(`v_global_user_react_${video.id}`) as keyof Reactions | null;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem(`v_global_comments_${video.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [userCommentCount, setUserCommentCount] = useState(() => {
    return parseInt(localStorage.getItem(`v_global_user_comment_count_${video.id}`) || '0');
  });

  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
    localStorage.setItem('v_vol', val.toString());
  };

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ ПОЛНОЭКРАННОГО РЕЖИМА
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        logger.log('error', `Fullscreen request failed: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleReaction = (type: keyof Reactions) => {
    const currentReactions = { ...reactions };
    const storageKey = `v_global_user_react_${video.id}`;
    
    if (userReaction === type) {
      currentReactions[type] = Math.max(0, currentReactions[type] - 1);
      setUserReaction(null);
      localStorage.removeItem(storageKey);
    } else {
      if (userReaction) {
        currentReactions[userReaction] = Math.max(0, currentReactions[userReaction] - 1);
      }
      currentReactions[type] += 1;
      setUserReaction(type);
      localStorage.setItem(storageKey, type);
    }

    setReactions(currentReactions);
    localStorage.setItem(`v_global_reactions_${video.id}`, JSON.stringify(currentReactions));
  };

  const postComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || userCommentCount >= 10) return;

    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      author: "NODE_" + Math.random().toString(36).substr(2, 4).toUpperCase(),
      text: newComment.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [comment, ...comments];
    const newCount = userCommentCount + 1;

    setComments(updated);
    setUserCommentCount(newCount);
    setNewComment("");
    
    localStorage.setItem(`v_global_comments_${video.id}`, JSON.stringify(updated));
    localStorage.setItem(`v_global_user_comment_count_${video.id}`, newCount.toString());
  };

  const deleteComment = (id: string) => {
    const updated = comments.filter(c => c.id !== id);
    const newCount = Math.max(0, userCommentCount - 1);
    
    setComments(updated);
    setUserCommentCount(newCount);
    
    localStorage.setItem(`v_global_comments_${video.id}`, JSON.stringify(updated));
    localStorage.setItem(`v_global_user_comment_count_${video.id}`, newCount.toString());
  };

  const startEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditingText(c.text);
  };

  const saveEdit = () => {
    if (!editingText.trim()) return;
    const updated = comments.map(c => c.id === editingId ? { ...c, text: editingText.trim() } : c);
    setComments(updated);
    setEditingId(null);
    localStorage.setItem(`v_global_comments_${video.id}`, JSON.stringify(updated));
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setIsLoading(true);
    const savedTime = currentTime;
    v.src = video.sources[quality];
    v.load();
    v.volume = volume;
    const onCanPlay = () => {
      setIsLoading(false);
      setDuration(v.duration);
      if (savedTime > 0) v.currentTime = savedTime;
      if (isPlaying) v.play().catch(() => {});
    };
    v.addEventListener('canplay', onCanPlay);
    return () => v.removeEventListener('canplay', onCanPlay);
  }, [quality, video]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 group"
        onMouseMove={handleActivity}
        onTouchStart={handleActivity}
      >
        <div className="w-full h-full relative flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
              <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
          )}
          <video
            ref={videoRef}
            className="w-full h-full object-contain cursor-pointer"
            onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
          />
        </div>

        {/* Управление плеером */}
        <div className={`absolute inset-0 z-40 bg-gradient-to-t from-black/80 via-transparent transition-opacity duration-500 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-center">
            <h3 className="text-white font-orbitron text-[10px] md:text-xs uppercase tracking-widest truncate max-w-[200px]">{video.title}</h3>
            <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-red-500/80 rounded-xl flex items-center justify-center border border-white/10 transition-all">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 space-y-4">
            {/* Таймлайн */}
            <div className="relative w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
              <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentTime(val);
                if (videoRef.current) videoRef.current.currentTime = val;
              }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-8">
                <button onClick={togglePlay} className="text-white text-2xl md:text-3xl transition-transform active:scale-90">
                  <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>

                {/* Микшер громкости в стиле плеера (без фона) */}
                <div className="flex items-center gap-2 group/volume">
                  <i className="fas fa-volume-down text-zinc-500 text-[10px]"></i>
                  <div className="w-16 md:w-24 flex items-center">
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} />
                  </div>
                  <i className="fas fa-volume-up text-zinc-500 text-[10px]"></i>
                </div>

                <div className="hidden sm:block text-[10px] font-mono text-zinc-500">
                  <span className="text-white">{formatTime(currentTime)}</span>
                  <span className="mx-2 opacity-20">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-white uppercase hover:bg-white/10 transition-colors">
                  {quality.toUpperCase()}
                </button>
                <button onClick={toggleFullscreen} className="text-zinc-500 hover:text-white transition-colors p-2">
                  <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-lg`}></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {isQualityMenuOpen && (
          <div className="absolute right-4 bottom-24 z-[60] w-32 bg-zinc-900/95 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl">
             {(['auto', 'high', 'medium', 'low'] as VideoQuality[]).map(q => (
               <button key={q} onClick={() => { setQuality(q); setIsQualityMenuOpen(false); }} className={`w-full px-4 py-3 text-left text-[10px] font-bold uppercase transition-all ${quality === q ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                 {q.toUpperCase()}
               </button>
             ))}
          </div>
        )}
      </div>

      {/* Реакции: Возвращены классические цвета (Синий, Розовый, Оранжевый) */}
      <div className="flex items-center gap-3 md:gap-4 flex-wrap">
        <button 
          onClick={() => toggleReaction('like')} 
          className={`flex items-center gap-3 px-5 py-3 border rounded-2xl transition-all ${userReaction === 'like' ? 'bg-blue-600/20 border-blue-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
        >
          <i className={`fas fa-thumbs-up text-lg ${userReaction === 'like' ? 'text-blue-500' : 'text-zinc-600'}`}></i>
          <span className={`text-[10px] font-pixel ${userReaction === 'like' ? 'text-white' : 'text-zinc-400'}`}>{reactions.like}</span>
        </button>
        <button 
          onClick={() => toggleReaction('love')} 
          className={`flex items-center gap-3 px-5 py-3 border rounded-2xl transition-all ${userReaction === 'love' ? 'bg-pink-600/20 border-pink-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
        >
          <i className={`fas fa-heart text-lg ${userReaction === 'love' ? 'text-pink-500' : 'text-zinc-600'}`}></i>
          <span className={`text-[10px] font-pixel ${userReaction === 'love' ? 'text-white' : 'text-zinc-400'}`}>{reactions.love}</span>
        </button>
        <button 
          onClick={() => toggleReaction('wow')} 
          className={`flex items-center gap-3 px-5 py-3 border rounded-2xl transition-all ${userReaction === 'wow' ? 'bg-orange-600/20 border-orange-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
        >
          <i className={`fas fa-bolt text-lg ${userReaction === 'wow' ? 'text-orange-500' : 'text-zinc-600'}`}></i>
          <span className={`text-[10px] font-pixel ${userReaction === 'wow' ? 'text-white' : 'text-zinc-400'}`}>{reactions.wow}</span>
        </button>
      </div>

      {/* Комментарии */}
      <div className="p-6 md:p-8 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-3xl">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-sm md:text-lg font-orbitron font-bold text-white uppercase tracking-widest">Global_Feed</h3>
           <span className="text-[9px] font-pixel text-zinc-600 uppercase">Limit: {userCommentCount}/10</span>
        </div>
        
        <form onSubmit={postComment} className="relative mb-8">
          <input 
            type="text" 
            disabled={userCommentCount >= 10}
            placeholder={userCommentCount >= 10 ? "TRANSMISSION_LIMIT_EXCEEDED" : "Write a message..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 transition-all ${userCommentCount >= 10 ? 'opacity-30' : ''}`}
          />
          <button disabled={userCommentCount >= 10} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 text-purple-500 disabled:opacity-0 hover:text-white transition-colors">
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {comments.map(c => (
            <div key={c.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.03] hover:bg-white/[0.04] transition-all group">
              <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-3">
                    <span className="text-[9px] font-pixel text-purple-400">{c.author}</span>
                    <span className="text-[8px] font-mono text-zinc-700 uppercase">Synced</span>
                 </div>
                 <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(c)} className="text-zinc-600 hover:text-blue-400 transition-colors"><i className="fas fa-edit text-[10px]"></i></button>
                    <button onClick={() => deleteComment(c.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><i className="fas fa-trash text-[10px]"></i></button>
                    <span className="text-[9px] text-zinc-600 font-mono ml-2 uppercase tracking-tighter">{c.timestamp}</span>
                 </div>
              </div>
              
              {editingId === c.id ? (
                <div className="flex gap-2">
                   <input 
                    className="flex-grow bg-white/10 border border-purple-500/50 rounded-lg px-3 py-1 text-sm text-white focus:outline-none"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    autoFocus
                   />
                   <button onClick={saveEdit} className="px-3 py-1 bg-purple-600 text-white text-[10px] rounded-lg font-bold uppercase">Save</button>
                   <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-white/5 text-zinc-500 text-[10px] rounded-lg uppercase">Cancel</button>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 leading-relaxed font-light">{c.text}</p>
              )}
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-10 opacity-20">
               <p className="font-pixel text-[8px] uppercase tracking-widest">No transmissions synced</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
