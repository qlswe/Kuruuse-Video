
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoData, VideoQuality, Reactions, Comment } from '../types';
import { logger } from '../services/logger';

interface VideoPlayerProps {
  video: VideoData;
  onClose: () => void;
}

// Константа лимита комментариев
const MAX_COMMENTS = 10;

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

  // Состояние для редактирования
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Идентификатор пользователя (для лимитов)
  const [userId] = useState(() => {
    let id = localStorage.getItem('v_user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('v_user_id', id);
    }
    return id;
  });

  // Реакции и комментарии
  const [reactions, setReactions] = useState<Reactions>(() => {
    const saved = localStorage.getItem(`v_reactions_${video.id}`);
    return saved ? JSON.parse(saved) : { like: [], love: [], wow: [] };
  });
  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem(`v_comments_${video.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [newComment, setNewComment] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Синхронизация между вкладками
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `v_reactions_${video.id}`) {
        setReactions(e.newValue ? JSON.parse(e.newValue) : { like: [], love: [], wow: [] });
      }
      if (e.key === `v_comments_${video.id}`) {
        setComments(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [video.id]);

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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
    localStorage.setItem('v_vol', val.toString());
  };

  const addReaction = (type: keyof Reactions) => {
    const currentList = reactions[type] || [];
    let newList;
    
    if (currentList.includes(userId)) {
      newList = currentList.filter(id => id !== userId);
      logger.log('info', `Removed reaction: ${type} for video ${video.id}`);
    } else {
      newList = [...currentList, userId];
      logger.log('info', `Added reaction: ${type} for video ${video.id}`);
    }

    const updated = { ...reactions, [type]: newList };
    setReactions(updated);
    localStorage.setItem(`v_reactions_${video.id}`, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: `v_reactions_${video.id}`, newValue: JSON.stringify(updated) }));
  };

  const postComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const userCommentsCount = comments.filter(c => c.userId === userId).length;
    if (userCommentsCount >= MAX_COMMENTS) {
      alert(`Вы достигли лимита в ${MAX_COMMENTS} комментариев.`);
      return;
    }

    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: userId,
      author: "Guest_" + userId.substr(-4).toUpperCase(),
      text: newComment.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [comment, ...comments];
    setComments(updated);
    setNewComment("");
    localStorage.setItem(`v_comments_${video.id}`, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: `v_comments_${video.id}`, newValue: JSON.stringify(updated) }));
    logger.log('info', `Posted comment on video ${video.id}`);
  };

  const deleteComment = (id: string) => {
    const updated = comments.filter(c => c.id !== id);
    setComments(updated);
    localStorage.setItem(`v_comments_${video.id}`, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: `v_comments_${video.id}`, newValue: JSON.stringify(updated) }));
    logger.log('info', `Deleted comment ${id} from video ${video.id}`);
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const saveEdit = (id: string) => {
    const updated = comments.map(c => 
      c.id === id ? { ...c, text: editText.trim(), isEdited: true } : c
    );
    setComments(updated);
    setEditingCommentId(null);
    localStorage.setItem(`v_comments_${video.id}`, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: `v_comments_${video.id}`, newValue: JSON.stringify(updated) }));
    logger.log('info', `Edited comment ${id} on video ${video.id}`);
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

  const userCommentsCount = comments.filter(c => c.userId === userId).length;

  return (
    <div className="flex flex-col gap-6">
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

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-grow md:flex-grow-0">
              <button onClick={togglePlay} className="text-white text-xl hover:text-purple-400">
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              </button>
              <div className="text-[10px] font-mono text-zinc-400">
                <span className="text-white">{formatTime(currentTime)}</span>
                <span className="mx-1 opacity-20">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            {/* РЕДИЗАЙН: Контрастный BIO-микшер громкости */}
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-purple-500/40 p-1.5 md:p-2 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all hover:border-purple-500/60">
              <button 
                onClick={() => handleVolumeChange({ target: { value: volume > 0 ? "0" : "0.5" } } as any)}
                className="w-6 h-6 flex items-center justify-center text-purple-400 hover:text-white transition-colors"
              >
                <i className={`fas fa-volume-${volume === 0 ? 'mute' : volume < 0.5 ? 'down' : 'up'} text-[10px]`}></i>
              </button>
              
              <div className="relative w-16 md:w-28 h-6 flex items-center group/vol">
                <div className="absolute w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
                    style={{ width: `${volume * 100}%` }}
                  ></div>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume} 
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div 
                  className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-lg border border-purple-500 pointer-events-none transition-transform group-hover/vol:scale-125"
                  style={{ left: `calc(${volume * 100}% - 5px)` }}
                ></div>
              </div>
              
              <span className="text-[8px] md:text-[9px] font-bold text-white/90 min-w-[25px] text-center font-mono">
                {Math.round(volume * 100)}
              </span>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsQualityMenuOpen(!isQualityMenuOpen); }}
                className={`px-2 py-1 md:px-3 md:py-1 border rounded-lg text-[8px] md:text-[9px] font-bold uppercase transition-all ${isQualityMenuOpen ? 'bg-purple-600 text-white border-purple-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}
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

      {/* Reactions Section */}
      <div className="flex items-center gap-4 flex-wrap">
        <button 
          onClick={() => addReaction('like')}
          className={`flex items-center gap-2 px-5 py-3 border rounded-2xl transition-all group ${reactions.like.includes(userId) ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/5 hover:bg-blue-500/10 hover:border-blue-500/30'}`}
        >
          <i className={`fas fa-thumbs-up group-hover:scale-125 transition-transform ${reactions.like.includes(userId) ? 'text-blue-400' : 'text-zinc-500'}`}></i>
          <span className="text-[10px] font-pixel text-zinc-300">{reactions.like.length}</span>
        </button>
        <button 
          onClick={() => addReaction('love')}
          className={`flex items-center gap-2 px-5 py-3 border rounded-2xl transition-all group ${reactions.love.includes(userId) ? 'bg-pink-500/20 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'bg-white/5 border-white/5 hover:bg-pink-500/10 hover:border-pink-500/30'}`}
        >
          <i className={`fas fa-heart group-hover:scale-125 transition-transform ${reactions.love.includes(userId) ? 'text-pink-500' : 'text-zinc-500'}`}></i>
          <span className="text-[10px] font-pixel text-zinc-300">{reactions.love.length}</span>
        </button>
        <button 
          onClick={() => addReaction('wow')}
          className={`flex items-center gap-2 px-5 py-3 border rounded-2xl transition-all group ${reactions.wow.includes(userId) ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-white/5 border-white/5 hover:bg-orange-500/10 hover:border-orange-500/30'}`}
        >
          <i className={`fas fa-fire group-hover:scale-125 transition-transform ${reactions.wow.includes(userId) ? 'text-orange-400' : 'text-zinc-500'}`}></i>
          <span className="text-[10px] font-pixel text-zinc-300">{reactions.wow.length}</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="p-6 md:p-8 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-3xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-orbitron font-bold text-white uppercase tracking-widest flex items-center gap-3">
             <i className="fas fa-comments text-purple-500"></i>
             Database_Comments
          </h3>
          <span className={`text-[9px] font-pixel px-3 py-1 rounded-lg ${userCommentsCount >= MAX_COMMENTS ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/10 text-purple-400'}`}>
            Лимит: {userCommentsCount}/{MAX_COMMENTS}
          </span>
        </div>
        
        <form onSubmit={postComment} className="mb-8 flex gap-4">
          <input 
            type="text" 
            placeholder={userCommentsCount >= MAX_COMMENTS ? "Лимит исчерпан" : "Напишите что-нибудь..."}
            value={newComment}
            disabled={userCommentsCount >= MAX_COMMENTS}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-grow bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-30 placeholder:text-zinc-600"
          />
          <button 
            disabled={userCommentsCount >= MAX_COMMENTS || !newComment.trim()}
            className="px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-900/20"
          >
            Post
          </button>
        </form>

        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {comments.length === 0 ? (
            <p className="text-zinc-600 text-xs font-pixel italic opacity-40 py-10 text-center uppercase tracking-widest">No data logged yet...</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className={`flex flex-col gap-3 p-5 rounded-2xl border transition-all ${c.userId === userId ? 'bg-purple-600/5 border-purple-500/20' : 'bg-white/[0.02] border-white/[0.05]'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`text-[8px] font-pixel ${c.userId === userId ? 'text-cyan-400' : 'text-purple-400'}`}>
                      {c.author} {c.userId === userId && "(Вы)"}
                    </span>
                    {c.isEdited && <span className="text-[7px] font-pixel text-zinc-600 uppercase tracking-tighter">ред.</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] text-zinc-600 font-mono tracking-tighter">{c.timestamp}</span>
                    {c.userId === userId && (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => startEditing(c)}
                          className="text-zinc-500 hover:text-cyan-400 transition-colors"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button 
                          onClick={() => deleteComment(c.id)}
                          className="text-zinc-500 hover:text-red-500 transition-colors"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {editingCommentId === c.id ? (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                    <textarea 
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/40 rounded-xl p-3 text-sm text-zinc-200 focus:outline-none"
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => setEditingCommentId(null)}
                        className="px-4 py-1.5 text-[8px] font-pixel text-zinc-500 uppercase"
                      >
                        Отмена
                      </button>
                      <button 
                        onClick={() => saveEdit(c.id)}
                        className="px-4 py-1.5 bg-cyan-600 text-white rounded-lg text-[8px] font-pixel uppercase active:scale-95"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-300 leading-relaxed font-light">{c.text}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
