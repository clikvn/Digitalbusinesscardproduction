import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { X, ZoomIn, ZoomOut, Maximize2, Check } from "lucide-react";

interface AvatarImagePositionerProps {
  imageUrl: string;
  initialPosition?: { x: number; y: number; scale: number };
  onSave: (position: { x: number; y: number; scale: number }) => void;
  onClose: () => void;
}

export function AvatarImagePositioner({
  imageUrl,
  initialPosition = { x: 0, y: 0, scale: 1 },
  onSave,
  onClose
}: AvatarImagePositionerProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const getRelativePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Calculate position relative to container center
    return {
      x: clientX - centerX,
      y: clientY - centerY
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.controls-area')) return;
    setIsDragging(true);
    const relativePos = getRelativePosition(e.clientX, e.clientY);
    setDragStart({
      x: relativePos.x - position.x,
      y: relativePos.y - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const relativePos = getRelativePosition(e.clientX, e.clientY);
    setPosition({
      ...position,
      x: relativePos.x - dragStart.x,
      y: relativePos.y - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.controls-area')) return;
    e.preventDefault(); // Prevent default touch behavior
    const touch = e.touches[0];
    setIsDragging(true);
    const relativePos = getRelativePosition(touch.clientX, touch.clientY);
    setDragStart({
      x: relativePos.x - position.x,
      y: relativePos.y - position.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const relativePos = getRelativePosition(touch.clientX, touch.clientY);
    setPosition({
      ...position,
      x: relativePos.x - dragStart.x,
      y: relativePos.y - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setPosition({ ...position, scale: Math.min(position.scale + 0.1, 3) });
  };

  const handleZoomOut = () => {
    setPosition({ ...position, scale: Math.max(position.scale - 0.1, 0.2) });
  };

  const handleReset = () => {
    setPosition({ x: 0, y: 0, scale: 1 });
  };

  const handleSave = () => {
    onSave(position);
    onClose();
  };

  // Fixed reference size - use web size (1920px width) for all devices
  const REFERENCE_WIDTH = 1920;
  const REFERENCE_HEIGHT = 1080; // Standard 16:9 aspect ratio

  // Load image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Use fixed circle size - 160px base, consistent across all devices
  const circleSize = 160;
  const circleRadius = circleSize / 2;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black"
      style={{ touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image - Fixed Size Container (Web Size) */}
      <div 
        ref={containerRef}
        className="absolute top-1/2 left-1/2 select-none"
        style={{
          width: `${REFERENCE_WIDTH}px`,
          height: `${REFERENCE_HEIGHT}px`,
          transform: 'translate(-50%, -50%)',
          minWidth: `${REFERENCE_WIDTH}px`,
          minHeight: `${REFERENCE_HEIGHT}px`
        }}
      >
        <div className="absolute inset-0">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0">
              <img 
                ref={imageRef}
                alt="" 
                className="absolute h-full w-full pointer-events-none"
                src={imageUrl}
                style={{
                  // Use object-contain to show full image at exact web size
                  // No mobile transformations - exact same view as web
                  objectFit: 'contain',
                  objectPosition: 'center center',
                  transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale})`,
                  transformOrigin: 'center center'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dark Overlay with Circular Cutout - Fixed Size Container */}
      <div 
        className="absolute top-1/2 left-1/2 pointer-events-none"
        style={{
          width: `${REFERENCE_WIDTH}px`,
          height: `${REFERENCE_HEIGHT}px`,
          transform: 'translate(-50%, -50%)',
          minWidth: `${REFERENCE_WIDTH}px`,
          minHeight: `${REFERENCE_HEIGHT}px`
        }}
      >
        {/* Dark overlay with circular cutout - use radial gradient mask */}
        <div 
          className="absolute inset-0 bg-black/60"
          style={{
            maskImage: `radial-gradient(circle ${circleRadius}px at center, transparent ${circleRadius}px, black ${circleRadius + 0.5}px)`,
            WebkitMaskImage: `radial-gradient(circle ${circleRadius}px at center, transparent ${circleRadius}px, black ${circleRadius + 0.5}px)`
          }}
        />
        
        {/* Circular Guide Frame - positioned at exact center of 1920x1080 container */}
        <div 
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${circleSize}px`,
            height: `${circleSize}px`
          }}
        >
          {/* Circle border guide - this shows exactly what will be in the avatar */}
          <div 
            className="rounded-full border-4 border-white shadow-2xl"
            style={{ width: `${circleSize}px`, height: `${circleSize}px` }}
          />
          
          {/* Label */}
          <div className="mt-4 text-center text-white text-sm font-medium bg-black/50 rounded-full px-4 py-2">
            Avatar Preview
          </div>
        </div>
      </div>

      {/* Helper Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-full pointer-events-none">
        {isDragging ? "Dragging..." : "Drag image to reposition avatar"}
      </div>

      {/* Control Buttons */}
      <div className="controls-area absolute top-6 right-6 flex flex-col gap-2 pointer-events-auto">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={onClose}
          className="h-10 w-10 bg-white/90 hover:bg-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Bottom Controls */}
      <div className="controls-area absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-3 pointer-events-auto">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={position.scale <= 0.2}
          className="text-white hover:bg-white/20 h-9 px-3"
        >
          <ZoomOut className="w-4 h-4 mr-1" />
          <span className="text-xs">Out</span>
        </Button>
        
        <div className="h-6 w-px bg-white/30" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={position.scale >= 3}
          className="text-white hover:bg-white/20 h-9 px-3"
        >
          <ZoomIn className="w-4 h-4 mr-1" />
          <span className="text-xs">In</span>
        </Button>
        
        <div className="h-6 w-px bg-white/30" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-white hover:bg-white/20 h-9 px-3"
        >
          <Maximize2 className="w-4 h-4 mr-1" />
          <span className="text-xs">Reset</span>
        </Button>
        
        <div className="h-6 w-px bg-white/30" />
        
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleSave}
          className="h-9 px-4 bg-[#c96442] hover:bg-[#b55638]"
        >
          <Check className="w-4 h-4 mr-1" />
          <span className="text-xs">Save & Close</span>
        </Button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
        {Math.round(position.scale * 100)}%
      </div>
    </div>
  );
}