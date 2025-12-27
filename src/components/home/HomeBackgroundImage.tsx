import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import imgImg from "../../assets/myClik.png";
import { parseProfileImage } from "../../utils/profile-image-utils";
import { calculateBackgroundImagePosition } from "../../utils/home-background-positioning";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { getUserCode } from "../../utils/user-code";

export function HomeBackgroundImage() {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  
  // If no userCode (e.g. not in a route), fallback to default
  const targetUserCode = userCode || getUserCode();
  
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);

  // Parse profile image data
  const profileImageData = parseProfileImage(data?.personal.profileImage || '');
  const imageUrl = profileImageData?.imageUrl || imgImg;
  const bgPosition = calculateBackgroundImagePosition(profileImageData);

  // Reset loading state when image URL changes and preload the image
  useEffect(() => {
    if (!isLoading && imageUrl) {
      setImageLoaded(false);
      setCurrentImageUrl(imageUrl);
      
      // Preload the image
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
      };
      img.onerror = () => {
        // Even on error, set loaded to true to show something
        setImageLoaded(true);
      };
      img.src = imageUrl;
    }
  }, [imageUrl, isLoading]);

  if (isLoading || error) return null; // Fallback to no background during load/error

  return (
    <div className="relative shrink-0 w-full overflow-hidden z-0" style={{ height: 'calc(var(--vh, 1vh) * 100)' }} data-name="home-background-image">
      {/* Background Gradient - Black to Terracotta */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-[#c96442]" />
      
      <div className="absolute bottom-0 left-0 right-0 top-0" data-name="img">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0">
            {currentImageUrl && (
              <img 
                alt="" 
                className="absolute h-full w-full object-contain transition-opacity duration-500" 
                src={currentImageUrl}
                style={{
                  transform: bgPosition.transform,
                  transformOrigin: bgPosition.transformOrigin,
                  opacity: imageLoaded ? 1 : 0
                }}
              />
            )}
          </div>
          {/* Bottom Gradient Overlay - Fades portrait into background */}
          <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-b from-transparent to-[#c96442]" style={{ height: 'min(550px, calc(var(--vh, 1vh) * 70))' }} />
        </div>
      </div>
    </div>
  );
}