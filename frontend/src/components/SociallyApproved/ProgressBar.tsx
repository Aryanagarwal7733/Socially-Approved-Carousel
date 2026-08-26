import React, { useRef, MouseEvent, TouchEvent } from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  onSeek: (percent: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, onSeek }) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const calculatePercent = (clientX: number): number => {
    if (!progressBarRef.current) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const width = rect.width;
    const clickX = Math.max(0, Math.min(clientX - rect.left, width));
    return (clickX / width) * 100;
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    onSeek(calculatePercent(e.clientX));

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      onSeek(calculatePercent(moveEvent.clientX));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    onSeek(calculatePercent(e.touches[0].clientX));

    const handleTouchMove = (moveEvent: globalThis.TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      onSeek(calculatePercent(moveEvent.touches[0].clientX));
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
  };

  return (
    <div
      ref={progressBarRef}
      className="group relative w-full h-2 bg-white/20 hover:h-3 rounded-full cursor-pointer flex items-center transition-all duration-150 z-20"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        className="h-full bg-red-600 rounded-full relative transition-all duration-75"
        style={{ width: `${progress}%` }}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full scale-0 group-hover:scale-100 transition-transform duration-150 shadow shadow-black"></div>
      </div>
    </div>
  );
};

export default ProgressBar;
