import { createContext, ReactNode, useContext, useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { useAuth } from './AuthContext';
import {
    API_CONFIG,
    logApiCall,
    getChatApiUrl,
    getImageUrl,
    safeFetch,
    testNetworkConnections
} from '../config/environment';

const uuidv4 = () => uuid.v4() as string;
const APP_SESSION_ID = uuidv4(); // Pure UUID format

export interface ChatMessage {
    id: string;
    time: string;
    message: string;
    isUser: boolean;
    isStreaming?: boolean;
    agentStatus?: string;
    sources?: SourceReference[];
    hasVoted?: boolean;
    voteType?: 'upvote' | 'downvote';
    feedback?: any;
    highlight?: {
        title: string;
        rating: number;
        reviews: number;
        description: string;
    };
}

export interface ChatSession {
    id: string;
    title: string;
    timestamp: string;
    messages: ChatMessage[];
    userId: string;
    creationDate: string;
    label?: string;
}

export interface RecentQuery {
    id: string;
    message: string;
    timestamp: string;
}

export interface SourceReference {
    filename: string;
    pages: string;
    awsLink: string;
    url?: string;
    fullMatchText?: string; // Add this line

}

export interface VoteData {
    messageId: string;
    messageText: string;
    voteType: 'upvote' | 'downvote';
    timestamp: string;
    userId: string;
}

interface BackendSession {
    id: string;
    user_id: string;
    session_name?: string;
    created_at: string;
    updated_at: string;
    messages?: BackendMessage[];
    first_message?: string;
    last_message?: string;
    message_count?: number;
}

interface BackendMessage {
    id: string;
    session_id: string;
    content: string;
    is_user: boolean;
    created_at: string;
    vote?: number;
    feedback?: string;
}

interface WebAppSessionObject {
    id: string;
    label: string;
    messages: WebAppChatMessageObject[];
    creationDate: string;
    summary?: {
        title: string;
        problem: string;
        solution: string;
        sessionMessageLengthOnLastUpdate?: number;
        isExpectingDisplay?: boolean;
    };
}

interface WebAppChatMessageObject {
    id: string;
    userName: string;
    isBot: boolean;
    date: string;
    text: string;
    vote?: 0 | 1 | -1;
    feedback?: string;
    feedbackfiles?: any[];
    files?: any[];
    media?: any[];
    isStreaming?: boolean;
    agentStatus?: string;
    sources?: SourceReference[]; // ← Add this line

}

type ChatContextType = {
    messages: ChatMessage[];
    sessions: ChatSession[];
    recentQueries: RecentQuery[];
    currentSessionId: string | null;
    selectedSession: ChatSession | null;
    addMessage: (message: ChatMessage) => void;
    clearMessages: () => void;
    sendMessage: (text: string) => Promise<void>;
    submitVote: (messageText: string, voteType: 'upvote' | 'downvote') => Promise<void>;
    submitFeedback: (messageText: string, feedback: any) => Promise<void>;
    isLoading: boolean;
    startNewSession: () => void;
    loadSession: (sessionId: string) => void;
    setSelectedSession: (sessionId: string) => void;
    error: string | null;
    clearError: () => void;
    testNetwork: () => Promise<void>;
    loadUserSessions: () => Promise<ChatSession[]>;
    refreshChatHistory: () => Promise<void>;
    clearAllUserData: () => Promise<void>;
    addNewSession: () => void;
    cleanupEmptySessions: () => Promise<void>;
    getCurrentUserId: () => string; 
    enhancedAutoSave: (sessionData: ChatSession) => Promise<void>; 
    hasSessionContent: (sessionMessages: ChatMessage[]) => boolean; 
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [selectedSession, setSelectedSessionState] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const statusPollingRef = useRef<NodeJS.Timeout | null>(null);
    const lastAutoSaveRef = useRef<number>(0);

    const authContext = useAuth();

    const safeApiCall = useCallback(async (apiCall: () => Promise<any>, fallbackError = 'API call failed') => {
        try {
            return await apiCall();
        } catch (error) {
            console.error(' Safe API Call Error:', error);
            let errorMessage = fallbackError;
            if (error instanceof Error) {
                errorMessage = error.message;
                if (error.message.includes('Network request failed')) {
                    errorMessage = 'Cannot connect to server. Please check your internet connection.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Request timed out. Server may be busy.';
                } else if (error.message.includes('401')) {
                    errorMessage = 'Authentication failed. Please log in again.';
                } else if (error.message.includes('500')) {
                    errorMessage = 'Server error. Please try again later.';
                }
            }
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, []);

    const getCurrentUserId = useCallback(() => {
        const userData = authContext.state.user;
    return userData?.email || String(userData?.id || "unknown_user");
    }, [authContext]);

    const hasSessionContent = useCallback((sessionMessages: ChatMessage[]) => {
        if (!sessionMessages || sessionMessages.length < 2) return false;

        const hasUserMessage = sessionMessages.some(msg =>
            msg.isUser && msg.message.trim().length > 0
        );
        const hasAIMessage = sessionMessages.some(msg =>
            !msg.isUser &&
            !msg.isStreaming &&
            msg.message.trim().length > 0 &&
            !msg.message.includes('Processing your request') &&
            !msg.message.includes('Error:')
        );

        return hasUserMessage && hasAIMessage;
    }, []);

    const cleanupEmptySessions = useCallback(async () => {
        try {
            console.log(' Cleaning up empty sessions...');

            const userId = getCurrentUserId();
            const userSessionsStr = await AsyncStorage.getItem(`user_sessions_${userId}`);

            if (userSessionsStr) {
                const sessionList = JSON.parse(userSessionsStr);
                const validSessions = [];
                let removedCount = 0;

                for (const sessionRef of sessionList) {
                    try {
                        const sessionStr = await AsyncStorage.getItem(`session_${sessionRef.id}`);
                        if (sessionStr) {
                            const fullSession = JSON.parse(sessionStr);

                            if (hasSessionContent(fullSession.messages)) {
                                validSessions.push(sessionRef);
                            } else {
                                // Remove empty session from storage
                                await AsyncStorage.removeItem(`session_${sessionRef.id}`);
                                removedCount++;
                                console.log('🗑️ Removed empty session:', sessionRef.title || sessionRef.id);
                            }
                        }
                    } catch (error) {
                        console.log(`Failed to process session ${sessionRef.id}:`, error);
                        await AsyncStorage.removeItem(`session_${sessionRef.id}`);
                        removedCount++;
                    }
                }

                // Update the session list with only valid sessions
                await AsyncStorage.setItem(`user_sessions_${userId}`, JSON.stringify(validSessions));

                // Update in-memory sessions
                setSessions(prev => prev.filter(session => hasSessionContent(session.messages)));

                console.log(` Cleanup complete: Removed ${removedCount} empty sessions, kept ${validSessions.length} valid sessions`);
            }
        } catch (error) {
            console.error(' Failed to cleanup empty sessions:', error);
        }
    }, [getCurrentUserId, hasSessionContent]);

    const fetchChatHistoryFromBackend = useCallback(async (): Promise<ChatSession[]> => {
        try {
            console.log(' Fetching chat history from backend...');

            const token = authContext.state.tokens?.access_token;
            const userId = getCurrentUserId();

            if (!token) {
                console.log(' No token available for chat history');
                return [];
            }

            const possibleUrls = [
                `https://tgcsbe.iopex.ai/pastSessions?uid=${userId}`,
                `https://tgcsbe.iopex.ai/api/sessions?user_id=${userId}`,
                `https://tgcsbe.iopex.ai/sessions?user_id=${userId}`,
                `https://tgcsbe.iopex.ai/api/chat/sessions?user_id=${userId}`,
                `https://tgcsbe.iopex.ai/chat/sessions?user_id=${userId}`,
                `https://tgcsbe.iopex.ai/api/user-sessions?user_id=${userId}`,
                `https://tgcsbe.iopex.ai/user-sessions?user_id=${userId}`,
                `https://tgcsbe.iopex.ai/api/conversations?user_id=${userId}`,
                `https://tgcsbe.iopex.ai/conversations?user_id=${userId}`,
            ];

            for (const url of possibleUrls) {
                try {
                    console.log(` Testing chat history endpoint: ${url}`);

                    const response = await safeFetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    });

                    console.log(` ${url} - Status: ${response.status}`);

                    if (response.ok) {
                        const responseText = await response.text();
                        console.log(`Found working endpoint: ${url}`);
                        console.log(` Response preview:`, responseText.substring(0, 300));

                        try {
                            const chatHistory = JSON.parse(responseText);
                            console.log(` Successfully parsed chat history from backend`);

                            const convertedSessions = convertBackendChatHistory(chatHistory, userId);
                            console.log(` Converted ${convertedSessions.length} sessions from backend`);

                            return convertedSessions;
                        } catch (parseError) {
                            console.log(` Could not parse JSON from ${url}:`, parseError);
                            continue;
                        }
                    } else if (response.status === 404) {
                        console.log(` ${url} - Not found (404)`);
                    } else if (response.status === 401) {
                        console.log(` ${url} - Unauthorized (401)`);
                    } else {
                        console.log(` ${url} - Error: ${response.status}`);
                    }
                } catch (error) {
                    console.log(` ${url} - Exception:`, error);
                }
            }

            console.log(' No working chat history endpoint found');
            return [];

        } catch (error) {
            console.error(' Failed to fetch chat history from backend:', error);
            return [];
        }
    }, [authContext, getCurrentUserId]);

    const convertBackendChatHistory = useCallback((backendData: any, userId: string): ChatSession[] => {
        try {
            console.log(' Converting backend chat history format...');

            let chatArray = backendData;

            if (backendData.sessions) {
                chatArray = backendData.sessions;
            } else if (backendData.conversations) {
                chatArray = backendData.conversations;
            } else if (backendData.chats) {
                chatArray = backendData.chats;
            } else if (backendData.data) {
                chatArray = backendData.data;
            } else if (!Array.isArray(backendData)) {
                console.log(' Unexpected backend format, trying to convert single object');
                chatArray = [backendData];
            }

            if (!Array.isArray(chatArray)) {
                console.log(' Backend data is not convertible to array:', chatArray);
                return [];
            }

            const convertedSessions: ChatSession[] = chatArray.map((item: BackendSession, index: number) => {
                const sessionId = item.id || `backend-session-${index}`;
                const title = item.session_name || item.first_message?.substring(0, 50) || `Chat ${index + 1}`;
                const timestamp = item.created_at || item.updated_at || new Date().toISOString();
                const creationDate = item.created_at || timestamp;

                let messages: ChatMessage[] = [];

                if (item.messages && Array.isArray(item.messages)) {
                    messages = item.messages.map((msg: BackendMessage, msgIndex: number) => {
                        const messageId = msg.id || `msg-${sessionId}-${msgIndex}`;
                        return {
                            id: messageId,
                            time: new Date(msg.created_at || timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            message: msg.content || '',
                            isUser: msg.is_user || false,
                            sources: [],
                            hasVoted: msg.vote !== undefined && msg.vote !== null && msg.vote !== 0,
                            voteType: msg.vote === 1 ? 'upvote' as const : msg.vote === -1 ? 'downvote' as const : undefined,
                            feedback: msg.feedback,
                            highlight: {
                                title: msg.is_user ? "Your Query" : "AI Response",
                                rating: msg.is_user ? 0 : 4.8,
                                reviews: msg.is_user ? 0 : 8399,
                                description: msg.content || ''
                            }
                        };
                    });
                } else if (item.first_message || item.last_message) {
                    if (item.first_message) {
                        messages.push({
                            id: `${sessionId}-first`,
                            time: new Date(creationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            message: item.first_message,
                            isUser: true,
                            sources: [],
                            highlight: {
                                title: "Your Query",
                                rating: 0,
                                reviews: 0,
                                description: item.first_message
                            }
                        });
                    }

                    if (item.last_message && item.last_message !== item.first_message) {
                        messages.push({
                            id: `${sessionId}-last`,
                            time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            message: item.last_message,
                            isUser: false,
                            sources: [],
                            highlight: {
                                title: "AI Response",
                                rating: 4.8,
                                reviews: 8399,
                                description: item.last_message
                            }
                        });
                    }
                }

                return {
                    id: sessionId,
                    title: title,
                    timestamp: timestamp,
                    creationDate: creationDate,
                    messages: messages,
                    userId: userId,
                    label: title
                };
            });

            // ✅ FIXED: Filter out sessions without meaningful content
            const validSessions = convertedSessions.filter(session => hasSessionContent(session.messages));
            validSessions.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());

            console.log(` Converted ${validSessions.length} valid chat sessions from backend (filtered out ${convertedSessions.length - validSessions.length} empty sessions)`);
            return validSessions;

        } catch (error) {
            console.error(' Error converting backend chat history:', error);
            return [];
        }
    }, [hasSessionContent]);


    const fetchBackendSessions = useCallback(async (): Promise<ChatSession[]> => {
    try {
        console.log(' Fetching sessions from backend...');
        
        const token = authContext.state.tokens?.access_token;
        const userId = getCurrentUserId(); // This will now be email

        if (!token) {
            console.log(' No token available for session fetch');
            return [];
        }

        const response = await safeFetch(`${API_CONFIG.CHAT_API_BASE_URL}/pastSessions?uid=${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.log(` Session fetch failed: ${response.status}`);
            return [];
        }

        const backendSessions: WebAppSessionObject[] = await response.json(); // ← Add type
        console.log(` Fetched ${backendSessions.length} sessions from backend for user: ${userId}`);

        const convertedSessions: ChatSession[] = backendSessions.map((session: WebAppSessionObject) => ({ 
            id: session.id,
            title: session.label || `Session ${new Date(session.creationDate).toLocaleDateString()}`,
            timestamp: session.creationDate,
            creationDate: session.creationDate,
            messages: session.messages.map((msg: WebAppChatMessageObject) => ({ // ← Add type
                id: msg.id,
                time: new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                message: msg.text,
                isUser: !msg.isBot,
                sources: (msg as any).sources || [], // ← Cast to any for sources
                hasVoted: msg.vote !== undefined && msg.vote !== null && msg.vote !== 0,
                voteType: msg.vote === 1 ? 'upvote' as const : msg.vote === -1 ? 'downvote' as const : undefined,
                feedback: msg.feedback,
                highlight: {
                    title: msg.isBot ? "AI Response" : "Your Query",
                    rating: msg.isBot ? 4.8 : 0,
                    reviews: msg.isBot ? 8399 : 0,
                    description: msg.text || ''
                }
            })),
            userId: userId,
            label: session.label
        }));

        return convertedSessions.filter(session => hasSessionContent(session.messages));
    } catch (error) {
        console.error(' Failed to fetch backend sessions:', error);
        return [];
    }
}, [authContext, getCurrentUserId, hasSessionContent]);


    const saveSessionToBackend = useCallback(async (session: ChatSession) => {
        try {
            console.log(' Saving session to backend database (Web App Compatible)...');

            const token = authContext.state.tokens?.access_token;
            const userId = getCurrentUserId();

            if (!token) {
                console.log(' No token for backend session save');
                return false;
            }

            const webAppSession: WebAppSessionObject = {
    id: session.id,
    label: session.title,
    creationDate: session.creationDate || session.timestamp,
    messages: session.messages.map(msg => ({
        id: msg.id,
        userName: getCurrentUserId(), // ← This will now be email
        isBot: !msg.isUser,
        date: new Date().toISOString(),
        text: msg.message,
        vote: msg.hasVoted ? (msg.voteType === 'upvote' ? 1 : (msg.voteType === 'downvote' ? -1 : 0)) : 0,
        feedback: msg.feedback || '',
        feedbackfiles: undefined,
        files: undefined,
        media: undefined,
        isStreaming: false,
        sources: msg.sources || [] // ← Add sources
    }))
};

            console.log(' Web App Session Format:', JSON.stringify(webAppSession, null, 2));

            const possibleSaveUrls = [
                'https://tgcsbe.iopex.ai/api/sessions',
                'https://tgcsbe.iopex.ai/sessions',
                'https://tgcsbe.iopex.ai/api/chat/sessions',
                'https://tgcsbe.iopex.ai/chat/sessions',
                'https://tgcsbe.iopex.ai/api/chat/save-session',
                'https://tgcsbe.iopex.ai/chat/save-session',
                'https://tgcsbe.iopex.ai/saveSession',
                'https://tgcsbe.iopex.ai/api/saveSession',
                'https://tgcsbe.iopex.ai/api/conversations',
                'https://tgcsbe.iopex.ai/conversations',
                'https://tgcsbe.iopex.ai/api/user-sessions',
                'https://tgcsbe.iopex.ai/user-sessions',
            ];

            const payloadFormats = [
                webAppSession,
                { session: webAppSession },
                {
                    userId: userId,
                    session: webAppSession
                },
                {
                    sessionId: session.id,
                    userId: userId,
                    label: session.title,
                    creationDate: session.creationDate || session.timestamp,
                    messages: webAppSession.messages
                },
                {
                    id: session.id,
                    user_id: userId,
                    session_name: session.title,
                    created_at: session.creationDate || session.timestamp,
                    updated_at: new Date().toISOString(),
                    messages: webAppSession.messages
                }
            ];

            for (const url of possibleSaveUrls) {
                for (let i = 0; i < payloadFormats.length; i++) {
                    try {
                        console.log(`🔍 Testing session save: ${url} with format ${i + 1}`);

                        const response = await safeFetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json',
                            },
                            body: JSON.stringify(payloadFormats[i])
                        });

                        console.log(`📊 ${url} - Status: ${response.status}`);

                        if (response.ok) {
                            const responseText = await response.text();
                            console.log(` Session saved to backend: ${url} with format ${i + 1}`);
                            console.log(` Save response:`, responseText.substring(0, 300));
                            return true;
                        } else if (response.status === 404) {
                            console.log(` ${url} - Not found (404)`);
                        } else if (response.status === 401) {
                            console.log(` ${url} - Unauthorized (401)`);
                        } else {
                            const errorText = await response.text();
                            console.log(` ${url} - Error: ${response.status} - ${errorText.substring(0, 100)}`);
                        }
                    } catch (error) {
                        console.log(` ${url} - Exception:`, error);
                    }
                }
            }

            console.log(' No working session save endpoint found');
            return false;

        } catch (error) {
            console.error(' Failed to save session to backend:', error);
            return false;
        }
    }, [authContext, getCurrentUserId]);

    const saveVoteToStorage = useCallback(async (messageId: string, messageText: string, voteType: 'upvote' | 'downvote') => {
        try {
            const userId = getCurrentUserId();
            const existingVotesStr = await AsyncStorage.getItem(`user_votes_${userId}`);
            const existingVotes = existingVotesStr ? JSON.parse(existingVotesStr) : [];

            const voteData: VoteData = {
                messageId,
                messageText: messageText.substring(0, 100),
                voteType,
                timestamp: new Date().toISOString(),
                userId
            };

            const filteredVotes = existingVotes.filter((vote: VoteData) => vote.messageId !== messageId);
            filteredVotes.push(voteData);

            await AsyncStorage.setItem(`user_votes_${userId}`, JSON.stringify(filteredVotes));
            console.log(' Vote saved to local storage');

        } catch (error) {
            console.error('Failed to save vote to storage:', error);
        }
    }, [getCurrentUserId]);

    const loadVotesFromStorage = useCallback(async () => {
        try {
            const userId = getCurrentUserId();
            const votesStr = await AsyncStorage.getItem(`user_votes_${userId}`);
            if (votesStr) {
                const votes: VoteData[] = JSON.parse(votesStr);
                console.log(' Loaded votes from storage:', votes.length);

                setMessages(prev => prev.map(msg => {
                    if (!msg.isUser) {
                        const savedVote = votes.find(vote =>
                            vote.messageId === msg.id ||
                            vote.messageText === msg.message.substring(0, 100)
                        );
                        if (savedVote) {
                            return {
                                ...msg,
                                hasVoted: true,
                                voteType: savedVote.voteType
                            };
                        }
                    }
                    return msg;
                }));

                return votes;
            }
        } catch (error) {
            console.error('Failed to load votes from storage:', error);
        }
        return [];
    }, [getCurrentUserId]);

    const saveSessionToStorage = useCallback(async (session: ChatSession) => {
        try {
            if (!hasSessionContent(session.messages)) {
                console.log('⏭️ Skipping storage save - session has no meaningful content');
                return;
            }

            const now = Date.now();
            if (now - lastAutoSaveRef.current < 10000) {
                return;
            }
            lastAutoSaveRef.current = now;

            const userId = getCurrentUserId();
            await AsyncStorage.setItem(`session_${session.id}`, JSON.stringify(session));

            const userSessionsStr = await AsyncStorage.getItem(`user_sessions_${userId}`);
            const userSessions = userSessionsStr ? JSON.parse(userSessionsStr) : [];

            const filteredSessions = userSessions.filter((s: any) => s.id !== session.id);
            filteredSessions.unshift({
                id: session.id,
                title: session.title,
                timestamp: session.timestamp,
                creationDate: session.creationDate,
                userId: session.userId
            });

            const limitedSessions = filteredSessions.slice(0, 50);
            await AsyncStorage.setItem(`user_sessions_${userId}`, JSON.stringify(limitedSessions));
            console.log(' Session saved to storage:', session.title);

        } catch (error) {
            console.error('Failed to save session to storage:', error);
        }
    }, [getCurrentUserId, hasSessionContent]);

    const loadUserSessions = useCallback(async (): Promise<ChatSession[]> => {
        try {
            const userId = getCurrentUserId();
            const userSessionsStr = await AsyncStorage.getItem(`user_sessions_${userId}`);
            if (userSessionsStr) {
                const sessionList = JSON.parse(userSessionsStr);
                console.log(' Found user session list:', sessionList.length);

                const fullSessions: ChatSession[] = [];

                for (const sessionRef of sessionList) {
                    try {
                        const sessionStr = await AsyncStorage.getItem(`session_${sessionRef.id}`);
                        if (sessionStr) {
                            const fullSession = JSON.parse(sessionStr);
                            if (hasSessionContent(fullSession.messages)) {
                                fullSessions.push(fullSession);
                            }
                        }
                    } catch (error) {
                        console.log(`Failed to load session ${sessionRef.id}:`, error);
                    }
                }

                console.log(' Loaded local sessions with content:', fullSessions.length);
                return fullSessions;
            }
        } catch (error) {
            console.error('Failed to load user sessions:', error);
        }
        return [];
    }, [getCurrentUserId, hasSessionContent]);

    const refreshChatHistory = useCallback(async () => {
  try {
    console.log('🔄 Refreshing chat history from backend + local...');
    setError(null);

    const [backendSessions, localSessions] = await Promise.all([
      fetchBackendSessions(), // Use new function
      loadUserSessions()
    ]);

    const allSessions = [...backendSessions, ...localSessions];

    const uniqueSessions = allSessions.filter((session, index, self) =>
      index === self.findIndex(s =>
        s.id === session.id ||
        (s.title === session.title && Math.abs(new Date(s.timestamp).getTime() - new Date(session.timestamp).getTime()) < 60000)
      )
    );

    const validSessions = uniqueSessions.filter(session => hasSessionContent(session.messages));
    validSessions.sort((a, b) => new Date(b.creationDate || b.timestamp).getTime() - new Date(a.creationDate || a.timestamp).getTime());

    console.log(` Total valid sessions: ${validSessions.length} (Backend: ${backendSessions.length}, Local: ${localSessions.length})`);

    setSessions(validSessions);
    console.log(' Chat history refreshed successfully');

  } catch (error) {
    console.error('Failed to refresh chat history:', error);
    setError('Failed to refresh chat history');
  }
}, [fetchBackendSessions, loadUserSessions, hasSessionContent]);


    const enhancedAutoSave = useCallback(async (sessionData: ChatSession) => {
        try {
            if (!hasSessionContent(sessionData.messages)) {
                console.log('⏭️ Skipping auto-save - session has no meaningful content');
                return;
            }

            await saveSessionToStorage(sessionData);

            const backendSaved = await saveSessionToBackend(sessionData);

            if (backendSaved) {
                console.log(' Session saved to BOTH local and backend database');
            } else {
                console.log(' Session saved locally only (backend save failed)');
            }

            setSessions(prev => {
                const filtered = prev.filter(s => s.id !== sessionData.id);
                return [sessionData, ...filtered];
            });

        } catch (error) {
            console.error(' Enhanced auto-save failed:', error);
        }
    }, [saveSessionToStorage, saveSessionToBackend, hasSessionContent]);

    const clearAllUserData = useCallback(async () => {
        try {
            const userId = getCurrentUserId();

            await AsyncStorage.removeItem(`user_votes_${userId}`);

            const userSessionsStr = await AsyncStorage.getItem(`user_sessions_${userId}`);
            if (userSessionsStr) {
                const sessionList = JSON.parse(userSessionsStr);
                for (const sessionRef of sessionList) {
                    await AsyncStorage.removeItem(`session_${sessionRef.id}`);
                }
            }
            await AsyncStorage.removeItem(`user_sessions_${userId}`);
            await AsyncStorage.removeItem('recent_queries');

            setSessions([]);
            setRecentQueries([]);
            setMessages([]);
            setCurrentSessionId(null);
            setSelectedSessionState(null);

            console.log('🗑️ All user data cleared');

        } catch (error) {
            console.error('Failed to clear user data:', error);
        }
    }, [getCurrentUserId]);

    const addMessage = useCallback((message: ChatMessage) => {
        try {
            setMessages(prev => [...prev, message]);
            setError(null);
        } catch (error) {
            console.error('Error adding message:', error);
            setError('Failed to add message');
        }
    }, []);

    const clearMessages = useCallback(() => {
        try {
            setMessages([]);
            setError(null);
        } catch (error) {
            console.error('Error clearing messages:', error);
            setError('Failed to clear messages');
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
        try {
            setMessages(prev => prev.map(msg =>
                msg.id === id ? { ...msg, ...updates } : msg
            ));
        } catch (error) {
            console.error('Error updating message:', error);
            setError('Failed to update message');
        }
    }, []);

    const saveRecentQuery = useCallback(async (queryText: string) => {
        try {
            const newQuery: RecentQuery = {
                id: uuidv4(),
                message: queryText,
                timestamp: new Date().toISOString(),
            };

            const updatedQueries = [newQuery, ...recentQueries]
                .filter((query, index, self) =>
                    index === self.findIndex(q => q.message.toLowerCase() === query.message.toLowerCase())
                )
                .slice(0, 10);

            setRecentQueries(updatedQueries);
            await AsyncStorage.setItem('recent_queries', JSON.stringify(updatedQueries));
            console.log(' Recent query saved:', queryText);
        } catch (error) {
            console.error('Error saving recent query:', error);
        }
    }, [recentQueries]);

    const loadRecentQueries = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem('recent_queries');
            if (stored) {
                const queries = JSON.parse(stored);
                setRecentQueries(queries);
                console.log(' Recent queries loaded:', queries.length);
            }
        } catch (error) {
            console.error('Error loading recent queries:', error);
        }
    }, []);

    const startNewSession = useCallback(() => {
        try {
            if (messages.length >= 2 && currentSessionId && hasSessionContent(messages)) {
                const sessionTitle = messages.find(msg => msg.isUser)?.message.slice(0, 50) || 'New Chat';
                const newSession: ChatSession = {
                    id: currentSessionId,
                    title: sessionTitle,
                    timestamp: new Date().toISOString(),
                    creationDate: new Date().toISOString(),
                    messages: [...messages],
                    userId: getCurrentUserId(),
                    label: sessionTitle
                };

                enhancedAutoSave(newSession);
                setSessions(prev => [newSession, ...prev.filter(s => s.id !== currentSessionId)]);
                console.log(' Session saved with content:', sessionTitle);
            } else {
                console.log('⏭Skipping empty session save - no meaningful content');
            }

            const newSessionId = uuidv4();
            setCurrentSessionId(newSessionId);
            setSelectedSessionState(null);
            clearMessages();
            clearError();
            console.log(' New session started:', newSessionId);
        } catch (error) {
            console.error('Error starting new session:', error);
            setError('Failed to start new session');
        }
    }, [messages, currentSessionId, clearMessages, clearError, getCurrentUserId, enhancedAutoSave, hasSessionContent]);

    const addNewSession = useCallback(() => {
        startNewSession();
    }, [startNewSession]);

    const loadSession = useCallback((sessionId: string) => {
        try {
            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                setCurrentSessionId(sessionId);
                setSelectedSessionState(session);
                setMessages(session.messages);
                clearError();
                loadVotesFromStorage();
                console.log('Session loaded:', session.title);
            } else {
                setError('Session not found');
            }
        } catch (error) {
            console.error('Error loading session:', error);
            setError('Failed to load session');
        }
    }, [sessions, clearError, loadVotesFromStorage]);

    const setSelectedSession = useCallback((sessionId: string) => {
        loadSession(sessionId);
    }, [loadSession]);

const extractSourcesFromText = useCallback((text: string): SourceReference[] => {
  try {
    console.log(' === SOURCE EXTRACTION DEBUG START ===');
    console.log(' Input text length:', text.length);
    console.log(' First 500 chars:', text.substring(0, 500));
    
    const sources: SourceReference[] = [];

    const fullSourcePattern = /(.*?)\s+page\s+(\d+)\s+\[aws_id:\s+(.*?)\]/gi;
    
    let match;

    console.log(' Searching for source patterns (web app style)...');
    
    // Reset regex
    fullSourcePattern.lastIndex = 0;
    
    while ((match = fullSourcePattern.exec(text)) !== null) {
      const filename = match[1].trim();
      const pageNum = match[2];
      const awsLink = match[3].trim();
      
      console.log(' Found source pattern:', {
        filename,
        pageNum,
        awsLink,
        fullMatch: match[0]
      });

      const imageUrl = getImageUrl(awsLink);
      console.log('🖼️ Generated image URL:', imageUrl);

      sources.push({
        filename: filename,
        pages: pageNum,
        awsLink: awsLink,
        url: imageUrl,
        fullMatchText: match[0]
      });
    }

    const awsIdPattern = /\[aws_id:\s*([^\]]+)\]/gi;
    awsIdPattern.lastIndex = 0;
    
    while ((match = awsIdPattern.exec(text)) !== null) {
      const awsLink = match[1].trim();
      
      const existingSource = sources.find(s => s.awsLink === awsLink);
      if (!existingSource) {
        console.log('🆕 Found standalone aws_id:', awsLink);
        
        const parts = awsLink.split('_page_');
        if (parts.length >= 2) {
          const filename = parts[0].replace(/_/g, ' ') + '.pdf';
          const pageNum = parts[1];
          
          console.log(' Extracted info:', { filename, pageNum });

          const imageUrl = getImageUrl(awsLink);
          console.log(' Generated image URL:', imageUrl);

          sources.push({
            filename: filename,
            pages: pageNum,
            awsLink: awsLink,
            url: imageUrl
          });
        }
      }
    }

    console.log(' === FINAL EXTRACTED SOURCES ===');
    sources.forEach((source, index) => {
      console.log(`Source ${index + 1}:`, {
        filename: source.filename,
        pages: source.pages,
        awsLink: source.awsLink,
        url: source.url,
        hasUrl: !!source.url
      });
    });
    console.log(' === SOURCE EXTRACTION DEBUG END ===');
    
    return sources;
  } catch (error) {
    console.error(' Error extracting sources:', error);
    return [];
  }
}, []);

const cleanMessageText = useCallback((text: string, sources: SourceReference[]): string => {
  let cleanedText = text;
  
  // Remove source references from the text
  sources.forEach(source => {
    if (source.fullMatchText) {
      cleanedText = cleanedText.replace(source.fullMatchText, '');
    }
  });
  
  // Clean up extra whitespace and line breaks
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  return cleanedText;
}, []);

const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) {
        console.log('⏭️ Skipping send - empty text or already loading');
        return;
    }

    console.log('===  STARTING SEND MESSAGE ===');
    console.log('Original user text:', text); // 
    
    let isRequestCancelled = false;
    let cleanupFunctions: (() => void)[] = [];
    
    try {
        if (!currentSessionId) {
            const newSessionId = uuidv4();
            setCurrentSessionId(newSessionId);
            console.log('🆕 Created new session:', newSessionId);
        }

        const isSessionValid = await authContext.validateSessionBeforeRequest();
        if (!isSessionValid) {
            setError('Session expired. Please log in again.');
            return;
        }

        if (isRequestCancelled) {
            console.log(' Request was cancelled');
            return;
        }

        setIsLoading(true);
        setError(null);

        await saveRecentQuery(text.trim()); 

        const userMessageId = uuidv4();
        const aiMessageId = uuidv4();
        
        const token = authContext.state.tokens?.access_token;
        if (!token) {
            throw new Error('No authentication token available');
        }

        const userMessage: ChatMessage = {
            id: userMessageId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            message: text, 
            isUser: true,
            sources: [],
            highlight: {
                title: "Your Query",
                rating: 0,
                reviews: 0,
                description: text 
            }
        };

        console.log(' Adding user message:', userMessage.message);
        addMessage(userMessage);

        const aiMessage: ChatMessage = {
            id: aiMessageId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            message: '',
            isUser: false,
            isStreaming: true,
            agentStatus: 'Processing your request...',
            sources: [],
            highlight: {
                title: "AI Response",
                rating: 4.8,
                reviews: 8399,
                description: "Processing your request..."
            }
        };

        addMessage(aiMessage);

        const requestBody = {
            query: text.trim(), 
            qid: aiMessageId,
            uid: getCurrentUserId(),
            sid: currentSessionId || APP_SESSION_ID,
            messages: messages.filter(msg => !msg.isStreaming).map(msg => ({
                content: msg.message, 
                isBot: !msg.isUser
            })),
            collection: 'chatbot'
        };

        console.log('📡 Request body query:', requestBody.query); 

        const chatUrl = getChatApiUrl('/run');
        console.log('📡 Sending chat request to:', chatUrl);

        // Status polling setup (unchanged)
        let statusInterval: NodeJS.Timeout | null = null;
        
        const startStatusPolling = () => {
            const statusUrl = getChatApiUrl(`/currentStatus?uid=${requestBody.uid}&sid=${currentSessionId || APP_SESSION_ID}`);
            
            statusInterval = setInterval(async () => {
                if (isRequestCancelled) {
                    if (statusInterval) {
                        clearInterval(statusInterval);
                        statusInterval = null;
                    }
                    return;
                }

                try {
                    const statusController = new AbortController();
                    const statusTimeoutId = setTimeout(() => statusController.abort(), 5000);
                    
                    const statusResponse = await safeFetch(statusUrl, {
                        signal: statusController.signal
                    });
                    
                    clearTimeout(statusTimeoutId);
                    
                    if (statusResponse.ok) {
                        const statusText = await statusResponse.text();
                        
                        try {
                            const lines = statusText.split('\n');
                            for (const line of lines) {
                                if (line.startsWith('data: ') && !isRequestCancelled) {
                                    const data = JSON.parse(line.substring(6));
                                    if (data.status) {
                                        updateMessage(aiMessageId, {
                                            agentStatus: data.status,
                                            isStreaming: true
                                        });
                                    }
                                }
                            }
                        } catch (parseError) {
                        }
                    }
                } catch (statusError) {
                }
            }, 3000);
        };

        const stopStatusPolling = () => {
            if (statusInterval) {
                clearInterval(statusInterval);
                statusInterval = null;
                console.log(' Status polling stopped');
            }
        };

        cleanupFunctions.push(stopStatusPolling);
        startStatusPolling();

        // API call
        const abortController = new AbortController();
        cleanupFunctions.push(() => {
            isRequestCancelled = true;
            abortController.abort();
        });

        const response = await safeApiCall(async () => {
            const res = await safeFetch(chatUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
                signal: abortController.signal
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.log(' Chat API error response:', errorText);
                throw new Error(`HTTP ${res.status}: ${errorText || 'Chat request failed'}`);
            }

            return res;
        });

        if (isRequestCancelled) {
            console.log(' Request cancelled, stopping...');
            return;
        }

        console.log(' Chat response received');

        const responseText = await response.text();
        console.log(' AI response length:', responseText.length);

        let fullMessage = '';

        if (responseText && !isRequestCancelled) {
            try {
                const jsonResponse = JSON.parse(responseText);
                fullMessage = jsonResponse.message || jsonResponse.response || jsonResponse.text || responseText;
            } catch {
                fullMessage = responseText;
            }

            // Streaming animation
            const words = fullMessage.split(' ');
            for (let i = 0; i < words.length && !isRequestCancelled; i += 3) {
                const chunk = words.slice(0, i + 3).join(' ');
                updateMessage(aiMessageId, {
                    message: chunk,
                    isStreaming: true
                });

                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        stopStatusPolling();

        if (!isRequestCancelled) {
            const extractedSources = extractSourcesFromText(fullMessage);
            const cleanedAIMessage = cleanMessageText(fullMessage, extractedSources);
            
            console.log(' Final AI message:', cleanedAIMessage); 
            
            updateMessage(aiMessageId, {
                message: cleanedAIMessage, 
                agentStatus: undefined,
                sources: extractedSources,
                highlight: {
                    title: "AI Response",
                    rating: 4.8,
                    reviews: 8399,
                    description: "Response completed"
                }
            });

            console.log('Message processing completed successfully');
            
            console.log(' Final messages in context:');
            messages.forEach((msg, index) => {
                console.log(`Message ${index}: ${msg.isUser ? 'USER' : 'AI'} - "${msg.message}"`);
            });
        }

    } catch (error) {
        console.error(' Send message error:', error);

        cleanupFunctions.forEach(cleanup => {
            try {
                cleanup();
            } catch (err) {
                // Ignore cleanup errors
            }
        });

        if (!isRequestCancelled) {
            let errorMessage = 'Failed to get response';
            
            if (error instanceof Error) {
                if (error.message.includes('Session expired')) {
                    errorMessage = 'Your session has expired. Please log in again.';
                } else if (error.message.includes('Network request failed')) {
                    errorMessage = 'Cannot connect to server. Please check your internet connection.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Request timed out. Please try again.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            setError(errorMessage);

            const streamingAiMessages = messages.filter(msg => !msg.isUser && msg.isStreaming);
            if (streamingAiMessages.length > 0) {
                updateMessage(streamingAiMessages[0].id, {
                    message: `Error: ${errorMessage}`,
                    isStreaming: false,
                    agentStatus: undefined,
                    sources: [],
                    highlight: {
                        title: "Error",
                        rating: 0,
                        reviews: 0,
                        description: "Failed to get response"
                    }
                });
            }
        }
    } finally {
        cleanupFunctions.forEach(cleanup => {
            try {
                cleanup();
            } catch (err) {
                // Ignore cleanup errors
            }
        });
        
        setIsLoading(false);
    }
}, [
    messages, 
    isLoading, 
    addMessage, 
    updateMessage, 
    authContext, 
    currentSessionId, 
    saveRecentQuery, 
    getCurrentUserId, 
    extractSourcesFromText,
    cleanMessageText
]);

const submitVote = useCallback(async (messageText: string, voteType: 'upvote' | 'downvote') => {
  try {
    console.log(` Submitting ${voteType} for message`);

    const isSessionValid = await authContext.validateSessionBeforeRequest();
    if (!isSessionValid) {
      throw new Error('Session expired. Please log in again.');
    }

    const token = authContext.state.tokens?.access_token;

    const aiMessage = messages.find(msg =>
      !msg.isUser && msg.message === messageText
    );

    if (!aiMessage) {
      throw new Error('Message not found for voting');
    }

    const voteUrl = `${API_CONFIG.CHAT_API_BASE_URL}/vote`;

    const votePayload = {
      message_id: aiMessage.id, // Use the message ID that matches backend qid
      user_id: getCurrentUserId(),
      vote: voteType === 'upvote' ? 1 : -1,
      session_id: currentSessionId || APP_SESSION_ID // Use proper session ID
    };

    console.log('Vote payload:', JSON.stringify(votePayload, null, 2));

    const response = await safeFetch(voteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(votePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(' Vote failed:', response.status, '-', errorText);
      throw new Error(`Vote submission failed: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log(' Vote SUCCESS! Response:', responseText);

    setMessages(prev => prev.map(msg =>
      msg.message === messageText && !msg.isUser ? {
        ...msg,
        hasVoted: true,
        voteType: voteType
      } : msg
    ));

    await saveVoteToStorage(aiMessage.id, messageText, voteType);

    console.log(` ${voteType} submitted successfully`);
    clearError();

  } catch (error) {
    console.error(' Vote submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit vote';
    setError(errorMessage);
    throw new Error(errorMessage);
  }
}, [authContext, clearError, messages, currentSessionId, getCurrentUserId, saveVoteToStorage]);

const submitFeedback = useCallback(async (messageText: string, feedback: any) => {
    try {
        console.log(' Submitting feedback for message');

        const isSessionValid = await authContext.validateSessionBeforeRequest();
        if (!isSessionValid) {
            throw new Error('Session expired. Please log in again.');
        }

        const token = authContext.state.tokens?.access_token;

        const aiMessage = messages.find(msg =>
            !msg.isUser && msg.message === messageText
        );

        if (!aiMessage) {
            throw new Error('Message not found for feedback');
        }

        const feedbackUrl = `${API_CONFIG.CHAT_API_BASE_URL}/feedback`;

        // Extract just the feedback text
        let feedbackText = '';
        if (typeof feedback === 'string') {
            feedbackText = feedback;
        } else if (feedback && typeof feedback === 'object' && feedback.feedback) {
            feedbackText = feedback.feedback;
        } else {
            feedbackText = String(feedback || '');
        }

        const requestBody = {
            message_id: aiMessage.id,
            user_id: getCurrentUserId(),
            feedback: feedbackText, // ← Just the text, not JSON
            session_id: currentSessionId || APP_SESSION_ID
        };

        console.log('📝 Feedback request body:', JSON.stringify(requestBody, null, 2));

        const response = await safeFetch(feedbackUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log(' Feedback error response:', errorText);
            throw new Error(`Feedback submission failed: ${response.status} - ${errorText}`);
        }

        const responseText = await response.text();
        console.log(' Feedback response body:', responseText);

        setMessages(prev => prev.map(msg =>
            msg.message === messageText && !msg.isUser ? {
                ...msg,
                feedback: feedbackText // ← Store just the text
            } : msg
        ));

        console.log(' Feedback submitted successfully');
        clearError();

    } catch (error) {
        console.error('Feedback submission error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
        setError(errorMessage);
        throw new Error(errorMessage);
    }
}, [authContext, clearError, messages, currentSessionId, getCurrentUserId]);
    const testNetwork = useCallback(async () => {
        console.log(' Starting network connectivity test...');
        setError(null);

        try {
            await testNetworkConnections();
            console.log(' Network test completed');
        } catch (error) {
            console.error(' Network test failed:', error);
            setError('Network connectivity test failed. Check your internet connection.');
        }
    }, []);

    // ✅ CRITICAL: Crash-proof initialization
    useEffect(() => {
        let isMounted = true;
        let initTimeout: NodeJS.Timeout | null = null;
        
        const initializeApp = async () => {
            // Prevent multiple rapid initializations
            if (!authContext.state.isAuthenticated || !isMounted) {
                console.log('⏭️ Skipping initialization - not authenticated or unmounted');
                return;
            }

            console.log(' ChatProvider initializing (single instance)...');

            try {
                // Add delay to prevent race conditions
                await new Promise(resolve => {
                    initTimeout = setTimeout(resolve, 100);
                });
                
                if (!isMounted) return;

                await Promise.all([
                    cleanupEmptySessions(),
                    loadRecentQueries(),
                    refreshChatHistory(),
                    loadVotesFromStorage()
                ]);

                if (isMounted) {
                    console.log(' All user data loaded successfully');
                }
            } catch (error) {
                if (isMounted) {
                    console.error(' Failed to load user data:', error);
                    setError('Failed to load user data');
                }
            }
        };

        // Debounce initialization to prevent multiple calls
        const debounceTimeout = setTimeout(() => {
            if (isMounted) {
                initializeApp();
            }
        }, 200);

        return () => {
            isMounted = false;
            if (initTimeout) {
                clearTimeout(initTimeout);
            }
            clearTimeout(debounceTimeout);
        };
    }, [authContext.state.isAuthenticated]);

    // ✅ FIXED: Only auto-save sessions with meaningful content
    useEffect(() => {
        if (messages.length >= 2 && currentSessionId && authContext.state.isAuthenticated && hasSessionContent(messages)) {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }

            autoSaveTimerRef.current = setTimeout(async () => {
                try {
                    const sessionTitle = messages.find(msg => msg.isUser)?.message.slice(0, 50) || 'Chat Session';
                    const sessionData: ChatSession = {
                        id: currentSessionId,
                        title: sessionTitle,
                        timestamp: new Date().toISOString(),
                        creationDate: new Date().toISOString(),
                        messages: messages,
                        userId: getCurrentUserId(),
                        label: sessionTitle
                    };

                    await enhancedAutoSave(sessionData);

                    console.log('Session auto-saved with meaningful content:', sessionTitle);
                } catch (error) {
                    console.error(' Failed to auto-save session:', error);
                }
            }, 15000);

            return () => {
                if (autoSaveTimerRef.current) {
                    clearTimeout(autoSaveTimerRef.current);
                }
            };
        } else if (messages.length > 0) {
            console.log('⏭Skipping auto-save - session lacks meaningful content');
        }
    }, [messages, currentSessionId, authContext.state.isAuthenticated, getCurrentUserId, enhancedAutoSave, hasSessionContent]);

    useEffect(() => {
        if (messages.length > 0 && authContext.state.isAuthenticated) {
            loadVotesFromStorage();
        }
    }, [messages.length, authContext.state.isAuthenticated, loadVotesFromStorage]);

    useEffect(() => {
        if (!authContext.state.isAuthenticated) {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }
            if (statusPollingRef.current) {
                clearInterval(statusPollingRef.current);
                statusPollingRef.current = null;
            }

            setSessions([]);
            setRecentQueries([]);
            setMessages([]);
            setCurrentSessionId(null);
            setSelectedSessionState(null);
            setError(null);
            setIsLoading(false);

            console.log('🧹 Cleared in-memory chat data and timers on logout');
        }
    }, [authContext.state.isAuthenticated]);

    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            if (statusPollingRef.current) {
                clearInterval(statusPollingRef.current);
            }
        };
    }, []);

    return (
    <ChatContext.Provider value={{
        messages,
        sessions,
        recentQueries,
        currentSessionId,
        selectedSession,
        addMessage,
        clearMessages,
        sendMessage,
        submitVote,
        submitFeedback,
        isLoading,
        startNewSession,
        loadSession,
        setSelectedSession,
        error,
        clearError,
        testNetwork,
        loadUserSessions,
        refreshChatHistory,
        clearAllUserData,
        addNewSession,
        cleanupEmptySessions,
        getCurrentUserId, // ← Add this line
        enhancedAutoSave, // ← Add this line
        hasSessionContent, // ← Add this line
    }}>
        {children}
    </ChatContext.Provider>
);
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};