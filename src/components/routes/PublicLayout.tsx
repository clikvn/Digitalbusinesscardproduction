import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner@2.0.3";
import { useQueryClient } from "@tanstack/react-query";
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
import { clearSupabaseSessionStorage } from "../../utils/logout-utils";
import { supabase } from "../../lib/supabase-client";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { AccountErrorPage } from "./AccountErrorPage";
import { DynamicMetaTags } from "../seo/DynamicMetaTags";

export function PublicLayout({ screen }: { screen: 'home' | 'contact' | 'profile' | 'portfolio' }) {
  const { userCode, groupCode, contactCode } = useParams<{ 
    userCode: string; 
    groupCode?: string;
    contactCode?: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  // Fetch business card data to check for errors
  const { error: businessCardError, isLoading: isLoadingBusinessCard } = usePublicBusinessCard(userCode || '', groupCode);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Only set authenticated if session exists, user is owner, AND email is verified
      const isVerified = session?.user?.email_confirmed_at ? true : false;
      if (session && !isVerified) {
        // Clear unverified session to prevent auto-login
        await supabase.auth.signOut({ scope: 'local' });
        setIsAuthenticated(false);
        setUserId(undefined);
      } else {
        setIsAuthenticated(!!session && isOwner && isVerified);
        setUserId(session?.user?.id);
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Only set authenticated if session exists, user is owner, AND email is verified
      const isVerified = session?.user?.email_confirmed_at ? true : false;
      if (session && !isVerified) {
        // Clear unverified session to prevent auto-login
        await supabase.auth.signOut({ scope: 'local' });
        setIsAuthenticated(false);
        setUserId(undefined);
      } else {
        setIsAuthenticated(!!session && isOwner && isVerified);
        setUserId(session?.user?.id);
      }
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

  const { t } = useTranslation();

  // Determine error message (must be after all hooks)
  const getErrorInfo = () => {
    if (!businessCardError || !userCode) return null;
    
    const errorMessage = (businessCardError as any)?.message || '';
    
    if (errorMessage === 'USER_CODE_NOT_FOUND') {
      return {
        title: t("error.accountNotAvailable"),
        message: t("error.accountNotFound")
      };
    } else if (errorMessage === 'EMPLOYEE_DEACTIVATED') {
      return {
        title: t("error.accountNotAvailable"),
        message: t("error.accountDeactivated")
      };
    }
    
    return null;
  };

  const errorInfo = getErrorInfo();

  // Show error page if there's an error (must be after all hooks)
  if (errorInfo && !isLoadingBusinessCard) {
    return <AccountErrorPage title={errorInfo.title} message={errorInfo.message} />;
  }

  return (
    <div className="bg-[#faf9f5] w-full h-full relative" style={{ height: 'calc(var(--vh, 1vh) * 100)', overflow: screen === 'home' ? 'visible' : 'auto' }}>
      {/* Dynamic Meta Tags for Social Sharing */}
      <DynamicMetaTags />
      
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
            toast.info(t("messages.comingSoon"));
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
        onLogin={() => navigate('/auth')}
        onLogout={async () => {
          // Close menu immediately to force re-render
          setIsMenuOpen(false);
          
          // Immediately update state to prevent showing authenticated features
          setIsAuthenticated(false);
          setUserId(undefined);
          
          // Clear ALL React Query cache to prevent auto-login from cached data
          queryClient.clear();
          
          // Clear all Supabase session storage (localStorage and sessionStorage)
          clearSupabaseSessionStorage();
          
          // Sign out from Supabase (use local scope to avoid 403 errors)
          // This will also clear the session from Supabase's internal storage
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch (error) {
            // If signOut fails, we've already cleared all storage, so continue
            console.warn('SignOut error (non-critical):', error);
          }
          
          // Force a session check to ensure state is updated
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setIsAuthenticated(false);
            setUserId(undefined);
          }
          
          toast.success(t("auth.loggedOutSuccess"));
        }}
        onNavigateToCMS={navigateToCMS}
        onOpenAIAssistant={() => {
          toast.info(t("messages.comingSoon"));
        }}
        userId={userId}
      />

    </div>
  );
}