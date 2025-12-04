/**
 * Constructable Stylesheets Polyfill for iOS 16.0-16.3
 * 
 * iOS 16.0-16.3 doesn't support new CSSStyleSheet() constructor
 * This polyfill adds support by converting to <style> tags
 */

(function() {
  // Only polyfill if CSSStyleSheet constructor is not supported
  if (typeof CSSStyleSheet === 'undefined') {
    return; // Browser doesn't support CSSStyleSheet at all
  }

  // Test if constructor is supported
  try {
    new CSSStyleSheet();
    // Constructor works, no need to polyfill
    return;
  } catch (e) {
    // Constructor throws error, need to polyfill
    console.log('[Polyfill] CSSStyleSheet constructor not supported, applying polyfill');
  }

  // Store original CSSStyleSheet if it exists
  const OriginalCSSStyleSheet = window.CSSStyleSheet;
  
  // Create polyfill class
  class CSSStyleSheetPolyfill {
    constructor() {
      this.cssRules = [];
      this._element = null;
      this._text = '';
    }

    replaceSync(text) {
      this._text = text;
      
      // If already attached to shadow root, update the style element
      if (this._element) {
        this._element.textContent = text;
      }
      
      // Parse CSS rules (basic implementation)
      try {
        this.cssRules = this._parseRules(text);
      } catch (e) {
        console.warn('[Polyfill] Failed to parse CSS rules:', e);
        this.cssRules = [];
      }
    }

    replace(text) {
      return Promise.resolve(this.replaceSync(text));
    }

    _parseRules(text) {
      // Very basic rule parsing - just split by }
      const rules = text.split('}').filter(r => r.trim());
      return rules.map((rule, index) => ({
        cssText: rule + '}',
        selectorText: rule.split('{')[0]?.trim() || '',
        style: {},
        type: 1, // STYLE_RULE
        index: index
      }));
    }

    _attachToShadowRoot(shadowRoot) {
      if (!this._element) {
        this._element = document.createElement('style');
        this._element.textContent = this._text;
      }
      shadowRoot.appendChild(this._element);
    }
  }

  // Override CSSStyleSheet constructor
  window.CSSStyleSheet = CSSStyleSheetPolyfill;

  // Store reference to polyfill
  window.__CSSStyleSheetPolyfill = true;

  // Polyfill ShadowRoot.adoptedStyleSheets
  if (typeof ShadowRoot !== 'undefined' && ShadowRoot.prototype) {
    const originalAttachShadow = Element.prototype.attachShadow;
    
    Element.prototype.attachShadow = function(...args) {
      const shadowRoot = originalAttachShadow.apply(this, args);
      
      // Store adopted stylesheets
      let _adoptedStyleSheets = [];
      
      Object.defineProperty(shadowRoot, 'adoptedStyleSheets', {
        get() {
          return _adoptedStyleSheets;
        },
        set(sheets) {
          _adoptedStyleSheets = sheets;
          
          // Remove old style elements
          const oldStyles = shadowRoot.querySelectorAll('style[data-polyfill-sheet]');
          oldStyles.forEach(style => style.remove());
          
          // Add new style elements for each sheet
          sheets.forEach((sheet, index) => {
            if (sheet instanceof CSSStyleSheetPolyfill) {
              const styleElement = document.createElement('style');
              styleElement.setAttribute('data-polyfill-sheet', index);
              styleElement.textContent = sheet._text;
              shadowRoot.appendChild(styleElement);
              sheet._element = styleElement;
            }
          });
        },
        enumerable: true,
        configurable: true
      });
      
      return shadowRoot;
    };
  }

  console.log('[Polyfill] Constructable Stylesheets polyfill applied successfully');
})();
