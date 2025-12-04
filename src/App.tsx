// Load polyfills FIRST before any other imports
// This fixes iOS 16.0-16.3 CSSStyleSheet constructor error
import "../polyfills/constructable-stylesheets.js";

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { PublicLayout } from "./components/routes/PublicLayout";
import { CMSLayout } from "./components/routes/CMSLayout";
import { AuthScreen } from "./components/screens/AuthScreen";
import { ensureDefaultUserExists } from "./utils/storage";

function AppContent() {
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}