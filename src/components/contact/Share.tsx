import React from "react";
import { useParams } from "react-router-dom";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { parseProfileImage, calculateImagePosition } from "../../utils/profile-image-utils";
import imgImg from "figma:asset/420b26ed698402e60bcb7141f4b23bc3850beb9d.png";
import { Headline } from "./Headline";
import { CallToAction } from "./CallToAction";
import { getUserCode } from "../../utils/user-code";

export function Share({ onAIClick }: { onAIClick?: () => void }) {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);

  // Loading state
  if (isLoading) {
    return (
      <div className="box-border content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-tl-[24px] rounded-tr-[24px] shrink-0 w-full" data-name="share">
        <div className="relative rounded-[100px] shrink-0 size-[120px] bg-gray-200 animate-pulse" />
        <div className="flex flex-col gap-2 items-center">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('[Share] Error loading profile:', error);
    return (
      <div className="box-border content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-tl-[24px] rounded-tr-[24px] shrink-0 w-full" data-name="share">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="text-[#c96442] text-lg">⚠️</div>
          <p className="text-[#3d3d3a]">Unable to load profile</p>
          <p className="text-sm text-[#83827d]">Please try again later</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    console.warn('[Share] No data returned from hook');
    return (
      <div className="box-border content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-tl-[24px] rounded-tr-[24px] shrink-0 w-full" data-name="share">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-[#3d3d3a]">Profile not found</p>
        </div>
      </div>
    );
  }

  // Parse profile image data
  const profileImageData = parseProfileImage(data.personal.profileImage);
  const imageUrl = profileImageData?.imageUrl || imgImg;
  const imagePosition = calculateImagePosition(profileImageData);

  return (
    <div className="box-border content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-tl-[24px] rounded-tr-[24px] shrink-0 w-full" data-name="share">
      <div className="relative rounded-[100px] shrink-0 size-[120px]" data-name="avatar">
        <div className="overflow-clip relative rounded-[inherit] size-[120px]">
          <div className="absolute inset-0 rounded-[100px]" data-name="img">
            <div className="absolute overflow-hidden pointer-events-none rounded-[100px]" style={{
              width: '100vw',
              height: '100vh',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%) scale(0.75)',
              transformOrigin: 'center center'
            }}>
              <img 
                alt="Profile" 
                className="absolute h-full w-full object-contain" 
                src={imageUrl}
                style={{
                  ...(imagePosition.transform && {
                    transform: imagePosition.transform,
                    transformOrigin: imagePosition.transformOrigin
                  })
                }}
              />
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border-8 border-solid border-white inset-[-8px] pointer-events-none rounded-[108px]" />
      </div>
      <Headline name={data.personal.name} title={data.personal.title} />
      <CallToAction onAIClick={onAIClick} />
    </div>
  );
}
