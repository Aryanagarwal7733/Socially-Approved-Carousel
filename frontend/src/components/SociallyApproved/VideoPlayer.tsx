import React, { useRef, useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import VideoControls from './VideoControls';
import ProgressBar from './ProgressBar';
import { Heart } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnail: string;
  title: string;
  description: string;
  likesCount: number;
  sharesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onLike: () => void;
  onShare: () => void;
  onCommentsClick: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  thumbnail,
  title,
  description,
  likesCount,
  sharesCount,
  commentsCount,
  isLiked,
  isPlaying,
  isMuted,
  onToggleMute,
  onLike,
  onShare,
  onCommentsClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [heartPopCoords, setHeartPopCoords] = useState({ x: 0, y: 0 });
  const lastTapRef = useRef<number>(0);

  // Sync playing prop with video element state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setLocalIsPlaying(true);
            setIsLoading(false);
          })
          .catch((err) => {
            console.warn("Video playback was interrupted or blocked by browser autocomplete:", err.message);
            setLocalIsPlaying(false);
          });
      }
    } else {
      video.pause();
      setLocalIsPlaying(false);
    }
  }, [isPlaying]);

  // Reset progress and loading states if video URL changes
  useEffect(() => {
    setProgress(0);
    setIsLoading(true);
  }, [videoUrl]);

  // Track progress and metadata loaded
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isNaN(video.duration)) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    const video = videoRef.current;
    if (isPlaying && video) {
      video.play()
        .then(() => {
          setLocalIsPlaying(true);
        })
        .catch((err) => {
          console.warn("onCanPlay auto-start blocked:", err.message);
        });
    }
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handlePlaying = () => {
    setIsLoading(false);
    setLocalIsPlaying(true);
  };

  const handleSeek = (percent: number) => {
    const video = videoRef.current;
    if (!video || isNaN(video.duration)) return;
    const newTime = (percent / 100) * video.duration;
    video.currentTime = newTime;
    setProgress(percent);
  };

  // Toggle local play/pause from parent prop
  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (localIsPlaying) {
      video.pause();
      setLocalIsPlaying(false);
    } else {
      video.play().then(() => setLocalIsPlaying(true));
    }
  };

  // Double-tap/Double-click to like
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      onLike();
      
      // Calculate coordinates for the popup heart
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setHeartPopCoords({ x, y });
      
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 800);
    }
    lastTapRef.current = now;
  };

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center overflow-visible"
      onClick={handleTap}
    >
      {/* Video Content Box - strictly rounded and hidden overflow */}
      <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden rounded-2xl border border-zinc-800/40 shadow-2xl z-10">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain max-h-[85vh]"
          loop
          playsInline
          autoPlay={isPlaying}
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedData={handleLoadedData}
          onCanPlay={handleCanPlay}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
        />

        {/* Loading Spinner overlay */}
        {isLoading && <LoadingSpinner />}

        {/* Interactive Seek Bar at the bottom of the video */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 p-3 z-30">
            <ProgressBar progress={progress} onSeek={handleSeek} />
          </div>
        )}
      </div>

      {/* Custom Video Controls overlay (floats outside on desktop via layout, inside on mobile) */}
      {isPlaying && (
        <VideoControls
          title={title}
          description={description}
          likesCount={likesCount}
          isLiked={isLiked}
          sharesCount={sharesCount}
          commentsCount={commentsCount}
          isMuted={isMuted}
          isPlaying={localIsPlaying}
          onTogglePlay={handleTogglePlay}
          onToggleMute={onToggleMute}
          onLike={onLike}
          onShare={onShare}
          onCommentsClick={onCommentsClick}
        />
      )}

      {/* Double tap Heart POP animation */}
      {showHeartPop && (
        <div
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 text-red-500 z-55 drop-shadow-lg scale-0 transition-transform duration-500 ease-out"
          style={{
            left: `${heartPopCoords.x}px`,
            top: `${heartPopCoords.y}px`,
            animation: 'heart-pop-keyframe 0.8s forwards'
          }}
        >
          <Heart size={80} fill="currentColor" className="stroke-white stroke-2" />
        </div>
      )}

      {/* Inject custom animation keyframe styles */}
      <style>{`
        @keyframes heart-pop-keyframe {
          0% {
            transform: translate(-55%, -55%) scale(0);
            opacity: 0;
          }
          15% {
            transform: translate(-55%, -55%) scale(1.2);
            opacity: 0.9;
          }
          30% {
            transform: translate(-55%, -55%) scale(1);
            opacity: 1;
          }
          80% {
            transform: translate(-55%, -55%) translateY(-50px) scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: translate(-55%, -55%) translateY(-100px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
