import React, { useEffect, useState } from 'react';
import { fetchVideos, likeVideo, shareVideo } from '../../services/videoApi';
import { Video, Comment } from '../../types/video';
import VideoCarousel from './VideoCarousel';
import VideoModal from './VideoModal';
import { Sparkles, Flame } from 'lucide-react';

export const SociallyApproved: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const [userId, setUserId] = useState<string>('');

  // Initialize userId from localStorage or generate a new one
  useEffect(() => {
    let localUserId = localStorage.getItem('socially_approved_user_id');
    if (!localUserId) {
      localUserId = `user_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('socially_approved_user_id', localUserId);
    }
    setUserId(localUserId);
  }, []);

  // Fetch videos on mount
  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        const data = await fetchVideos();
        setVideos(data);
        
        // Mock initializing likedVideos based on backend data (if available)
        // Since we don't return user-specific liked fields initially, we'll keep it empty or local
        const savedLikes = localStorage.getItem('socially_approved_liked_videos');
        if (savedLikes) {
          try {
            setLikedVideos(JSON.parse(savedLikes));
          } catch (e) {
            console.error(e);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load videos.');
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  // Sync likes with localStorage to persist liked state locally for simplicity
  const updateLocalLikes = (updated: Record<string, boolean>) => {
    setLikedVideos(updated);
    localStorage.setItem('socially_approved_liked_videos', JSON.stringify(updated));
  };

  const handleVideoClick = (index: number) => {
    setSelectedVideoIndex(index);
    setIsModalOpen(true);
  };

  const handleLikeToggle = async (videoId: string) => {
    if (!userId) return;

    const currentlyLiked = !!likedVideos[videoId];
    
    // OPTIMISTIC UPDATE: update frontend state immediately
    const updatedLikes = { ...likedVideos, [videoId]: !currentlyLiked };
    updateLocalLikes(updatedLikes);

    setVideos((prevVideos) =>
      prevVideos.map((video) => {
        if (video.id === videoId) {
          return {
            ...video,
            likes: currentlyLiked ? Math.max(0, video.likes - 1) : video.likes + 1,
          };
        }
        return video;
      })
    );

    try {
      const response = await likeVideo(videoId, userId);
      // Ensure backend count is in sync
      setVideos((prevVideos) =>
        prevVideos.map((video) => {
          if (video.id === videoId) {
            return {
              ...video,
              likes: response.likes,
            };
          }
          return video;
        })
      );
      
      const syncedLikes = { ...likedVideos, [videoId]: response.liked };
      updateLocalLikes(syncedLikes);
    } catch (err) {
      console.error('Failed to sync like with backend:', err);
      // Revert optimistic update on failure
      const revertedLikes = { ...likedVideos, [videoId]: currentlyLiked };
      updateLocalLikes(revertedLikes);
      
      setVideos((prevVideos) =>
        prevVideos.map((video) => {
          if (video.id === videoId) {
            return {
              ...video,
              likes: currentlyLiked ? video.likes + 1 : Math.max(0, video.likes - 1),
            };
          }
          return video;
        })
      );
    }
  };

  const handleShare = async (videoId: string, platform: string) => {
    // Optimistic Share Count
    setVideos((prevVideos) =>
      prevVideos.map((video) => {
        if (video.id === videoId) {
          return {
            ...video,
            shares: video.shares + 1,
          };
        }
        return video;
      })
    );

    try {
      const response = await shareVideo(videoId, platform);
      // Sync with server response
      setVideos((prevVideos) =>
        prevVideos.map((video) => {
          if (video.id === videoId) {
            return {
              ...video,
              shares: response.shares,
            };
          }
          return video;
        })
      );
    } catch (err) {
      console.error('Failed to register share with backend:', err);
    }
  };

  const handleCommentAdded = (videoId: string, newComment: Comment) => {
    setVideos((prevVideos) =>
      prevVideos.map((video) => {
        if (video.id === videoId) {
          return {
            ...video,
            comments: [newComment, ...(video.comments || [])],
          };
        }
        return video;
      })
    );
  };

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col justify-center items-center py-16">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 mt-4 font-medium animate-pulse">Loading social feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[300px] flex flex-col justify-center items-center py-16 px-4">
        <div className="text-red-500 bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-xl max-w-md text-center">
          <p className="font-bold text-lg mb-1">Could not load feed</p>
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full max-w-[1400px] mx-auto py-12 px-4 md:px-8 select-none">
      {/* Title Header Section mimicking driptrip.in streetwear style */}
      <div className="flex flex-col items-center text-center mb-8 md:mb-12">
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-amber-500 text-xs font-semibold uppercase tracking-wider mb-3">
          <Flame size={12} fill="currentColor" />
          <span>Social Hub</span>
        </div>
        
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase flex items-center justify-center gap-2">
          Socially Approved
          <Sparkles className="text-amber-400 animate-pulse hidden md:block" size={28} />
        </h2>
        
        <p className="text-zinc-400 text-sm md:text-base mt-3 max-w-xl font-medium">
          Real customer reviews, styling suggestions, and performance tests. Click any reel to join the conversation!
        </p>
      </div>

      {/* Outer Video Cards Carousel Slider */}
      <VideoCarousel
        videos={videos}
        likedVideos={likedVideos}
        onVideoClick={handleVideoClick}
      />

      {/* Video Playback & Comments Modal Slider */}
      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videos={videos}
        initialIndex={selectedVideoIndex || 0}
        likedVideos={likedVideos}
        onLikeToggle={handleLikeToggle}
        onShare={handleShare}
        onCommentAdded={handleCommentAdded}
      />
    </section>
  );
};

export default SociallyApproved;
