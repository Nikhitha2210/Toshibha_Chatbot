import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Dimensions } from 'react-native';
import Video from 'react-native-video';
import { WebView } from 'react-native-webview';

interface ChatMessageVideoElementProps {
  xml: string;
}

export const ChatMessageVideoElement: React.FC<ChatMessageVideoElementProps> = ({ xml }) => {
  const [description, setDescription] = useState<string>("");
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoStartPoint, setVideoStartPoint] = useState<number>(0);
  const [videoEndPoint, setVideoEndPoint] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const videoRef = useRef<any>(null);

  useEffect(() => {
    extractXmlDetails(xml);
  }, [xml]);

  const extractInnerTag = (block: string, tag: string): string => {
    const regExPattern = new RegExp(`<\\s*${tag}\\b[^>]*>([\\s\\S]*?)<\\/\\s*${tag}\\s*>`, "i");
    const foundMatch = block.match(regExPattern);
    return foundMatch?.[1]?.trim() ?? "";
  };

  const extractXmlDetails = (xml: string) => {
    const desc = extractInnerTag(xml, "video-description");
    const src = extractInnerTag(xml, "video-link");
    
    console.log('📹 Extracted video description:', desc);
    console.log('📹 Extracted video source:', src);
    
    setDescription(desc);
    setVideoSrc(src);
    setIsYouTube(isYouTubeUrl(src));
    extractTimestamps(xml);
  };

  const extractTimestamps = (xml: string) => {
    const foundMatch = xml.match(/<\s*timestamp\b[^>]*>([\s\S]*?)<\/\s*timestamp\s*>/i);
    if (!foundMatch) {
      setVideoStartPoint(0);
      setVideoEndPoint(0);
      return;
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
        setVideoStartPoint(start);
        setVideoEndPoint(end);
        console.log('📹 Video timestamps:', { start, end });
        return;
      }
    }

    setVideoStartPoint(0);
    setVideoEndPoint(0);
  };

  const coerceTimestamp = (token: string): number | null => {
    const lower = token.replace(/^['"]|['"]$/g, "").toLowerCase();
    if (lower === "min") return 0;
    if (lower === "max") return Number.POSITIVE_INFINITY;
    if (/^[+-]?\d+(?:\.\d+)?$/.test(lower)) return Number(lower);
    return null;
  };

  const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const host = new URL(normalized).hostname.replace(/^www\./i, "");
      return host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com");
    } catch {
      return false;
    }
  };

  const normalizeYouTubeUrl = (url: string): string => {
    try {
      const sourceUrl = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
      let id = "";
      
      if (sourceUrl.hostname.includes("youtu.be")) {
        id = sourceUrl.pathname.slice(1);
      } else if (sourceUrl.searchParams.has("v")) {
        id = sourceUrl.searchParams.get("v") || "";
      }

      const embedParameters = new URLSearchParams();
      if (videoStartPoint > 0) embedParameters.set("start", String(Math.floor(videoStartPoint)));
      if (videoEndPoint > 0 && videoEndPoint !== Number.POSITIVE_INFINITY) {
        embedParameters.set("end", String(Math.floor(videoEndPoint)));
      }
      embedParameters.set("modestbranding", "1");
      embedParameters.set("rel", "0");
      
      return `https://www.youtube.com/embed/${id}?${embedParameters.toString()}`;
    } catch (error) {
      console.error('Error normalizing YouTube URL:', error);
      return url;
    }
  };

  if (!videoSrc) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.videoContainer} 
        onPress={() => setIsModalOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.thumbnailOverlay}>
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
          {description ? (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalOpen}
        animationType="slide"
        onRequestClose={() => {
          setIsModalOpen(false);
          setIsPaused(true);
        }}
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setIsModalOpen(false);
                setIsPaused(true);
              }}
            >
              <Text style={styles.closeText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.videoPlayerContainer}>
            {isYouTube ? (
              <WebView
                source={{ uri: normalizeYouTubeUrl(videoSrc) }}
                style={styles.webView}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
              />
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: videoSrc }}
                style={styles.video}
                controls={true}
                paused={isPaused}
                resizeMode="contain"
                onLoad={() => {
                  if (videoStartPoint > 0 && videoRef.current) {
                    videoRef.current.seek(videoStartPoint);
                  }
                }}
                onEnd={() => setIsPaused(true)}
              />
            )}
          </View>

          {description ? (
            <View style={styles.descriptionContainer}>
              <Text style={styles.modalDescription}>{description}</Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    marginHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  videoContainer: {
    height: 200,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    width: '100%',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  playIcon: {
    fontSize: 24,
    color: '#000',
    marginLeft: 4,
  },
  description: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#1a1a1a',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  descriptionContainer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  modalDescription: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
});