import React, { useRef, useState } from 'react';
import { Heart, Play } from 'lucide-react';
import { useVideoObserver } from '../../hooks/useVideoObserver';

interface VideoCardProps {
  id: string;
  thumbnail: string;
  videoUrl: string;
  title: string;
  likes: number;
  isLiked: boolean;
  onClick: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  videoUrl,
  title,
  likes,
  isLiked,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Lazy load video element when card is near the viewport
  const isNearViewport = useVideoObserver(containerRef, {
    rootMargin: '200px',
    threshold: 0.01,
  });

  // Play/Pause on hover
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered) {
      video.play().catch((err) => {
        console.warn("Hover preview play blocked by browser:", err.message);
      });
    } else {
      video.pause();
      // Reset video to first frame
      video.currentTime = 0.001;
    }
  }, [isHovered]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer shadow-lg group hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 select-none"
    >
      {/* Video Preview / Dynamic Thumbnail */}
      {isNearViewport ? (
        <video
          ref={videoRef}
          src={`${videoUrl}#t=0.001`}
          className="absolute inset-0 w-full h-full object-cover z-0"
          preload="metadata"
          muted
          loop
          playsInline
        />
      ) : (
        /* Image Skeleton / Loading Placeholder */
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-zinc-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Gradient Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20 opacity-80 group-hover:opacity-90 transition-opacity duration-300 z-10" />

      {/* Play Icon Hover Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="bg-white/95 text-black p-3.5 rounded-full shadow-lg scale-75 group-hover:scale-100 transition-all duration-300">
          <Play size={22} fill="black" className="translate-x-0.5" />
        </div>
      </div>

      {/* Metadata (Bottom overlay) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-left">
        <h4 className="font-semibold text-sm md:text-base text-white tracking-wide truncate group-hover:text-amber-400 transition-colors mb-1.5">
          {title}
        </h4>
        
        <div className="flex items-center text-zinc-300 text-xs md:text-sm">
          <Heart
            size={14}
            className={`mr-1 transition-colors ${
              isLiked ? 'text-red-500 fill-red-500' : 'text-zinc-400 group-hover:text-red-500'
            }`}
          />
          <span className="font-medium">{likes}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
