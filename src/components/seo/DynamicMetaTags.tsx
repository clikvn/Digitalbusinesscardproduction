import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { usePublicBusinessCard } from "../../hooks/usePublicBusinessCard";
import { parseProfileImage } from "../../utils/profile-image-utils";
import { useParams } from "react-router-dom";

/**
 * DynamicMetaTags Component
 * 
 * Sets dynamic Open Graph and Twitter Card meta tags for individual business card pages.
 * When a user shares their contact, the card will show:
 * - Title: "Contact AI"
 * - Owner name
 * - Owner avatar (circular profile image)
 * - Description: Company and title
 * - Site Name: "Contact AI"
 */
export function DynamicMetaTags() {
  const { userCode, groupCode } = useParams<{ 
    userCode: string; 
    groupCode?: string;
  }>();
  const location = useLocation();
  
  // Fetch business card data
  const { data: businessCardData, isLoading } = usePublicBusinessCard(
    userCode || '', 
    groupCode
  );

  // Don't render meta tags if no userCode or still loading
  if (!userCode || isLoading || !businessCardData) {
    return null;
  }

  // Extract data
  const ownerName = businessCardData.personal.name || '';
  const title = businessCardData.personal.title || '';
  const companyName = businessCardData.personal.businessName || '';
  
  // Parse profile image to get the avatar URL
  const profileImageData = parseProfileImage(businessCardData.personal.profileImage || '');
  const avatarUrl = profileImageData?.imageUrl || '';
  
  // Build description: "Company and title" format
  // If both exist: "Company - Title"
  // If only company: "Company"
  // If only title: "Title"
  // If neither: "Contact AI"
  let description = 'Contact AI';
  if (companyName && title) {
    description = `${companyName} - ${title}`;
  } else if (companyName) {
    description = companyName;
  } else if (title) {
    description = title;
  }
  
  // Build full page title: "Owner Name | Contact AI"
  const pageTitle = ownerName ? `${ownerName} | Contact AI` : 'Contact AI';
  
  // Get current page URL
  const currentUrl = window.location.origin + location.pathname + location.search;

  return (
    <Helmet>
      {/* Page Title */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      
      {/* Description */}
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="Contact AI" />
      {avatarUrl && (
        <meta property="og:image" content={avatarUrl} />
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      {avatarUrl && (
        <meta name="twitter:image" content={avatarUrl} />
      )}
    </Helmet>
  );
}
