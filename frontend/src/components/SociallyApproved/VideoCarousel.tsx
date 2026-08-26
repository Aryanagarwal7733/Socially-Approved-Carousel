import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Video } from '../../types/video';
import VideoCard from './VideoCard';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

interface VideoCarouselProps {
  videos: Video[];
  likedVideos: Record<string, boolean>;
  onVideoClick: (index: number) => void;
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({
  videos,
  likedVideos,
  onVideoClick,
}) => {
  return (
    <div className="w-full relative px-2 py-4">
      <Swiper
        modules={[Navigation]}
        navigation={true}
        spaceBetween={16}
        slidesPerView={1.3}
        breakpoints={{
          480: {
            slidesPerView: 2.2,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 3.5,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 4.8,
            spaceBetween: 24,
          },
          1280: {
            slidesPerView: 5.8,
            spaceBetween: 24,
          },
          1536: {
            slidesPerView: 6.8,
            spaceBetween: 28,
          },
        }}
        grabCursor={true}
        className="outer-video-carousel !pb-4"
      >
        {videos.map((video, index) => (
          <SwiperSlide key={video.id} className="h-full">
            <VideoCard
              id={video.id}
              thumbnail={video.thumbnail}
              videoUrl={video.videoUrl}
              title={video.title}
              likes={video.likes}
              isLiked={!!likedVideos[video.id]}
              onClick={() => onVideoClick(index)}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default VideoCarousel;
