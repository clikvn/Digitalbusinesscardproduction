import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { X, ZoomIn, ZoomOut, Maximize2, Check } from "lucide-react";
import { ProfileImageData } from "../../types/business-card";
import imgImg from "figma:asset/420b26ed698402e60bcb7141f4b23bc3850beb9d.png";
import svgPaths from "../../imports/svg-ryed6k4ibx";

interface FullScreenImagePositionerProps {
  imageUrl: string;
  initialPosition?: { x: number; y: number; scale: number };
  profileName: string;
  profileTitle: string;
  onSave: (position: { x: number; y: number; scale: number }) => void;
  onClose: () => void;
}

export function FullScreenImagePositioner({
  imageUrl,
  initialPosition = { x: 0, y: 0, scale: 1 },
  profileName,
  profileTitle,
  onSave,
  onClose
}: FullScreenImagePositionerProps) {
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
    e.preventDefault(); // Prevent default touch behavior
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
      style={{ touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image */}
      <div className="h-screen relative shrink-0 w-full select-none overflow-hidden" data-name="home-background-image">
        <div className="absolute bottom-0 left-0 right-0 top-0" data-name="img">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0">
              <img 
                alt="" 
                className="absolute h-full w-full object-contain pointer-events-none" 
                src={imageUrl || imgImg}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale})`,
                  transformOrigin: 'center center'
                }}
              />
            </div>
            <div className="absolute left-0 right-0 bottom-0 h-[550px] bg-gradient-to-b from-transparent to-[#c96442] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="absolute backdrop-blur-lg backdrop-filter bg-[rgba(255,222,207,0.33)] bottom-[18px] box-border content-stretch flex flex-col h-[50vh] items-center justify-between left-[4.27%] pb-[clamp(20px,3vh,24px)] pt-[clamp(16px,2vh,20px)] px-[24px] right-[4.27%] rounded-[24px] pointer-events-none">
        <div className="content-stretch flex flex-col gap-[clamp(4px,0.5vh,8px)] items-center relative shrink-0 w-full">
          <div className="overflow-clip relative shrink-0 size-[20px]">
            <div className="absolute inset-[33.33%_20.83%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                <path clipRule="evenodd" d={svgPaths.p2c9b2300} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[clamp(24px,5vh,40px)] text-slate-50 tracking-[-0.576px] w-[min-content]">
            <p className="leading-[1.17]">{profileName || "Your Name"}</p>
          </div>
          <div className="box-border content-stretch flex gap-[16px] items-center pb-0 pt-[8px] px-0 relative shrink-0 w-full">
            <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-slate-50">
              <p className="leading-[20px]">{profileTitle || "Your Title"}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#c96442] h-[48px] relative rounded-[12px] shrink-0 w-full">
          <div className="flex flex-row items-center justify-center size-full">
            <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-slate-50">
              <p className="leading-[20px]">Contact</p>
            </div>
          </div>
        </div>
      </div>

      {/* Helper Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-full pointer-events-none">
        {isDragging ? "Dragging..." : "Drag image to reposition"}
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