import React from "react";
import svgPaths from "../../imports/svg-ryed6k4ibx";
import { useNameFontSize } from "../../hooks/useNameFontSize";
import { SubTitle } from "./SubTitle";

export function Container({ onNavigateToContact, name, title, businessName, cardHeight, cardWidth }: { 
  onNavigateToContact: () => void; 
  name: string; 
  title: string; 
  businessName: string;
  cardHeight: number;
  cardWidth: number;
}) {
  const { fontSize, nameLines } = useNameFontSize(cardHeight, cardWidth, name);
  
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" style={{ gap: '8px' }} data-name="container">
      <button
        onClick={onNavigateToContact}
        className="overflow-clip relative shrink-0 size-[20px] cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95"
        data-name="Chevron Icon"
        aria-label="Open contact"
      >
        <div className="absolute inset-[33.33%_20.83%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
            <path clipRule="evenodd" d={svgPaths.p2c9b2300} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </button>
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] min-w-full not-italic relative shrink-0 text-slate-50 tracking-[-0.576px] w-[min-content]">
        <p 
          className="leading-[1.17]"
          style={{
            fontSize: `${fontSize}px`,
            ...(nameLines === 1 ? { whiteSpace: 'nowrap' } : {
              display: '-webkit-box',
              WebkitLineClamp: nameLines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word'
            })
          }}
        >
          {name}
        </p>
      </div>
      <SubTitle title={title} businessName={businessName} />
    </div>
  );
}
