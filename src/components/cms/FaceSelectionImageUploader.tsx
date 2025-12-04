import React, { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Upload, X, Image as ImageIcon, Check, User } from "lucide-react";
import { fileToDataURL, validateImageFile } from "../../utils/file-utils";
import { toast } from "sonner@2.0.3";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "../ui/dialog";

export interface ProfileImageData {
  imageUrl: string;
  facePosition: {
    x: number; // percentage from left (0-100)
    y: number; // percentage from top (0-100)
    width: number; // percentage of image width (0-100)
    height: number; // percentage of image height (0-100)
  } | null;
}

interface FaceSelectionImageUploaderProps {
  label: string;
  value: string; // JSON string of ProfileImageData or just image URL for backward compatibility
  onChange: (value: string) => void;
  aspectRatio?: string;
  description?: string;
}

export function FaceSelectionImageUploader({ 
  label, 
  value, 
  onChange, 
  aspectRatio, 
  description 
}: FaceSelectionImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasInitialized = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showFaceSelector, setShowFaceSelector] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; ovalX: number; ovalY: number } | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentOval, setCurrentOval] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [detectionStatus, setDetectionStatus] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Parse the value to get image data
  const parseValue = (val: string): ProfileImageData | null => {
    if (!val) return null;
    
    try {
      const parsed = JSON.parse(val);
      if (parsed.imageUrl) {
        return parsed as ProfileImageData;
      }
    } catch {
      // Backward compatibility - if it's just a URL string
      if (val.startsWith('data:image')) {
        return {
          imageUrl: val,
          facePosition: null
        };
      }
    }
    return null;
  };

  const imageData = parseValue(value);

  const detectFace = async (imageUrl: string, imgWidth: number, imgHeight: number) => {
    try {
      // Check if Face Detection API is available
      if ('FaceDetector' in window) {
        setDetectionStatus('Detecting face...');
        
        const faceDetector = new (window as any).FaceDetector();
        
        // Create image element for detection
        const img = new Image();
        img.src = imageUrl;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          // Add timeout to prevent hanging
          setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        
        const faces = await faceDetector.detect(img);
        
        if (faces.length > 0) {
          const face = faces[0].boundingBox;
          
          // Convert to canvas coordinates
          const scaleX = imgWidth / img.naturalWidth;
          const scaleY = imgHeight / img.naturalHeight;
          
          // Add some padding around the detected face
          const padding = 0.3; // 30% padding
          const paddedWidth = face.width * (1 + padding);
          const paddedHeight = face.height * (1 + padding);
          const paddedX = face.x - (paddedWidth - face.width) / 2;
          const paddedY = face.y - (paddedHeight - face.height) / 2;
          
          setCurrentOval({
            x: paddedX * scaleX,
            y: paddedY * scaleY,
            width: paddedWidth * scaleX,
            height: paddedHeight * scaleY
          });
          
          setDetectionStatus('Face detected! Adjust the oval if needed.');
          return true;
        }
      }
    } catch (error) {
      console.log('Face detection not available or failed:', error);
    }
    
    // If face detection failed or not available, create default oval
    console.log('Face detection failed/unavailable, creating default oval');
    setDetectionStatus('Drag to adjust position');
    createDefaultOval(imgWidth, imgHeight);
    return false;
  };

  const createDefaultOval = (imgWidth: number, imgHeight: number) => {
    console.log('Creating default oval', { imgWidth, imgHeight });
    // Create an oval in the upper-center portion of the image
    const ovalWidth = imgWidth * 0.4; // 40% of image width
    const ovalHeight = imgHeight * 0.5; // 50% of image height
    const ovalX = (imgWidth - ovalWidth) / 2; // Centered horizontally
    const ovalY = imgHeight * 0.15; // Start at 15% from top
    
    const oval = {
      x: ovalX,
      y: ovalY,
      width: ovalWidth,
      height: ovalHeight
    };
    console.log('Setting default oval', oval);
    setCurrentOval(oval);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      setIsUploading(false);
      return;
    }

    try {
      // Reset states before opening
      setCurrentOval(null);
      setImageSize({ width: 0, height: 0 });
      setIsProcessingImage(false);
      hasInitialized.current = false;
      
      const dataURL = await fileToDataURL(file);
      setUploadedImage(dataURL);
      setShowFaceSelector(true);
      setDetectionStatus('Processing...');
      toast.success("Image uploaded. Detecting face...");
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    }

    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const drawImage = async () => {
    console.log('drawImage called', { hasCanvas: !!canvasRef.current, hasImage: !!uploadedImage, hasInit: hasInitialized.current });
    
    if (!canvasRef.current || !uploadedImage) {
      console.log('drawImage early return - no canvas or image');
      return;
    }
    if (hasInitialized.current) {
      console.log('drawImage early return - already initialized');
      return; // Prevent running twice
    }

    hasInitialized.current = true;
    setIsProcessingImage(true);
    console.log('Starting image processing...');
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('No canvas context');
      setIsProcessingImage(false);
      hasInitialized.current = false;
      return;
    }

    const img = new Image();
    img.onload = async () => {
      console.log('Image loaded', { width: img.width, height: img.height });
      try {
        // Set canvas size to match container while maintaining aspect ratio
        const maxWidth = 600;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        setImageSize({ width, height });
        console.log('Canvas sized', { width, height });

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        console.log('Image drawn on canvas');

        // Detect face or create default oval if not already set
        // Check if we're editing an existing image with face position
        if (imageData?.imageUrl === uploadedImage && imageData?.facePosition) {
          console.log('Loading existing face position');
          loadExistingFacePosition(width, height);
        } else {
          console.log('Detecting face...');
          await detectFace(uploadedImage, width, height);
        }
        
        setIsProcessingImage(false);
        console.log('Processing complete');
      } catch (error) {
        console.error('Error drawing image:', error);
        setDetectionStatus('Error loading image. Please try again.');
        setIsProcessingImage(false);
        hasInitialized.current = false;
      }
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image', error);
      setDetectionStatus('Failed to load image. Please try again.');
      toast.error('Failed to load image');
      setIsProcessingImage(false);
      hasInitialized.current = false;
    };
    
    console.log('Setting img.src to:', uploadedImage.substring(0, 50) + '...');
    img.src = uploadedImage;
  };

  const drawOval = (ctx: CanvasRenderingContext2D, oval: { x: number; y: number; width: number; height: number }) => {
    const centerX = oval.x + oval.width / 2;
    const centerY = oval.y + oval.height / 2;
    const radiusX = Math.abs(oval.width / 2);
    const radiusY = Math.abs(oval.height / 2);

    // Draw the oval outline
    ctx.strokeStyle = '#c96442';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw semi-transparent overlay outside the oval
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Draw resize handles
    const handleSize = 10;
    ctx.fillStyle = '#c96442';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    const handles = [
      { x: oval.x, y: oval.y }, // top-left
      { x: oval.x + oval.width, y: oval.y }, // top-right
      { x: oval.x, y: oval.y + oval.height }, // bottom-left
      { x: oval.x + oval.width, y: oval.y + oval.height }, // bottom-right
    ];

    handles.forEach(handle => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, handleSize / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
  };

  // Initialize canvas when dialog opens
  useEffect(() => {
    console.log('useEffect triggered', { showFaceSelector, hasImage: !!uploadedImage, hasInit: hasInitialized.current, hasCanvas: !!canvasRef.current });
    if (showFaceSelector && uploadedImage && !hasInitialized.current) {
      console.log('Calling drawImage from useEffect');
      // Check if canvas is ready, if not wait for it
      let retryCount = 0;
      const maxRetries = 20; // Max 1 second wait (20 * 50ms)
      
      const attemptDraw = () => {
        if (canvasRef.current) {
          console.log('Canvas ready, calling drawImage');
          drawImage();
        } else if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Canvas not ready, retrying (${retryCount}/${maxRetries})...`);
          setTimeout(attemptDraw, 50);
        } else {
          console.error('Canvas failed to mount after max retries');
          setDetectionStatus('Failed to initialize. Please try again.');
          toast.error('Failed to initialize canvas');
        }
      };
      attemptDraw();
    }
  }, [showFaceSelector, uploadedImage]);

  // Redraw when oval changes (for drag/resize)
  useEffect(() => {
    console.log('Redraw useEffect triggered', { 
      hasOval: !!currentOval, 
      hasCanvas: !!canvasRef.current, 
      imageWidth: imageSize.width, 
      hasImage: !!uploadedImage 
    });
    
    if (currentOval && canvasRef.current && imageSize.width > 0 && uploadedImage) {
      console.log('Redrawing canvas with oval', currentOval);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('No context for redraw');
        return;
      }

      const img = new Image();
      img.onload = () => {
        console.log('Redraw image loaded, drawing...');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawOval(ctx, currentOval);
        console.log('Redraw complete');
      };
      img.onerror = () => {
        console.error('Failed to load image for redraw');
      };
      img.src = uploadedImage;
    }
  }, [currentOval]);

  const isPointInOval = (px: number, py: number, oval: { x: number; y: number; width: number; height: number }): boolean => {
    const centerX = oval.x + oval.width / 2;
    const centerY = oval.y + oval.height / 2;
    const radiusX = oval.width / 2;
    const radiusY = oval.height / 2;
    
    const normalizedX = (px - centerX) / radiusX;
    const normalizedY = (py - centerY) / radiusY;
    
    return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1;
  };

  const getResizeHandle = (x: number, y: number, oval: { x: number; y: number; width: number; height: number }): 'tl' | 'tr' | 'bl' | 'br' | null => {
    const handleSize = 15;
    const handles = [
      { id: 'tl' as const, x: oval.x, y: oval.y },
      { id: 'tr' as const, x: oval.x + oval.width, y: oval.y },
      { id: 'bl' as const, x: oval.x, y: oval.y + oval.height },
      { id: 'br' as const, x: oval.x + oval.width, y: oval.y + oval.height },
    ];

    for (const handle of handles) {
      const dx = x - handle.x;
      const dy = y - handle.y;
      if (Math.sqrt(dx * dx + dy * dy) < handleSize) {
        return handle.id;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentOval) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a resize handle
    const handle = getResizeHandle(x, y, currentOval);
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      return;
    }

    // Check if clicking inside the oval for dragging
    if (isPointInOval(x, y, currentOval)) {
      setIsDragging(true);
      setDragStart({ 
        x, 
        y, 
        ovalX: currentOval.x, 
        ovalY: currentOval.y 
      });
      return;
    }

    // Otherwise, start drawing a new oval
    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentOval({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Update cursor based on position
    if (currentOval && !isDragging && !isResizing && !isDrawing) {
      const handle = getResizeHandle(currentX, currentY, currentOval);
      if (handle) {
        canvas.style.cursor = handle === 'tl' || handle === 'br' ? 'nwse-resize' : 'nesw-resize';
      } else if (isPointInOval(currentX, currentY, currentOval)) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    }

    if (isDrawing && startPoint) {
      const width = currentX - startPoint.x;
      const height = currentY - startPoint.y;

      setCurrentOval({
        x: width < 0 ? currentX : startPoint.x,
        y: height < 0 ? currentY : startPoint.y,
        width: Math.abs(width),
        height: Math.abs(height)
      });
    } else if (isDragging && dragStart && currentOval) {
      const dx = currentX - dragStart.x;
      const dy = currentY - dragStart.y;

      setCurrentOval({
        ...currentOval,
        x: dragStart.ovalX + dx,
        y: dragStart.ovalY + dy
      });
    } else if (isResizing && resizeHandle && currentOval) {
      const newOval = { ...currentOval };

      switch (resizeHandle) {
        case 'tl':
          newOval.width = currentOval.x + currentOval.width - currentX;
          newOval.height = currentOval.y + currentOval.height - currentY;
          newOval.x = currentX;
          newOval.y = currentY;
          break;
        case 'tr':
          newOval.width = currentX - currentOval.x;
          newOval.height = currentOval.y + currentOval.height - currentY;
          newOval.y = currentY;
          break;
        case 'bl':
          newOval.width = currentOval.x + currentOval.width - currentX;
          newOval.height = currentY - currentOval.y;
          newOval.x = currentX;
          break;
        case 'br':
          newOval.width = currentX - currentOval.x;
          newOval.height = currentY - currentOval.y;
          break;
      }

      // Ensure minimum size
      if (newOval.width > 20 && newOval.height > 20) {
        setCurrentOval(newOval);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setStartPoint(null);
    setDragStart(null);
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Simulate mouse down
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseDown(mouseEvent as any);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseMove(mouseEvent as any);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseUp();
  };

  const handleSubmitFaceSelection = () => {
    if (!uploadedImage || !currentOval) {
      toast.error("Please draw an oval around the face area");
      return;
    }

    // Convert pixel values to percentages
    const facePosition = {
      x: (currentOval.x / imageSize.width) * 100,
      y: (currentOval.y / imageSize.height) * 100,
      width: (currentOval.width / imageSize.width) * 100,
      height: (currentOval.height / imageSize.height) * 100
    };

    const profileImageData: ProfileImageData = {
      imageUrl: uploadedImage,
      facePosition
    };

    onChange(JSON.stringify(profileImageData));
    setShowFaceSelector(false);
    setUploadedImage(null);
    setCurrentOval(null);
    setDetectionStatus('');
    setImageSize({ width: 0, height: 0 });
    setIsProcessingImage(false);
    hasInitialized.current = false;
    toast.success("Profile image saved successfully");
  };

  const handleSkipFaceSelection = () => {
    if (!uploadedImage) return;

    const profileImageData: ProfileImageData = {
      imageUrl: uploadedImage,
      facePosition: null
    };

    onChange(JSON.stringify(profileImageData));
    setShowFaceSelector(false);
    setUploadedImage(null);
    setCurrentOval(null);
    setDetectionStatus('');
    setImageSize({ width: 0, height: 0 });
    setIsProcessingImage(false);
    hasInitialized.current = false;
    setCurrentOval(null);
    toast.success("Profile image saved successfully");
  };

  const handleCancelFaceSelection = () => {
    setShowFaceSelector(false);
    setUploadedImage(null);
    setCurrentOval(null);
    setDetectionStatus('');
    setImageSize({ width: 0, height: 0 });
    setIsProcessingImage(false);
    hasInitialized.current = false;
  };

  const handleEditFaceSelection = () => {
    if (!imageData?.imageUrl) return;
    
    // Reset states before opening
    setCurrentOval(null);
    setImageSize({ width: 0, height: 0 });
    setIsProcessingImage(false);
    hasInitialized.current = false;
    
    setUploadedImage(imageData.imageUrl);
    setShowFaceSelector(true);
    setDetectionStatus('Edit your face selection');
    
    // Don't auto-detect on edit, we'll load the existing position when canvas is ready
  };

  const loadExistingFacePosition = (imgWidth: number, imgHeight: number) => {
    if (!imageData?.facePosition) {
      createDefaultOval(imgWidth, imgHeight);
      return;
    }

    // Convert percentage back to pixel coordinates
    const facePos = imageData.facePosition;
    setCurrentOval({
      x: (facePos.x / 100) * imgWidth,
      y: (facePos.y / 100) * imgHeight,
      width: (facePos.width / 100) * imgWidth,
      height: (facePos.height / 100) * imgHeight
    });
  };

  const handleReset = () => {
    setCurrentOval(null);
    setDetectionStatus('');
    if (uploadedImage && imageSize.width > 0) {
      createDefaultOval(imageSize.width, imageSize.height);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="space-y-2">
        {imageData?.imageUrl ? (
          <div className="space-y-2">
            <div className="relative group cursor-pointer" onClick={handleEditFaceSelection}>
              <img
                src={imageData.imageUrl}
                alt="Profile"
                className="w-full h-48 object-cover rounded-lg border-2 border-[#535146]/20 transition-all group-hover:border-[#c96442]"
                style={aspectRatio ? { aspectRatio } : undefined}
              />
              {imageData.facePosition && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Face Selected
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-2 rounded-lg flex items-center gap-2">
                  <User className="w-4 h-4 text-[#c96442]" />
                  <span className="text-sm text-[#535146]">
                    {imageData.facePosition ? 'Edit Face Selection' : 'Add Face Selection'}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                className="absolute top-2 right-2 h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleEditFaceSelection}
                className="flex-1"
              >
                <User className="w-4 h-4 mr-2" />
                {imageData.facePosition ? 'Edit Face Selection' : 'Add Face Selection'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Change Image
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-[#535146]/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#535146]/40 hover:bg-[#e9e6dc]/20 transition-colors"
              style={aspectRatio ? { aspectRatio } : undefined}
            >
              <ImageIcon className="w-12 h-12 text-[#535146]/30 mb-2" />
              <p className="text-sm text-[#535146] text-center">Click to upload profile image</p>
              <p className="text-xs text-[#535146]/40 mt-1">JPG, PNG, GIF or WebP (max 5MB)</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Uploading..." : "Choose Image"}
            </Button>
          </>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {description && <p className="text-xs text-[#535146]/60">{description}</p>}

      {/* Face Selection Dialog */}
      <Dialog open={showFaceSelector} onOpenChange={(open) => {
        if (!open) {
          handleCancelFaceSelection();
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Face Area</DialogTitle>
            <DialogDescription>
              {detectionStatus ? (
                <span className="text-[#c96442]">{detectionStatus}</span>
              ) : (
                "Adjust the oval around the face area to ensure optimal positioning on your profile."
              )}
              <br />
              <span className="text-xs mt-1 block">
                • Drag the oval to move it • Drag corner handles to resize • Click outside to draw new
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center bg-zinc-100 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="max-w-full touch-none"
                style={{ maxHeight: '600px', cursor: 'crosshair' }}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelFaceSelection}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSkipFaceSelection}
            >
              Skip Face Selection
            </Button>
            <Button
              type="button"
              onClick={handleSubmitFaceSelection}
              className="bg-[#c96442] hover:bg-[#b85838]"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Face Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
