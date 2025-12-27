import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner@2.0.3";
import { HomeBackgroundImage } from "../home/HomeBackgroundImage";
import { Gradient } from "../home/Gradient";
import { NavigationMenu } from "../layout/NavigationMenu";
import { ContactScreen } from "../screens/ContactScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { PortfolioScreen } from "../screens/PortfolioScreen";
import { ProfileMenuIcon } from "../profile/ProfileIcons";
import profileSvgPaths from "../../imports/svg-i5dwj49pkv";
import { getUserCode, buildProfileUrl, buildCMSUrl } from "../../utils/user-code";
import { trackPageView } from "../../utils/analytics";
import { supabase } from "../../lib/supabase-client";

export function PublicLayout({ screen }: { screen: 'home' | 'contact' | 'profile' | 'portfolio' }) {
  const { userCode, groupCode, contactCode } = useParams<{ 
    userCode: string; 
    groupCode?: string;
    contactCode?: string;
  }>();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();

  // Redirect to public group if no groupCode provided
  useEffect(() => {
    const redirectToPublic = async () => {
      if (!groupCode && userCode) {
        try {
          // Fetch public group's share code
          const { data, error } = await supabase
            .from('user_share_groups')
            .select('share_code')
            .eq('user_code', userCode)
            .eq('id', 'public')
            .maybeSingle();
          
          if (data && data.share_code && !error) {
            // Build new URL with public share code
            let newPath = `/${userCode}/${data.share_code}`;
            if (screen !== 'home') {
              newPath += `/${screen}`;
            }
            navigate(newPath, { replace: true });
          }
        } catch (e) {
          console.error('Error fetching public share code:', e);
          // Continue anyway, just won't redirect
        }
      }
    };
    
    redirectToPublic();
  }, [userCode, groupCode, screen, navigate]);

  // Track page view
  useEffect(() => {
    const trackPage = async () => {
      if (!userCode) return;
      
      const pageMap = {
        'home': 'page.home',
        'contact': 'page.contact',
        'profile': 'page.profile',
        'portfolio': 'page.portfolio',
      } as const;
      
      // If no groupCode, fetch the actual default group's share code from database
      let effectiveShareCode = groupCode;
      
      if (!effectiveShareCode) {
        try {
          // Query for the default group (is_default = true)
          const { data, error } = await supabase
            .from('user_share_groups')
            .select('share_code')
            .eq('user_code', userCode)
            .eq('is_default', true)
            .maybeSingle();
          
          if (data?.share_code && !error) {
            effectiveShareCode = data.share_code;
            console.log('[PublicLayout] Resolved default share code:', effectiveShareCode);
          } else {
            console.error('[PublicLayout] No default group found for user:', userCode, error);
            return; // Don't track if we can't find the share code
          }
        } catch (e) {
          console.error('[PublicLayout] Error fetching default share code:', e);
          return; // Don't track on error
        }
      }
      
      trackPageView(
        userCode,
        effectiveShareCode,
        pageMap[screen],
        contactCode // Contact ID would need to be parsed from somewhere else if needed
      );
    };
    
    trackPage();
  }, [userCode, groupCode, screen, contactCode]);

  // Check if current user is the owner (for showing edit buttons)
  const isOwner = userCode === getUserCode();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session && isOwner);
      setUserId(session?.user?.id);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session && isOwner);
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, [isOwner]);

  // Navigation Helpers
  const navigateTo = (targetScreen: 'home' | 'contact' | 'profile' | 'portfolio') => {
    let url = `/${userCode}`;
    if (groupCode) url += `/${groupCode}`;
    if (targetScreen !== 'home') url += `/${targetScreen}`;
    navigate(url);
  };

  const navigateToCMS = (section?: string) => {
    navigate(buildCMSUrl(getUserCode(), section));
  };

  return (
    <div className="bg-[#faf9f5] w-full h-full relative" style={{ height: 'calc(var(--vh, 1vh) * 100)', overflow: screen === 'home' ? 'visible' : 'auto' }}>
      {/* Home Screen Specific Layout */}
      {screen === 'home' && (
        <div className="bg-[#c96442] w-full h-full relative">
          <HomeBackgroundImage />
          <Gradient
            onNavigateToContact={() => navigateTo('contact')}
            onNavigateToProfile={() => navigateTo('profile')}
            onNavigateToPortfolio={() => navigateTo('portfolio')}
          />
          {/* Floating Menu Button Overlay */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="w-full h-full flex items-start justify-end p-6">
              <div className="pointer-events-auto">
                <div
                  className="cursor-pointer transition-transform hover:scale-110 active:scale-95 bg-[#faf9f5] rounded-lg p-[8px] flex items-center justify-center shadow-lg border border-[#e9e6dc]"
                  onClick={() => {
                    console.log('Menu button clicked!');
                    setIsMenuOpen(true);
                  }}
                  data-name="Menu Icon"
                  aria-label="Open menu"
                >
                  <ProfileMenuIcon onClick={() => {}} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Other Screens */}
      {screen === 'contact' && (
        <ContactScreen 
          onBack={() => navigateTo('home')} 
          onMenuClick={() => setIsMenuOpen(true)} 
          onAIClick={() => {
            // Trigger external AI script if available
            if ((window as any).__openAIAssistant) {
              (window as any).__openAIAssistant();
            }
          }} 
        />
      )}

      {screen === 'profile' && (
        <ProfileScreen 
          onBack={() => navigateTo('home')} 
          onMenuClick={() => setIsMenuOpen(true)} 
        />
      )}

      {screen === 'portfolio' && (
        <PortfolioScreen 
          onBack={() => navigateTo('home')} 
          onMenuClick={() => setIsMenuOpen(true)} 
        />
      )}

      {/* Navigation Menu - Always available via Home NavBar or specific headers */}
      <NavigationMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigateHome={() => navigateTo('home')}
        onNavigateContact={() => navigateTo('contact')}
        onNavigateProfile={() => navigateTo('profile')}
        onNavigatePortfolio={() => navigateTo('portfolio')}
        onNavigateToMyProfile={() => navigate(buildCMSUrl(getUserCode()))}
        currentScreen={screen}
        isAuthenticated={isAuthenticated}
        onLogin={() => navigate(buildCMSUrl(getUserCode()))}
        onLogout={async () => {
          await supabase.auth.signOut();
          toast.success("Logged out successfully");
          // Stay on page, just update state (handled by onAuthStateChange)
        }}
        onNavigateToCMS={navigateToCMS}
        onOpenAIAssistant={() => {
          // Trigger external AI script if available
          if ((window as any).__openAIAssistant) {
            (window as any).__openAIAssistant();
          } else {
            // Fallback: navigate to CMS
            navigateToCMS();
          }
        }}
        userId={userId}
      />

    </div>
  );
}