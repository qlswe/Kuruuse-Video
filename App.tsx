
import React, { useState, useEffect } from 'react';
import { VideoData, LogEntry } from './types';
import { INITIAL_VIDEOS, APP_VERSION } from './constants';
import { VideoCard } from './components/VideoCard';
import { VideoPlayer } from './components/VideoPlayer';
import { LogOverlay } from './components/LogOverlay';
import { logger } from './services/logger';

const App: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsub = logger.subscribe(setLogs);
    const handleScroll = () => {
      // Small threshold to toggle scrolled state for nav styling
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { unsub(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  return (
    <div className="min-h-screen bg-[#0d061a] flex flex-col selection:bg-purple-500/30 overflow-x-hidden">
      {/* Navigation - Fixed White Line by avoiding bottom borders and using matching bg */}
      <nav className={`fixed top-0 w-full z-[200] transition-all duration-500 ease-in-out ${scrolled ? 'bg-[#0d061a] py-3 shadow-[0_15px_50px_rgba(0,0,0,0.9)]' : 'bg-transparent py-6 md:py-12'}`}>
        <div className="container mx-auto px-5 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-5 group cursor-pointer" onClick={() => setSelectedVideo(null)}>
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 to-purple-800 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.4)] group-hover:scale-105 transition-transform duration-300">
               <i className="fas fa-bolt text-white text-lg md:text-2xl"></i>
            </div>
            <div className="flex flex-col">
              <h1 className="font-pixel text-[8px] md:text-[12px] text-white tracking-tighter uppercase leading-none">BIO | クルシーP</h1>
              <span className="text-[6px] md:text-[9px] text-purple-500 font-orbitron font-black tracking-[0.4em] uppercase mt-1 opacity-70">Station_V2</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsLogOpen(true)}
            className="group flex items-center gap-3 px-5 py-2.5 md:px-8 md:py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 active:scale-95 shadow-lg"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
            <span className="text-[9px] md:text-[11px] font-orbitron font-black text-white uppercase tracking-widest hidden sm:inline">System_Console</span>
            <span className="text-[9px] font-orbitron font-black text-white uppercase tracking-widest sm:hidden">LOG</span>
          </button>
        </div>
      </nav>

      {/* Hero / Player Section */}
      <header className="pt-32 md:pt-56 pb-12 md:pb-24 bg-[#0d061a] relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl aspect-square bg-purple-600/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
        
        <div className="container mx-auto px-5 md:px-12">
           {selectedVideo ? (
             <div className="animate-in fade-in zoom-in-[0.99] slide-in-from-bottom-4 duration-700">
               <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
               <div className="mt-8 md:mt-12 p-6 md:p-10 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-3xl">
                  <h2 className="text-xl md:text-3xl font-orbitron font-bold text-white mb-4 uppercase tracking-tight">{selectedVideo.title}</h2>
                  <p className="text-zinc-400 text-sm md:text-lg leading-relaxed font-light">{selectedVideo.description}</p>
               </div>
             </div>
           ) : (
             <div className="max-w-4xl py-12 md:py-24 animate-in slide-in-from-left-8 duration-1000">
               <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-purple-600/10 border border-purple-500/20 rounded-xl text-[8px] md:text-[10px] font-pixel text-purple-400 mb-8 md:mb-12 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping"></span>
                  System_Initialized_Successfully
               </div>
               <h2 className="text-5xl md:text-9xl font-orbitron font-black text-white mb-8 md:mb-14 leading-[0.9] tracking-tighter">
                 NEXT<br/><span className="text-purple-600 neon-text">LEVEL</span><br/>STATION
               </h2>
               <div className="flex flex-col sm:flex-row gap-6 md:gap-10">
                  <p className="text-sm md:text-xl text-zinc-500 font-light leading-relaxed max-w-xl border-l-4 border-purple-600/40 pl-8">
                    Интеллектуальная среда для работы с видеопотоком. Адаптивное качество, нулевая задержка и современный BIO-интерфейс.
                  </p>
                  <div className="flex flex-wrap gap-4 items-center sm:items-start">
                     <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-orbitron font-bold text-zinc-400 uppercase">4K_Ready</div>
                     <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-orbitron font-bold text-zinc-400 uppercase">Low_Latency</div>
                  </div>
               </div>
             </div>
           )}
        </div>
      </header>

      {/* Content Feed */}
      <main className="container mx-auto px-5 md:px-12 py-12 flex-grow bg-[#0d061a]">
        <div className="flex items-center gap-8 mb-12 md:mb-20">
          <div className="flex flex-col gap-1">
            <span className="text-[7px] md:text-[9px] font-pixel text-purple-600 uppercase tracking-widest">Core_Index</span>
            <h3 className="text-lg md:text-2xl font-orbitron font-black text-white uppercase tracking-widest">Database_Content</h3>
          </div>
          <div className="h-px flex-grow bg-gradient-to-r from-purple-600/40 via-purple-600/5 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-12">
          {INITIAL_VIDEOS.map(v => (
            <VideoCard key={v.id} video={v} onClick={(v) => {
              setSelectedVideo(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} />
          ))}
        </div>
      </main>

      <footer className="py-16 md:py-32 bg-[#0d061a] border-t border-white/5">
        <div className="container mx-auto px-5 md:px-12 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col gap-4 items-center md:items-start">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                 <i className="fas fa-bolt text-purple-600"></i>
              </div>
              <div className="text-[10px] md:text-xs font-pixel text-zinc-500 uppercase tracking-tighter">BIO_STATION // {APP_VERSION}</div>
            </div>
            <p className="text-[8px] md:text-[10px] font-orbitron text-zinc-700 tracking-[0.6em] uppercase text-center md:text-left">
              Engineered for the future of translations
            </p>
          </div>
          <div className="flex gap-12 text-2xl md:text-3xl text-zinc-600">
             <i className="fab fa-telegram hover:text-purple-500 cursor-pointer transition-all hover:scale-125"></i>
             <i className="fab fa-discord hover:text-purple-500 cursor-pointer transition-all hover:scale-125"></i>
             <i className="fab fa-github hover:text-purple-500 cursor-pointer transition-all hover:scale-125"></i>
          </div>
        </div>
      </footer>

      <LogOverlay isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} logs={logs} />
    </div>
  );
};

export default App;
