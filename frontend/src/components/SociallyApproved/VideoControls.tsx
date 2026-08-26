import React from 'react';
import { Heart, Share2, MessageCircle, Volume2, VolumeX, Play } from 'lucide-react';

interface VideoControlsProps {
  title: string;
  description: string;
  likesCount: number;
  isLiked: boolean;
  sharesCount: number;
  commentsCount: number;
  isMuted: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onLike: () => void;
  onShare: () => void;
  onCommentsClick: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  title,
  description,
  likesCount,
  isLiked,
  sharesCount,
  commentsCount,
  isMuted,
  isPlaying,
  onTogglePlay,
  onToggleMute,
  onLike,
  onShare,
  onCommentsClick,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 z-20 pointer-events-none select-none overflow-visible">
      {/* Top Header */}
      <div></div>

      {/* Center Tap Play/Pause Feedback */}
      <div 
        onClick={onTogglePlay} 
        className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-auto z-10"
      >
        {!isPlaying && (
          <div className="bg-black/50 p-4 rounded-full text-white animate-pulse">
            <Play size={40} fill="white" />
          </div>
        )}
      </div>

      {/* Title & Description inside the video frame at the bottom-left */}
      <div className="absolute bottom-6 left-4 pr-16 text-white text-left drop-shadow-md max-w-[70%] pointer-events-none z-20">
        <h3 className="font-bold text-base md:text-lg mb-1">{title}</h3>
        <p className="text-xs md:text-sm text-zinc-200 line-clamp-2 leading-relaxed">{description}</p>
      </div>

      {/* Action Buttons: Overlay inside on both mobile and desktop */}
      <div className="absolute bottom-16 right-4 flex flex-col items-center space-y-4 md:space-y-5 pb-2 pointer-events-auto z-30">
        {/* Mute/Unmute */}
        <button
          onClick={onToggleMute}
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-zinc-900/95 hover:bg-zinc-800 text-white rounded-full transition-colors shadow-lg border border-white/10"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Like (Heart) */}
        <div className="flex flex-col items-center">
          <button
            onClick={onLike}
            className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all shadow-lg border border-white/10 ${
              isLiked 
                ? 'bg-red-600 hover:bg-red-700 text-white scale-110 animate-heart' 
                : 'bg-zinc-900/95 text-white hover:text-red-500'
            }`}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <span className="text-[10px] md:text-xs text-white md:text-zinc-400 mt-1.5 font-bold tracking-wide drop-shadow">
            {likesCount}
          </span>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center">
          <button
            onClick={onCommentsClick}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-zinc-900/95 text-white hover:text-blue-400 rounded-full transition-colors shadow-lg border border-white/10"
          >
            <MessageCircle size={20} />
          </button>
          <span className="text-[10px] md:text-xs text-white md:text-zinc-400 mt-1.5 font-bold tracking-wide drop-shadow">
            {commentsCount}
          </span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center">
          <button
            onClick={onShare}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-zinc-900/95 text-white hover:text-green-400 rounded-full transition-colors shadow-lg border border-white/10"
          >
            <Share2 size={20} />
          </button>
          <span className="text-[10px] md:text-xs text-white md:text-zinc-400 mt-1.5 font-bold tracking-wide drop-shadow">
            {sharesCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;
