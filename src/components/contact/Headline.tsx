import React from "react";

export function Headline({ name, title }: { name: string; title: string }) {
  return (
    <div className="relative rounded-bl-[24px] rounded-br-[24px] shrink-0 w-full" data-name="headline">
      <div className="flex flex-col items-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-center px-[24px] py-0 relative w-full">
          <TitleContact name={name} title={title} />
        </div>
      </div>
    </div>
  );
}

export function TitleContact({ name, title }: { name: string; title: string }) {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full" data-name="title">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[24px] text-center tracking-[-0.144px] w-full">
        <p className="leading-[32px]">{name}</p>
      </div>
      <SubTitleContact title={title} />
    </div>
  );
}

export function SubTitleContact({ title }: { title: string }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0 w-full" data-name="sub-title">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#83827d] text-[14px] text-nowrap">
        <p className="leading-[20px] whitespace-pre">{title}</p>
      </div>
    </div>
  );
}
