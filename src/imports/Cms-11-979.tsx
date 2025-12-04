import svgPaths from "./svg-hs3ftccbgf";

function Icon() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d="M4 12H20" id="Vector" stroke="var(--stroke-0, #3D3D3A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M4 18H20" id="Vector_2" stroke="var(--stroke-0, #3D3D3A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M4 6H20" id="Vector_3" stroke="var(--stroke-0, #3D3D3A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="absolute box-border content-stretch flex gap-[10px] items-center justify-center left-[0.33px] px-0 py-[3px] top-[0.33px]" data-name="Button">
      <p className="font-['Arial:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#3d3929] text-[14px] text-nowrap whitespace-pre">AI Agent</p>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[30px] relative shrink-0 w-[279px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[30px] relative w-[279px]">
        <Button />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-1/4" data-name="Vector">
        <div className="absolute inset-[-8.333%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
            <path d={svgPaths.p354ab980} id="Vector" stroke="var(--stroke-0, #83827D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-1/4" data-name="Vector">
        <div className="absolute inset-[-8.333%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
            <path d={svgPaths.p2a4db200} id="Vector" stroke="var(--stroke-0, #83827D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="relative rounded-[6px] shrink-0 size-[28px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start pb-0 pt-[4px] px-[4px] relative size-[28px]">
        <Icon1 />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[46px] relative shrink-0 w-[389.333px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0px_0px_0.667px] border-black border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[46px] items-center justify-between pb-[0.667px] pt-0 px-[12px] relative w-[389.333px]">
        <Icon />
        <Container />
        <Button1 />
      </div>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[105px] not-italic text-[#83827d] text-[14px] text-center text-nowrap top-[-1.33px] translate-x-[-50%] whitespace-pre">Start a conversation with AI Agent</p>
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[1144px] relative shrink-0 w-[389px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[1144px] items-start overflow-clip pb-0 pt-[564.667px] px-[89.781px] relative rounded-[inherit] w-[389px]">
        <Paragraph />
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#faf9f5] h-[37.333px] relative rounded-[2.23696e+07px] shrink-0 w-[202.49px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[#dad9d4] border-[0.667px] border-solid inset-0 pointer-events-none rounded-[2.23696e+07px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[37.333px] relative w-[202.49px]">
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[16.67px] not-italic text-[#3d3929] text-[14px] text-nowrap top-[7.33px] whitespace-pre">What vanities are trending?</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-[#faf9f5] h-[37.333px] relative rounded-[2.23696e+07px] shrink-0 w-[237.135px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[#dad9d4] border-[0.667px] border-solid inset-0 pointer-events-none rounded-[2.23696e+07px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[37.333px] relative w-[237.135px]">
        <p className="absolute font-['Arial:Regular',sans-serif] leading-[20px] left-[16.67px] not-italic text-[#3d3929] text-[14px] text-nowrap top-[7.33px] whitespace-pre">Show me Rosetree Home mirrors</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex gap-[8px] h-[37.333px] items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <Button2 />
      <Button3 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d="M4.16667 10H15.8333" id="Vector" stroke="var(--stroke-0, #83827D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M10 4.16667V15.8333" id="Vector_2" stroke="var(--stroke-0, #83827D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-[#faf9f5] relative rounded-[2.23696e+07px] shrink-0 size-[40px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[40px]">
        <Icon2 />
      </div>
    </div>
  );
}

function TextInput() {
  return (
    <div className="basis-0 grow h-[20px] min-h-px min-w-px relative shrink-0" data-name="Text Input">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[20px] items-center overflow-clip relative rounded-[inherit] w-full">
        <p className="font-['Arial:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[14px] text-[rgba(131,130,125,0.5)] text-nowrap whitespace-pre">Ask me anything about this vanity...</p>
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[8.33%] left-1/2 right-1/2 top-[79.17%]" data-name="Vector">
        <div className="absolute inset-[-33.33%_-0.83px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 5">
            <path d="M0.833333 0.833333V3.33333" id="Vector" stroke="var(--stroke-0, #83827D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[41.67%_20.83%_20.83%_20.83%]" data-name="Vector">
        <div className="absolute inset-[-11.11%_-7.14%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 10">
            <path d={svgPaths.p1a8a3b00} id="Vector" stroke="var(--stroke-0, #83827D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[8.33%_37.5%_37.5%_37.5%]" data-name="Vector">
        <div className="absolute inset-[-7.69%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 13">
            <path d={svgPaths.p127c7400} id="Vector" stroke="var(--stroke-0, #83827D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="relative rounded-[2.23696e+07px] shrink-0 size-[28px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start pb-0 pt-[4px] px-[4px] relative size-[28px]">
        <Icon3 />
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_9_279)" id="Icon">
          <path d={svgPaths.p1431c600} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M16.6667 2.5V5.83333" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M18.3333 4.16667H15" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M3.33333 14.1667V15.8333" id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M4.16667 15H2.5" id="Vector_5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
        <defs>
          <clipPath id="clip0_9_279">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button6() {
  return (
    <div className="bg-[#c96442] relative rounded-[2.23696e+07px] shrink-0 size-[32px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[32px]">
        <Icon4 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="basis-0 bg-[#faf9f5] grow h-[48px] min-h-px min-w-px relative rounded-[2.23696e+07px] shrink-0" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[48px] items-center px-[12px] py-0 relative w-full">
          <TextInput />
          <Button5 />
          <Button6 />
        </div>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex gap-[8px] h-[48px] items-center relative shrink-0 w-full" data-name="Container">
      <Button4 />
      <Container4 />
    </div>
  );
}

function Container6() {
  return (
    <div className="bg-[#f5f4ee] h-[110px] relative shrink-0 w-[389px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[8px] h-[110px] items-start pb-0 pt-[8px] px-[12px] relative w-[389px]">
        <Container3 />
        <Container5 />
      </div>
    </div>
  );
}

function RightPanel() {
  return (
    <div className="absolute bg-[#f5f4ee] box-border content-stretch flex flex-col gap-[0.667px] h-[1305.33px] items-start left-[1326px] pl-[0.667px] pr-0 py-0 top-0 w-[390px]" data-name="RightPanel">
      <div aria-hidden="true" className="absolute border-[#ebebeb] border-[0px_0px_0px_0.667px] border-solid inset-0 pointer-events-none" />
      <Container1 />
      <Container2 />
      <Container6 />
    </div>
  );
}

export default function Cms() {
  return (
    <div className="bg-[#faf9f5] relative size-full" data-name="CMS">
      <RightPanel />
    </div>
  );
}