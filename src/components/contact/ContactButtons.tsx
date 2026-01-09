import React from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner@2.0.3";
import { parseProfileUrl, getUserCode } from "../../utils/user-code";
import { useAnalyticsTracking } from "../../hooks/useAnalytics";
import contactSvgPaths from "../../imports/svg-1txqd1yzsg";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";

export function ButtonMain({ phone, email, onAIClick }: { phone: string; email: string; onAIClick?: () => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full" data-name="button main">
      <AIButton onClick={onAIClick} />
      <Btn phone={phone} email={email} />
    </div>
  );
}

export function AIButton({ onClick }: { onClick?: () => void }) {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);
  const { trackClickEvent } = useAnalyticsTracking(targetUserCode, groupCode || '', undefined);
  
  if (isLoading || error || !data) return null;
  
  // Check the computed property from the filtered data
  const isVisible = data.aiAgentVisible !== false; // Default to true if undefined, but our filter sets it.
  
  if (!isVisible) return null;
  
  return (
    <button 
      onClick={() => {
        trackClickEvent('aiAgent');
        toast.info("This feature will coming soon!");
      }}
      className="bg-[#c96442] h-[40px] relative rounded-[8px] shrink-0 w-full cursor-pointer transition-all hover:bg-[#b85838] active:scale-[0.98]" 
      data-name="button"
    >
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center p-[12px] relative w-full">
          <div className="relative shrink-0 size-[16px]" data-name="AI Agent Icon">
            <div className="absolute bottom-0 left-0 right-[6.67%] top-[6.67%]">
              <div className="absolute inset-[11.6%]" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                  <path d={contactSvgPaths.p1e531580} fill="var(--fill-0, white)" id="Star 1" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-[62.22%] left-[62.21%] right-[0.01%] top-[0]">
              <div className="absolute inset-[11.6%]" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
                  <path d={contactSvgPaths.p1f96fb00} fill="var(--fill-0, white)" id="Star 3" />
                </svg>
              </div>
            </div>
          </div>
          <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[14px] text-nowrap text-slate-50 whitespace-pre">AI Agent</p>
        </div>
      </div>
    </button>
  );
}

export function Btn({ phone, email }: { phone: string; email: string }) {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="btn">
      <PhoneButton phone={phone} />
      <EmailButton email={email} />
    </div>
  );
}

export function PhoneButton({ phone }: { phone: string }) {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  const { trackClickEvent } = useAnalyticsTracking(targetUserCode, groupCode || '', undefined);
  
  if (!phone) return null; // Don't show button if no phone number
  
  return (
    <button 
      onClick={() => {
        trackClickEvent('contact.phone');
        window.location.href = `tel:${phone}`;
      }}
      className="basis-0 bg-[#e9e6dc] grow h-[40px] min-h-px min-w-px relative rounded-[8px] shrink-0 cursor-pointer transition-all hover:bg-[#d9d6cc] active:scale-[0.98]" 
      data-name="fill"
    >
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center px-[12px] py-[8px] relative w-full">
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Phone Icon">
            <div className="absolute inset-[4.17%_4.17%_4.47%_4.63%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                <path d={contactSvgPaths.p369509f0} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#535146] text-[14px] text-nowrap whitespace-pre">Phone</p>
        </div>
      </div>
    </button>
  );
}

export function EmailButton({ email }: { email: string }) {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  const { trackClickEvent } = useAnalyticsTracking(targetUserCode, groupCode || '', undefined);
  
  if (!email) return null; // Don't show button if no email
  
  return (
    <button 
      onClick={() => {
        trackClickEvent('contact.email');
        window.location.href = `mailto:${email}`;
      }}
      className="basis-0 bg-[#e9e6dc] grow h-[40px] min-h-px min-w-px relative rounded-[8px] shrink-0 cursor-pointer transition-all hover:bg-[#d9d6cc] active:scale-[0.98]" 
      data-name="fill"
    >
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center px-[12px] py-[8px] relative w-full">
          <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Email Icon">
            <div className="absolute inset-[12.5%_4.17%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 12">
                <path d={contactSvgPaths.p28e15500} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
              </svg>
            </div>
            <div className="absolute inset-[25%_4.17%_41.68%_4.17%]" data-name="Vector (Stroke)">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 6">
                <path d={contactSvgPaths.p19161100} fill="var(--fill-0, #535146)" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#535146] text-[14px] text-nowrap whitespace-pre">Email</p>
        </div>
      </div>
    </button>
  );
}
