import svgPaths from "./svg-p3p7jcj1vn";
import imgImg from "figma:asset/25d1a77020008b9e3f08babd1f67f01cdb8f89d6.png";
import imgImg1 from "figma:asset/d0400c167c2b5599f72e19a01b70f51fb477fb65.png";
import imgImg2 from "figma:asset/8e2d5bcb44df5cb0b3eb50296d53dd2bead6e45d.png";
import imgImg3 from "figma:asset/513dd7bc494865ca5a45fb92277a8d681c3397ff.png";

function Logo() {
  return (
    <div className="basis-0 content-stretch flex grow h-[48px] items-center justify-center min-h-px min-w-px relative shrink-0" data-name="logo">
      <div className="basis-0 flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#535146] text-[20px] tracking-[-0.1px]">
        <p className="leading-[28px]">Share Contact</p>
      </div>
    </div>
  );
}

function TopNavBar() {
  return (
    <div className="bg-[#faf9f5] box-border content-stretch flex gap-[12px] items-center justify-center px-[16px] py-[8px] relative shrink-0 w-[375px]" data-name="top nav bar">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Back button">
        <div className="absolute inset-[20.83%_33.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 14">
            <path clipRule="evenodd" d={svgPaths.p1656a400} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
      <Logo />
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Add Contact">
        <div className="absolute inset-[16.67%_45.83%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 16">
            <path d={svgPaths.p38bd6c80} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[45.83%_16.67%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 2">
            <path d={svgPaths.p8a37d00} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TextArea() {
  return (
    <div className="basis-0 grow h-[39px] min-h-px min-w-px relative shrink-0" data-name="Text Area">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[39px] items-center overflow-clip px-0 py-[9px] relative rounded-[inherit] w-full">
        <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Search Icon">
          <div className="absolute inset-[8.33%_16.67%_16.67%_8.33%]" data-name="Vector (Stroke)">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
              <path clipRule="evenodd" d={svgPaths.p1b8a4300} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
            </svg>
          </div>
          <div className="absolute inset-[65.21%_8.33%_8.33%_65.21%]" data-name="Vector (Stroke)">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
              <path clipRule="evenodd" d={svgPaths.p35f5b400} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#83827d] text-[14px] text-center text-nowrap">
          <p className="leading-[20px] whitespace-pre">Search</p>
        </div>
      </div>
    </div>
  );
}

function Graphics() {
  return (
    <div className="absolute inset-[16.67%_8.33%_15.13%_8.33%]" data-name="graphics">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 14">
        <g clipPath="url(#clip0_43_465)" id="graphics">
          <path d={svgPaths.p15c5d700} fill="var(--fill-0, #535146)" id="Vector" />
          <path d={svgPaths.p186ac700} fill="var(--fill-0, #535146)" id="Vector_2" />
          <path d={svgPaths.p3927c380} fill="var(--fill-0, #535146)" id="Vector_3" />
          <path d={svgPaths.p6d0a300} fill="var(--fill-0, #535146)" id="Vector_4" />
        </g>
        <defs>
          <clipPath id="clip0_43_465">
            <rect fill="white" height="13.6417" width="16.6667" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-[#faf9f5] box-border content-stretch flex gap-[8px] h-[44px] items-center justify-center p-[13px] relative rounded-[12px] shrink-0 w-[333px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#dad9d4] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <TextArea />
      <div className="relative shrink-0 size-[20px]" data-name="Filter Icon">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border overflow-clip relative rounded-[inherit] size-[20px]">
          <Graphics />
        </div>
      </div>
    </div>
  );
}

function Title() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#83827d] text-[14px] w-[96px]">
        <p className="leading-[20px]">KH tiềm năng cao</p>
      </div>
    </div>
  );
}

function Txt() {
  return (
    <div className="h-[32px] relative shrink-0 w-full" data-name="txt">
      <div className="absolute bottom-0 flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] left-0 not-italic right-[74.04%] text-[#535146] text-[24px] text-nowrap top-0 tracking-[-0.144px]">
        <p className="leading-[32px] whitespace-pre">18</p>
      </div>
      <div className="absolute left-[82px] overflow-clip size-[16px] top-[8px]" data-name="Share Icon">
        <div className="absolute inset-[4.17%_8.33%_62.5%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[33.33%_58.33%_33.33%_8.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[62.5%_8.33%_4.17%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[52.12%_31.58%_22.96%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3c172900} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[22.96%_31.62%_52.12%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3e8ac300} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Board() {
  return (
    <div className="bg-[#faf9f5] box-border content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0 w-[128px]" data-name="board">
      <div aria-hidden="true" className="absolute border-[#dad9d4] border-[0.667px] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Title />
      <Txt />
    </div>
  );
}

function Title1() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#83827d] text-[14px] w-[96px]">
        <p className="leading-[20px]">Đối tác kinh doanh</p>
      </div>
    </div>
  );
}

function Board1() {
  return (
    <div className="bg-[#faf9f5] box-border content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0 w-[128px]" data-name="board">
      <div aria-hidden="true" className="absolute border-[#dad9d4] border-[0.667px] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Title1 />
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[24px] tracking-[-0.144px] w-full">
        <p className="leading-[32px]">36</p>
      </div>
    </div>
  );
}

function Title2() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
      <div className="basis-0 flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#83827d] text-[14px]">
        <p className="leading-[20px]">KH không tiềm năng</p>
      </div>
    </div>
  );
}

function Board2() {
  return (
    <div className="bg-[#faf9f5] box-border content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0 w-[128px]" data-name="board">
      <div aria-hidden="true" className="absolute border-[#dad9d4] border-[0.667px] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Title2 />
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[24px] text-nowrap tracking-[-0.144px]">
        <p className="leading-[32px] whitespace-pre">68</p>
      </div>
    </div>
  );
}

function ContactGroups() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Contact_Groups">
      <Board />
      <Board1 />
      <Board2 />
    </div>
  );
}

function Txt1() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start justify-center min-h-px min-w-px not-italic relative shrink-0 text-[#535146]" data-name="txt">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[16px] w-full">
        <p className="leading-[24px]">Mira</p>
      </div>
      <p className="[white-space-collapse:collapse] font-['Inter:Regular',sans-serif] font-normal leading-[24px] overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-nowrap w-full">Trưởng BP Kinh Doanh Vinaseal</p>
    </div>
  );
}

function List() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name="list">
      <div className="relative rounded-[100px] shrink-0 size-[40px]" data-name="img">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full" src={imgImg} />
      </div>
      <Txt1 />
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Share Icon">
        <div className="absolute inset-[4.17%_8.33%_62.5%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[33.33%_58.33%_33.33%_8.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[62.5%_8.33%_4.17%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[52.12%_31.58%_22.96%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3c172900} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[22.96%_31.62%_52.12%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3e8ac300} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Txt2() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start justify-center min-h-px min-w-px not-italic relative shrink-0 text-[#535146]" data-name="txt">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[16px] w-full">
        <p className="leading-[24px]">Lory</p>
      </div>
      <p className="[white-space-collapse:collapse] font-['Inter:Regular',sans-serif] font-normal leading-[24px] overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-nowrap w-full">Trưởng BP Kinh Doanh Vinaseal</p>
    </div>
  );
}

function List1() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name="list">
      <div className="relative rounded-[100px] shrink-0 size-[40px]" data-name="img">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full" src={imgImg1} />
      </div>
      <Txt2 />
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Share Icon">
        <div className="absolute inset-[4.17%_8.33%_62.5%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[33.33%_58.33%_33.33%_8.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[62.5%_8.33%_4.17%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[52.12%_31.58%_22.96%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3c172900} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[22.96%_31.62%_52.12%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3e8ac300} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Txt3() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start justify-center min-h-px min-w-px not-italic relative shrink-0 text-[#535146]" data-name="txt">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[16px] w-full">
        <p className="leading-[24px]">Sophie</p>
      </div>
      <p className="[white-space-collapse:collapse] font-['Inter:Regular',sans-serif] font-normal leading-[24px] overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-nowrap w-full">Trưởng BP Kinh Doanh Vinaseal</p>
    </div>
  );
}

function List2() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name="list">
      <div className="relative rounded-[100px] shrink-0 size-[40px]" data-name="img">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full" src={imgImg2} />
      </div>
      <Txt3 />
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Share Icon">
        <div className="absolute inset-[4.17%_8.33%_62.5%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[33.33%_58.33%_33.33%_8.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[62.5%_8.33%_4.17%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[52.12%_31.58%_22.96%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3c172900} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[22.96%_31.62%_52.12%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3e8ac300} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Txt4() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start justify-center min-h-px min-w-px not-italic relative shrink-0 text-[#535146]" data-name="txt">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[16px] w-full">
        <p className="leading-[24px]">Jade</p>
      </div>
      <p className="[white-space-collapse:collapse] font-['Inter:Regular',sans-serif] font-normal leading-[24px] overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-nowrap w-full">Trưởng BP Kinh Doanh Vinaseal</p>
    </div>
  );
}

function List3() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name="list">
      <div className="relative rounded-[100px] shrink-0 size-[40px]" data-name="img">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full" src={imgImg3} />
      </div>
      <Txt4 />
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Share Icon">
        <div className="absolute inset-[4.17%_8.33%_62.5%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[33.33%_58.33%_33.33%_8.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[62.5%_8.33%_4.17%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[52.12%_31.58%_22.96%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3c172900} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[22.96%_31.62%_52.12%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3e8ac300} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Txt5() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start justify-center min-h-px min-w-px not-italic relative shrink-0 text-[#535146]" data-name="txt">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[16px] w-full">
        <p className="leading-[24px]">Nina</p>
      </div>
      <p className="[white-space-collapse:collapse] font-['Inter:Regular',sans-serif] font-normal leading-[24px] overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-nowrap w-full">Trưởng BP Kinh Doanh Vinaseal</p>
    </div>
  );
}

function List4() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name="list">
      <div className="relative rounded-[100px] shrink-0 size-[40px]" data-name="img">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full" src={imgImg} />
      </div>
      <Txt5 />
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Share Icon">
        <div className="absolute inset-[4.17%_8.33%_62.5%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[33.33%_58.33%_33.33%_8.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[62.5%_8.33%_4.17%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[52.12%_31.58%_22.96%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3c172900} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[22.96%_31.62%_52.12%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3e8ac300} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ContactList() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-[333px]" data-name="Contact_List">
      <List />
      <List1 />
      <List2 />
      <List3 />
      <List4 />
    </div>
  );
}

function ShareContact() {
  return (
    <div className="h-[555px] relative rounded-tl-[24px] rounded-tr-[24px] shrink-0 w-full" data-name="Share_Contact">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] h-[555px] items-start px-[16px] py-0 relative w-full">
          <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#83827d] text-[14px] text-center w-[333px]">
            <p className="leading-[20px]">Select contact to share your digital card or Add new contact to your list</p>
          </div>
          <Container />
          <ContactGroups />
          <ContactList />
        </div>
      </div>
    </div>
  );
}

export default function ShareStep1() {
  return (
    <div className="bg-[#faf9f5] content-stretch flex flex-col items-start relative size-full" data-name="Share-step-1">
      <TopNavBar />
      <ShareContact />
    </div>
  );
}