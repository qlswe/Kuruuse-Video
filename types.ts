
export type VideoQuality = 'high' | 'medium' | 'low' | 'auto';

export interface VideoSources {
  high: string;
  medium: string;
  low: string;
  auto: string;
}

export interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  sources: VideoSources;
}

export type LogLevel = 'info' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  action: string;
  details?: any;
}
