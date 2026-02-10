
export type VideoQuality = 'high' | 'medium' | 'low' | 'auto';

export interface VideoSources {
  high: string;
  medium: string;
  low: string;
  auto: string;
}

export interface Reactions {
  like: number;
  love: number;
  wow: number;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
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
