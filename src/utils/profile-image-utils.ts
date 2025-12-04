import { ProfileImageData } from "../types/business-card";

export function parseProfileImage(value: string): ProfileImageData | null {
  if (!value) return null;
  
  try {
    const parsed = JSON.parse(value);
    if (parsed.imageUrl) {
      return parsed as ProfileImageData;
    }
  } catch {
    // Backward compatibility - if it's just a URL string
    if (value && (value.startsWith('data:image') || value.startsWith('http'))) {
      return {
        imageUrl: value,
        facePosition: null
      };
    }
  }
  return null;
}

export function calculateImagePosition(profileImageData: ProfileImageData | null): {
  width: string;
  height: string;
  left: string;
  top: string;
  transform?: string;
  transformOrigin?: string;
} {
  // Prioritize avatar-specific positioning
  if (profileImageData?.avatarPosition) {
    const { x, y, scale } = profileImageData.avatarPosition;
    
    // Match positioner exactly: image uses h-full w-full object-contain with transform
    return {
      width: '100%',
      height: '100%',
      left: '0',
      top: '0',
      transform: `translate(${x}px, ${y}px) scale(${scale})`,
      transformOrigin: 'center center'
    };
  }

  // Fall back to home background position if available
  if (profileImageData?.position) {
    const { x, y, scale } = profileImageData.position;
    
    // The avatar is 120px diameter
    // Convert the home page positioning (which is for full screen) to avatar positioning
    // The user's adjustments are in pixels relative to screen center
    
    // Scale determines the zoom level
    const scaledWidth = scale * 100;
    const scaledHeight = scale * 100;
    
    // Convert pixel offsets to percentages relative to the avatar size (120px)
    // Normalize the offset based on the scaled image size
    const leftPercent = (x / 120) * 100 / scale;
    const topPercent = (y / 120) * 100 / scale;
    
    return {
      width: `${scaledWidth}%`,
      height: `${scaledHeight}%`,
      left: `${leftPercent}%`,
      top: `${topPercent}%`
    };
  }

  // Fall back to face position if available
  const facePosition = profileImageData?.facePosition;
  if (!facePosition) {
    // Default positioning - centered
    return {
      width: '265.83%',
      height: '177.24%',
      left: '-89.58%',
      top: '-14.46%'
    };
  }

  // Calculate positioning to center the face in the circular avatar
  // The avatar is 120px, and we want the face oval to be centered
  
  // Face center position as percentage
  const faceCenterX = facePosition.x + facePosition.width / 2;
  const faceCenterY = facePosition.y + facePosition.height / 2;
  
  // We want to position the image so the face center is at 50% of the avatar
  // Calculate the offset needed
  const offsetX = 50 - faceCenterX;
  const offsetY = 50 - faceCenterY;
  
  // Scale the image to make the face fill the avatar nicely
  // Base the scale on the face width (we want face to be ~70% of avatar diameter)
  const desiredFaceSize = 70; // percentage of avatar
  const scale = (desiredFaceSize / facePosition.width) * 100;
  
  // Apply the scale to dimensions
  const width = `${Math.min(scale * 2, 400)}%`; // Cap at 400% to prevent too large
  const height = `${Math.min(scale * 2, 400)}%`;
  
  // Calculate left and top with the offset
  const left = `${offsetX * (scale / 100)}%`;
  const top = `${offsetY * (scale / 100)}%`;
  
  return {
    width,
    height,
    left,
    top
  };
}