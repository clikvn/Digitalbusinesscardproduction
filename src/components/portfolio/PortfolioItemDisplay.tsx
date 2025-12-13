import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Maximize, Play, Pause, Hand, X } from "lucide-react";
import { AspectRatio } from "../ui/aspect-ratio";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { parseProfileUrl } from "../../utils/user-code";
import { useAnalyticsTracking } from "../../hooks/useAnalytics";
import { parseVideoUrl, type VideoInfo } from "../../lib/videoUtils";

export function PortfolioItemDisplay({ 
  itemId,
  type = 'image', 
  images, 
  title, 
  details,
  videoUrl: customVideoUrl,
  tourUrl: customTourUrl
}: { 
  itemId: string;
  type?: 'image' | 'video' | 'virtual-tour'; 
  images: string[]; 
  title: string; 
  details: string;
  videoUrl?: string;
  tourUrl?: string;
}) {
  const routeInfo = parseProfileUrl();
  const { trackClickEvent } = useAnalyticsTracking(routeInfo.userCode || '', routeInfo.group || '', undefined);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVirtualTourOpen, setIsVirtualTourOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const totalDuration = 45; // Mock duration in seconds
  
  // Track portfolio item view on mount
  useEffect(() => {
    trackClickEvent(`portfolio.item.${title}`);
  }, [title, trackClickEvent]);
  
  // Touch handling for swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Get current image
  const imgSrc = images[currentImageIndex] || images[0];
  
  // Use custom URLs or fallback to demo URLs
  const videoUrl = customVideoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const virtualTourUrl = customTourUrl || "https://my.matterport.com/show/?m=SxQL3iGyoDo";
  
  // Parse video URL to determine type (YouTube, Vimeo, or direct)
  const videoInfo: VideoInfo = parseVideoUrl(videoUrl);
  const isEmbeddedVideo = videoInfo.type === 'youtube' || videoInfo.type === 'vimeo';
  
  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    if (isFullscreen || isImageFullscreen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isFullscreen, isImageFullscreen]);
  
  const nextImage = () => {
    if (type === 'image' && images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };
  
  const previousImage = () => {
    if (type === 'image' && images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };
  
  const handleImageFullscreen = () => {
    // Track image open
    trackClickEvent('portfolio.imageOpen');
    setIsImageFullscreen(true);
  };
  
  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    // Prevent default scrolling while swiping
    if (Math.abs((touchStart || 0) - e.targetTouches[0].clientX) > 10) {
      e.preventDefault();
    }
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      previousImage();
    }
    
    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        // Track video play
        trackClickEvent('portfolio.videoPlay');
        
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Play was prevented:", error);
              setIsPlaying(false);
            });
        }
      }
    }
  };
  
  const handleFullscreen = () => {
    // Use custom fullscreen modal (permissions policy prevents native fullscreen in this environment)
    setIsFullscreen(true);
  };
  
  const handleVirtualTourClick = () => {
    if (type === 'virtual-tour') {
      // Track virtual tour open
      trackClickEvent('portfolio.virtualTourOpen');
      setIsVirtualTourOpen(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="content-stretch flex flex-col gap-[8px] items-start relative rounded-[24px] shrink-0 w-full" data-name="item">
        <div 
          className={`overflow-clip relative rounded-[16px] shrink-0 w-full ${type === 'virtual-tour' ? 'cursor-pointer' : ''}`} 
          data-name="IMG"
          onClick={handleVirtualTourClick}
          onTouchStart={type === 'image' && images.length > 1 ? onTouchStart : undefined}
          onTouchMove={type === 'image' && images.length > 1 ? onTouchMove : undefined}
          onTouchEnd={type === 'image' && images.length > 1 ? onTouchEnd : undefined}
          style={type === 'image' && images.length > 1 ? { touchAction: 'pan-y' } : undefined}
        >
          <AspectRatio ratio={16 / 9} className="w-full">
            {type === 'video' ? (
              <>
                {isEmbeddedVideo ? (
                  // YouTube or Vimeo embed
                  <iframe
                    ref={iframeRef}
                    className="absolute inset-0 w-full h-full"
                    src={videoInfo.embedUrl}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ border: 'none' }}
                  />
                ) : (
                  // Direct video file (mp4, webm, etc.)
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    src={videoInfo.embedUrl || videoUrl}
                    poster={imgSrc}
                    playsInline
                    preload="metadata"
                    onTimeUpdate={(e) => setCurrentTime(Math.floor(e.currentTarget.currentTime))}
                    onEnded={() => setIsPlaying(false)}
                    onError={(e) => {
                      console.error('Video playback error:', e);
                    }}
                  />
                )}
              </>
            ) : (
              <img alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" src={imgSrc} />
            )}
          </AspectRatio>
          
          {/* Image carousel indicator */}
          {type === 'image' && (
            <div className="absolute bottom-0 box-border content-stretch flex flex-col gap-[8px] items-center justify-end left-0 p-[8px] right-0 z-10" data-name="bottom">
              <div className="flex gap-1.5 items-center justify-center">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className="transition-all"
                    aria-label={`Go to image ${index + 1}`}
                  >
                    <div 
                      className={`rounded-full bg-white transition-all ${
                        index === currentImageIndex 
                          ? 'w-3 h-3 opacity-100' 
                          : 'w-2 h-2 opacity-50 hover:opacity-75'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Fullscreen icon for images */}
          {type === 'image' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleImageFullscreen();
              }}
              className="absolute bottom-2 right-2 z-20 text-white hover:scale-110 transition-transform active:scale-95 p-1.5"
              aria-label="View fullscreen"
            >
              <Maximize className="w-5 h-5 drop-shadow-lg" />
            </button>
          )}
          
          {/* Video controls - Only show for direct video files, not YouTube/Vimeo */}
          {type === 'video' && !isEmbeddedVideo && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3 z-10" data-name="video-controls">
              <div className="flex flex-col gap-1">
                {/* Timeline bar */}
                <div className="relative h-0.5 bg-white/30 rounded-full overflow-hidden cursor-pointer">
                  <div 
                    className="absolute h-full bg-white rounded-full transition-all"
                    style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                  />
                </div>
                
                {/* Control buttons and time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={togglePlay}
                      className="text-white hover:scale-110 transition-transform active:scale-95"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 fill-white" />
                      )}
                    </button>
                    <span className="text-white text-xs font-medium">
                      {formatTime(currentTime)} / {formatTime(totalDuration)}
                    </span>
                  </div>
                  <button 
                    onClick={handleFullscreen}
                    className="p-1.5 hover:scale-110 transition-transform active:scale-95"
                  >
                    <Maximize className="w-5 h-5 text-white drop-shadow-lg" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Virtual tour indicator */}
          {type === 'virtual-tour' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" data-name="virtual-tour-overlay">
              <motion.div
                animate={{
                  x: [-12, 12, -12],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Hand className="w-6 h-6 text-white drop-shadow-lg" />
              </motion.div>
            </div>
          )}
        </div>
        
        <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="title">
          <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0" data-name="txt">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="title">
              <div className="basis-0 flex flex-col font-['Inter:Medium',sans-serif] font-medium grow justify-center leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#535146] text-[16px] text-nowrap">
                <p className="[white-space-collapse:collapse] leading-[24px] overflow-ellipsis overflow-hidden">{title}</p>
              </div>
            </div>
            <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#83827d] text-[14px] w-full overflow-hidden text-ellipsis whitespace-nowrap">{details}</p>
          </div>
        </div>
      </div>
      
      {/* Fullscreen Video Modal */}
      {type === 'video' && isFullscreen && (
        <div 
          className="fixed inset-0 z-[99999] bg-black flex flex-col"
          style={{ 
            width: '100vw',
            height: '100dvh',
            position: 'fixed',
            top: 0,
            left: 0,
            margin: 0,
            padding: 0,
            touchAction: 'none'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-[100000] text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all"
            style={{ position: 'fixed' }}
            aria-label="Close fullscreen"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Video player */}
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              width: '100vw',
              height: '100dvh'
            }}
          >
            <video
              className="max-w-full max-h-full"
              src={videoUrl}
              controls
              controlsList="nodownload"
              autoPlay
              playsInline
              preload="metadata"
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: '#000'
              }}
            />
          </div>
        </div>
      )}
      
      {/* Image Fullscreen Modal */}
      {type === 'image' && isImageFullscreen && (
        <div 
          className="fixed inset-0 z-[99999] bg-black flex flex-col"
          style={{ 
            width: '100vw',
            height: '100vh',
            minHeight: '-webkit-fill-available',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 0,
            padding: 0,
            touchAction: images.length > 1 ? 'pan-y' : 'auto',
            overflow: 'hidden'
          }}
          onTouchStart={images.length > 1 ? onTouchStart : undefined}
          onTouchMove={images.length > 1 ? onTouchMove : undefined}
          onTouchEnd={images.length > 1 ? onTouchEnd : undefined}
        >
          {/* Close button */}
          <button
            onClick={() => setIsImageFullscreen(false)}
            className="absolute top-4 right-4 z-[100000] text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all"
            style={{ position: 'fixed' }}
            aria-label="Close fullscreen"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Image */}
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              width: '100vw',
              height: '100vh',
              minHeight: '-webkit-fill-available'
            }}
          >
            <img
              src={imgSrc}
              alt=""
              className="max-w-full max-h-full pointer-events-none"
              style={{ 
                width: 'auto',
                height: 'auto',
                maxWidth: '100vw',
                maxHeight: '100vh',
                objectFit: 'contain'
              }}
            />
          </div>
          
          {/* Carousel indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 z-[100000]" style={{ position: 'fixed' }}>
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className="transition-all"
                  aria-label={`Go to image ${index + 1}`}
                >
                  <div 
                    className={`rounded-full bg-white transition-all ${
                      index === currentImageIndex 
                        ? 'w-4 h-4 opacity-100' 
                        : 'w-3 h-3 opacity-50 hover:opacity-75'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Virtual Tour Dialog */}
      {type === 'virtual-tour' && (
        <Dialog open={isVirtualTourOpen} onOpenChange={setIsVirtualTourOpen}>
          <DialogContent className="max-w-[100vw] w-full p-0 bg-black border-0 [&>button[class*='ring-offset']]:hidden" style={{ height: 'calc(var(--vh, 1vh) * 100)' }} aria-describedby={undefined}>
            <DialogTitle className="sr-only">360° Virtual Tour</DialogTitle>
            <button
              onClick={() => setIsVirtualTourOpen(false)}
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full p-2 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full h-full">
              <iframe
                ref={iframeRef}
                src={virtualTourUrl}
                className="w-full h-full border-0"
                title="360° Virtual Tour"
                allow="accelerometer; gyroscope; fullscreen"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}