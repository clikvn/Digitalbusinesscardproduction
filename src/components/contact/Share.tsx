import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { parseProfileImage, calculateImagePosition } from "../../utils/profile-image-utils";
import imgImg from "figma:asset/420b26ed698402e60bcb7141f4b23bc3850beb9d.png";
import { Headline } from "./Headline";
import { CallToAction } from "./CallToAction";
import { getUserCode } from "../../utils/user-code";

export function Share({ onAIClick }: { onAIClick?: () => void }) {
  const { t } = useTranslation();
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
          <p className="text-[#3d3d3a]">{t("public.unableToLoadProfile")}</p>
          <p className="text-sm text-[#83827d]">{t("public.pleaseTryAgainLater")}</p>
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
          <p className="text-[#3d3d3a]">{t("public.profileNotFound")}</p>
        </div>
      </div>
    );
  }

  // Parse profile image data
  const profileImageData = parseProfileImage(data.personal.profileImage);
  const imageUrl = profileImageData?.imageUrl || imgImg;
  const imagePosition = calculateImagePosition(profileImageData);

  // Fixed reference size matching AvatarImagePositioner (1920x1080px)
  const REFERENCE_WIDTH = 1920;
  const REFERENCE_HEIGHT = 1080;
  
  // Circle size matching AvatarImagePositioner (160px)
  const CIRCLE_SIZE = 160;
  
  return (
    <div className="box-border content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-tl-[24px] rounded-tr-[24px] shrink-0 w-full" data-name="share">
      <div className="relative rounded-[100px] shrink-0 overflow-hidden" style={{ width: `${CIRCLE_SIZE}px`, height: `${CIRCLE_SIZE}px` }} data-name="avatar">
        {/* Fixed-size container matching AvatarImagePositioner exactly */}
        {/* The container is 1920x1080px, same as positioner, centered and clipped to 160px circle */}
        {/* Structure matches positioner: container -> inset-0 -> inset-0 -> img */}
        <div 
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            width: `${REFERENCE_WIDTH}px`,
            height: `${REFERENCE_HEIGHT}px`,
            transform: 'translate(-50%, -50%)',
            transformOrigin: 'center center'
          }}
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0">
                <img 
                  alt="Profile" 
                  className="absolute h-full w-full object-contain pointer-events-none" 
                  src={imageUrl}
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'center center',
                    ...(imagePosition.transform && {
                      transform: imagePosition.transform,
                      transformOrigin: imagePosition.transformOrigin || 'center center'
                    })
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border-8 border-solid border-white pointer-events-none rounded-[100px]" style={{
          inset: '-8px',
          width: `${CIRCLE_SIZE + 16}px`,
          height: `${CIRCLE_SIZE + 16}px`
        }} />
      </div>
      <Headline name={data.personal.name} title={data.personal.title} />
      <CallToAction onAIClick={onAIClick} />
    </div>
  );
}
