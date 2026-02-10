
import React from 'react';
import { LogEntry } from '../types';
import { logger } from '../services/logger';

interface LogOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
}

export const LogOverlay: React.FC<LogOverlayProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#0d061a]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-purple-500/20 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-pixel text-purple-500 uppercase">Console_Output</span>
            <h2 className="text-xl font-orbitron font-bold text-white tracking-widest uppercase">System Logs</h2>
          </div>
          <div className="flex gap-4">
             <button 
              onClick={() => logger.clear()}
              className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-[9px] font-bold text-purple-400 rounded-lg transition-all border border-purple-500/20"
            >
              Flush Cache
            </button>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-4 font-mono">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
               <i className="fas fa-terminal text-4xl mb-4"></i>
               <p className="text-xs uppercase font-pixel tracking-tighter">Terminal is empty...</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="group relative p-4 bg-white/[0.02] border border-white/[0.03] rounded-2xl hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${
                    log.level === 'error' ? 'bg-red-500/20 text-red-400' : 
                    log.level === 'warning' ? 'bg-orange-500/20 text-orange-400' : 
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-[10px] text-zinc-600">{log.timestamp}</span>
                </div>
                <div className="text-zinc-200 text-xs font-semibold leading-relaxed">{log.action}</div>
                {log.details && (
                  <pre className="mt-3 p-3 bg-black/40 rounded-xl text-[10px] text-zinc-500 overflow-x-auto border border-white/5">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
