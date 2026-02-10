
import React from 'react';
import { VideoData } from '../types';

interface VideoCardProps {
  video: VideoData;
  onClick: (video: VideoData) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  return (
    <div 
      onClick={() => onClick(video)}
      className="group relative bg-white/[0.02] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:bg-white/[0.04] border border-white/5 flex flex-col"
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <i className="fas fa-play text-white ml-1 text-sm md:text-base"></i>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[8px] font-bold text-white uppercase border border-white/10">
          HD_READY
        </div>
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-zinc-200 text-xs md:text-sm font-medium line-clamp-2 leading-tight group-hover:text-purple-400 transition-colors">
          {video.title}
        </h3>
        <p className="mt-3 text-[8px] md:text-[9px] text-zinc-500 font-orbitron uppercase tracking-widest">
          Status: Online
        </p>
      </div>
    </div>
  );
};
