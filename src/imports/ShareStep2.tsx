import svgPaths from "./svg-t43go4j2wu";
import imgImg from "figma:asset/0a66fc9b99f063b4c5fc622d0ab5d7d243f6ed44.png";

function Logo() {
  return (
    <div className="basis-0 content-stretch flex grow h-[48px] items-center justify-center min-h-px min-w-px relative shrink-0" data-name="logo">
      <div className="basis-0 flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#535146] text-[20px] tracking-[-0.1px]">
        <p className="leading-[28px]">Share</p>
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

function Avatar() {
  return <div className="basis-0 grow mb-[-240px] min-h-px min-w-px shrink-0 w-full" data-name="avatar" />;
}

function QrCode() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col items-center justify-center overflow-clip pb-[240px] pt-0 px-0 relative rounded-[24px] shrink-0 size-[240px]" data-name="qr code">
      <div className="basis-0 grow mb-[-240px] min-h-px min-w-px relative rounded-[8px] shrink-0 w-full" data-name="img">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[8px] size-full" src={imgImg} />
      </div>
      <Avatar />
    </div>
  );
}

function AvatarQrCode() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full" data-name="avatar qr code">
      <QrCode />
    </div>
  );
}

function ButtonTextIconHorizontal() {
  return (
    <div className="bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center px-[12px] py-[8px] relative rounded-[8px] shrink-0 size-[40px]" data-name="Button-Text-Icon-Horizontal">
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Copy Icon">
        <div className="absolute bottom-[20.83%] left-1/4 right-[12.5%] top-[4.17%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 12">
            <path d={svgPaths.p23563f00} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[27.5%_35.83%_4.17%_8.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 11">
            <path d={svgPaths.p1f384080} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[4.17%_12.5%_66.67%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
            <path d={svgPaths.p30977200} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Url() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full" data-name="url">
      <div className="basis-0 bg-[#faf9f5] grow h-[40px] min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="Button-Text-Icon-Horizontal">
        <div aria-hidden="true" className="absolute border border-[#dad9d4] border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-row items-center justify-center size-full">
          <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center p-[12px] relative w-full">
            <div className="relative shrink-0 size-[24px]" data-name="& I / Content / link">
              <div className="absolute inset-[29.17%_8.33%]" data-name="Vector">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 10">
                  <path d={svgPaths.p3d40d680} fill="var(--fill-0, #3D3929)" id="Vector" />
                </svg>
              </div>
            </div>
            <div className="basis-0 flex flex-col font-['Be_Vietnam_Pro:Medium',sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#3d3929] text-[14px]">
              <p className="leading-[20px]">clik.page/christine-nguyen-</p>
            </div>
          </div>
        </div>
      </div>
      <ButtonTextIconHorizontal />
    </div>
  );
}

function Line() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-[327px]" data-name="line ___">
      <div className="h-px relative shrink-0 w-full" data-name="Divider">
        <div className="absolute bg-[rgba(0,0,0,0.16)] inset-0" />
      </div>
    </div>
  );
}

function ButtonTextIconHorizontal1() {
  return (
    <div className="basis-0 bg-[#faf9f5] grow h-[48px] min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="Button-Text-Icon-Horizontal">
      <div aria-hidden="true" className="absolute border border-[#dad9d4] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[48px] items-center justify-center p-[12px] relative w-full">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="& I / Action  / code">
            <div className="absolute inset-[26.7%_10.07%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 12">
                <path d={svgPaths.p3799ba00} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
          <div className="basis-0 flex flex-col font-['Be_Vietnam_Pro:Medium',sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-[rgba(0,0,0,0.64)]">
            <p className="leading-[20px]">{`<iframe width="375" height="812"`}</p>
          </div>
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Copy Icon">
            <div className="absolute bottom-[20.83%] left-1/4 right-[12.5%] top-[4.17%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 12">
                <path d={svgPaths.p23563f00} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
              </svg>
            </div>
            <div className="absolute inset-[27.5%_35.83%_4.17%_8.33%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 11">
                <path d={svgPaths.p1f384080} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
              </svg>
            </div>
            <div className="absolute inset-[4.17%_12.5%_66.67%_58.33%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
                <path d={svgPaths.p30977200} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbedCode() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-[327px]" data-name="embed_code">
      <ButtonTextIconHorizontal1 />
    </div>
  );
}

function Embed() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="embed">
      <Line />
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#83827d] text-[14px] text-center w-[327px]">
        <p className="leading-[20px]">Add HTML Embed Codes to Your Website</p>
      </div>
      <EmbedCode />
    </div>
  );
}

function Fill() {
  return (
    <div className="basis-0 bg-[#e9e6dc] grow h-[40px] min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="fill">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center px-[12px] py-[8px] relative w-full">
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="SMS Icon">
            <div className="absolute inset-[8.333%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                <path d={svgPaths.p22a2fcc0} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#535146] text-[14px] text-nowrap whitespace-pre">SMS</p>
        </div>
      </div>
    </div>
  );
}

function Fill1() {
  return (
    <div className="basis-0 bg-[#e9e6dc] grow h-[40px] min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="fill">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center px-[12px] py-[8px] relative w-full">
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Email Icon">
            <div className="absolute inset-[12.5%_4.17%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 12">
                <path d={svgPaths.p28e15500} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
              </svg>
            </div>
            <div className="absolute inset-[25%_4.17%_41.68%_4.17%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 6">
                <path d={svgPaths.p19161100} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#535146] text-[14px] text-nowrap whitespace-pre">Email</p>
        </div>
      </div>
    </div>
  );
}

function Btn() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="btn">
      <Fill />
      <Fill1 />
    </div>
  );
}

function ShareFunction() {
  return (
    <div className="bg-[#c96442] box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center p-[12px] relative rounded-[8px] shrink-0 w-[327px]" data-name="Share_function">
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Share Icon">
        <div className="absolute inset-[4.17%_8.33%_62.5%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[33.33%_58.33%_33.33%_8.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[62.5%_8.33%_4.17%_58.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[52.12%_31.58%_22.96%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p3c172900} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute inset-[22.96%_31.62%_52.12%_31.62%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
            <path clipRule="evenodd" d={svgPaths.p1719f100} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[14px] text-nowrap text-slate-50 whitespace-pre">Share</p>
    </div>
  );
}

function ShareButtons() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0" data-name="Share_buttons">
      <Btn />
      <ShareFunction />
    </div>
  );
}

function ShareOptions() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-[327px]" data-name="Share_options">
      <Url />
      <Embed />
      <ShareButtons />
    </div>
  );
}

function Share() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[24px] items-center p-[24px] relative rounded-tl-[24px] rounded-tr-[24px] shrink-0 w-[375px]" data-name="share">
      <AvatarQrCode />
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#83827d] text-[14px] text-center w-[327px]">
        <p className="leading-[20px]">
          Point your camera at the QR code to
          <br aria-hidden="true" />
          receive the card
        </p>
      </div>
      <ShareOptions />
    </div>
  );
}

export default function ShareStep2() {
  return (
    <div className="bg-[#faf9f5] content-stretch flex flex-col gap-[8px] items-start relative size-full" data-name="Share-step-2">
      <TopNavBar />
      <Share />
    </div>
  );
}