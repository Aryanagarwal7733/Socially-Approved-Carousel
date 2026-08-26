import { Video, LikeResponse, ShareResponse, Comment } from '../types/video';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function assetUrl(path: string): string {
  return path.startsWith('http') ? path : apiUrl(path);
}

export async function fetchVideos(): Promise<Video[]> {
  const res = await fetch(apiUrl('/api/videos'));
  if (!res.ok) {
    throw new Error(`Failed to fetch videos: ${res.statusText}`);
  }
  const videos: Video[] = await res.json();
  return videos.map((video) => ({
    ...video,
    videoUrl: assetUrl(video.videoUrl),
    thumbnail: assetUrl(video.thumbnail),
  }));
}

export async function likeVideo(id: string, userId: string): Promise<LikeResponse> {
  const res = await fetch(apiUrl(`/api/videos/${id}/like`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to like video: ${res.statusText}`);
  }
  return res.json();
}

export async function shareVideo(id: string, platform: string): Promise<ShareResponse> {
  const res = await fetch(apiUrl(`/api/videos/${id}/share`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ platform }),
  });
  if (!res.ok) {
    throw new Error(`Failed to register share: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchComments(id: string): Promise<Comment[]> {
  const res = await fetch(apiUrl(`/api/videos/${id}/comments`));
  if (!res.ok) {
    throw new Error(`Failed to fetch comments: ${res.statusText}`);
  }
  return res.json();
}

export async function addComment(id: string, username: string, text: string): Promise<Comment> {
  const res = await fetch(apiUrl(`/api/videos/${id}/comments`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, text }),
  });
  if (!res.ok) {
    throw new Error(`Failed to post comment: ${res.statusText}`);
  }
  return res.json();
}
