import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner@2.0.3";
import { Copy, Check } from "lucide-react";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { getUserCode } from "../../utils/user-code";

export function SaveContactCard({ onClose }: { onClose: () => void }) {
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);

  if (isLoading || error || !data) return null;

  const contactInfo = {
    name: data.personal.name,
    position: data.personal.title,
    phone: data.contact.phone,
    url: window.location.href,
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      // Try modern clipboard API first with fallback
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          setCopiedField(field);
          toast.success(`${field} copied!`);
          setTimeout(() => setCopiedField(null), 2000);
          return;
        } catch (clipboardErr) {
          console.log('Modern clipboard API blocked, using fallback');
        }
      }
      
      // Fallback method using document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopiedField(field);
        toast.success(`${field} copied!`);
        setTimeout(() => setCopiedField(null), 2000);
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error("Failed to copy");
    }
  };

  const truncateUrl = (url: string, maxLength: number = 30) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="backdrop-blur-lg backdrop-filter bg-[rgba(255,222,207,0.33)] box-border content-stretch flex flex-col h-[472px] items-center justify-between mb-[18px] pb-[24px] pt-[16px] px-[24px] rounded-[24px] w-full pr-[24px] pl-[24px]" data-name="save-contact-card">
      {/* Close button */}
      <button
        onClick={onClose}
        className="overflow-clip relative shrink-0 size-[20px] cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95 self-end"
        aria-label="Close"
      >
        <div className="absolute inset-[8%]" data-name="Close Icon">
          <svg className="block size-full" fill="none" viewBox="0 0 16 16">
            <path d="M12 4L4 12M4 4L12 12" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </button>

      {/* Title and Instructions */}
      <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[32px] text-slate-50 tracking-[-0.384px]">
          <p className="leading-[40px]">Save Contact</p>
        </div>
        <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-slate-50 text-center">
          <p className="leading-[18px]">Tap to copy each field to your clipboard</p>
        </div>
      </div>

      {/* Contact Fields */}
      <div className="content-stretch flex flex-col gap-[12px] items-center relative rounded-[24px] shrink-0 w-full">
        {/* Name Field */}
        <div className="w-full bg-[rgba(255,255,255,0.15)] backdrop-blur-sm rounded-[12px] flex items-center justify-between px-[12px] py-[8px]">
          <div className="flex flex-col gap-[2px] flex-1">
            <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic text-[10px] text-slate-200">
              <p className="leading-[14px]">Name</p>
            </div>
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic text-[14px] text-slate-50">
              <p className="leading-[20px]">{contactInfo.name}</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(contactInfo.name, "Name")}
            className="p-[8px] hover:bg-[rgba(255,255,255,0.2)] rounded-[8px] transition-colors"
            aria-label="Copy name"
          >
            {copiedField === "Name" ? (
              <Check className="w-[16px] h-[16px] text-green-300" />
            ) : (
              <Copy className="w-[16px] h-[16px] text-slate-50" />
            )}
          </button>
        </div>

        {/* Position Field */}
        <div className="w-full bg-[rgba(255,255,255,0.15)] backdrop-blur-sm rounded-[12px] flex items-center justify-between px-[12px] py-[8px]">
          <div className="flex flex-col gap-[2px] flex-1">
            <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic text-[10px] text-slate-200">
              <p className="leading-[14px]">Position</p>
            </div>
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic text-[14px] text-slate-50">
              <p className="leading-[20px]">{contactInfo.position}</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(contactInfo.position, "Position")}
            className="p-[8px] hover:bg-[rgba(255,255,255,0.2)] rounded-[8px] transition-colors"
            aria-label="Copy position"
          >
            {copiedField === "Position" ? (
              <Check className="w-[16px] h-[16px] text-green-300" />
            ) : (
              <Copy className="w-[16px] h-[16px] text-slate-50" />
            )}
          </button>
        </div>

        {/* Phone Field */}
        <div className="w-full bg-[rgba(255,255,255,0.15)] backdrop-blur-sm rounded-[12px] flex items-center justify-between px-[12px] py-[8px]">
          <div className="flex flex-col gap-[2px] flex-1">
            <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic text-[10px] text-slate-200">
              <p className="leading-[14px]">Phone</p>
            </div>
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic text-[14px] text-slate-50">
              <p className="leading-[20px]">{contactInfo.phone}</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(contactInfo.phone, "Phone")}
            className="p-[8px] hover:bg-[rgba(255,255,255,0.2)] rounded-[8px] transition-colors"
            aria-label="Copy phone"
          >
            {copiedField === "Phone" ? (
              <Check className="w-[16px] h-[16px] text-green-300" />
            ) : (
              <Copy className="w-[16px] h-[16px] text-slate-50" />
            )}
          </button>
        </div>

        {/* URL Field */}
        <div className="w-full bg-[rgba(255,255,255,0.15)] backdrop-blur-sm rounded-[12px] p-[12px] flex items-center justify-between">
          <div className="flex flex-col gap-[2px] flex-1 min-w-0">
            <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic text-[10px] text-slate-200">
              <p className="leading-[14px]">Website</p>
            </div>
            <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic text-[14px] text-slate-50">
              <p className="leading-[20px] truncate">{truncateUrl(contactInfo.url)}</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(contactInfo.url, "Website")}
            className="p-[8px] hover:bg-[rgba(255,255,255,0.2)] rounded-[8px] transition-colors shrink-0"
            aria-label="Copy website"
          >
            {copiedField === "Website" ? (
              <Check className="w-[16px] h-[16px] text-green-300" />
            ) : (
              <Copy className="w-[16px] h-[16px] text-slate-50" />
            )}
          </button>
        </div>
      </div>

      {/* Done Button */}
      <button
        onClick={onClose}
        className="bg-[#c96442] h-[48px] relative rounded-[12px] shrink-0 w-full cursor-pointer transition-all hover:bg-[#b85838] active:scale-[0.98]"
      >
        <div className="flex flex-row items-center justify-center size-full">
          <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic text-[14px] text-nowrap text-slate-50">
            <p className="leading-[20px] whitespace-pre">Done</p>
          </div>
        </div>
      </button>
    </div>
  );
}
