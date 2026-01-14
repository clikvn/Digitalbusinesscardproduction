import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
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
          <div className="bg-background box-border content-stretch flex gap-[8px] h-[44px] items-center justify-center relative rounded-[12px] shrink-0 w-full py-[8px] px-[12px] py-[4px]">
            <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[12px]" />
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
            <button className="relative shrink-0 size-[20px] hover:opacity-70 transition-opacity">
              <Filter className="w-[20px] h-[20px] text-foreground" strokeWidth={1.5} />
            </button>
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
                      setSelectedGroup(selectedGroup === group.id ? null : group.id);
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }}
                    className={`box-border content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0 w-[100px] h-[70px] transition-all ${
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
                  className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full rounded-lg hover:bg-muted transition-colors p-2 -m-2"
                >
                  {/* Contact Info - Click to Edit */}
                  <button
                    onClick={() => onEditContact(contact)}
                    className="flex gap-[16px] items-center flex-1 text-left"
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
                    onClick={() => onSelectContact(contact)}
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