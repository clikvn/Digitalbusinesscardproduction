import React from "react";
import profileSvgPaths from "../../imports/svg-i5dwj49pkv";

export function ProfileLogo() {
  return (
    <div className="basis-0 content-stretch flex grow h-[48px] items-center justify-center min-h-px min-w-px relative shrink-0" data-name="logo">
      <div className="basis-0 flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#535146] text-[20px] tracking-[-0.1px]">
        <p className="leading-[28px]">Profile</p>
      </div>
    </div>
  );
}

export function ProfileMenuIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="overflow-clip relative shrink-0 size-[24px] cursor-pointer transition-transform hover:scale-110 active:scale-95"
      data-name="Menu Icon"
      aria-label="Open menu"
    >
      <div className="absolute inset-[45.83%_12.5%]" data-name="Vector (Stroke)">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 2">
          <path clipRule="evenodd" d={profileSvgPaths.p1ed66800} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
        </svg>
      </div>
      <div className="absolute inset-[20.83%_12.5%_70.83%_12.5%]" data-name="Vector (Stroke)">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 2">
          <path clipRule="evenodd" d={profileSvgPaths.p1ed66800} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
        </svg>
      </div>
      <div className="absolute inset-[70.83%_12.5%_20.83%_12.5%]" data-name="Vector (Stroke)">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 2">
          <path clipRule="evenodd" d={profileSvgPaths.p1ed66800} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
        </svg>
      </div>
    </button>
  );
}
