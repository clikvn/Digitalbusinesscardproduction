import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BusinessCardStudio } from "../cms/BusinessCardStudio";
import { CMSDashboard } from "../cms/CMSDashboard";
import { FileUploadPage } from "../cms/FileUploadPage";
import { NavigationMenu } from "../layout/NavigationMenu";
import { useBusinessCard } from "../../hooks/useBusinessCard";
import { getUserCode, buildCMSUrl, buildProfileUrl } from "../../utils/user-code";
import { supabase } from "../../lib/supabase-client";

export function CMSLayout() {
  const { userCode, section } = useParams<{ userCode: string; section?: string }>();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  
  // Use the hook to fetch data
  const { data } = useBusinessCard(userCode);

  // Ensure user is authenticated
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
      } else {
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
    await supabase.auth.signOut();
    navigate(`/${userCode || getUserCode()}`);
  };

  const handleNavigateToCMS = (targetSection: string) => {
    navigate(buildCMSUrl(userCode, targetSection));
  };

  const handleOpenAIAssistant = () => {
    if ((window as any).__openAIAssistant) {
      (window as any).__openAIAssistant();
    }
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

  // Handle personal-ai section (file upload page)
  if (section === 'personal-ai') {
    return (
      <div className="w-full h-full bg-[#faf9f5]" style={{ minHeight: '100vh' }}>
        <FileUploadPage />
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