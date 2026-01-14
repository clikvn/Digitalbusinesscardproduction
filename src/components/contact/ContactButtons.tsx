import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner@2.0.3";
import { parseProfileUrl, getUserCode } from "../../utils/user-code";
import { useAnalyticsTracking } from "../../hooks/useAnalytics";
import contactSvgPaths from "../../imports/svg-1txqd1yzsg";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Copy, Phone, Mail } from "lucide-react@0.487.0";
import { copyWithToast } from "../../utils/clipboard-utils";

export function ButtonMain({ phone, email, onAIClick }: { phone: string; email: string; onAIClick?: () => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full" data-name="button main">
      <AIButton onClick={onAIClick} />
      <Btn phone={phone} email={email} />
    </div>
  );
}

export function AIButton({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();
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
        toast.info(t("messages.comingSoon"));
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
          <p className="font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[14px] text-nowrap text-slate-50 whitespace-pre">{t("navigation.aiAgent")}</p>
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

/**
 * Detect if the device/platform can actually dial phone numbers (has tel: support)
 * This checks for actual mobile platforms that support dialing, not just screen size
 */
function canDialPhone(): boolean {
  // Check user agent for mobile platforms that support tel: protocol
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(userAgent);
  
  // Check if running on a mobile device platform
  // Note: Some tablets might not have phone capability, but they usually still support tel: links
  // iPad on iOS 13+ supports tel: links even without cellular capability
  
  // Additional check: if it's a known desktop platform, definitely can't dial
  const isDesktopPlatform = /Windows|Macintosh|Linux|X11/i.test(userAgent) && !isMobilePlatform;
  
  // If it's clearly a desktop platform, return false
  if (isDesktopPlatform) {
    return false;
  }
  
  // For mobile platforms, assume tel: is supported
  // The browser/OS will handle it appropriately (some tablets might show a message, but that's fine)
  return isMobilePlatform;
}

export function PhoneButton({ phone }: { phone: string }) {
  const { t } = useTranslation();
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  const { trackClickEvent } = useAnalyticsTracking(targetUserCode, groupCode || '', undefined);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  
  if (!phone) return null; // Don't show button if no phone number
  
  const handlePhoneClick = () => {
    trackClickEvent('contact.phone');
    
    // Check if device/platform can actually dial (mobile platforms)
    if (canDialPhone()) {
      // On mobile devices/platforms that support dialing, use tel: link
      window.location.href = `tel:${phone}`;
    } else {
      // On desktop or platforms that can't dial, show dialog with phone number and copy option
      setShowPhoneDialog(true);
    }
  };
  
  const handleCopyPhone = async () => {
    await copyWithToast(
      phone,
      toast,
      t('common.phoneNumberCopied') || 'Phone number copied to clipboard!',
      t('common.failedToCopy') || 'Failed to copy phone number'
    );
  };
  
  return (
    <>
      <button 
        onClick={handlePhoneClick}
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
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#535146] text-[14px] text-nowrap whitespace-pre">{t("common.phone")}</p>
          </div>
        </div>
      </button>
      
      {/* Phone Number Dialog for Desktop */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="max-w-sm w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              {t("common.phoneNumber") || "Phone Number"}
            </DialogTitle>
            <DialogDescription>
              {t("common.copyPhoneNumberToClipboard") || "Copy the phone number to your clipboard"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between gap-2 p-4 bg-muted rounded-lg">
              <span className="text-lg font-mono font-semibold flex-1">{phone}</span>
              <button
                onClick={handleCopyPhone}
                className="flex-shrink-0 p-2 hover:bg-muted-foreground/10 rounded-md transition-colors"
                title={t("common.copy") || "Copy"}
              >
                <Copy className="w-6 h-6 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Get webmail compose URL for a specific provider
 * Uses official compose URL formats with pre-filled recipient email
 */
function getWebmailComposeUrl(provider: string, recipientEmail: string): string {
  const encodedEmail = encodeURIComponent(recipientEmail);
  
  switch (provider) {
    case 'gmail':
      // Gmail compose with pre-filled recipient: view=cm (compose), fs=1 (fullscreen), to=EMAIL
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedEmail}`;
    case 'outlook':
      // Outlook.com compose with pre-filled recipient using deeplink format
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedEmail}`;
    default:
      return `mailto:${recipientEmail}`;
  }
}

/**
 * Gmail Icon Component
 * Attribution: Gmail icons created by Freepik - Flaticon
 * https://www.flaticon.com/free-icons/gmail
 */
function GmailIcon({ className }: { className?: string }) {
  return (
    <img 
      src="https://cdn-icons-png.flaticon.com/512/732/732200.png" 
      alt="Gmail" 
      className={className}
      style={{ width: '24px', height: '24px', objectFit: 'contain' }}
    />
  );
}

/**
 * Outlook Icon Component
 * Attribution: Outlook icons created by Pixel perfect - Flaticon
 * https://www.flaticon.com/free-icons/outlook
 */
function OutlookIcon({ className }: { className?: string }) {
  return (
    <img 
      src="https://cdn-icons-png.flaticon.com/512/732/732221.png" 
      alt="Outlook" 
      className={className}
      style={{ width: '24px', height: '24px', objectFit: 'contain' }}
    />
  );
}

/**
 * Email provider configuration with Flaticon logos
 * Attribution:
 * - Gmail icons created by Freepik - Flaticon (https://www.flaticon.com/free-icons/gmail)
 * - Outlook icons created by Pixel perfect - Flaticon (https://www.flaticon.com/free-icons/outlook)
 */
const emailProviders = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: GmailIcon,
    color: 'bg-white hover:bg-gray-50 border-2 border-gray-200',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: OutlookIcon,
    color: 'bg-white hover:bg-gray-50 border-2 border-gray-200',
  },
];

export function EmailButton({ email }: { email: string }) {
  const { t } = useTranslation();
  const { userCode, groupCode } = useParams<{ userCode: string; groupCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  const { trackClickEvent } = useAnalyticsTracking(targetUserCode, groupCode || '', undefined);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  if (!email) return null; // Don't show button if no email
  
  const handleEmailClick = () => {
    trackClickEvent('contact.email');
    
    // On mobile platforms, use mailto: directly (works well on mobile)
    if (canDialPhone()) {
      window.location.href = `mailto:${email}`;
    } else {
      // On desktop, show dialog with provider options
      setShowEmailDialog(true);
    }
  };
  
  const handleOpenEmailClient = () => {
    window.location.href = `mailto:${email}`;
    setShowEmailDialog(false);
  };
  
  const handleOpenWebmail = (providerId: string) => {
    const webmailUrl = getWebmailComposeUrl(providerId, email);
    window.open(webmailUrl, '_blank', 'noopener,noreferrer');
    setShowEmailDialog(false);
  };
  
  const handleCopyEmail = async () => {
    await copyWithToast(
      email,
      toast,
      t('common.emailCopied') || 'Email address copied to clipboard!',
      t('common.failedToCopy') || 'Failed to copy email address'
    );
  };
  
  return (
    <>
      <button 
        onClick={handleEmailClick}
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
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#535146] text-[14px] text-nowrap whitespace-pre">{t("common.email")}</p>
          </div>
        </div>
      </button>
      
      {/* Email Dialog for Desktop */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-sm w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {t("common.emailAddress") || "Email Address"}
            </DialogTitle>
            <DialogDescription>
              {t("common.chooseEmailProvider") || "Choose your email provider to send an email"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between gap-2 p-4 bg-muted rounded-lg">
              <span className="text-lg font-mono font-semibold break-all flex-1">{email}</span>
              <button
                onClick={handleCopyEmail}
                className="flex-shrink-0 p-2 hover:bg-muted-foreground/10 rounded-md transition-colors"
                title={t("common.copy") || "Copy"}
              >
                <Copy className="w-6 h-6 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            
            {/* Send Email Using Client App */}
            <div className="space-y-2">
              <Button
                onClick={handleOpenEmailClient}
                className="w-full"
                variant="outline"
              >
                <Mail className="w-4 h-4 mr-2" />
                {t("common.openEmailClient") || "Send email using client app"}
              </Button>
            </div>
            
            {/* Email Provider Options */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t("common.selectEmailProvider") || "Send mail using website"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {emailProviders.map((provider) => {
                  const IconComponent = provider.icon;
                  return (
                    <Button
                      key={provider.id}
                      onClick={() => handleOpenWebmail(provider.id)}
                      className={`w-full ${provider.color} flex items-center justify-center gap-2 h-auto py-4 hover:shadow-md transition-all`}
                      variant="outline"
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className="text-sm font-semibold text-gray-800">{provider.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
