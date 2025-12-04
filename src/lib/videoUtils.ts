/**
 * Video URL utilities for detecting and converting video platform URLs
 */

export type VideoType = 'youtube' | 'vimeo' | 'direct' | 'unsupported';

export interface VideoInfo {
  type: VideoType;
  id?: string;
  embedUrl?: string;
  originalUrl: string;
}

/**
 * Detects the type of video URL and extracts necessary information
 */
export function parseVideoUrl(url: string): VideoInfo {
  if (!url) {
    return { type: 'unsupported', originalUrl: url };
  }

  const trimmedUrl = url.trim();

  // YouTube detection
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = trimmedUrl.match(youtubeRegex);
  
  if (youtubeMatch && youtubeMatch[1]) {
    const videoId = youtubeMatch[1];
    return {
      type: 'youtube',
      id: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      originalUrl: trimmedUrl,
    };
  }

  // Vimeo detection
  const vimeoRegex = /(?:vimeo\.com\/)(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:|\/\?)/;
  const vimeoMatch = trimmedUrl.match(vimeoRegex);
  
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      id: videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      originalUrl: trimmedUrl,
    };
  }

  // Direct video file (mp4, webm, ogg, etc.)
  const directVideoRegex = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
  if (directVideoRegex.test(trimmedUrl)) {
    return {
      type: 'direct',
      embedUrl: trimmedUrl,
      originalUrl: trimmedUrl,
    };
  }

  // If it starts with http/https and doesn't match above, assume it might be a direct link
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return {
      type: 'direct',
      embedUrl: trimmedUrl,
      originalUrl: trimmedUrl,
    };
  }

  return { type: 'unsupported', originalUrl: trimmedUrl };
}

/**
 * Check if a URL is a valid video URL
 */
export function isValidVideoUrl(url: string): boolean {
  const info = parseVideoUrl(url);
  return info.type !== 'unsupported';
}

/**
 * Get a thumbnail URL for a video (if available)
 */
export function getVideoThumbnail(url: string): string | null {
  const info = parseVideoUrl(url);

  if (info.type === 'youtube' && info.id) {
    return `https://img.youtube.com/vi/${info.id}/maxresdefault.jpg`;
  }

  if (info.type === 'vimeo' && info.id) {
    // Vimeo thumbnails require an API call, so we'll return null
    // You could implement this with Vimeo API if needed
    return null;
  }

  return null;
}
