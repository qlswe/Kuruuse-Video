
import { VideoData } from './types';

export const INITIAL_VIDEOS: VideoData[] = [
  {
    id: "rotten-girl",
    title: "SAWTOWNE - Confessions of a Rotten Girl",
    description: "SAWTOWNE - Confessions of a Rotten Girl / ft. Hatsune Miku / SAWTOWNE - Признание гнилой девчонки / при участии Hatsune Miku.",
    thumbnail: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=800",
    sources: {
      high: "https://cdn.my1.ru/Rotten_Girl_high.mp4",
      medium: "https://cdn.my1.ru/Rotten_Girl_medium.mp4",
      low: "https://cdn.my1.ru/Rotten_Girl_low.mp4",
      auto: "https://cdn.my1.ru/Rotten_Girl_auto.mp4"
    }
  },
  {
    id: "duke-venomania",
    title: "Mothy - The Lunacy of Duke Venomania",
    description: "The Lunacy of Duke Venomania / Безумие Герцога Веномания.\n\n[SYSTEM] Поток оптимизирован для высокоскоростных соединений.",
    thumbnail: "https://images.unsplash.com/photo-1514525253361-bee8718a340b?auto=format&fit=crop&q=80&w=800",
    sources: {
      high: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      medium: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      low: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      auto: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    }
  },
  {
    id: "alice-in-ny",
    title: "Hitoshizuku × Yama△’ - Alice in N.Y.",
    description: "Alice in N.Y. «будь инфлюенсером.» Стильная работа от Hitoshizuku-P.",
    thumbnail: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800",
    sources: {
      high: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      medium: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      low: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      auto: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    }
  }
];

export const APP_VERSION = "v2.5.1-cors-fix";
