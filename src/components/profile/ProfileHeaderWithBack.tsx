import React from "react";
import profileSvgPaths from "../../imports/svg-i5dwj49pkv";
import { ProfileLogo, ProfileMenuIcon } from "./ProfileIcons";

export function ProfileHeaderWithBack({ onBack, onMenuClick }: { onBack: () => void; onMenuClick: () => void }) {
  return (
    <div className="bg-[#faf9f5] box-border content-stretch flex gap-[12px] items-center justify-center px-[24px] py-[8px] relative shrink-0 w-full" data-name="profile-header">
      <button
        onClick={onBack}
        className="overflow-clip relative shrink-0 size-[24px] cursor-pointer transition-transform hover:scale-110 active:scale-95"
        data-name="Back Icon"
        aria-label="Back to home"
      >
        <div className="absolute inset-[20.83%_33.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 14">
            <path clipRule="evenodd" d={profileSvgPaths.p1656a400} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </button>
      <ProfileLogo />
      <ProfileMenuIcon onClick={onMenuClick} />
    </div>
  );
}
