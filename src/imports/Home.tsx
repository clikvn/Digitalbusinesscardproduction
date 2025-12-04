import svgPaths from "./svg-ryed6k4ibx";
import imgImg from "figma:asset/420b26ed698402e60bcb7141f4b23bc3850beb9d.png";

function HomeBackgroundImage() {
  return (
    <div className="h-[812px] relative shrink-0 w-[375px]" data-name="home-background-image">
      <div className="absolute bottom-[33.5%] left-0 right-0 top-0" data-name="img">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 overflow-hidden">
            <img alt="" className="absolute h-full left-[-63.41%] max-w-none top-0 w-[215.97%]" src={imgImg} />
          </div>
          <div className="absolute bg-gradient-to-b from-[55.246%] from-[rgba(0,0,0,0)] inset-0 to-[#c96442]" />
        </div>
      </div>
    </div>
  );
}

function HomeProfileLocationText() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="home-profile-location-text">
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Location Icon">
        <div className="absolute inset-[4.17%_12.5%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 15">
            <path clipRule="evenodd" d={svgPaths.p29b4d340} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
        <div className="absolute bottom-[41.67%] left-[33.33%] right-[33.33%] top-1/4" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
            <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-slate-50">
        <p className="leading-[20px] whitespace-pre">Ha Noi, Viet Nam</p>
      </div>
    </div>
  );
}

function SubTitle() {
  return (
    <div className="box-border content-stretch flex gap-[16px] items-center pb-0 pt-[8px] px-0 relative shrink-0 w-full" data-name="sub-title">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-slate-50">
        <p className="leading-[20px] whitespace-pre">Interior Designer</p>
      </div>
      <HomeProfileLocationText />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full" data-name="container">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Chevron Icon">
        <div className="absolute inset-[33.33%_20.83%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
            <path clipRule="evenodd" d={svgPaths.p2c9b2300} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[48px] text-slate-50 tracking-[-0.576px] w-[min-content]">
        <p className="leading-[56px]">Christine Nguyen</p>
      </div>
      <SubTitle />
    </div>
  );
}

function HomeNavBar() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="home-nav-bar">
      <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative rounded-[12px] shrink-0" data-name="home-nav-profile-button">
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
      </div>
      <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative rounded-[12px] shrink-0" data-name="home-nav-portfolio-button">
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
      </div>
      <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative rounded-[12px] shrink-0" data-name="home-nav-save-button">
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
      </div>
      <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative rounded-[12px] shrink-0" data-name="home-nav-share-button">
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
      </div>
    </div>
  );
}

function HomeContactButton() {
  return (
    <div className="bg-[#c96442] h-[48px] relative rounded-[12px] shrink-0 w-full" data-name="home-contact-button">
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
            <p className="leading-[20px] whitespace-pre">Contact</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeProfileCard() {
  return (
    <div className="absolute backdrop-blur-lg backdrop-filter bg-[rgba(255,222,207,0.33)] bottom-[18px] box-border content-stretch flex flex-col h-[472px] items-center justify-between left-[4.27%] pb-[24px] pt-[16px] px-[24px] right-[4.27%] rounded-[24px]" data-name="home-profile-card">
      <Container />
      <div className="content-stretch flex flex-col gap-[16px] items-center relative rounded-[24px] shrink-0 w-full" data-name="home-profile-description-text">
        <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-slate-50 w-full">
          <p className="leading-[24px]">It is my pleasure to assist you with your real estate needs. My number one goal is your complete satisfaction.</p>
        </div>
      </div>
      <HomeNavBar />
      <HomeContactButton />
    </div>
  );
}

function Gradient() {
  return (
    <div className="absolute h-[812px] left-1/2 top-0 translate-x-[-50%] w-[375px]" data-name="Gradient">
      <HomeProfileCard />
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-[#c96442] content-stretch flex gap-[10px] items-center relative size-full" data-name="Home">
      <HomeBackgroundImage />
      <Gradient />
    </div>
  );
}