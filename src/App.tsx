import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "./lib/query-client";
import { PublicLayout } from "./components/routes/PublicLayout";
import { CMSLayout } from "./components/routes/CMSLayout";
import { AuthScreen } from "./components/screens/AuthScreen";
import { AuthCallbackScreen } from "./components/screens/AuthCallbackScreen";
import { PasswordResetScreen } from "./components/screens/PasswordResetScreen";
import { ensureDefaultUserExists } from "./utils/storage";
import { Toaster } from "./components/ui/sonner";
import { useChatWidget } from "./hooks/useChatWidget";
import { parseProfileUrl } from "./utils/user-code";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we have password reset tokens on the wrong page and redirect
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const hasResetToken = hash.includes('access_token') || hash.includes('type=recovery') || search.includes('code=');
    
    // If we have reset tokens but we're not on the reset-password page, redirect there
    if (hasResetToken && location.pathname !== '/auth/reset-password') {
      console.log('[App] Detected password reset token on wrong page, redirecting to /auth/reset-password');
      navigate(`/auth/reset-password${search}${hash}`, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);
  
  // Extract user code and route info from current URL
  const { userCode, isCMS } = parseProfileUrl(location.pathname);
  
  // Only enable chat widget on public owner pages (not CMS or auth routes)
  const isPublicOwnerPage = !isCMS && !location.pathname.includes('/auth') && userCode;
  
  // Initialize chat widget with user code as ownerId
  // Widget will automatically re-initialize when ownerId changes (navigating to different owner)
  useChatWidget({
    serverUrl: 'https://agent-chat-widget-568865197474.europe-west1.run.app',
    tenantId: 'business-card-only',
    ownerId: userCode || undefined, // Pass user code as ownerId
    sidebar: true,
    defaultOpen: false,
    enabled: isPublicOwnerPage, // Only enable on public owner pages
  });
  // Calculate and set actual viewport height (accounting for mobile browser chrome)
  useEffect(() => {
    const setVH = () => {
      // Use visualViewport API when available (more accurate on mobile)
      const height = window.visualViewport 
        ? window.visualViewport.height 
        : window.innerHeight;
      
      // Set CSS custom property: 1vh = 1% of actual visible viewport height
      const vh = height * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set on mount
    setVH();

    // Update on resize, orientation change, and visual viewport changes
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Handle iOS Safari address bar show/hide
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setVH);
      window.visualViewport.addEventListener('scroll', setVH);
    }

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setVH);
        window.visualViewport.removeEventListener('scroll', setVH);
      }
    };
  }, []);

  // Ensure default user exists on app mount
  useEffect(() => {
    ensureDefaultUserExists();
  }, []);

  return (
    <Routes>
      {/* Root Redirect */}
      <Route path="/" element={<Navigate to="/myclik" replace />} />
      
      {/* Auth */}
      <Route path="/auth" element={<AuthScreen />} />
      <Route path="/auth/callback" element={<AuthCallbackScreen />} />
      <Route path="/auth/reset-password" element={<PasswordResetScreen />} />
      <Route path="/:userCode/auth" element={<AuthScreen />} />
      
      {/* CMS Routes */}
      <Route path="/:userCode/studio" element={<CMSLayout />} />
      <Route path="/:userCode/studio/:section" element={<CMSLayout />} />

      {/* Public Profile Routes - Specific Screens */}
      <Route path="/:userCode/contact" element={<PublicLayout screen="contact" />} />
      <Route path="/:userCode/profile" element={<PublicLayout screen="profile" />} />
      <Route path="/:userCode/portfolio" element={<PublicLayout screen="portfolio" />} />
      
      {/* Public Profile Routes - Group Specific Screens */}
      <Route path="/:userCode/:groupCode/contact" element={<PublicLayout screen="contact" />} />
      <Route path="/:userCode/:groupCode/profile" element={<PublicLayout screen="profile" />} />
      <Route path="/:userCode/:groupCode/portfolio" element={<PublicLayout screen="portfolio" />} />
      
      {/* Public Profile Routes - Group + Contact Tracking (3 segments) */}
      {/* Format: /:userCode/:groupCode/:contactCode */}
      <Route path="/:userCode/:groupCode/:contactCode/contact" element={<PublicLayout screen="contact" />} />
      <Route path="/:userCode/:groupCode/:contactCode/profile" element={<PublicLayout screen="profile" />} />
      <Route path="/:userCode/:groupCode/:contactCode/portfolio" element={<PublicLayout screen="portfolio" />} />
      <Route path="/:userCode/:groupCode/:contactCode" element={<PublicLayout screen="home" />} />

      {/* Public Profile Routes - Home (Catch-all for remaining paths) */}
      {/* We place these last so they don't greedily match screens as group codes */}
      <Route path="/:userCode/:groupCode" element={<PublicLayout screen="home" />} />
      <Route path="/:userCode" element={<PublicLayout screen="home" />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/myclik" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <Helmet>
        {/* Page Title and Description */}
        <title>CLIK DIGITAL BUSINESS CARD</title>
        <meta name="description" content="Digital business card platform by CLIK JSC" />
        <meta name="author" content="CLIK JSC" />
        
        {/* Open Graph / Facebook Meta Tags (for sharing on social media) */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="CLIK DIGITAL BUSINESS CARD" />
        <meta property="og:description" content="Digital business card platform by CLIK JSC" />
        <meta property="og:site_name" content="CLIK" />
        
        {/* Twitter Card Meta Tags (for sharing on Twitter/X) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CLIK DIGITAL BUSINESS CARD" />
        <meta name="twitter:description" content="Digital business card platform by CLIK JSC" />
        
        {/* Essential viewport meta tag for mobile compatibility */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        
        {/* Additional mobile optimization meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Prevent auto-zoom on input focus (iOS Safari) */}
        <meta name="format-detection" content="telephone=no" />
      </Helmet>
      
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}