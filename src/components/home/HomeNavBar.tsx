import React from "react";
import svgPaths from "../../imports/svg-ryed6k4ibx";

export function HomeNavBar({ onProfileClick, onPortfolioClick, onSaveClick, onShareClick }: {
  onProfileClick: () => void;
  onPortfolioClick: () => void;
  onSaveClick: () => void;
  onShareClick: () => void;
}) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full h-[72px]" data-name="home-nav-bar">
      <button
        onClick={onProfileClick}
        className="content-stretch flex flex-col gap-[8px] items-center justify-center relative rounded-[12px] shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95"
        data-name="home-nav-profile-button"
      >
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="& I / Action  / account-circle">
            <div className="absolute inset-[8.333%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                <path d={svgPaths.p18fcaf00} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-nowrap text-slate-50">
          <p className="leading-[16px] whitespace-pre">Profile</p>
        </div>
      </button>
      <button
        onClick={onPortfolioClick}
        className="content-stretch flex flex-col gap-[8px] items-center justify-center relative rounded-[12px] shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95"
        data-name="home-nav-portfolio-button"
      >
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="icon / portfolio">
            <div className="absolute inset-[8.33%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                <g id="Vector">
                  <path clipRule="evenodd" d={svgPaths.pf322100} fill="var(--fill-0, #535146)" fillRule="evenodd" />
                  <path d={svgPaths.p3a254700} fill="var(--fill-0, #535146)" />
                </g>
              </svg>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-nowrap text-slate-50">
          <p className="leading-[16px] whitespace-pre">Portfolio</p>
        </div>
      </button>
      <button
        onClick={onSaveClick}
        className="content-stretch flex flex-col gap-[8px] items-center justify-center relative rounded-[12px] shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95"
        data-name="home-nav-save-button"
      >
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="& I / Action  / bookmark-border">
            <div className="absolute inset-[12.5%_20.83%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 18">
                <path d={svgPaths.p1a4cbf00} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-nowrap text-slate-50">
          <p className="leading-[16px] whitespace-pre">Save</p>
        </div>
      </button>
      <button
        onClick={onShareClick}
        className="content-stretch flex flex-col gap-[8px] items-center justify-center relative rounded-[12px] shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95"
        data-name="home-nav-share-button"
      >
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="& I / Social / share">
            <div className="absolute inset-[8.33%_12.5%_8.67%_12.5%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 20">
                <path d={svgPaths.p1c8e5000} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-nowrap text-slate-50">
          <p className="leading-[16px] whitespace-pre">Share</p>
        </div>
      </button>
    </div>
  );
}
