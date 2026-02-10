
import { LogEntry, LogLevel } from '../types';

class Logger {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  log(level: LogLevel, action: string, details?: any) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      action,
      details
    };
    this.logs = [entry, ...this.logs].slice(0, 100);
    this.notify();
    console.log(`[${entry.timestamp}] [${level.toUpperCase()}] ${action}`, details || '');
  }

  subscribe(callback: (logs: LogEntry[]) => void) {
    this.listeners.push(callback);
    callback(this.logs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.logs));
  }
}

export const logger = new Logger();
