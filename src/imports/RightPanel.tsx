import svgPaths from "./svg-7yvcko98wd";

function Text() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Text">
      <p className="font-['Arial:Regular',sans-serif] leading-[18px] not-italic relative shrink-0 text-[#7a776c] text-[12px] text-nowrap whitespace-pre">What vanities are trending?</p>
    </div>
  );
}

function Button() {
  return (
    <div className="relative rounded-[24px] shrink-0 w-[178.333px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#dad9d4] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start px-[16px] py-[8px] relative w-[178.333px]">
        <Text />
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="content-stretch flex h-[16px] items-start relative shrink-0 w-full" data-name="Text">
      <p className="font-['Arial:Regular',sans-serif] leading-[18px] not-italic relative shrink-0 text-[#7a776c] text-[12px] text-nowrap whitespace-pre">Show me Rosetree Home mirrors</p>
    </div>
  );
}

function Button1() {
  return (
    <div className="relative rounded-[24px] shrink-0 w-[208.021px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#dad9d4] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start px-[16px] py-[8px] relative w-[208.021px]">
        <Text1 />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-[4px] items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <Button />
      <Button1 />
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, #3D3D3A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, #3D3D3A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#faf9f5] relative rounded-[24px] shrink-0 size-[40px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#dad9d4] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center p-px relative size-[40px]">
        <Icon />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M8 12.6667V14.6667" id="Vector" stroke="var(--stroke-0, #3D3D3A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p4f72080} id="Vector_2" stroke="var(--stroke-0, #3D3D3A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p1c53e800} id="Vector_3" stroke="var(--stroke-0, #3D3D3A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-[#faf9f5] relative rounded-[2.23696e+07px] shrink-0 size-[24px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[24px]">
        <Icon1 />
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_20_948)" id="Icon">
          <path d={svgPaths.p340d8400} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M13.3333 2V4.66667" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M14.6667 3.33333H12" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M2.66667 11.3333V12.6667" id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M3.33333 12H2" id="Vector_5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
        <defs>
          <clipPath id="clip0_20_948">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button4() {
  return (
    <div className="basis-0 bg-[#c96442] grow h-[32px] min-h-px min-w-px relative rounded-[24px] shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[32px] items-center justify-center relative w-full">
        <Icon2 />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[32px] relative shrink-0 w-[68px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[12px] h-[32px] items-center relative w-[68px]">
        <Button3 />
        <Button4 />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="basis-0 bg-[#faf9f5] grow min-h-px min-w-px relative rounded-[24px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#dad9d4] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[12px] items-center pl-[13px] pr-[5px] py-[5px] relative w-full">
          <p className="basis-0 font-['Arial:Regular',sans-serif] grow leading-[21px] min-h-px min-w-px not-italic relative shrink-0 text-[#7a776c] text-[14px]">{`Hi, I'm your showroom assistant`}</p>
          <Container1 />
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <Button2 />
      <Container2 />
    </div>
  );
}

export default function RightPanel() {
  return (
    <div className="bg-[#f5f4ee] relative size-full" data-name="RightPanel">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[8px] items-start p-[12px] relative size-full">
          <Container />
          <Container3 />
        </div>
      </div>
    </div>
  );
}