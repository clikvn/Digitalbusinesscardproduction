import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
import { MarkdownText } from '../common/MarkdownText';
import termsEn from '../../locales/terms-en.json';
import termsVi from '../../locales/terms-vi.json';

interface TermsAndConditionsScreenProps {
  onAccept: () => void;
  onBack: () => void;
}

export function TermsAndConditionsScreen({ onAccept, onBack }: TermsAndConditionsScreenProps) {
  const { t, i18n } = useTranslation();
  const [accepted, setAccepted] = useState(false);
  const [terms, setTerms] = useState(termsEn);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hasScrolled85Percent, setHasScrolled85Percent] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load terms metadata based on current language
    const currentLang = i18n.language || 'en';
    if (currentLang === 'vi') {
      setTerms(termsVi);
    } else {
      setTerms(termsEn);
    }
    // Reset scroll state when language changes
    setHasScrolled85Percent(false);
    setAccepted(false);
  }, [i18n.language]);

  useEffect(() => {
    // Load markdown content dynamically
    const loadContent = async () => {
      setLoading(true);
      try {
        const currentLang = i18n.language || 'en';
        const markdownFile = currentLang === 'vi' ? 'terms-vi.md' : 'terms-en.md';
        const response = await fetch(`/terms/${markdownFile}`);
        
        if (response.ok) {
          const text = await response.text();
          setContent(text);
        } else {
          // Fallback to empty content if file not found
          setContent('');
        }
      } catch (error) {
        console.error('Failed to load terms content:', error);
        setContent('');
      } finally {
        setLoading(false);
        // Check if content is already short enough (less than 85% scroll needed)
        setTimeout(() => {
          if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
            if (scrollPercentage >= 0.85 || scrollHeight <= clientHeight) {
              setHasScrolled85Percent(true);
            }
          }
        }, 100);
      }
    };

    loadContent();
  }, [i18n.language]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage >= 0.85) {
      setHasScrolled85Percent(true);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
      <Card className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden gap-0">
        <CardHeader className="flex-shrink-0 pb-4 gap-y-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <CardTitle className="font-semibold text-2xl">{terms.title}</CardTitle>
          </div>
          <CardDescription className="font-light text-red-600 text-xs px-[5px]">
            *** {terms.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 pl-6 pr-[18px] pt-0 pb-0 overflow-hidden">
          {/* Scrollable Terms Content */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto pr-4 terms-scrollbar"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--primary)) transparent'
            }}
          >
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                {t('common.loading')}
              </div>
            ) : (
              <MarkdownText className="text-sm text-foreground">
                {content || (t('termsAndConditions.content') || 'Content not available')}
              </MarkdownText>
            )}
          </div>
        </CardContent>
        <style>{`
          .terms-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .terms-scrollbar::-webkit-scrollbar-button {
            display: none;
          }
          .terms-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .terms-scrollbar::-webkit-scrollbar-thumb {
            background-color: hsl(var(--primary));
            border-radius: 4px;
          }
          .terms-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: hsl(var(--primary) / 0.8);
          }
        `}</style>
        <CardFooter className="flex flex-col gap-4 border-t flex-shrink-0">
          {/* Acceptance Checkbox */}
          <div className="flex items-center gap-3 w-full">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              disabled={!hasScrolled85Percent}
            />
            <Label
              htmlFor="accept-terms"
              className={`text-sm flex-1 leading-normal ${hasScrolled85Percent ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              {terms.acceptanceText}
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              {t('common.back')}
            </Button>
            <Button
              type="button"
              onClick={onAccept}
              disabled={!accepted || !hasScrolled85Percent}
              className="flex-1"
            >
              {terms.acceptAndContinue}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
