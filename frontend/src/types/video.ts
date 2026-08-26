export interface Comment {
  id: string;
  videoId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  likes: number;
  shares: number;
  comments: Comment[];
}

export interface LikeResponse {
  videoId: string;
  likes: number;
  liked: boolean;
}

export interface ShareResponse {
  videoId: string;
  shares: number;
  platform: string;
}
