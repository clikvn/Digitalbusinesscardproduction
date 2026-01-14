import { useState, useMemo } from 'react';
import { Eye, MousePointerClick, Users, Share2, Home, User, Briefcase, Mail, Phone, Calendar, MapPin, Link2, MessageCircle, ChevronDown, Search, X, ExternalLink, Bookmark, Play, Image, Maximize2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { useAnalyticsDashboard } from '../../hooks/useAnalytics';
import { getUserCode } from '../../utils/user-code';
import { useContacts } from '../../hooks/useContacts';
import { useSettings } from '../../hooks/useSettings';
import { useBusinessCard } from '../../hooks/useBusinessCard';
import { AnalyticsPeriod, AnalyticsFilters, getClickTargetLabel } from '../../types/analytics';
import { useTranslation } from 'react-i18next';

// Compact Metric Tile
function MetricTile({ 
  icon: Icon, 
  label, 
  value,
  iconColor = 'text-purple-600',
  iconBg = 'bg-purple-50'
}: { 
  icon: any; 
  label: string; 
  value: string | number;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-2xl truncate">{value}</div>
          <div className="text-xs text-muted-foreground truncate">{label}</div>
        </div>
      </div>
    </Card>
  );
}

// Page Stats Block
function PageStatsBlock({
  icon: Icon,
  title,
  pageViews,
  elements,
  showElements = true,
  interactionMetrics,
  t
}: {
  icon: any;
  title: string;
  pageViews: number;
  elements: { label: string; clicks: number }[];
  showElements?: boolean;
  interactionMetrics?: Array<{ label: string; value: number }>;
  t: (key: string) => string;
}) {
  // Merge interaction metrics into elements list
  const allElements = useMemo(() => {
    if (!interactionMetrics || interactionMetrics.length === 0) {
      return elements;
    }
    
    // Convert interaction metrics to element format
    const metricElements = interactionMetrics.map(metric => ({
      label: metric.label,
      clicks: metric.value
    }));
    
    // Prepend interaction metrics to the beginning
    return [...metricElements, ...elements];
  }, [elements, interactionMetrics]);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-foreground" />
        <h3>{title}</h3>
        <span className="ml-auto text-sm text-muted-foreground">{pageViews} {t('analyticsDashboard.views')}</span>
      </div>
      
      {showElements && allElements.length > 0 ? (
        <div className="space-y-2">
          {allElements.map((element, index) => {
            // Get icon based on element label - improved matching
            const getElementIcon = (label: string) => {
              const lower = label.toLowerCase();
              // Portfolio interaction metrics
              if (lower === 'play video') return Play;
              if (lower === 'open image') return Image;
              if (lower === 'open virtual tour') return Maximize2;
              // Phone
              if (lower === 'phone' || lower.includes('call')) return Phone;
              // Email
              if (lower === 'email' || lower.includes('mail')) return Mail;
              // Messaging apps
              if (lower === 'whatsapp') return MessageCircle;
              if (lower === 'telegram') return MessageCircle;
              if (lower === 'messenger') return MessageCircle;
              if (lower === 'zalo') return MessageCircle;
              if (lower === 'kakao') return MessageCircle;
              if (lower === 'discord') return MessageCircle;
              if (lower === 'wechat') return MessageCircle;
              // Location/Address
              if (lower === 'location' || lower === 'address' || lower.includes('map')) return MapPin;
              // Home Screen Navigation
              if (lower.includes('view profile')) return User;
              if (lower.includes('view portfolio')) return Briefcase;
              if (lower.includes('view contact')) return Mail;
              if (lower.includes('save contact')) return Bookmark;
              if (lower.includes('share profile')) return Share2;
              // Social channels
              if (lower === 'facebook' || lower === 'linkedin' || lower === 'twitter' || lower === 'youtube' || lower === 'tiktok') return Link2;
              // Calendar
              if (lower.includes('calendar') || lower.includes('schedule')) return Calendar;
              // Portfolio
              if (lower.includes('portfolio') || lower.includes('work') || lower.includes('next') || lower.includes('previous')) return Briefcase;
              // Profile/About
              if (lower.includes('profile') || lower.includes('about')) return User;
              // Default
              return MousePointerClick;
            };
            
            const ElementIcon = getElementIcon(element.label);
            
            return (
              <div key={index} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <div className="flex items-center gap-2 text-foreground truncate flex-1">
                  <ElementIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{element.label}</span>
                </div>
                <span className="text-foreground ml-2 flex-shrink-0">{element.clicks} {t('analyticsDashboard.cliks')}</span>
              </div>
            );
          })}
        </div>
      ) : showElements && allElements.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">{t('analyticsDashboard.noInteractionsYet')}</p>
      ) : null}
    </Card>
  );
}

// Format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function AnalyticsDashboard() {
  const { t } = useTranslation();
  const userCode = getUserCode();
  const { data: profile } = useBusinessCard(userCode);
  const { contacts } = useContacts(userCode);
  const { customGroups: groups } = useSettings(userCode);
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: '7d',
  });
  
  const [isContactSearchOpen, setIsContactSearchOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  
  const { dashboard, isLoading } = useAnalyticsDashboard(userCode, filters, contacts, groups);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!contactSearchQuery) return contacts;
    const query = contactSearchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.name?.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query)
    );
  }, [contacts, contactSearchQuery]);

  // Get selected contact name
  const selectedContactName = useMemo(() => {
    if (!filters.contactEmail) return null;
    const contact = contacts.find(c => c.email === filters.contactEmail);
    return contact ? (contact.name || contact.email) : null;
  }, [filters.contactEmail, contacts]);

  // Get selected contact's group
  const selectedContactGroup = useMemo(() => {
    if (!filters.contactEmail) return null;
    const contact = contacts.find(c => c.email === filters.contactEmail);
    if (!contact) return null;
    const group = groups.find(g => g.id === contact.group);
    return group || null;
  }, [filters.contactEmail, contacts, groups]);

  // Handle contact selection
  const handleSelectContact = (email: string) => {
    setFilters(prev => ({ ...prev, contactEmail: email }));
    setIsContactSearchOpen(false);
    setContactSearchQuery('');
  };

  // Clear contact filter
  const handleClearContact = () => {
    setFilters(prev => ({ ...prev, contactEmail: undefined }));
  };

  // Calculate engaged contacts (unique sessions - 30min visits)
  const engagementContacts = useMemo(() => {
    if (!dashboard) return 0;
    // Unique sessions = unique visits (30-min timeout)
    // This counts each distinct visit, regardless of page refreshes
    return dashboard.overallMetrics.uniqueVisitors || 0;
  }, [dashboard]);

  // Calculate new shares (unique people - 90-day visitors)
  const newShares = useMemo(() => {
    if (!dashboard) return 0;
    // Unique people = unique individuals (90-day localStorage persistence via visitor_id)
    // This counts unique people, not repeat visits
    return dashboard.overallMetrics.uniquePeople || dashboard.overallMetrics.uniqueVisitors || 0;
  }, [dashboard]);

  // Calculate portfolio interaction metrics (video play, image open, virtual tour open)
  const portfolioInteractionMetrics = useMemo(() => {
    if (!dashboard) return { videoPlay: 0, imageOpen: 0, virtualTourOpen: 0 };
    
    const metrics = { videoPlay: 0, imageOpen: 0, virtualTourOpen: 0 };
    
    // Find portfolio page data
    const portfolioPage = dashboard.pageBreakdown.find(p => p.screenId === 'portfolio');
    if (portfolioPage && portfolioPage.topElements) {
      // Extract videoPlay, imageOpen, and virtualTourOpen counts
      portfolioPage.topElements.forEach(el => {
        if (el && el.label) {
          const lower = el.label.toLowerCase();
          // Match against the exact labels from CLICK_TARGET_LABELS
          // Use exact match to prevent false positives from portfolio item titles
          if (lower === 'play video') {
            metrics.videoPlay += el.count || 0;
          }
          else if (lower === 'open image') {
            metrics.imageOpen += el.count || 0;
          }
          else if (lower === 'open virtual tour') {
            metrics.virtualTourOpen += el.count || 0;
          }
        }
      });
    }
    
    return metrics;
  }, [dashboard]);

  // Get all available elements for each screen from business card data
  const getAllScreenElements = useMemo(() => {
    const elements: Record<string, { label: string; type: string }[]> = {
      home: [],
      contact: [],
      profile: [],
      portfolio: []
    };

    // Early return if profile is not loaded
    if (!profile) {
      return elements;
    }

    // Home Screen elements - Navigation buttons only
    // Use getClickTargetLabel to get translated labels that match analytics data
    elements.home.push({ label: getClickTargetLabel('home.navigateToProfile'), type: 'navigation' });
    elements.home.push({ label: getClickTargetLabel('home.navigateToPortfolio'), type: 'navigation' });
    elements.home.push({ label: getClickTargetLabel('home.navigateToContact'), type: 'navigation' });
    elements.home.push({ label: getClickTargetLabel('home.saveContact'), type: 'save' });
    elements.home.push({ label: getClickTargetLabel('home.shareProfile'), type: 'share' });

    // Contact Screen elements - with null safety
    // Use getClickTargetLabel to get translated labels
    if (profile.contact?.phone) {
      elements.contact.push({ label: getClickTargetLabel('contact.phone'), type: 'phone' });
    }
    if (profile.contact?.email) {
      elements.contact.push({ label: getClickTargetLabel('contact.email'), type: 'email' });
    }
    if (profile.contact?.address) {
      elements.contact.push({ label: getClickTargetLabel('contact.address'), type: 'location' });
    }
    
    // Messaging apps - with null safety
    if (profile.socialMessaging?.whatsapp) {
      elements.contact.push({ label: getClickTargetLabel('socialMessaging.whatsapp'), type: 'whatsapp' });
    }
    if (profile.socialMessaging?.telegram) {
      elements.contact.push({ label: getClickTargetLabel('socialMessaging.telegram'), type: 'telegram' });
    }
    if (profile.socialMessaging?.messenger) {
      elements.contact.push({ label: getClickTargetLabel('socialMessaging.messenger'), type: 'messenger' });
    }
    if (profile.socialMessaging?.zalo) {
      elements.contact.push({ label: getClickTargetLabel('socialMessaging.zalo'), type: 'zalo' });
    }
    if (profile.socialMessaging?.kakao) {
      elements.contact.push({ label: getClickTargetLabel('socialMessaging.kakao'), type: 'kakao' });
    }
    if (profile.socialMessaging?.discord) {
      elements.contact.push({ label: getClickTargetLabel('socialMessaging.discord'), type: 'discord' });
    }
    if (profile.socialMessaging?.wechat) {
      elements.contact.push({ label: getClickTargetLabel('socialMessaging.wechat'), type: 'wechat' });
    }

    // Social channels - with null safety
    if (profile.socialChannels?.facebook) {
      elements.contact.push({ label: getClickTargetLabel('socialChannels.facebook'), type: 'facebook' });
    }
    if (profile.socialChannels?.linkedin) {
      elements.contact.push({ label: getClickTargetLabel('socialChannels.linkedin'), type: 'linkedin' });
    }
    if (profile.socialChannels?.twitter) {
      elements.contact.push({ label: getClickTargetLabel('socialChannels.twitter'), type: 'twitter' });
    }
    if (profile.socialChannels?.youtube) {
      elements.contact.push({ label: getClickTargetLabel('socialChannels.youtube'), type: 'youtube' });
    }
    if (profile.socialChannels?.tiktok) {
      elements.contact.push({ label: getClickTargetLabel('socialChannels.tiktok'), type: 'tiktok' });
    }

    // Profile Screen elements - with null safety
    if (profile.profile?.about) {
      elements.profile.push({ label: 'About', type: 'about' });
    }
    if (profile.profile?.serviceAreas) {
      elements.profile.push({ label: 'Service Areas', type: 'service' });
    }
    if (profile.profile?.specialties) {
      elements.profile.push({ label: 'Specialties', type: 'specialties' });
    }
    if (profile.profile?.experience) {
      elements.profile.push({ label: 'Experience', type: 'experience' });
    }
    if (profile.profile?.languages) {
      elements.profile.push({ label: 'Languages', type: 'languages' });
    }
    if (profile.profile?.certifications) {
      elements.profile.push({ label: 'Certifications', type: 'certifications' });
    }

    // Portfolio Screen elements
    if (profile.portfolio && profile.portfolio.length > 0) {
      profile.portfolio.forEach((item, index) => {
        elements.portfolio.push({ 
          label: item.title || `Portfolio Item ${index + 1}`, 
          type: 'portfolio-item' 
        });
      });
    }

    return elements;
  }, [profile]);

  // Get page-specific stats with all elements (even 0 clicks)
  const getPageStats = (screenId: string) => {
    const allElements = getAllScreenElements[screenId] || [];
    
    // If no dashboard data, return all elements with 0 clicks
    if (!dashboard || !dashboard.pageBreakdown) {
      return { 
        views: 0, 
        elements: allElements.map(el => ({ label: el.label, clicks: 0 }))
      };
    }
    
    const pageData = dashboard.pageBreakdown.find(p => p.screenId === screenId);
    const views = pageData?.metrics.totalViews || 0;
    
    // Create a map of clicked elements
    const clickedElements = new Map<string, number>();
    if (pageData && pageData.topElements) {
      pageData.topElements.forEach(el => {
        if (el && el.label) {
          clickedElements.set(el.label.toLowerCase(), el.count || 0);
        }
      });
    }
    
    // Merge all elements with click data
    const elements = allElements.map(el => {
      if (!el || !el.label) {
        return { label: 'Unknown', clicks: 0 };
      }
      const clicks = clickedElements.get(el.label.toLowerCase()) || 0;
      return { label: el.label, clicks };
    });
    
    return { views, elements };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">{t('analyticsDashboard.loadingAnalytics')}</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md px-4">
          <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <h3 className="mb-2">{t('analyticsDashboard.noAnalyticsData')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('analyticsDashboard.startSharingToSeeData')}
          </p>
        </div>
      </div>
    );
  }

  // Early return if profile is not loaded yet
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">{t('analyticsDashboard.loadingAnalytics')}</p>
        </div>
      </div>
    );
  }

  const { overallMetrics } = dashboard;
  const homeStats = getPageStats('home');
  const contactStats = getPageStats('contact');
  const profileStats = getPageStats('profile');
  const portfolioStats = getPageStats('portfolio');

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="space-y-3">
        {/* User Profile Link */}
        <button
          onClick={() => window.location.href = `/${userCode}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors w-full"
        >
          <Avatar className="w-12 h-12">
            <AvatarImage src={profile?.avatar} alt={profile?.fullName || 'Profile'} />
            <AvatarFallback>
              {profile?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <div className="truncate">{profile?.fullName || t('analyticsDashboard.yourProfile')}</div>
            <div className="text-sm text-muted-foreground">{t('analyticsDashboard.viewClikCard')}</div>
          </div>
          <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </button>
        
        {/* Performance Title */}
        <h1 className="text-xl">{t('analyticsDashboard.performance')}</h1>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: selectedContactName ? '1fr auto 1fr' : '1fr 1fr auto' }}>
          {/* Time Period Filter */}
          <div className="min-w-0">
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('analyticsDashboard.timePeriod')}</label>
            <Select 
              value={filters.period} 
              onValueChange={(value: AnalyticsPeriod) => setFilters(prev => ({ ...prev, period: value }))}
            >
              <SelectTrigger className="w-full" style={{ height: '40px' }}>
                <SelectValue placeholder={t('analyticsDashboard.selectPeriod')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">{t('analyticsDashboard.last1Hour')}</SelectItem>
                <SelectItem value="1d">{t('analyticsDashboard.last1Day')}</SelectItem>
                <SelectItem value="7d">{t('analyticsDashboard.last7Days')}</SelectItem>
                <SelectItem value="30d">{t('analyticsDashboard.last30Days')}</SelectItem>
                <SelectItem value="90d">{t('analyticsDashboard.last90Days')}</SelectItem>
                <SelectItem value="all">{t('analyticsDashboard.allTime')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group Filter */}
          <div className="min-w-0">
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('analyticsDashboard.group')}</label>
            {selectedContactGroup ? (
              // Show icon-only button when contact is selected (smaller width)
              <button
                disabled
                className="flex items-center justify-center w-10 border border-input rounded-md bg-muted/50 opacity-60 cursor-not-allowed"
                style={{ height: '40px' }}
                title={`${selectedContactName} belongs to ${selectedContactGroup.label}`}
              >
                {(() => {
                  const IconComponent = (LucideIcons as any)[selectedContactGroup.icon];
                  return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
                })()}
              </button>
            ) : (
              // Normal group filter (enabled when no contact selected)
              <Select 
                value={filters.groupId || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  groupId: value === 'all' ? undefined : value 
                }))}
              >
                <SelectTrigger className="w-full" style={{ height: '40px' }}>
                  <SelectValue placeholder={t('analyticsDashboard.allGroups')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('analyticsDashboard.allGroups')}</SelectItem>
                  {groups.map(group => {
                    const IconComponent = (LucideIcons as any)[group.icon];
                    return (
                      <SelectItem key={group.id} value={group.id}>
                        <span className="flex items-center gap-2">
                          {IconComponent && <IconComponent className="w-4 h-4" />}
                          {group.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Contact Search Button */}
          <div className="min-w-0">
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('analyticsDashboard.contact')}</label>
            {selectedContactName ? (
              <div className="flex items-center gap-2 px-3 border border-input rounded-md bg-background" style={{ height: '40px' }}>
                <span className="text-sm flex-1 truncate min-w-0">{selectedContactName}</span>
                <button
                  onClick={handleClearContact}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-10 p-0 justify-center"
                style={{ height: '40px' }}
                onClick={() => setIsContactSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Contact Search Dialog */}
      <Dialog open={isContactSearchOpen} onOpenChange={setIsContactSearchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('analyticsDashboard.searchContact')}</DialogTitle>
            <DialogDescription>{t('analyticsDashboard.findContactToFilter')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('analyticsDashboard.searchByNameOrEmail')}
                value={contactSearchQuery}
                onChange={(e) => setContactSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-1">
              {filteredContacts.length > 0 ? (
                <>
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, contactEmail: undefined }));
                      setIsContactSearchOpen(false);
                      setContactSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-md hover:bg-accent transition-colors"
                  >
                    <div>{t('analyticsDashboard.allContacts')}</div>
                    <div className="text-xs text-muted-foreground">{t('analyticsDashboard.showAnalyticsForEveryone')}</div>
                  </button>
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.email}
                      onClick={() => handleSelectContact(contact.email)}
                      className="w-full text-left px-3 py-2.5 rounded-md hover:bg-accent transition-colors"
                    >
                      <div className="truncate">{contact.name || contact.email}</div>
                      {contact.name && (
                        <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                      )}
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('analyticsDashboard.noContactsFound')}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overall Stats - 4 Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile
          icon={Eye}
          label={t('analyticsDashboard.totalViews')}
          value={formatNumber(overallMetrics.totalViews)}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <MetricTile
          icon={MousePointerClick}
          label={t('analyticsDashboard.totalCliks')}
          value={formatNumber(overallMetrics.totalClicks)}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <MetricTile
          icon={Users}
          label={t('analyticsDashboard.engagedContacts')}
          value={formatNumber(engagementContacts)}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <MetricTile
          icon={Share2}
          label={t('analyticsDashboard.newShares')}
          value={formatNumber(newShares)}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
      </div>

      {/* Page Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PageStatsBlock
          icon={Home}
          title={t('analyticsDashboard.homeScreen')}
          pageViews={homeStats.views}
          elements={homeStats.elements}
          t={t}
        />
        <PageStatsBlock
          icon={Mail}
          title={t('analyticsDashboard.contactScreen')}
          pageViews={contactStats.views}
          elements={contactStats.elements}
          t={t}
        />
        <PageStatsBlock
          icon={User}
          title={t('analyticsDashboard.profileScreen')}
          pageViews={profileStats.views}
          elements={profileStats.elements}
          showElements={false}
          t={t}
        />
        <PageStatsBlock
          icon={Briefcase}
          title={t('analyticsDashboard.portfolioScreen')}
          pageViews={portfolioStats.views}
          elements={portfolioStats.elements}
          interactionMetrics={[
            {
              label: t('analyticsDashboard.playVideo'),
              value: portfolioInteractionMetrics.videoPlay,
            },
            {
              label: t('analyticsDashboard.openImage'),
              value: portfolioInteractionMetrics.imageOpen,
            },
            {
              label: t('analyticsDashboard.openVirtualTour'),
              value: portfolioInteractionMetrics.virtualTourOpen,
            },
          ]}
          t={t}
        />
      </div>

      {/* Top Contact Methods */}
      {overallMetrics.topContactMethods.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {t('analyticsDashboard.topContactMethods')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overallMetrics.topContactMethods.slice(0, 6).map((method, index) => {
              const getIcon = (target: string) => {
                const lower = target.toLowerCase();
                if (lower.includes('phone')) return { icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' };
                if (lower.includes('email')) return { icon: Mail, color: 'text-red-600', bg: 'bg-red-50' };
                if (lower.includes('whatsapp')) return { icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50' };
                if (lower.includes('calendar')) return { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' };
                if (lower.includes('location')) return { icon: MapPin, color: 'text-orange-600', bg: 'bg-orange-50' };
                return { icon: Link2, color: 'text-muted-foreground', bg: 'bg-muted' };
              };
              const iconData = getIcon(method.target);
              const Icon = iconData.icon;

              return (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className={`w-10 h-10 rounded-lg ${iconData.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${iconData.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{method.label}</div>
                    <div className="text-xs text-muted-foreground">{method.count} {t('analyticsDashboard.cliks')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}