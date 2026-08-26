import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel, Keyboard } from 'swiper/modules';
import { X, Send, Heart, Share2, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { Video, Comment } from '../../types/video';
import VideoPlayer from './VideoPlayer';
import { addComment, fetchComments } from '../../services/videoApi';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: Video[];
  initialIndex: number;
  likedVideos: Record<string, boolean>;
  onLikeToggle: (id: string) => void;
  onShare: (id: string, platform: string) => void;
  onCommentAdded: (videoId: string, comment: Comment) => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videos,
  initialIndex,
  likedVideos,
  onLikeToggle,
  onShare,
  onCommentAdded,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true); // Shared mute state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [username, setUsername] = useState('viewer_xyz');
  const [loadingComments, setLoadingComments] = useState(false);
  
  const swiperRef = useRef<any>(null);

  // Sync swiper index on modal open
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
      setShowComments(false);
      if (swiperRef.current) {
        swiperRef.current.slideTo(initialIndex, 0);
      }
    }
  }, [isOpen, initialIndex]);

  // Load comments when active video changes or comments panel is opened
  useEffect(() => {
    if (!isOpen) return;
    const currentVideo = videos[activeIndex];
    if (!currentVideo) return;

    const loadComments = async () => {
      setLoadingComments(true);
      try {
        const fetched = await fetchComments(currentVideo.id);
        setComments(fetched);
      } catch (err) {
        console.error('Failed to load comments:', err);
        // Fall back to local array if api fails
        setComments(currentVideo.comments || []);
      } finally {
        setLoadingComments(false);
      }
    };

    loadComments();
  }, [activeIndex, isOpen, videos]);

  if (!isOpen) return null;

  const currentVideo = videos[activeIndex];

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !username.trim()) return;

    const videoId = currentVideo.id;
    const text = newCommentText.trim();
    const user = username.trim();

    // Optimistic Comment addition
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      videoId,
      username: user,
      text,
      createdAt: new Date().toISOString(),
    };
    
    // Optimistically update comments panel UI
    setComments((prev) => [tempComment, ...prev]);
    setNewCommentText('');

    try {
      const savedComment = await addComment(videoId, user, text);
      // Replace optimistic comment with saved comment
      setComments((prev) => 
        prev.map((c) => (c.id === tempComment.id ? savedComment : c))
      );
      onCommentAdded(videoId, savedComment);
    } catch (err) {
      console.error('Failed to post comment:', err);
      // Roll back
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
    }
  };

  const handleShareClick = (video: Video) => {
    const videoUrl = `${window.location.origin}${video.videoUrl}`;
    
    // Copy link
    navigator.clipboard.writeText(videoUrl)
      .then(() => {
        alert('Video link copied to clipboard!');
        onShare(video.id, 'copy');
      })
      .catch((err) => {
        console.error('Clipboard copy failed:', err);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm select-none">
      {/* Modal Close Area Background */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-55 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full border border-white/10 hover:scale-105 transition-all"
      >
        <X size={24} />
      </button>

      {/* Main Container */}
      <div 
        className="relative w-full h-full flex flex-col md:flex-row items-center justify-center p-0 md:p-6 max-w-7xl z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video Swiper Area */}
        <div className={`relative h-full flex items-center justify-center transition-all duration-300 w-full ${
          showComments ? 'md:w-[65%] lg:w-[70%]' : 'md:w-full'
        }`}>
          <Swiper
            modules={[Navigation, Keyboard]}
            navigation={true}
            direction="horizontal"
            keyboard={{ enabled: true }}
            centeredSlides={true}
            spaceBetween={16}
            slidesPerView={1.2}
            breakpoints={{
              768: {
                slidesPerView: 3,
                spaceBetween: 30,
              }
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.activeIndex);
              setShowComments(false); // Hide comments when scrolling to new video
            }}
            className="w-full h-full max-h-[85vh] px-4 md:px-12"
          >
            {videos.map((video, idx) => {
              // PERFORMANCE OPTIMIZATION: Only render VideoPlayer for active slide and its immediate neighbors (prev/next)
              const isNear = Math.abs(idx - activeIndex) <= 1;
              const isActive = idx === activeIndex;

              return (
                <SwiperSlide key={video.id} className="flex items-center justify-center">
                  <div className={`w-full h-full transition-all duration-300 flex items-center justify-center ${
                    isActive ? 'scale-100 opacity-100 z-10' : 'scale-90 opacity-25 z-0 pointer-events-none select-none'
                  }`}>
                    {isNear ? (
                      <VideoPlayer
                        videoUrl={video.videoUrl}
                        thumbnail={video.thumbnail}
                        title={video.title}
                        description={video.description}
                        likesCount={video.likes}
                        sharesCount={video.shares}
                        commentsCount={video.comments ? video.comments.length : 0}
                        isLiked={!!likedVideos[video.id]}
                        isPlaying={isActive && isOpen}
                        isMuted={isMuted}
                        onToggleMute={() => setIsMuted(!isMuted)}
                        onLike={() => onLikeToggle(video.id)}
                        onShare={() => handleShareClick(video)}
                        onCommentsClick={() => setShowComments(!showComments)}
                      />
                    ) : (
                      /* Render static thumbnail placeholder for out-of-range videos */
                      <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center rounded-2xl overflow-hidden border border-zinc-800/40 shadow-2xl">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover opacity-40 blur-[2px]"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>

        {/* Comments Sidebar Panel */}
        <div
          className={`absolute bottom-0 right-0 left-0 h-[60vh] md:relative md:h-full md:max-h-[90vh] bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col transition-all duration-300 z-40 rounded-t-2xl md:rounded-t-none md:rounded-r-xl w-full ${
            showComments 
              ? 'translate-y-0 opacity-100 md:w-2/5 lg:w-[35%]' 
              : 'translate-y-full opacity-0 pointer-events-none md:hidden'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h3 className="font-bold text-base md:text-lg text-white">Comments</h3>
            <button
              onClick={() => setShowComments(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* User configuration overlay */}
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/40 flex items-center text-xs text-zinc-400 gap-2">
            <span>Comment as:</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '_').substring(0, 15))}
              className="bg-transparent border-b border-zinc-700 text-zinc-200 outline-none px-1 w-28 focus:border-amber-500 font-semibold"
              placeholder="username"
            />
          </div>

          {/* Comment List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {loadingComments && comments.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-zinc-500 py-12 text-sm">
                No comments yet. Start the conversation!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex flex-col text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-zinc-200">@{comment.username}</span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(comment.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="p-4 border-t border-zinc-800 bg-zinc-950/50">
            <div className="relative flex items-center">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="absolute right-1 p-2 text-amber-500 disabled:text-zinc-600 hover:scale-105 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
