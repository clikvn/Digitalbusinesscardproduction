/**
 * Serverless Analytics Batcher
 * Batches events and sends directly to Supabase via RPC
 * No external server needed!
 */

import { supabase, supabaseUrl, supabaseKey } from '../lib/supabase-client';

interface BatchedEvent {
  type: 'session' | 'page_view' | 'click';
  data: any;
  timestamp: number;
}

class AnalyticsBatcher {
  private events: BatchedEvent[] = [];
  private flushInterval: number = 10000; // 10 seconds
  private maxBatchSize: number = 20; // Send after 20 events
  private timer: NodeJS.Timeout | null = null;
  private isFlushing: boolean = false;

  constructor() {
    this.startFlushTimer();
    this.setupUnloadHandler();
  }

  // Track session start
  trackSession(
    sessionId: string,
    userCode: string,
    shareCode: string,
    contactId?: string,
    visitorId?: string
  ) {
    this.events.push({
      type: 'session',
      data: {
        sessionId,
        userCode,
        shareCode,
        contactId: contactId || null,
        visitorId: visitorId || null,
        timestamp: Date.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      },
      timestamp: Date.now(),
    });
    this.checkFlush();
  }

  // Track page view
  trackPageView(
    sessionId: string,
    userCode: string,
    shareCode: string,
    pageType: string,
    contactId?: string
  ) {
    this.events.push({
      type: 'page_view',
      data: {
        sessionId,
        userCode,
        shareCode,
        contactId: contactId || null,
        pageType,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
    this.checkFlush();
  }

  // Track click
  trackClick(
    sessionId: string,
    userCode: string,
    shareCode: string,
    clickTarget: string,
    contactId?: string
  ) {
    const category = this.getClickCategory(clickTarget);

    this.events.push({
      type: 'click',
      data: {
        sessionId,
        userCode,
        shareCode,
        contactId: contactId || null,
        clickTarget,
        clickCategory: category,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
    this.checkFlush();
  }

  // Check if we should flush
  private checkFlush() {
    if (this.events.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  // Start auto-flush timer
  private startFlushTimer() {
    if (typeof window === 'undefined') return; // Skip in SSR
    
    this.timer = setInterval(() => {
      if (this.events.length > 0 && !this.isFlushing) {
        this.flush();
      }
    }, this.flushInterval);
  }

  // Flush events to Supabase via RPC
  private async flush() {
    if (this.events.length === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const eventsToSend = [...this.events];
    this.events = []; // Clear buffer immediately

    try {
      // Call Supabase RPC function - No external server needed!
      const { data, error } = await supabase.rpc('ingest_analytics_batch', {
        events: eventsToSend,
      });

      if (error) {
        console.error('[Analytics] Batch failed:', error);
        // Optional: Implement retry logic here
      } else if (data && !data.success) {
        console.error('[Analytics] Processing error:', data.error);
      } else {
        // Success - optionally log for debugging
        // console.log('[Analytics] Batch sent:', data);
      }
    } catch (error) {
      console.error('[Analytics] Send failed:', error);
      // Optional: Implement retry logic here
    } finally {
      this.isFlushing = false;
    }
  }

  // Setup page unload handler
  private setupUnloadHandler() {
    if (typeof window === 'undefined') return; // Skip in SSR

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      if (this.events.length > 0) {
        this.flushSync();
      }
    });

    // Also handle visibility change (mobile browsers)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.events.length > 0) {
        this.flushSync();
      }
    });
  }

  // Synchronous flush for page unload (uses keepalive)
  private flushSync() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // Use fetch with keepalive for reliable delivery on page unload
      if (supabaseUrl && supabaseKey) {
        fetch(`${supabaseUrl}/rest/v1/rpc/ingest_analytics_batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ events: eventsToSend }),
          keepalive: true, // Ensures request completes even if page unloads
        }).catch((err) => {
          console.error('[Analytics] Sync flush failed:', err);
        });
      }
    } catch (error) {
      console.error('[Analytics] Failed to flush on unload:', error);
    }
  }

  // Cleanup
  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.flush();
  }

  // Helper to categorize clicks
  private getClickCategory(target: string): string {
    if (target.startsWith('contact.')) return 'contact';
    if (target.startsWith('socialMessaging.')) return 'messaging';
    if (target.startsWith('socialChannels.')) return 'social';
    if (target.startsWith('portfolio.')) return 'portfolio';
    if (target === 'aiAgent') return 'aiAgent';
    return 'other';
  }
}

// Singleton instance
export const analyticsBatcher = new AnalyticsBatcher();