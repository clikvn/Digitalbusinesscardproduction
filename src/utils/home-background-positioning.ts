import { ProfileImageData } from "../types/business-card";

export function calculateBackgroundImagePosition(
  imageData: ProfileImageData | null
): {
  transform: string;
  transformOrigin: string;
} {
  if (!imageData?.position) {
    // Default positioning - no transform
    return {
      transform: 'none',
      transformOrigin: 'center center'
    };
  }

  const { x, y, scale } = imageData.position;
  
  return {
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    transformOrigin: 'center center'
  };
}
