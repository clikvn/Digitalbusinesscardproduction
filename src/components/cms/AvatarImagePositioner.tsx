import React, { useState, useRef } from "react";
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.controls-area')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      ...position,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.controls-area')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    setPosition({
      ...position,
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setPosition({ ...position, scale: Math.min(position.scale + 0.1, 3) });
  };

  const handleZoomOut = () => {
    setPosition({ ...position, scale: Math.max(position.scale - 0.1, 0.5) });
  };

  const handleReset = () => {
    setPosition({ x: 0, y: 0, scale: 1 });
  };

  const handleSave = () => {
    onSave(position);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image - Full Screen */}
      <div className="h-screen relative shrink-0 w-full select-none overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 top-0">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0">
              <img 
                alt="" 
                className="absolute h-full w-full object-contain pointer-events-none" 
                src={imageUrl}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale})`,
                  transformOrigin: 'center center'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dark Overlay with Circular Cutout */}
      <div className="absolute inset-0 pointer-events-none">
        {/* This creates a dark overlay everywhere except the circle */}
        <div 
          className="absolute inset-0 bg-black/60"
          style={{
            clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, calc(50% - 80px) 50%, calc(50% - 80px) 50%, calc(50% + 80px) 50%, calc(50% + 80px) 50%, calc(50% - 80px) 50%)'
          }}
        />
        
        {/* Circular Guide Frame */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            {/* Circle border guide */}
            <div 
              className="rounded-full border-4 border-white shadow-2xl"
              style={{ width: '160px', height: '160px' }}
            />
            
            {/* Label */}
            <div className="mt-4 text-center text-white text-sm font-medium bg-black/50 rounded-full px-4 py-2">
              Avatar Preview
            </div>
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
          disabled={position.scale <= 0.5}
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
