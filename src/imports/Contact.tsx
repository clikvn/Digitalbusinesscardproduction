import svgPaths from "./svg-1txqd1yzsg";
import img from "figma:asset/420b26ed698402e60bcb7141f4b23bc3850beb9d.png";

function Logo() {
  return (
    <div className="basis-0 content-stretch flex grow h-[48px] items-center justify-center min-h-px min-w-px relative shrink-0" data-name="logo">
      <div className="basis-0 flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#535146] text-[20px] tracking-[-0.1px]">
        <p className="leading-[28px]">Contact</p>
      </div>
    </div>
  );
}

function ContactHeader() {
  return (
    <div className="bg-[#faf9f5] box-border content-stretch flex gap-[12px] items-center justify-center px-[16px] py-[8px] relative shrink-0 w-[375px]" data-name="contact-header">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Back Icon">
        <div className="absolute inset-[20.83%_33.33%]" data-name="Vector (Stroke)">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 14">
            <path clipRule="evenodd" d={svgPaths.p1656a400} fill="var(--fill-0, #535146)" fillRule="evenodd" id="Vector (Stroke)" />
          </svg>
        </div>
      </div>
      <Logo />
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Menu Icon">
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

function SubTitle() {
  return (
    <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0 w-full" data-name="sub-title">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#83827d] text-[14px] text-nowrap">
        <p className="leading-[20px] whitespace-pre">Interior Designer</p>
      </div>
    </div>
  );
}

function Title() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full" data-name="title">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[24px] text-center tracking-[-0.144px] w-full">
        <p className="leading-[32px]">Christine Nguyen</p>
      </div>
      <SubTitle />
    </div>
  );
}

function Headline() {
  return (
    <div className="relative rounded-bl-[24px] rounded-br-[24px] shrink-0 w-full" data-name="headline">
      <div className="flex flex-col items-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-center px-[24px] py-0 relative w-full">
          <Title />
        </div>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#c96442] h-[40px] relative rounded-[8px] shrink-0 w-full" data-name="button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center p-[12px] relative w-full">
          <div className="relative shrink-0 size-[16px]" data-name="AI Agent Icon">
            <div className="absolute bottom-0 left-0 right-[6.67%] top-[6.67%]">
              <div className="absolute inset-[11.6%]" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                  <path d={svgPaths.p1e531580} fill="var(--fill-0, white)" id="Star 1" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-[62.22%] left-[62.21%] right-[0.01%] top-0">
              <div className="absolute inset-[11.6%]" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
                  <path d={svgPaths.p1f96fb00} fill="var(--fill-0, white)" id="Star 3" />
                </svg>
              </div>
            </div>
          </div>
          <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[14px] text-nowrap text-slate-50 whitespace-pre">AI Agent</p>
        </div>
      </div>
    </div>
  );
}

function Fill() {
  return (
    <div className="basis-0 bg-[#e9e6dc] grow h-[40px] min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="fill">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center px-[12px] py-[8px] relative w-full">
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Phone Icon">
            <div className="absolute inset-[4.17%_4.17%_4.47%_4.63%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                <path d={svgPaths.p369509f0} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#535146] text-[14px] text-nowrap whitespace-pre">Phone</p>
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

function ButtonMain() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full" data-name="button main">
      <Button />
      <Btn />
    </div>
  );
}

function Title1() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[18px] text-nowrap">
        <p className="leading-[28px] whitespace-pre">Social Messaging</p>
      </div>
    </div>
  );
}

function WidgetElementsTitle() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0 w-full" data-name="widget-elements-title">
      <Title1 />
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name="button">
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / zalo">
            <div className="absolute bottom-[31.57%] left-0 right-0 top-[33.33%]" data-name="zalo">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 9">
                <path d={svgPaths.p3c0f7800} fill="var(--fill-0, #535146)" id="zalo" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Zalo</p>
      </div>
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / messenger">
            <div className="absolute inset-[8.33%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                <path d={svgPaths.p28c7e780} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Messenger</p>
      </div>
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / telegram">
            <div className="absolute inset-[12.5%_8.34%_12.5%_8.33%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 18">
                <path d={svgPaths.p17afbb00} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Telegram</p>
      </div>
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / whatsapp">
            <div className="absolute inset-[8.333%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                <path d={svgPaths.p1d96e40} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Whatsapp</p>
      </div>
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / kakao">
            <div className="absolute inset-[12.5%_4.17%_10.92%_12.5%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 19">
                <path d={svgPaths.p1b2b5d00} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Kakao</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name="button">
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / discord">
            <div className="absolute inset-[16.67%_8.33%_20.83%_8.33%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 15">
                <path d={svgPaths.p2dbd7c00} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Discord</p>
      </div>
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / wechat">
            <div className="absolute inset-[12.5%_8.33%_14.17%_8.33%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 18">
                <path d={svgPaths.p13598400} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Wechat</p>
      </div>
    </div>
  );
}

function Connect() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[12px] shrink-0 w-[327px]" data-name="connect">
      <Button1 />
      <Button2 />
    </div>
  );
}

function Messaging() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-0 py-[12px] relative shrink-0 w-full" data-name="messaging">
      <WidgetElementsTitle />
      <Connect />
    </div>
  );
}

function Title2() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="title">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#535146] text-[18px] text-nowrap">
        <p className="leading-[28px] whitespace-pre">Social Channels</p>
      </div>
    </div>
  );
}

function WidgetElementsTitle1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0 w-full" data-name="widget-elements-title">
      <Title2 />
    </div>
  );
}

function Button3() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name="button">
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / facebook">
            <div className="absolute bottom-[8.33%] left-1/4 right-[24.09%] top-[8.33%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 20">
                <path d={svgPaths.pbab2f00} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Facebook</p>
      </div>
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / linkedin">
            <div className="absolute inset-[12.5%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
                <path d={svgPaths.p3dcb5200} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Linkedin</p>
      </div>
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / twitter">
            <div className="absolute inset-[16.67%_8.33%_15.58%_8.33%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 17">
                <path d={svgPaths.pc49a000} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Twitter</p>
      </div>
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / youtube">
            <div className="absolute inset-[16.67%_8.33%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 16">
                <path d={svgPaths.p39d046f0} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Youtube</p>
      </div>
      <div className="content-stretch flex flex-col gap-[4px] items-center justify-center relative rounded-[12px] shrink-0" data-name="Button-Text-Icon-Vertical">
        <div className="backdrop-blur-lg backdrop-filter bg-[#e9e6dc] box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] relative rounded-[100px] shrink-0" data-name="Button-Text-Icon-Horizontal">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="social / tiktok">
            <div className="absolute inset-[8.33%_15.1%_8.33%_12.5%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 20">
                <path d={svgPaths.p15734100} fill="var(--fill-0, #535146)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#535146] text-[12px] text-nowrap whitespace-pre">Tiktok</p>
      </div>
    </div>
  );
}

function Connect1() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative rounded-[12px] shrink-0 w-[327px]" data-name="connect">
      <Button3 />
    </div>
  );
}

function Channels() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-0 py-[12px] relative shrink-0 w-full" data-name="channels">
      <WidgetElementsTitle1 />
      <Connect1 />
    </div>
  );
}

function Other() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="other">
      <Messaging />
      <Channels />
    </div>
  );
}

function CallToAction() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-[327px]" data-name="call to action">
      <ButtonMain />
      <Other />
    </div>
  );
}

function Share() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[24px] h-[740px] items-center p-[24px] relative rounded-tl-[24px] rounded-tr-[24px] shrink-0 w-[375px]" data-name="share">
      <div className="relative rounded-[100px] shrink-0 size-[120px]" data-name="avatar">
        <div className="overflow-clip relative rounded-[inherit] size-[120px]">
          <div className="absolute inset-0 rounded-[100px]" data-name="img">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[100px]">
              <img alt="" className="absolute h-[177.24%] left-[-89.58%] max-w-none top-[-14.46%] w-[265.83%]" src={img} />
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border-8 border-solid border-white inset-[-8px] pointer-events-none rounded-[108px]" />
      </div>
      <Headline />
      <CallToAction />
    </div>
  );
}

export default function Contact() {
  return (
    <div className="bg-[#faf9f5] content-stretch flex flex-col gap-[8px] items-start relative size-full" data-name="Contact">
      <ContactHeader />
      <Share />
    </div>
  );
}