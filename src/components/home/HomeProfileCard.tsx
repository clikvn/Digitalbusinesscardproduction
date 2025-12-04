import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner@2.0.3";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { buildProfileUrl, getUserCode } from "../../utils/user-code";
import { Container } from "./Container";
import { HomeNavBar } from "./HomeNavBar";
import { HomeContactButton } from "./HomeContactButton";
import { SaveContactCard } from "./SaveContactCard";
import { useAnalyticsTracking } from "../../hooks/useAnalytics";

export function HomeProfileCard({ onNavigateToContact, onNavigateToProfile, onNavigateToPortfolio }: { 
  onNavigateToContact: () => void; 
  onNavigateToProfile: () => void;
  onNavigateToPortfolio: () => void;
}) {
  const { userCode, groupCode, contactCode } = useParams<{ userCode: string; groupCode?: string; contactCode?: string }>();
  const targetUserCode = userCode || getUserCode();
  
  const [showSaveCard, setShowSaveCard] = useState(false);
  const { data, isLoading, error } = usePublicBusinessCard(targetUserCode, groupCode);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  
  // Analytics tracking
  const { trackClickEvent } = useAnalyticsTracking(targetUserCode, groupCode, contactCode);

  // Calculate card dimensions from viewport to avoid circular dependency
  useEffect(() => {
    const updateDimensions = () => {
      // Calculate 50vh directly from viewport instead of measuring the card
      // This prevents circular dependency issues where showing/hiding bio changes card height
      const vh = window.visualViewport?.height || window.innerHeight;
      const calculatedHeight = vh * 0.5;
      setCardHeight(calculatedHeight);
      
      // Calculate card width: screen width - 36px (18px margin on each side)
      const vw = window.visualViewport?.width || window.innerWidth;
      const calculatedWidth = vw - 36;
      setCardWidth(calculatedWidth);
    };

    // Initial measurement
    updateDimensions();
    
    // Update on window resize
    window.addEventListener('resize', updateDimensions);
    
    // Update when visual viewport changes (mobile browser chrome)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateDimensions);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateDimensions);
      }
    };
  }, []);

  // Calculate BioLines based on cardHeight breakpoints
  const calculateBioLines = (height: number): number => {
    if (height < 320) return 0;
    if (height < 350) return 1;
    if (height < 400) return 2;
    return 3; // height >= 400px
  };

  const bioLines = calculateBioLines(cardHeight);
  const shouldShowBio = bioLines > 0;

  if (!data) return null;

  const handleProfileClick = () => {
    // Track analytics
    trackClickEvent('home.navigateToProfile');
    onNavigateToProfile();
  };

  const handlePortfolioClick = () => {
    // Track analytics
    trackClickEvent('home.navigateToPortfolio');
    onNavigateToPortfolio();
  };

  const handleContactClick = () => {
    // Track analytics
    trackClickEvent('home.navigateToContact');
    onNavigateToContact();
  };

  const handleSaveClick = () => {
    // Track analytics
    trackClickEvent('home.saveContact');
    
    // Generate vCard for download
    const { personal } = data;
    
    // Create vCard content
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${personal.name || 'Digital Business Card'}`,
      data.contact.email ? `EMAIL:${data.contact.email}` : '',
      data.contact.phone ? `TEL:${data.contact.phone}` : '',
      personal.title ? `TITLE:${personal.title}` : '',
      personal.businessName ? `ORG:${personal.businessName}` : '',
      personal.bio ? `NOTE:${personal.bio}` : '',
      `URL:${window.location.origin}${buildProfileUrl({ userCode: targetUserCode, group: groupCode as any })}`,
      'END:VCARD'
    ].filter(line => line && !line.endsWith(':')).join('\\n');

    // Create and download vCard file
    const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${personal.name || 'contact'}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Contact card downloaded');
  };

  const handleShareClick = async () => {
    // Track analytics
    trackClickEvent('home.shareProfile');
    
    const shareTitle = `${data.personal.name} - ${data.personal.title}`;
    const shareText = `Check out ${data.personal.name}'s profile`;
    
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: window.location.href,
      }).catch(() => {
        toast.info("Share cancelled");
      });
    } else {
      try {
        // Try modern clipboard API first with fallback
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard");
            return;
          } catch (clipboardErr) {
            console.log('Modern clipboard API blocked, using fallback');
          }
        }
        
        // Fallback for when clipboard API is not available
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast.success("Link copied to clipboard");
        } else {
          throw new Error('execCommand copy failed');
        }
      } catch (err) {
        console.error('Copy failed:', err);
        toast.error("Failed to copy link");
      }
    }
  };

  if (showSaveCard) {
    return <SaveContactCard onClose={() => setShowSaveCard(false)} />;
  }

  return (
    <div ref={cardRef} className="backdrop-blur-lg backdrop-filter bg-[rgba(255,222,207,0.33)] box-border content-stretch flex flex-col items-center justify-between mb-[16px] rounded-[24px] w-full" style={{ height: 'calc(var(--vh, 1vh) * 50)', paddingTop: '16px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px' }} data-name="home-profile-card">
      <Container 
        onNavigateToContact={onNavigateToContact}
        name={data.personal.name}
        title={data.personal.title}
        businessName={data.personal.businessName}
        cardHeight={cardHeight}
        cardWidth={cardWidth}
      />
      {shouldShowBio && data.personal.bio && (
        <div className="content-stretch flex flex-col items-center relative rounded-[24px] shrink-0 w-full" style={{ gap: 'clamp(14px, calc(var(--vh, 1vh) * 2), 16px)' }} data-name="home-profile-description-text">
          <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center not-italic relative shrink-0 text-[14px] text-slate-50 w-full">
            <p 
              className="leading-[18px]"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: bioLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {data.personal.bio}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-[16px] w-full shrink-0" data-name="button-block">
        <HomeNavBar
          onProfileClick={handleProfileClick}
          onPortfolioClick={handlePortfolioClick}
          onSaveClick={handleSaveClick}
          onShareClick={handleShareClick}
        />
        <HomeContactButton onClick={handleContactClick} />
      </div>
    </div>
  );
}