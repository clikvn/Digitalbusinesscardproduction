import { useEffect, useRef } from 'react';

interface UseChatWidgetOptions {
  serverUrl: string;
  tenantId: string;
  context?: string; // Optional: Product context (e.g., "SKU: 10010" or "Product Name: Ice Age")
  ownerId?: string; // Optional: Owner ID for File Search
  sidebar?: boolean;
  defaultOpen?: boolean;
  enabled?: boolean;
}

// TypeScript declarations for ChatAgent global objects
declare global {
  interface Window {
    ChatAgentLoader?: {
      init: (options: {
        serverUrl: string;
        tenantId: string;
        context?: string;
        ownerId?: string;
        sidebar?: boolean;
        defaultOpen?: boolean;
      }) => Promise<void>;
    };
    ChatAgent?: {
      open: () => void;
      close: () => void;
      destroy: () => void;
      isOpen: () => boolean;
    };
    __openAIAssistant?: () => void;
  }
}

export function useChatWidget({
  serverUrl,
  tenantId,
  context,
  ownerId,
  sidebar = true,
  defaultOpen = false,
  enabled = true,
}: UseChatWidgetOptions) {
  const initialized = useRef(false);
  const currentOwnerId = useRef<string | undefined>(ownerId);

  useEffect(() => {
    if (!enabled) return;

    // Expose __openAIAssistant early so buttons can call it even before widget loads
    // It will wait for the widget to be ready
    window.__openAIAssistant = () => {
      if (window.ChatAgent) {
        window.ChatAgent.open();
      } else {
        // Widget not ready yet, wait for it
        const checkAndOpen = () => {
          if (window.ChatAgent) {
            window.ChatAgent.open();
          } else {
            setTimeout(checkAndOpen, 100);
          }
        };
        checkAndOpen();
      }
    };

    // Load the loader script (it automatically loads CSS and JS)
    const loaderScriptId = 'chat-agent-loader-script';
    let loaderScript = document.getElementById(loaderScriptId) as HTMLScriptElement;

    const initializeWidget = async () => {
      // Check if we need to re-initialize (first time or ownerId changed)
      const needsInit = !initialized.current || currentOwnerId.current !== ownerId;
      
      if (window.ChatAgentLoader && needsInit) {
        // If already initialized with different ownerId, destroy first
        if (initialized.current && window.ChatAgent) {
          window.ChatAgent.destroy();
          initialized.current = false;
        }
        
        try {
          await window.ChatAgentLoader.init({
            serverUrl,
            tenantId,
            context,
            ownerId,
            sidebar,
            defaultOpen,
          });
          initialized.current = true;
          currentOwnerId.current = ownerId;

          // Expose the open function via window.__openAIAssistant for backward compatibility
          window.__openAIAssistant = () => {
            if (window.ChatAgent) {
              window.ChatAgent.open();
            } else {
              console.warn('[useChatWidget] ChatAgent not available yet, widget may still be loading');
            }
          };

          console.log('[useChatWidget] Chat widget initialized successfully');
        } catch (error) {
          console.error('[useChatWidget] Failed to initialize:', error);
        }
      }
    };

    if (!loaderScript) {
      loaderScript = document.createElement('script');
      loaderScript.id = loaderScriptId;
      loaderScript.src = `${serverUrl}/widget/chat-agent-loader.js`;
      loaderScript.async = true;

      loaderScript.onload = () => {
        // Wait a bit for ChatAgentLoader to be available
        const checkAndInit = () => {
          if (window.ChatAgentLoader) {
            initializeWidget();
          } else {
            // Retry after a short delay
            setTimeout(checkAndInit, 100);
          }
        };
        checkAndInit();
      };
      loaderScript.onerror = () => {
        console.error('[useChatWidget] Failed to load loader script');
      };

      document.head.appendChild(loaderScript);
    } else if (window.ChatAgentLoader) {
      // Loader already loaded, initialize immediately
      initializeWidget();
    } else {
      // Script exists but loader not ready yet, wait for it
      const checkAndInit = () => {
        if (window.ChatAgentLoader) {
          initializeWidget();
        } else {
          setTimeout(checkAndInit, 100);
        }
      };
      checkAndInit();
    }

    // Cleanup
    return () => {
      if (window.ChatAgent && initialized.current) {
        window.ChatAgent.destroy();
        initialized.current = false;
        currentOwnerId.current = undefined;
        delete window.__openAIAssistant;
      }
    };
  }, [serverUrl, tenantId, context, ownerId, sidebar, defaultOpen, enabled]);
}

