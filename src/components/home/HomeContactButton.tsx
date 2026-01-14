import React from "react";
import { useTranslation } from "react-i18next";
import svgPaths from "../../imports/svg-ryed6k4ibx";

export function HomeContactButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="bg-[#c96442] h-[48px] relative rounded-[12px] shrink-0 w-full cursor-pointer transition-all hover:bg-[#b85838] active:scale-[0.98]"
      data-name="home-contact-button"
    >
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[48px] items-center justify-center p-[12px] relative w-full">
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Contact Icon">
            <div className="absolute bottom-[20.83%] left-1/4 right-1/4 top-[62.5%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 3">
                <path clipRule="evenodd" d={svgPaths.p17e65e00} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" id="Vector (Stroke)" />
              </svg>
            </div>
            <div className="absolute inset-[12.5%_8.33%_4.17%_8.33%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                <path clipRule="evenodd" d={svgPaths.p5800fc0} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector (Stroke)" />
              </svg>
            </div>
            <div className="absolute inset-[29.17%_37.5%_45.83%_37.5%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 4">
                <path clipRule="evenodd" d={svgPaths.p17049100} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector (Stroke)" />
              </svg>
            </div>
            <div className="absolute inset-[4.17%_62.5%_79.17%_29.17%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 3">
                <path clipRule="evenodd" d={svgPaths.p39029480} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector (Stroke)" />
              </svg>
            </div>
            <div className="absolute inset-[4.17%_29.17%_79.17%_62.5%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 3">
                <path clipRule="evenodd" d={svgPaths.p39029480} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-slate-50">
            <p className="leading-[20px] whitespace-pre">{t("common.contact")}</p>
          </div>
        </div>
      </div>
    </button>
  );
}
