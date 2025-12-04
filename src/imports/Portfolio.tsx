import svgPaths from "./svg-si0rv80jbp";
import imgImg from "figma:asset/1635d94ad705220ac6b8f6ff8c00a0762bd530f5.png";
import imgImg1 from "figma:asset/449c8f8ba1b9e460b6c9171256f41a197aee5c0e.png";

function Logo() {
  return (
    <div className="basis-0 content-stretch flex grow h-[48px] items-center justify-center min-h-px min-w-px relative shrink-0" data-name="logo">
      <div className="basis-0 flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#535146] text-[20px] tracking-[-0.1px]">
        <p className="leading-[28px]">Portfolio</p>
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
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Menu button">
        <div className="absolute inset-[45.83%_12.5%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 2">
            <path clipRule="evenodd" d={svgPaths.p1ed66800} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[20.83%_12.5%_70.83%_12.5%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 2">
            <path clipRule="evenodd" d={svgPaths.p1ed66800} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[70.83%_12.5%_20.83%_12.5%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 2">
            <path clipRule="evenodd" d={svgPaths.p1ed66800} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Active() {
  return (
    <div className="bg-[#535146] h-[4px] relative rounded-[100px] shrink-0 w-full" data-name="active">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="h-[4px] w-full" />
      </div>
    </div>
  );
}

function Cate1() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-full items-center justify-center min-h-px min-w-px relative shrink-0" data-name="cate 1">
      <div className="basis-0 box-border content-stretch flex gap-[8px] grow items-center justify-center min-h-px min-w-px overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-name="Button-Text">
        <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[18px] text-center text-nowrap">
          <p className="leading-[28px] whitespace-pre">Projects</p>
        </div>
      </div>
      <Active />
    </div>
  );
}

function Active1() {
  return (
    <div className="h-[4px] relative rounded-[100px] shrink-0 w-full" data-name="active">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="h-[4px] w-full" />
      </div>
    </div>
  );
}

function Cate2() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-full items-center justify-center min-h-px min-w-px relative shrink-0" data-name="cate 2">
      <div className="basis-0 grow min-h-px min-w-px relative rounded-[12px] shrink-0 w-full" data-name="Button-Text">
        <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
          <div className="box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative size-full">
            <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[18px] text-center text-nowrap">
              <p className="leading-[28px] whitespace-pre">Showroom</p>
            </div>
          </div>
        </div>
      </div>
      <Active1 />
    </div>
  );
}

function Slider() {
  return (
    <div className="absolute content-stretch flex gap-[8px] inset-0 items-center" data-name="slider">
      <Cate1 />
      <Cate2 />
    </div>
  );
}

function Img() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-full items-center justify-center min-h-px min-w-px relative shrink-0" data-name="img">
      <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="img">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImg} />
      </div>
    </div>
  );
}

function Img1() {
  return (
    <div className="absolute content-stretch flex gap-px inset-0 items-center justify-center overflow-clip" data-name="img">
      <Img />
    </div>
  );
}

function ScrollPage() {
  return (
    <div className="h-[6px] relative shrink-0 w-[50px]" data-name="scroll page">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 6">
        <g id="scroll page">
          <circle cx="2" cy="3" fill="var(--fill-0, white)" fillOpacity="0.48" id="Ellipse 90" r="2" />
          <circle cx="13" cy="3" fill="var(--fill-0, white)" fillOpacity="0.48" id="Ellipse 91" r="3" />
          <circle cx="25" cy="3" fill="var(--fill-0, white)" id="Ellipse 92" r="3" />
          <circle cx="37" cy="3" fill="var(--fill-0, white)" fillOpacity="0.48" id="Ellipse 92_2" r="3" />
          <circle cx="48" cy="3" fill="var(--fill-0, white)" fillOpacity="0.48" id="Ellipse 93" r="2" />
        </g>
      </svg>
    </div>
  );
}

function Bottom() {
  return (
    <div className="absolute bottom-0 box-border content-stretch flex flex-col gap-[8px] items-center justify-end left-0 p-[8px] right-0" data-name="bottom">
      <ScrollPage />
    </div>
  );
}

function Broker() {
  return <div className="absolute box-border content-stretch flex gap-[8px] items-center p-[8px] right-0 top-0" data-name="broker" />;
}

function Img2() {
  return (
    <div className="h-[204px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-name="IMG">
      <Img1 />
      <Bottom />
      <Broker />
    </div>
  );
}

function Title() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="title">
      <div className="basis-0 flex flex-col font-['Inter:Medium',sans-serif] font-medium grow justify-center leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#535146] text-[16px] text-nowrap">
        <p className="[white-space-collapse:collapse] leading-[24px] overflow-ellipsis overflow-hidden">Căn hộ 2PN tòa M2 dự án Vinhomes Metro...</p>
      </div>
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="more_horiz">
        <div className="absolute inset-[41.67%_16.67%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 4">
            <path d={svgPaths.pc200ac0} fill="var(--fill-0, #1D1D1D)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Txt() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0" data-name="txt">
      <Title />
      <p className="font-['Arial:Regular',sans-serif] h-[16px] leading-[20px] not-italic relative shrink-0 text-[#83827d] text-[14px] w-full">**08 • 2 PN • 2 WC • 58,32 m2 • Ba Đình • Hà Nội</p>
    </div>
  );
}

function Title1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="title">
      <Txt />
    </div>
  );
}

function Item() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative rounded-[24px] shrink-0 w-full" data-name="item">
      <Img2 />
      <Title1 />
    </div>
  );
}

function Img3() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-full items-center justify-center min-h-px min-w-px relative shrink-0" data-name="img">
      <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="img">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImg1} />
      </div>
    </div>
  );
}

function Img4() {
  return (
    <div className="absolute content-stretch flex gap-px inset-0 items-center justify-center overflow-clip" data-name="img">
      <Img3 />
    </div>
  );
}

function ScrollPage1() {
  return (
    <div className="h-[6px] relative shrink-0 w-[50px]" data-name="scroll page">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 6">
        <g id="scroll page">
          <circle cx="2" cy="3" fill="var(--fill-0, white)" fillOpacity="0.48" id="Ellipse 90" r="2" />
          <circle cx="13" cy="3" fill="var(--fill-0, white)" fillOpacity="0.48" id="Ellipse 91" r="3" />
          <circle cx="25" cy="3" fill="var(--fill-0, white)" id="Ellipse 92" r="3" />
          <circle cx="37" cy="3" fill="var(--fill-0, white)" fillOpacity="0.48" id="Ellipse 92_2" r="3" />
          <circle cx="48" cy="3" fill="var(--fill-0, white)" fillOpacity="0.48" id="Ellipse 93" r="2" />
        </g>
      </svg>
    </div>
  );
}

function Bottom1() {
  return (
    <div className="absolute bottom-0 box-border content-stretch flex flex-col gap-[8px] items-center justify-end left-0 p-[8px] right-0" data-name="bottom">
      <ScrollPage1 />
    </div>
  );
}

function Img5() {
  return (
    <div className="h-[204px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-name="IMG">
      <Img4 />
      <Bottom1 />
    </div>
  );
}

function Title2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="title">
      <div className="basis-0 flex flex-col font-['Inter:Medium',sans-serif] font-medium grow justify-center leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#535146] text-[16px] text-nowrap">
        <p className="[white-space-collapse:collapse] leading-[24px] overflow-ellipsis overflow-hidden">Căn hộ 2PN tòa M2 dự án Vinhomes Metro...</p>
      </div>
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="more_horiz">
        <div className="absolute inset-[41.67%_16.67%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 4">
            <path d={svgPaths.pc200ac0} fill="var(--fill-0, #1D1D1D)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Txt1() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0" data-name="txt">
      <Title2 />
      <p className="font-['Arial:Regular',sans-serif] h-[16px] leading-[20px] not-italic relative shrink-0 text-[#83827d] text-[14px] w-full">**08 • 2 PN • 2 WC • 58,32 m2 • Ba Đình • Hà Nội</p>
    </div>
  );
}

function Title3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="title">
      <Txt1 />
    </div>
  );
}

function Item1() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative rounded-[24px] shrink-0 w-full" data-name="item">
      <Img5 />
      <Title3 />
    </div>
  );
}

function Img6() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-full items-center justify-center min-h-px min-w-px relative shrink-0" data-name="img">
      <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="img">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImg1} />
      </div>
    </div>
  );
}

function Img7() {
  return (
    <div className="absolute content-stretch flex gap-px inset-0 items-center justify-center overflow-clip" data-name="img">
      <Img6 />
    </div>
  );
}

function Img8() {
  return (
    <div className="h-[204px] overflow-clip relative rounded-[16px] shrink-0 w-full" data-name="IMG">
      <Img7 />
    </div>
  );
}

function Title4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="title">
      <div className="basis-0 flex flex-col font-['Inter:Medium',sans-serif] font-medium grow justify-center leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#535146] text-[16px] text-nowrap">
        <p className="[white-space-collapse:collapse] leading-[24px] overflow-ellipsis overflow-hidden">Căn hộ 2PN tòa M2 dự án Vinhomes Metro...</p>
      </div>
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="more_horiz">
        <div className="absolute inset-[41.67%_16.67%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 4">
            <path d={svgPaths.pc200ac0} fill="var(--fill-0, #1D1D1D)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Txt2() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0" data-name="txt">
      <Title4 />
      <p className="font-['Arial:Regular',sans-serif] h-[16px] leading-[20px] not-italic relative shrink-0 text-[#83827d] text-[14px] w-full">**08 • 2 PN • 2 WC • 58,32 m2 • Ba Đình • Hà Nội</p>
    </div>
  );
}

function Title5() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="title">
      <Txt2 />
    </div>
  );
}

function Item2() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative rounded-[24px] shrink-0 w-full" data-name="item">
      <Img8 />
      <Title5 />
    </div>
  );
}

function List() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="list">
      <Item />
      <Item1 />
      <Item2 />
    </div>
  );
}

function Listing() {
  return (
    <div className="relative shrink-0 w-full" data-name="listing">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[16px] py-0 relative w-full">
          <div className="h-[56px] overflow-x-auto overflow-y-clip relative shrink-0 w-full" data-name="nav-menu-slider">
            <Slider />
          </div>
          <List />
        </div>
      </div>
    </div>
  );
}

function Content() {
  return (
    <div className="content-stretch flex flex-col h-[812px] items-start relative shrink-0 w-[375px]" data-name="content">
      <TopNavBar />
      <Listing />
    </div>
  );
}

export default function Portfolio() {
  return (
    <div className="bg-[#faf9f5] content-stretch flex gap-[10px] items-center relative size-full" data-name="Portfolio">
      <Content />
    </div>
  );
}