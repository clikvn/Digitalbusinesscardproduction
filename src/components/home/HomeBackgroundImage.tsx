import React from "react";
import { useParams } from "react-router-dom";
import imgImg from "../../assets/myClik.png";
import { parseProfileImage } from "../../utils/profile-image-utils";
import { calculateBackgroundImagePosition } from "../../utils/home-background-positioning";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { getUserCode } from "../../utils/user-code";

export function HomeBackgroundImage() {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  
  // If no userCode (e.g. not in a route), fallback to default
  const targetUserCode = userCode || getUserCode();
  
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);
  
  if (isLoading || error) return null; // Fallback to no background during load/error

  // Parse profile image data
  const profileImageData = parseProfileImage(data?.personal.profileImage || '');
  const imageUrl = profileImageData?.imageUrl || imgImg;
  const bgPosition = calculateBackgroundImagePosition(profileImageData);

  return (
    <div className="relative shrink-0 w-full overflow-hidden" style={{ height: 'calc(var(--vh, 1vh) * 100)' }} data-name="home-background-image">
      {/* Background Gradient - Black to Terracotta */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-[#c96442]" />
      
      <div className="absolute bottom-0 left-0 right-0 top-0" data-name="img">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0">
            <img 
              alt="" 
              className="absolute h-full w-full object-contain" 
              src={imageUrl}
              style={{
                transform: bgPosition.transform,
                transformOrigin: bgPosition.transformOrigin
              }}
            />
          </div>
          {/* Bottom Gradient Overlay - Fades portrait into background */}
          <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-b from-transparent to-[#c96442]" style={{ height: 'min(550px, calc(var(--vh, 1vh) * 70))' }} />
        </div>
      </div>
    </div>
  );
}