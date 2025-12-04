import React, { useState, useEffect } from "react";
import svgPaths from "../../imports/svg-ryed6k4ibx";

export function SubTitle({ title, businessName }: { title: string; businessName: string }) {
  return (
    <div className="box-border content-stretch flex gap-[16px] items-center pb-0 pt-[8px] px-0 relative shrink-0 w-full" data-name="sub-title">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-slate-50 overflow-hidden">
        <p className="leading-[20px] truncate">{title}</p>
      </div>
      {businessName && (
        <div className="flex gap-[6px] items-center">
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Building Icon">
            <div className="absolute inset-[8.33%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 13V3C2 2.44772 2.44772 2 3 2H7C7.55228 2 8 2.44772 8 3V5H11C11.5523 5 12 5.44772 12 6V13M2 13H12M2 13H1M12 13H13M4 5H6M4 7H6M4 9H6M9 7H11M9 9H11M9 11H11" stroke="#F8FAFC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-slate-50">
            <p className="leading-[20px] whitespace-pre">{businessName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
