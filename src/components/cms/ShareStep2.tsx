import React, { useEffect, useRef, useState } from 'react';
import { Copy, Mail, MessageSquare, Wallet, FileText, Link as LinkIcon2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import svgPaths from '../../imports/svg-t43go4j2wu';
import { Contact, CONTACT_GROUPS } from '../../types/contacts';
import { generateShareUrlWithCode, generatePublicProfileUrl, getUserCode } from '../../utils/user-code';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useBusinessCard } from '../../hooks/useBusinessCard';
import { useSettings } from '../../hooks/useSettings';
import { useParams } from 'react-router-dom';
import { filterBusinessCardData } from '../../utils/filtered-data-loader';
import qrCodeLogo from '../../assets/qr_code_logo.svg';

interface ShareStep2Props {
  onBack: () => void;
  onMenu: () => void;
  selectedContact?: Contact;
}

export function ShareStep2({ onBack, onMenu, selectedContact }: ShareStep2Props) {
  const { userCode } = useParams<{ userCode: string }>();
  const { data } = useBusinessCard(userCode);
  const { customGroups: groups, settings } = useSettings(userCode);
  
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showEmailSignatureDialog, setShowEmailSignatureDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'simple' | 'detailed' | 'compact'>('simple');
  
  // ✅ CRITICAL FIX: Don't render if data is not loaded
  if (!data) {
    return (
      <div className="bg-[#faf9f5] flex items-center justify-center size-full">
        <div className="text-center">
          <p className="text-[#83827d]">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Generate profile URL with group code if sharing with a group
  const generateProfileUrl = () => {
    const targetUserCode = userCode || getUserCode();
    
    // Individual contact: ALWAYS has a group + optional contactCode for tracking
    if (selectedContact && !selectedContact.isGroupShare) {
      const group = groups.find(g => g.id === selectedContact.group);
      if (group && selectedContact.contactCode) {
        // URL: /{userCode}/{groupShareCode}/{contactCode}
        // Example: myclik.com/myclik/xyz789/a3f7c9d2
        // → Shows Private group content
        // → Tracks individual contact "a3f7c9d2"
        return `${window.location.origin}/${targetUserCode}/${group.shareCode}/${selectedContact.contactCode}`;
      } else if (group) {
        // Contact without contactCode (legacy) - just use group share code
        return generateShareUrlWithCode(targetUserCode, group.shareCode);
      }
    }
    
    // Group share (no individual tracking)
    if (selectedContact?.isGroupShare) {
      const group = groups.find(g => g.id === selectedContact.group);
      if (group) {
        return generateShareUrlWithCode(targetUserCode, group.shareCode);
      }
    }
    
    // FALLBACK: Public profile URL
    return generatePublicProfileUrl();
  };
  
  const profileUrl = generateProfileUrl();
  
  // Get group display name and code
  const groupInfo = selectedContact?.isGroupShare ? (() => {
    const group = groups.find(g => g.id === selectedContact.group);
    return group ? {
      name: group.label,
      code: group.shareCode
    } : null;
  })() : null;
  
  // Generate embed code
  const embedCode = `<iframe width="375" height="812" src="${profileUrl}" frameborder="0"></iframe>`;

  // Email signature templates
  const getEmailSignature = (template: 'simple' | 'detailed' | 'compact') => {
    const { personal, contact } = data;
    
    if (template === 'simple') {
      return `${personal.name || 'Your Name'}
${personal.title || ''}${personal.businessName ? ` | ${personal.businessName}` : ''}
${profileUrl}`;
    }
    
    if (template === 'detailed') {
      let signature = `${personal.name || 'Your Name'}\n`;
      if (personal.title) signature += `${personal.title}\n`;
      if (personal.businessName) signature += `${personal.businessName}\n`;
      if (contact.email) signature += `📧 ${contact.email}\n`;
      if (contact.phone) signature += `📱 ${contact.phone}\n`;
      signature += `🔗 ${profileUrl}`;
      return signature;
    }
    
    // compact
    return `${personal.name || 'Your Name'} | ${profileUrl}`;
  };

  // Generate QR code
  useEffect(() => {
    if (qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, profileUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch(err => {
        console.error('Failed to generate QR code:', err);
      });
    }
  }, [profileUrl]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success('Embed code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy embed code');
    }
  };

  const handleCopySignature = async () => {
    try {
      const signature = getEmailSignature(selectedTemplate);
      await navigator.clipboard.writeText(signature);
      toast.success('Email signature copied to clipboard');
      setShowEmailSignatureDialog(false);
    } catch (error) {
      toast.error('Failed to copy signature');
    }
  };

  const handleSMS = () => {
    const name = data.personal.name || 'My';
    const message = `Check out ${name}${name === 'My' ? '' : "'s"} digital business card: ${profileUrl}`;
    const smsUrl = selectedContact?.phone 
      ? `sms:${selectedContact.phone}?body=${encodeURIComponent(message)}`
      : `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  const handleEmail = () => {
    const name = data.personal.name || 'My';
    const subject = `${name}${name === 'My' ? '' : "'s"} Digital Business Card`;
    const body = `Hi,\n\nI'd like to share ${name === 'My' ? 'my' : `${name}'s`} digital business card with you:\n\n${profileUrl}\n\nBest regards${name !== 'My' ? `,\n${name}` : ''}`;
    const mailtoUrl = selectedContact?.email
      ? `mailto:${selectedContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleShare = async () => {
    const name = data.personal.name || 'This';
    const shareData = {
      title: `${name}${name === 'This' ? '' : "'s"} Business Card`,
      text: `Check out ${name === 'This' ? 'this' : `${name}'s`} digital business card`,
      url: profileUrl
    };

    // Check if Web Share API is available AND can share this data
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully');
      } catch (error: any) {
        // User cancelled the share - don't show error
        if (error.name === 'AbortError') {
          return;
        }
        
        // Other errors - fallback to copy URL
        console.error('Error sharing:', error);
        console.log('Share error details:', {
          name: error.name,
          message: error.message,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol
        });
        
        // Fallback to copying URL
        toast.info('Sharing not available, copying URL instead');
        handleCopyUrl();
      }
    } else if (navigator.share) {
      // navigator.share exists but canShare check failed
      // Try anyway (some browsers don't support canShare)
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully');
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Error sharing:', error);
        toast.info('Sharing not available, copying URL instead');
        handleCopyUrl();
      }
    } else {
      // Web Share API not supported - copy URL instead
      handleCopyUrl();
    }
  };

  const handleAddToWallet = async () => {
    // Filter data based on selected contact's group share config
    const selectedGroupId = (selectedContact?.group || 'public') as any;
    
    // Filter data based on share config for the selected group
    const filteredData = filterBusinessCardData(data, settings || {}, selectedGroupId);
    
    // Generate vCard for download - only include visible fields
    const { personal, contact } = filteredData;
    
    // Parse name into parts for N property (required by vCard 3.0)
    const nameParts = (personal.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Build vCard content - vCard 3.0 standard format
    // Using CRLF (\r\n) line endings for maximum compatibility
    const vCardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      // N property is REQUIRED in vCard 3.0: N:Last;First;Middle;Prefix;Suffix
      `N:${lastName};${firstName};;;`,
      // FN (Formatted Name) is REQUIRED
      `FN:${personal.name || 'Digital Business Card'}`,
    ];
    
    // Only add fields if they have values (respects share config filtering)
    // Use TYPE parameters for better mobile app recognition
    if (contact.email) {
      vCardLines.push(`EMAIL;TYPE=INTERNET:${contact.email}`);
    }
    if (contact.phone) {
      // TYPE=CELL for mobile, TYPE=WORK for office - default to CELL for personal cards
      vCardLines.push(`TEL;TYPE=CELL:${contact.phone}`);
    }
    if (personal.title) {
      vCardLines.push(`TITLE:${personal.title}`);
    }
    if (personal.businessName) {
      vCardLines.push(`ORG:${personal.businessName}`);
    }
    if (personal.bio) {
      // Escape special characters in NOTE field
      const escapedBio = personal.bio.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
      vCardLines.push(`NOTE:${escapedBio}`);
    }
    
    // Add profile URL
    vCardLines.push(`URL:${profileUrl}`);
    
    // Add timestamp for when this card was generated
    vCardLines.push(`REV:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    
    vCardLines.push('END:VCARD');
    
    // Use CRLF line endings for vCard standard compliance
    const vCard = vCardLines.join('\r\n');
    const fileName = `${personal.name || 'contact'}.vcf`;

    // Detect mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // For mobile devices, try Web Share API first (iOS 13+)
    if (isMobile && navigator.share) {
      try {
        const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
        const file = new File([blob], fileName, { type: 'text/vcard' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Contact: ${personal.name || 'Digital Business Card'}`,
            text: `Save ${personal.name || 'this contact'}`,
          });
          toast.success('Contact shared! Open it to save to contacts.');
          return;
        }
      } catch (error: any) {
        // User cancelled or share failed, fall through to download
        if (error.name !== 'AbortError') {
          console.log('Web Share API failed, using fallback:', error);
        }
      }
    }

    // Fallback: Download method (works on desktop and some mobile browsers)
    const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // For iOS, use data URL approach
    if (isIOS) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const newLink = document.createElement('a');
        newLink.href = dataUrl;
        newLink.download = fileName;
        document.body.appendChild(newLink);
        newLink.click();
        document.body.removeChild(newLink);
        URL.revokeObjectURL(url);
        toast.success('Contact saved! Check your Downloads folder or Files app.');
      };
      reader.readAsDataURL(blob);
    } else {
      // Standard download for Android and desktop
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Contact card downloaded');
    }
  };

  return (
    <>
      <div className="bg-[#faf9f5] flex flex-col size-full overflow-hidden">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto w-full py-6 px-[0px] p-[0px]">
          <div className="flex flex-col gap-5 items-center w-full max-w-md mx-auto">
            {/* QR Code with Avatar */}
            <div className="flex flex-col items-center w-full gap-3">
              <div className="relative size-[200px]">
                <canvas ref={qrCanvasRef} className="absolute inset-0 rounded-2xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[50px] rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
                  <img 
                    src={qrCodeLogo} 
                    alt="QR Code Logo" 
                    className="size-full object-contain p-1"
                  />
                </div>
              </div>
              <p className="text-sm text-[#83827d] text-center">
                {groupInfo 
                  ? `Scan QR code to share with ${groupInfo.name}`
                  : 'Scan QR code to receive the card'
                }
              </p>
            </div>

            {/* Button Grid - All evenly spaced */}
            <div className="flex flex-col gap-3 w-full">
              {/* Row 1: Copy URL + Copy Embed */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopyUrl}
                  className="bg-[#e9e6dc] flex gap-2 items-center justify-center px-3 py-3 rounded-lg hover:bg-[#dad7cd] transition-colors"
                >
                  <LinkIcon2 className="size-4 text-[#535146]" />
                  <span className="text-sm text-[#535146]">Copy URL</span>
                </button>
                <button
                  onClick={handleCopyEmbed}
                  className="bg-[#e9e6dc] flex gap-2 items-center justify-center px-3 py-3 rounded-lg hover:bg-[#dad7cd] transition-colors"
                >
                  <CodeIcon />
                  <span className="text-sm text-[#535146]">Copy Embed</span>
                </button>
              </div>

              {/* Row 2: SMS + Email */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSMS}
                  className="bg-[#e9e6dc] flex gap-2 items-center justify-center px-3 py-3 rounded-lg hover:bg-[#dad7cd] transition-colors"
                >
                  <MessageSquare className="size-4 text-[#535146]" />
                  <span className="text-sm text-[#535146]">SMS</span>
                </button>
                <button
                  onClick={handleEmail}
                  className="bg-[#e9e6dc] flex gap-2 items-center justify-center px-3 py-3 rounded-lg hover:bg-[#dad7cd] transition-colors"
                >
                  <Mail className="size-4 text-[#535146]" />
                  <span className="text-sm text-[#535146]">Email</span>
                </button>
              </div>

              {/* Row 3: Apple Wallet + Email Signature */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToWallet}
                  className="bg-[#e9e6dc] flex gap-2 items-center justify-center px-3 py-3 rounded-lg hover:bg-[#dad7cd] transition-colors"
                >
                  <Wallet className="size-4 text-[#535146]" />
                  <span className="text-sm text-[#535146]">Add to Wallet</span>
                </button>
                <button
                  onClick={() => setShowEmailSignatureDialog(true)}
                  className="bg-[#e9e6dc] flex gap-2 items-center justify-center px-3 py-3 rounded-lg hover:bg-[#dad7cd] transition-colors"
                >
                  <FileText className="size-4 text-[#535146]" />
                  <span className="text-sm text-[#535146]">Email Signature</span>
                </button>
              </div>

              {/* Main Share Button */}
              <button
                onClick={handleShare}
                className="bg-[#c96442] flex gap-2 items-center justify-center px-4 py-3 rounded-lg hover:bg-[#b5583b] transition-colors w-full"
              >
                <ShareIconWhite />
                <span className="text-sm text-slate-50">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Signature Template Dialog */}
      <Dialog open={showEmailSignatureDialog} onOpenChange={setShowEmailSignatureDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Email Signature Template</DialogTitle>
            <DialogDescription>Select a template to copy as your email signature.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            {/* Template Options */}
            <div className="flex flex-col gap-3">
              {/* Simple Template */}
              <button
                onClick={() => setSelectedTemplate('simple')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTemplate === 'simple'
                    ? 'border-[#c96442] bg-[#fdf6f3]'
                    : 'border-[#dad9d4] bg-white hover:border-[#c9c8c3]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium">Simple</p>
                  {selectedTemplate === 'simple' && (
                    <div className="size-5 rounded-full bg-[#c96442] flex items-center justify-center">
                      <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <pre className="text-xs text-[#535146] whitespace-pre-wrap font-mono">
{getEmailSignature('simple')}
                </pre>
              </button>

              {/* Detailed Template */}
              <button
                onClick={() => setSelectedTemplate('detailed')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTemplate === 'detailed'
                    ? 'border-[#c96442] bg-[#fdf6f3]'
                    : 'border-[#dad9d4] bg-white hover:border-[#c9c8c3]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium">Detailed</p>
                  {selectedTemplate === 'detailed' && (
                    <div className="size-5 rounded-full bg-[#c96442] flex items-center justify-center">
                      <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <pre className="text-xs text-[#535146] whitespace-pre-wrap font-mono">
{getEmailSignature('detailed')}
                </pre>
              </button>

              {/* Compact Template */}
              <button
                onClick={() => setSelectedTemplate('compact')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTemplate === 'compact'
                    ? 'border-[#c96442] bg-[#fdf6f3]'
                    : 'border-[#dad9d4] bg-white hover:border-[#c9c8c3]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium">Compact</p>
                  {selectedTemplate === 'compact' && (
                    <div className="size-5 rounded-full bg-[#c96442] flex items-center justify-center">
                      <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <pre className="text-xs text-[#535146] whitespace-pre-wrap font-mono">
{getEmailSignature('compact')}
                </pre>
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopySignature}
              className="bg-[#c96442] text-white px-4 py-2.5 rounded-lg hover:bg-[#b5583b] transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="size-4" />
              Copy Selected Signature
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CodeIcon() {
  return (
    <div className="overflow-clip relative shrink-0 size-4">
      <div className="absolute inset-[26.7%_10.07%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 12">
          <path d={svgPaths.p3799ba00} fill="var(--fill-0, #535146)" />
        </svg>
      </div>
    </div>
  );
}

function ShareIconWhite() {
  return (
    <div className="overflow-clip relative shrink-0 size-4">
      <div className="absolute inset-[4.17%_8.33%_62.5%_58.33%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[33.33%_58.33%_33.33%_8.33%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[62.5%_8.33%_4.17%_58.33%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[52.12%_31.58%_22.96%_31.62%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
          <path clipRule="evenodd" d={svgPaths.p3c172900} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[22.96%_31.62%_52.12%_31.62%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
          <path clipRule="evenodd" d={svgPaths.p1719f100} fill="var(--fill-0, #F8FAFC)" fillRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}