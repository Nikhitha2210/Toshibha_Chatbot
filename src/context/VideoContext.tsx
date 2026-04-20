import { createContext, ReactNode, useContext, useState, useCallback } from 'react';

export interface VideoDetails {
  description: string;
  videoSrc: string;
  videoStartPoint: number;
  videoEndPoint: number;
  timestamp?: string;
}

interface VideoContextType {
  extractVideoDetails: (xml: string) => VideoDetails[];
  splitMessageByVideos: (text: string) => Array<{ type: 'text' | 'video'; content: string }>;
  isYouTubeUrl: (url: string) => boolean;
  normalizeYouTubeUrl: (url: string, start?: number, end?: number) => string;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider = ({ children }: { children: ReactNode }) => {
  
  const extractInnerTag = useCallback((block: string, tag: string): string => {
    const regExPattern = new RegExp(`<\\s*${tag}\\b[^>]*>([\\s\\S]*?)<\\/\\s*${tag}\\s*>`, "i");
    const foundMatch = block.match(regExPattern);
    return foundMatch?.[1]?.trim() ?? "";
  }, []);

  const extractTimestamps = useCallback((xml: string): { start: number; end: number } => {
    const foundMatch = xml.match(/<\s*timestamp\b[^>]*>([\s\S]*?)<\/\s*timestamp\s*>/i);
    if (!foundMatch) {
      return { start: 0, end: 0 };
    }

    const raw = (foundMatch[1] ?? "").trim();
    const tokenRegEx = /"(min|max)"|'(min|max)'|\bmin\b|\bmax\b|[+-]?\d+(?:\.\d+)?/gi;
    const tokens: string[] = [];
    let t: RegExpExecArray | null;
    
    while ((t = tokenRegEx.exec(raw)) !== null && tokens.length < 2) {
      let token = t[0];
      if (t[1]) token = t[1]; 
      else if (t[2]) token = t[2];
      tokens.push(token);
    }

    if (tokens.length === 2) {
      const start = coerceTimestamp(tokens[0]);
      const end = coerceTimestamp(tokens[1]);
      
      if (start !== null && end !== null) {
        return { start, end };
      }
    }

    return { start: 0, end: 0 };
  }, []);

  const coerceTimestamp = (token: string): number | null => {
    const lower = token.replace(/^['"]|['"]$/g, "").toLowerCase();
    if (lower === "min") return 0;
    if (lower === "max") return Number.POSITIVE_INFINITY;
    if (/^[+-]?\d+(?:\.\d+)?$/.test(lower)) return Number(lower);
    return null;
  };

  const extractVideoDetails = useCallback((xml: string): VideoDetails[] => {
    try {
      const videoBlocks: VideoDetails[] = [];
      
      // Find all <video-details> blocks
      const videoRegex = /<video-details>[\s\S]*?<\/video-details>/gi;
      let match;
      
      while ((match = videoRegex.exec(xml)) !== null) {
        const block = match[0];
        const description = extractInnerTag(block, "video-description");
        const videoSrc = extractInnerTag(block, "video-link");
        const timestamps = extractTimestamps(block);
        
        if (videoSrc) {
          videoBlocks.push({
            description,
            videoSrc,
            videoStartPoint: timestamps.start,
            videoEndPoint: timestamps.end,
            timestamp: extractInnerTag(block, "timestamp")
          });
        }
      }
      
      return videoBlocks;
    } catch (error) {
      console.error('Error extracting video details:', error);
      return [];
    }
  }, [extractInnerTag, extractTimestamps]);

  const splitMessageByVideos = useCallback((text: string): Array<{ type: 'text' | 'video'; content: string }> => {
    const parts: Array<{ type: 'text' | 'video'; content: string }> = [];
    const videoRegex = /<video-details>[\s\S]*?<\/video-details>/gi;
    
    let lastIndex = 0;
    let match;
    
    const regex = new RegExp(videoRegex);
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before video
      if (match.index > lastIndex) {
        const textContent = text.slice(lastIndex, match.index).trim();
        if (textContent) {
          parts.push({
            type: 'text',
            content: textContent
          });
        }
      }
      
      // Add video
      parts.push({
        type: 'video',
        content: match[0]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const textContent = text.slice(lastIndex).trim();
      if (textContent) {
        parts.push({
          type: 'text',
          content: textContent
        });
      }
    }
    
    // If no videos found, return text as single part
    if (parts.length === 0 && text.trim()) {
      parts.push({ type: 'text', content: text.trim() });
    }
    
    return parts;
  }, []);

  const isYouTubeUrl = useCallback((url: string): boolean => {
    if (!url) return false;
    try {
      const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const host = new URL(normalized).hostname.replace(/^www\./i, "");
      return host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com");
    } catch {
      return false;
    }
  }, []);

  const normalizeYouTubeUrl = useCallback((url: string, start?: number, end?: number): string => {
    try {
      const sourceUrl = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
      let id = "";
      
      if (sourceUrl.hostname.includes("youtu.be")) {
        id = sourceUrl.pathname.slice(1);
      } else if (sourceUrl.searchParams.has("v")) {
        id = sourceUrl.searchParams.get("v") || "";
      }

      const embedParameters = new URLSearchParams();
      if (start && start > 0) embedParameters.set("start", String(Math.floor(start)));
      if (end && end > 0 && end !== Number.POSITIVE_INFINITY) {
        embedParameters.set("end", String(Math.floor(end)));
      }
      embedParameters.set("modestbranding", "1");
      embedParameters.set("rel", "0");
      
      return `https://www.youtube.com/embed/${id}?${embedParameters.toString()}`;
    } catch (error) {
      console.error('Error normalizing YouTube URL:', error);
      return url;
    }
  }, []);

  return (
    <VideoContext.Provider
      value={{
        extractVideoDetails,
        splitMessageByVideos,
        isYouTubeUrl,
        normalizeYouTubeUrl,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};