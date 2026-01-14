import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import svgPaths from '../../imports/svg-p3p7jcj1vn';
import shareIconPaths from '../../imports/svg-v3myfe0s0k';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Contact } from '../../types/contacts';
import { CustomGroup, getColorClasses } from '../../utils/custom-groups';
import * as LucideIcons from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useContacts } from '../../hooks/useContacts';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';

interface ShareStep1Props {
  onAddContact: () => void;
  onSelectContact: (contact: Contact) => void;
  onEditContact: (contact: Contact) => void;
  onShareGroup?: (groupId: string) => void;
}

export function ShareStep1({ onAddContact, onSelectContact, onEditContact, onShareGroup }: ShareStep1Props) {
  const { t } = useTranslation();
  const { userCode } = useParams<{ userCode: string }>();
  const { customGroups: groups } = useSettings(userCode);
  const { contacts } = useContacts(userCode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach(c => {
      counts[c.group] = (counts[c.group] || 0) + 1;
    });
    return counts;
  }, [contacts]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter contacts based on search and selected group
  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Filter by group
    if (selectedGroup) {
      filtered = filtered.filter(c => c.group === selectedGroup);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.title.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.includes(query)
      );
    }

    return filtered;
  }, [contacts, selectedGroup, searchQuery]);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollGroups = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 136; // card width (128) + gap (8)
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      
      // Update scroll buttons after animation
      setTimeout(updateScrollButtons, 300);
    }
  };

  return (
    <div className="bg-background content-stretch flex flex-col items-start relative size-full overflow-hidden">
      {/* Share Contact Content */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[0px] w-full px-[0px] py-[16px]">
          <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-muted-foreground text-center w-full">
            <p className="leading-[20px]">
              {t('shareManager.selectContactToShare')}{' '}
              <button 
                onClick={onAddContact}
                className="underline hover:text-foreground transition-colors"
              >
                {t('shareManager.addNewContact')}
              </button>
              {' '}{t('shareManager.toYourList')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-background box-border content-stretch flex flex-col gap-2 relative rounded-[12px] shrink-0 w-full py-[8px] px-[12px] py-[4px]">
            <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[12px]" />
            
            {/* Search Input Row */}
            <div className="flex gap-[8px] items-center relative">
              <div className="basis-0 grow h-[39px] min-h-px min-w-px relative shrink-0">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-[39px] items-center overflow-clip px-0 relative rounded-[inherit] w-full px-[0px] py-[8px] py-[4px]">
                  <Search className="w-[20px] h-[20px] text-foreground" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('shareManager.search')}
                    className="flex-1 bg-transparent outline-none font-['Inter:Medium',sans-serif] font-medium text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              {(searchQuery || selectedGroup) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGroup(null);
                  }}
                  className="p-1 hover:bg-muted/50 rounded-full transition-colors shrink-0"
                  aria-label={t('shareManager.clearFilters')}
                >
                  <X className="size-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <button 
                    className={`relative shrink-0 size-[20px] hover:opacity-70 transition-opacity ${selectedGroup ? 'text-primary' : ''}`}
                    aria-label={t('shareManager.filterByGroup')}
                  >
                    <Filter className="w-[20px] h-[20px] text-foreground" strokeWidth={1.5} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-sm font-semibold text-foreground">{t('shareManager.filterByGroup')}</div>
                    {groups.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">{t('shareManager.noGroups')}</div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setSelectedGroup(null);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-2 ${
                            !selectedGroup ? 'bg-accent font-medium' : ''
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            !selectedGroup ? 'bg-primary border-primary' : 'border-border'
                          }`}>
                            {!selectedGroup && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className="truncate flex-1">{t('shareManager.allGroups')}</span>
                        </button>
                        {groups.map((group) => {
                          const IconComponent = (LucideIcons as any)[group.icon];
                          const isSelected = selectedGroup === group.id;
                          return (
                            <button
                              key={group.id}
                              onClick={() => {
                                setSelectedGroup(isSelected ? null : group.id);
                                setIsFilterOpen(false);
                              }}
                              className={`w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-2 ${
                                isSelected ? 'bg-accent font-medium' : ''
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-primary border-primary' : 'border-border'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              {IconComponent && (
                                <IconComponent className="w-4 h-4 shrink-0" />
                              )}
                              <span className="truncate flex-1">{group.label}</span>
                              <span className="text-xs text-muted-foreground">({groupCounts[group.id] || 0})</span>
                            </button>
                          );
                        })}
                      </>
                    )}
                    {selectedGroup && (
                      <div className="pt-2 border-t">
                        <button
                          onClick={() => {
                            setSelectedGroup(null);
                            setIsFilterOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-muted-foreground"
                        >
                          {t('shareManager.clearAll')}
                        </button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Selected Group Tag */}
            {selectedGroup && (
              <div className="flex flex-wrap gap-2 px-2">
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2 py-1 text-xs"
                >
                  {(() => {
                    const group = groups.find(g => g.id === selectedGroup);
                    const IconComponent = group ? (LucideIcons as any)[group.icon] : null;
                    return (
                      <>
                        {IconComponent && <IconComponent className="w-3 h-3" />}
                        <span>{group?.label || selectedGroup}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(null);
                          }}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    );
                  })()}
                </Badge>
              </div>
            )}
          </div>

          {/* Contact Groups with Chevron Navigation */}
          <div className="relative w-full">
            {/* Left Chevron */}
            {canScrollLeft && (
              <button
                onClick={() => scrollGroups('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-muted p-2 rounded-lg shadow-sm transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" strokeWidth={2} />
              </button>
            )}
            
            {/* Scrollable Container */}
            <div 
              ref={scrollContainerRef}
              onScroll={updateScrollButtons}
              className="flex gap-[8px] items-stretch overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* All Groups (Default + Custom) */}
              {groups.map(group => {
                const IconComponent = (LucideIcons as any)[group.icon];
                const colorClasses = getColorClasses(group.color);
                
                return (
                  <button
                    key={group.id}
                    onClick={(e) => {
                      // Trigger share when clicking the button (but not when clicking the share icon inside)
                      if (onShareGroup && !(e.target as HTMLElement).closest('[data-share-icon]')) {
                        onShareGroup(group.id);
                      }
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }}
                    className={`box-border content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0 w-[100px] h-[70px] transition-all cursor-pointer hover:opacity-90 ${
                      selectedGroup === group.id ? 'ring-2 ring-inset ring-primary' : ''
                    } ${colorClasses.bg} ${colorClasses.border} border-2`}
                  >
                    {/* Icon and Title Row */}
                    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full">
                      {IconComponent && (
                        <IconComponent className={`w-4 h-4 ${colorClasses.text} shrink-0`} />
                      )}
                      <div className={`flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 ${colorClasses.text} text-xs`}>
                        <p className="leading-[20px] truncate">{group.label}</p>
                      </div>
                    </div>
                    {/* Count and Share Icon */}
                    <div className="h-[32px] relative shrink-0 w-full">
                      <div className="absolute bottom-0 flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] left-0 not-italic text-foreground text-nowrap top-0 tracking-[-0.144px]">
                        <p className="leading-[32px] whitespace-pre">{groupCounts[group.id] || 0}</p>
                      </div>
                      <div 
                        data-share-icon
                        className="absolute right-[8px] size-[16px] top-[8px] cursor-pointer hover:opacity-70 transition-opacity z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onShareGroup) onShareGroup(group.id);
                        }}
                      >
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                          <g>
                            <path clipRule="evenodd" d={shareIconPaths.p1dccce80} fill="currentColor" fillRule="evenodd" className="text-foreground" />
                            <path clipRule="evenodd" d={shareIconPaths.p388fae80} fill="currentColor" fillRule="evenodd" className="text-foreground" />
                            <path clipRule="evenodd" d={shareIconPaths.p3f921100} fill="currentColor" fillRule="evenodd" className="text-foreground" />
                            <path clipRule="evenodd" d={shareIconPaths.p7742200} fill="currentColor" fillRule="evenodd" className="text-foreground" />
                            <path clipRule="evenodd" d={shareIconPaths.p3a28ff80} fill="currentColor" fillRule="evenodd" className="text-foreground" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Chevron */}
            {canScrollRight && (
              <button
                onClick={() => scrollGroups('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-muted p-2 rounded-lg shadow-sm transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-foreground" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Contact List */}
          <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full">
            {filteredContacts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                {searchQuery ? t('shareManager.noContactsFound') : t('shareManager.noContactsInGroup')}
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => onSelectContact(contact)}
                  className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full rounded-lg hover:bg-muted transition-colors p-2 -m-2 cursor-pointer"
                >
                  {/* Contact Info - Click to Edit */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditContact(contact);
                    }}
                    className="contact-edit-area flex gap-[16px] items-center flex-1 text-left"
                  >
                    <div className="relative rounded-[100px] shrink-0 size-[40px]">
                      <ImageWithFallback
                        src={contact.avatar}
                        alt={contact.name}
                        className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full"
                      />
                    </div>
                    <div className="basis-0 content-stretch flex flex-col grow items-start justify-center min-h-px min-w-px not-italic relative shrink-0 text-foreground text-left">
                      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 w-full">
                        <p className="leading-[24px]">{contact.name}</p>
                      </div>
                      <p className="[white-space-collapse:collapse] font-['Inter:Regular',sans-serif] font-normal leading-[24px] overflow-ellipsis overflow-hidden relative shrink-0 text-nowrap w-full">
                        {contact.title}
                      </p>
                    </div>
                  </button>
                  
                  {/* Share Icon - Click to Share */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectContact(contact);
                    }}
                    className="overflow-clip relative shrink-0 size-[16px]"
                    aria-label={t('shareManager.addContact')}
                  >
                    <ShareIcon />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <>
      <div className="absolute inset-[4.17%_8.33%_62.5%_58.33%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[33.33%_58.33%_33.33%_8.33%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[62.5%_8.33%_4.17%_58.33%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path clipRule="evenodd" d={svgPaths.p13ecaa70} fill="var(--fill-0, #535146)" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[52.12%_31.58%_22.96%_31.62%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
          <path clipRule="evenodd" d={svgPaths.p3c172900} fill="var(--fill-0, #535146)" fillRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-[22.96%_31.62%_52.12%_31.62%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 4">
          <path clipRule="evenodd" d={svgPaths.p3e8ac300} fill="var(--fill-0, #535146)" fillRule="evenodd" />
        </svg>
      </div>
    </>
  );
}