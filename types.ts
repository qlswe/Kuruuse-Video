
export type VideoQuality = 'high' | 'medium' | 'low' | 'auto';

export interface VideoSources {
  high: string;
  medium: string;
  low: string;
  auto: string;
}

export interface Reactions {
  like: string[]; // Массив ID пользователей, поставивших лайк
  love: string[];
  wow: string[];
}

export interface Comment {
  id: string;
  userId: string; // ID автора для проверки лимита в 10 сообщений
  author: string;
  text: string;
  timestamp: string;
  isEdited?: boolean;
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
