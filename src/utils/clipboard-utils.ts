/**
 * Clipboard Utility Functions
 * Handles clipboard operations with proper fallbacks for blocked APIs
 */

/**
 * Copy text to clipboard with fallback for blocked Clipboard API
 * @param text - The text to copy
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Try modern clipboard API first (requires secure context)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (clipboardErr) {
        console.log('Modern clipboard API blocked, using fallback method');
        // Fall through to fallback method
      }
    }
    
    // Fallback method using document.execCommand (deprecated but widely supported)
    return copyToClipboardFallback(text);
  } catch (error) {
    console.error('Clipboard copy failed:', error);
    return false;
  }
}

/**
 * Fallback method for copying to clipboard when modern API is blocked
 * Uses the deprecated document.execCommand method
 */
function copyToClipboardFallback(text: string): boolean {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make it invisible and position it off-screen
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    
    // Append to document
    document.body.appendChild(textArea);
    
    // Select the text
    textArea.select();
    textArea.setSelectionRange(0, text.length); // For mobile devices
    
    // Try to copy
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Fallback clipboard copy failed:', error);
    return false;
  }
}

/**
 * Copy text to clipboard and show toast notification
 * @param text - The text to copy
 * @param successMessage - Custom success message (optional)
 * @param errorMessage - Custom error message (optional)
 * @param toastFn - Toast function to use for notifications
 */
export async function copyWithToast(
  text: string,
  toastFn: { success: (msg: string) => void; error: (msg: string) => void },
  successMessage: string = 'Copied to clipboard!',
  errorMessage: string = 'Unable to copy to clipboard'
): Promise<void> {
  const success = await copyToClipboard(text);
  
  if (success) {
    toastFn.success(successMessage);
  } else {
    toastFn.error(errorMessage);
  }
}

/**
 * Check if clipboard API is available and not blocked
 */
export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && window.isSecureContext);
}

/**
 * Get clipboard permissions status
 * Returns 'granted', 'denied', 'prompt', or 'unavailable'
 */
export async function getClipboardPermissionStatus(): Promise<string> {
  try {
    if (!navigator.permissions) {
      return 'unavailable';
    }
    
    const permission = await navigator.permissions.query({ 
      name: 'clipboard-write' as PermissionName 
    });
    
    return permission.state;
  } catch (error) {
    return 'unavailable';
  }
}

export default {
  copyToClipboard,
  copyWithToast,
  isClipboardAvailable,
  getClipboardPermissionStatus
};
