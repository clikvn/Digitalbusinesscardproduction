import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BusinessCardStudio } from "../cms/BusinessCardStudio";
import { CMSDashboard } from "../cms/CMSDashboard";
import { NavigationMenu } from "../layout/NavigationMenu";
import { useBusinessCard } from "../../hooks/useBusinessCard";
import { getUserCode, buildCMSUrl, buildProfileUrl } from "../../utils/user-code";
import { clearSupabaseSessionStorage } from "../../utils/logout-utils";
import { supabase } from "../../lib/supabase-client";
import { toast } from "sonner@2.0.3";

export function CMSLayout() {
  const { userCode, section } = useParams<{ userCode: string; section?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  
  // Use the hook to fetch data
  const { data } = useBusinessCard(userCode);

  // Ensure user is authenticated and employee account is active
  useEffect(() => {
    if (!userCode) {
      navigate('/');
      return;
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Redirect to auth if not logged in
        // We pass userCode to preserve context
        navigate(`/${userCode}/auth`);
        return;
      }

      const userId = session.user.id;

      // Check if user is an employee and if account is active
      const { data: employeeStatus, error: statusError } = await supabase
        .rpc('check_employee_status', { p_user_id: userId });

      if (statusError) {
        console.error('Error checking employee status:', statusError);
        // Continue if check fails (fail open for edge cases)
        setIsAuthorized(true);
        setUserId(userId);
      } else if (employeeStatus && employeeStatus.is_active === false) {
        // Employee account is deactivated - sign them out and redirect
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch (error) {
          console.warn('SignOut error (non-critical):', error);
        }
        toast.error(employeeStatus.message || 'Your account has been deactivated by your business owner. Please contact them for more information.');
        navigate(`/${userCode}/auth`);
      } else {
        // User is authenticated and active (or not an employee)
        setIsAuthorized(true);
        setUserId(session.user.id);
      }
    };

    checkAuth();
  }, [userCode, navigate]);

  const handleNavigateHome = () => {
    navigate(buildProfileUrl({ userCode: userCode || getUserCode(), screen: 'home' }));
  };

  const handleLogout = async () => {
    // Clear ALL React Query cache to prevent auto-login from cached data
    queryClient.clear();
    
    // Clear all Supabase session storage (localStorage and sessionStorage)
    clearSupabaseSessionStorage();
    
    // Sign out from Supabase
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('SignOut error (non-critical):', error);
    }
    
    navigate(`/${userCode || getUserCode()}`);
  };

  const handleNavigateToCMS = (targetSection: string) => {
    navigate(buildCMSUrl(userCode, targetSection));
  };

  const handleOpenAIAssistant = () => {
    toast.info("This feature will coming soon!");
  };

  if (!isAuthorized) {
    return null; // Or a loading spinner
  }

  // If no section is selected, show the Studio Overview
  if (!section) {
    return (
      <div className="w-full h-full bg-[#faf9f5]" style={{ minHeight: '100vh' }}>
        <BusinessCardStudio
          onNavigateToSection={handleNavigateToCMS}
          onNavigateHome={handleNavigateHome}
          onMenuClick={() => setIsMenuOpen(true)}
          onAIClick={handleOpenAIAssistant}
          profileImage={data?.personal.profileImage}
          profileName={data?.personal.name}
        />
        <NavigationMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onNavigateHome={handleNavigateHome}
          onNavigateContact={() => navigate(buildProfileUrl({ userCode, screen: 'contact' }))}
          onNavigateProfile={() => navigate(buildProfileUrl({ userCode, screen: 'profile' }))}
          onNavigatePortfolio={() => navigate(buildProfileUrl({ userCode, screen: 'portfolio' }))}
          onNavigateToMyProfile={() => navigate(buildCMSUrl(userCode))}
          currentScreen="home"
          isAuthenticated={true}
          onLogin={() => navigate(buildCMSUrl(userCode))}
          onLogout={handleLogout}
          onNavigateToCMS={handleNavigateToCMS}
          cmsSection={null}
          onOpenAIAssistant={handleOpenAIAssistant}
          userId={userId}
        />
      </div>
    );
  }

  // Handle personal-ai section - show coming soon and redirect to studio
  if (section === 'personal-ai') {
    useEffect(() => {
      toast.info("This feature will coming soon!");
      navigate(buildCMSUrl(userCode));
    }, [navigate, userCode]);
    return null;
  }

  // Otherwise show the specific CMS Dashboard section
  return (
    <div className="w-full h-full bg-[#faf9f5]" style={{ minHeight: '100vh' }}>
      <CMSDashboard
        activeSection={section}
        onLogout={handleLogout}
        onNavigateHome={handleNavigateHome}
        onNavigateToStudio={() => navigate(buildCMSUrl(userCode))}
        onMenuClick={() => setIsMenuOpen(true)}
        onOpenAIAssistant={handleOpenAIAssistant}
      />
      <NavigationMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigateHome={handleNavigateHome}
        onNavigateContact={() => navigate(buildProfileUrl({ userCode, screen: 'contact' }))}
        onNavigateProfile={() => navigate(buildProfileUrl({ userCode, screen: 'profile' }))}
        onNavigatePortfolio={() => navigate(buildProfileUrl({ userCode, screen: 'portfolio' }))}
        onNavigateToMyProfile={() => navigate(buildCMSUrl(userCode))}
        currentScreen="home"
        isAuthenticated={true}
        onLogin={() => navigate(buildCMSUrl(userCode))}
        onLogout={handleLogout}
        onNavigateToCMS={handleNavigateToCMS}
        cmsSection={section}
        onOpenAIAssistant={handleOpenAIAssistant}
        userId={userId}
      />
    </div>
  );
}