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
const APP_SESSION_ID = 'session-' + uuidv4();

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
            console.error('🚨 Safe API Call Error:', error);
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
    }, []); // 12

    const getCurrentUserId = useCallback(() => {
        const userData = authContext.state.user;
        return String((userData as any)?.id || (userData as any)?.user_id || "7");
    }, [authContext]); // 13

    const fetchChatHistoryFromBackend = useCallback(async (): Promise<ChatSession[]> => {
        try {
            console.log('🌐 Fetching chat history from backend...');
            
            const token = authContext.state.tokens?.access_token;
            const userId = getCurrentUserId();
            
            if (!token) {
                console.log('❌ No token available for chat history');
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
                    console.log(`🔍 Testing chat history endpoint: ${url}`);
                    
                    const response = await safeFetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    });

                    console.log(`📊 ${url} - Status: ${response.status}`);

                    if (response.ok) {
                        const responseText = await response.text();
                        console.log(`✅ Found working endpoint: ${url}`);
                        console.log(`📄 Response preview:`, responseText.substring(0, 300));
                        
                        try {
                            const chatHistory = JSON.parse(responseText);
                            console.log(`🎉 Successfully parsed chat history from backend`);
                            
                            const convertedSessions = convertBackendChatHistory(chatHistory, userId);
                            console.log(`✅ Converted ${convertedSessions.length} sessions from backend`);
                            
                            return convertedSessions;
                        } catch (parseError) {
                            console.log(`⚠️ Could not parse JSON from ${url}:`, parseError);
                            continue;
                        }
                    } else if (response.status === 404) {
                        console.log(`❌ ${url} - Not found (404)`);
                    } else if (response.status === 401) {
                        console.log(`❌ ${url} - Unauthorized (401)`);
                    } else {
                        console.log(`❌ ${url} - Error: ${response.status}`);
                    }
                } catch (error) {
                    console.log(`💥 ${url} - Exception:`, error);
                }
            }
            
            console.log('❌ No working chat history endpoint found');
            return [];
            
        } catch (error) {
            console.error('❌ Failed to fetch chat history from backend:', error);
            return [];
        }
    }, [authContext, getCurrentUserId]); // 14

    const convertBackendChatHistory = useCallback((backendData: any, userId: string): ChatSession[] => {
        try {
            console.log('🔄 Converting backend chat history format...');
            
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
                console.log('⚠️ Unexpected backend format, trying to convert single object');
                chatArray = [backendData];
            }

            if (!Array.isArray(chatArray)) {
                console.log('❌ Backend data is not convertible to array:', chatArray);
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

            convertedSessions.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());

            console.log(`✅ Converted ${convertedSessions.length} chat sessions from backend`);
            return convertedSessions;
            
        } catch (error) {
            console.error('❌ Error converting backend chat history:', error);
            return [];
        }
    }, []); // 15

    const saveSessionToBackend = useCallback(async (session: ChatSession) => {
        try {
            console.log('💾 Saving session to backend database (Web App Compatible)...');
            
            const token = authContext.state.tokens?.access_token;
            const userId = getCurrentUserId();
            
            if (!token) {
                console.log('❌ No token for backend session save');
                return false;
            }

            const webAppSession: WebAppSessionObject = {
                id: session.id,
                label: session.title,
                creationDate: session.creationDate || session.timestamp,
                messages: session.messages.map(msg => ({
                    id: msg.id,
                    userName: userId,
                    isBot: !msg.isUser,
                    date: new Date().toISOString(),
                    text: msg.message,
                    vote: msg.hasVoted ? (msg.voteType === 'upvote' ? 1 : (msg.voteType === 'downvote' ? -1 : 0)) : 0,
                    feedback: msg.feedback || '',
                    feedbackfiles: undefined,
                    files: undefined,
                    media: undefined,
                    isStreaming: false
                }))
            };

            console.log('📤 Web App Session Format:', JSON.stringify(webAppSession, null, 2));

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
                            console.log(`✅ Session saved to backend: ${url} with format ${i + 1}`);
                            console.log(`📄 Save response:`, responseText.substring(0, 300));
                            return true;
                        } else if (response.status === 404) {
                            console.log(`❌ ${url} - Not found (404)`);
                        } else if (response.status === 401) {
                            console.log(`❌ ${url} - Unauthorized (401)`);
                        } else {
                            const errorText = await response.text();
                            console.log(`❌ ${url} - Error: ${response.status} - ${errorText.substring(0, 100)}`);
                        }
                    } catch (error) {
                        console.log(`💥 ${url} - Exception:`, error);
                    }
                }
            }
            
            console.log('❌ No working session save endpoint found');
            return false;
            
        } catch (error) {
            console.error('❌ Failed to save session to backend:', error);
            return false;
        }
    }, [authContext, getCurrentUserId]); // 16

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
            console.log('💾 Vote saved to local storage');
            
        } catch (error) {
            console.error('Failed to save vote to storage:', error);
        }
    }, [getCurrentUserId]); // 17

    const loadVotesFromStorage = useCallback(async () => {
        try {
            const userId = getCurrentUserId();
            const votesStr = await AsyncStorage.getItem(`user_votes_${userId}`);
            if (votesStr) {
                const votes: VoteData[] = JSON.parse(votesStr);
                console.log('📥 Loaded votes from storage:', votes.length);
                
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
    }, [getCurrentUserId]); // 18

    const saveSessionToStorage = useCallback(async (session: ChatSession) => {
        try {
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
            console.log('💾 Session saved to storage:', session.title);
            
        } catch (error) {
            console.error('Failed to save session to storage:', error);
        }
    }, [getCurrentUserId]); // 19

    const loadUserSessions = useCallback(async (): Promise<ChatSession[]> => {
        try {
            const userId = getCurrentUserId();
            const userSessionsStr = await AsyncStorage.getItem(`user_sessions_${userId}`);
            if (userSessionsStr) {
                const sessionList = JSON.parse(userSessionsStr);
                console.log('📥 Found user session list:', sessionList.length);
                
                const fullSessions: ChatSession[] = [];
                
                for (const sessionRef of sessionList) {
                    try {
                        const sessionStr = await AsyncStorage.getItem(`session_${sessionRef.id}`);
                        if (sessionStr) {
                            const fullSession = JSON.parse(sessionStr);
                            fullSessions.push(fullSession);
                        }
                    } catch (error) {
                        console.log(`Failed to load session ${sessionRef.id}:`, error);
                    }
                }
                
                console.log('✅ Loaded local sessions:', fullSessions.length);
                return fullSessions;
            }
        } catch (error) {
            console.error('Failed to load user sessions:', error);
        }
        return [];
    }, [getCurrentUserId]); // 20

    const refreshChatHistory = useCallback(async () => {
        try {
            console.log('🔄 Refreshing chat history from backend + local...');
            setError(null);
            
            const [backendSessions, localSessions] = await Promise.all([
                fetchChatHistoryFromBackend(),
                loadUserSessions()
            ]);
            
            const allSessions = [...backendSessions, ...localSessions];
            
            const uniqueSessions = allSessions.filter((session, index, self) => 
                index === self.findIndex(s => 
                    s.id === session.id || 
                    (s.title === session.title && Math.abs(new Date(s.timestamp).getTime() - new Date(session.timestamp).getTime()) < 60000)
                )
            );
            
            uniqueSessions.sort((a, b) => new Date(b.creationDate || b.timestamp).getTime() - new Date(a.creationDate || a.timestamp).getTime());
            
            console.log(`📊 Total sessions: ${uniqueSessions.length} (Backend: ${backendSessions.length}, Local: ${localSessions.length})`);
            
            setSessions(uniqueSessions);
            console.log('✅ Chat history refreshed successfully');
            
        } catch (error) {
            console.error('❌ Failed to refresh chat history:', error);
            setError('Failed to refresh chat history');
        }
    }, [fetchChatHistoryFromBackend, loadUserSessions]); // 21

    const enhancedAutoSave = useCallback(async (sessionData: ChatSession) => {
        try {
            await saveSessionToStorage(sessionData);
            
            const backendSaved = await saveSessionToBackend(sessionData);
            
            if (backendSaved) {
                console.log('✅ Session saved to BOTH local and backend database');
            } else {
                console.log('⚠️ Session saved locally only (backend save failed)');
            }
            
            setSessions(prev => {
                const filtered = prev.filter(s => s.id !== sessionData.id);
                return [sessionData, ...filtered];
            });
            
        } catch (error) {
            console.error('❌ Enhanced auto-save failed:', error);
        }
    }, [saveSessionToStorage, saveSessionToBackend]); // 22

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
    }, [getCurrentUserId]); // 23

    const addMessage = useCallback((message: ChatMessage) => {
        try {
            setMessages(prev => [...prev, message]);
            setError(null);
        } catch (error) {
            console.error('Error adding message:', error);
            setError('Failed to add message');
        }
    }, []); // 24

    const clearMessages = useCallback(() => {
        try {
            setMessages([]);
            setError(null);
        } catch (error) {
            console.error('Error clearing messages:', error);
            setError('Failed to clear messages');
        }
    }, []); // 25

    const clearError = useCallback(() => {
        setError(null);
    }, []); // 26

    const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
        try {
            setMessages(prev => prev.map(msg => 
                msg.id === id ? { ...msg, ...updates } : msg
            ));
        } catch (error) {
            console.error('Error updating message:', error);
            setError('Failed to update message');
        }
    }, []); // 27

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
            console.log('✅ Recent query saved:', queryText);
        } catch (error) {
            console.error('Error saving recent query:', error);
        }
    }, [recentQueries]); // 28

    const loadRecentQueries = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem('recent_queries');
            if (stored) {
                const queries = JSON.parse(stored);
                setRecentQueries(queries);
                console.log('✅ Recent queries loaded:', queries.length);
            }
        } catch (error) {
            console.error('Error loading recent queries:', error);
        }
    }, []); // 29

    const startNewSession = useCallback(() => {
        try {
            if (messages.length > 0 && currentSessionId) {
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
                console.log('✅ Session saved:', sessionTitle);
            }
            
            const newSessionId = uuidv4();
            setCurrentSessionId(newSessionId);
            setSelectedSessionState(null);
            clearMessages();
            clearError();
            console.log('✅ New session started:', newSessionId);
        } catch (error) {
            console.error('Error starting new session:', error);
            setError('Failed to start new session');
        }
    }, [messages, currentSessionId, clearMessages, clearError, getCurrentUserId, enhancedAutoSave]); // 30

    const addNewSession = useCallback(() => {
        startNewSession();
    }, [startNewSession]); // 31

    const loadSession = useCallback((sessionId: string) => {
        try {
            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                setCurrentSessionId(sessionId);
                setSelectedSessionState(session);
                setMessages(session.messages);
                clearError();
                loadVotesFromStorage();
                console.log('✅ Session loaded:', session.title);
            } else {
                setError('Session not found');
            }
        } catch (error) {
            console.error('Error loading session:', error);
            setError('Failed to load session');
        }
    }, [sessions, clearError, loadVotesFromStorage]); // 32

    const setSelectedSession = useCallback((sessionId: string) => {
        loadSession(sessionId);
    }, [loadSession]); // 33

    const extractSourcesFromText = useCallback((text: string): SourceReference[] => {
        try {
            const sources: SourceReference[] = [];
            
            const awsIdPattern = /\[aws_id:\s*([^\]]+)\]/g;
            let match;
            
            while ((match = awsIdPattern.exec(text)) !== null) {
                const awsLink = match[1].trim();
                const parts = awsLink.split('_page_');
                if (parts.length >= 2) {
                    const filename = parts[0].replace(/_/g, ' ');
                    const pageNum = parts[1];
                    
                    sources.push({
                        filename: filename,
                        pages: pageNum,
                        awsLink: awsLink,
                        url: getImageUrl(awsLink)
                    });
                }
            }
            
            const sourcePattern = /Source:\s*([^[]+)\[aws_id:\s*([^\]]+)\]/g;
            while ((match = sourcePattern.exec(text)) !== null) {
                const sourceText = match[1].trim();
                const awsLink = match[2].trim();
                
                const pageMatch = sourceText.match(/(.+?)\s+page\s+(\d+)/i);
                if (pageMatch) {
                    const filename = pageMatch[1].trim();
                    const pageNum = pageMatch[2];
                    
                    const existingSource = sources.find(s => s.awsLink === awsLink);
                    if (!existingSource) {
                        sources.push({
                            filename: filename,
                            pages: pageNum,
                            awsLink: awsLink,
                            url: getImageUrl(awsLink)
                        });
                    }
                }
            }
            
            console.log('📋 Extracted sources:', sources);
            return sources;
        } catch (error) {
            console.error('Error extracting sources:', error);
            return [];
        }
    }, []); // 34

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) {
            console.log('⏭️ Skipping send - empty text or already loading');
            return;
        }

        console.log('=== 🚀 STARTING SEND MESSAGE ===');
        console.log('📝 Message text:', text);

        try {
            if (!currentSessionId) {
                const newSessionId = uuidv4();
                setCurrentSessionId(newSessionId);
                console.log('🆕 Created new session:', newSessionId);
            }

            const isSessionValid = await authContext.validateSessionBeforeRequest();
            if (!isSessionValid) {
                throw new Error('Session expired. Please log in again.');
            }

            setIsLoading(true);
            setError(null);

            await saveRecentQuery(text);

            const userMessage: ChatMessage = {
                id: uuidv4(),
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

            addMessage(userMessage);

            const aiMessageId = uuidv4();
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

            const token = authContext.state.tokens?.access_token;

            if (!token) {
                throw new Error('No authentication token available');
            }

            const requestBody = {
                query: text,
                qid: uuidv4(),
                uid: getCurrentUserId(),
                sid: APP_SESSION_ID,
                messages: messages.filter(msg => !msg.isStreaming).map(msg => ({
                    content: msg.message,
                    isBot: !msg.isUser
                })),
                collection: 'chatbot'
            };

            const chatUrl = getChatApiUrl('/run');
            console.log('📡 Sending chat request to:', chatUrl);

            const startStatusPolling = () => {
                const statusUrl = getChatApiUrl(`/currentStatus?uid=${requestBody.uid}&sid=${APP_SESSION_ID}`);
                
                statusPollingRef.current = setInterval(async () => {
                    try {
                        const statusResponse = await safeFetch(statusUrl);
                        if (statusResponse.ok) {
                            const statusText = await statusResponse.text();
                            
                            const lines = statusText.split('\n');
                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    try {
                                        const data = JSON.parse(line.substring(6));
                                        if (data.status) {
                                            updateMessage(aiMessageId, {
                                                agentStatus: data.status,
                                                isStreaming: true
                                            });
                                        }
                                    } catch (parseError) {
                                        console.log('⚠️ Status parse error (normal):', parseError);
                                    }
                                }
                            }
                        }
                    } catch (statusError) {
                        console.log('⚠️ Status polling error:', statusError);
                    }
                }, 3000);
            };

            const stopStatusPolling = () => {
                if (statusPollingRef.current) {
                    clearInterval(statusPollingRef.current);
                    statusPollingRef.current = null;
                    console.log('🛑 Status polling stopped');
                }
            };

            startStatusPolling();

            const response = await safeApiCall(async () => {
                const res = await safeFetch(chatUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.log('❌ Chat API error response:', errorText);
                    throw new Error(`HTTP ${res.status}: ${errorText || 'Chat request failed'}`);
                }

                return res;
            });

            console.log('✅ Chat response received');
            
            const responseText = await response.text();
            console.log('📝 Full response length:', responseText.length);

            let fullMessage = '';
            let extractedSources: SourceReference[] = [];

            if (responseText) {
                try {
                    const jsonResponse = JSON.parse(responseText);
                    fullMessage = jsonResponse.message || jsonResponse.response || jsonResponse.text || responseText;
                } catch {
                    fullMessage = responseText;
                }

                extractedSources = extractSourcesFromText(fullMessage);
                
                const words = fullMessage.split(' ');
                for (let i = 0; i < words.length; i += 3) {
                    const chunk = words.slice(0, i + 3).join(' ');
                    updateMessage(aiMessageId, {
                        message: chunk,
                        isStreaming: true
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            stopStatusPolling();

            updateMessage(aiMessageId, {
                message: fullMessage,
                isStreaming: false,
                agentStatus: undefined,
                sources: extractedSources,
                highlight: {
                    title: "AI Response",
                    rating: 4.8,
                    reviews: 8399,
                    description: "Response completed"
                }
            });

            console.log('✅ Message processing completed successfully');

        } catch (error) {
            console.error('❌ Send message error:', error);
            
            if (statusPollingRef.current) {
                clearInterval(statusPollingRef.current);
                statusPollingRef.current = null;
            }
            
            const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
            setError(errorMessage);
            
            const aiMessages = messages.filter(msg => !msg.isUser && msg.isStreaming);
            if (aiMessages.length > 0) {
                updateMessage(aiMessages[0].id, {
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
        } finally {
            setIsLoading(false);
        }
    }, [messages, isLoading, addMessage, updateMessage, authContext, currentSessionId, saveRecentQuery, getCurrentUserId, extractSourcesFromText]); // 35


const submitVote = useCallback(async (messageText: string, voteType: 'upvote' | 'downvote') => {
    try {
        console.log(`🗳️ Submitting ${voteType} for message`);
        
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

        const voteUrl = 'https://tgcsbe.iopex.ai/vote';
        
        const votePayload = {
            message_id: aiMessage.id,                    
            user_id: getCurrentUserId(),                 
            vote: voteType === 'upvote' ? 1 : -1,       
            session_id: currentSessionId || APP_SESSION_ID 
        };

        console.log('🗳️ Vote payload (exact web app format):', JSON.stringify(votePayload, null, 2));

        const response = await fetch(voteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: JSON.stringify(votePayload),
        });

        console.log('🗳️ Vote response status:', response.status);

        if (response.ok) {
            const responseText = await response.text();
            console.log('✅ Vote SUCCESS! Response:', responseText);

            setMessages(prev => prev.map(msg => 
                msg.message === messageText && !msg.isUser ? {
                    ...msg,
                    hasVoted: true,
                    voteType: voteType
                } : msg
            ));

            await saveVoteToStorage(aiMessage.id, messageText, voteType);

            console.log(`✅ ${voteType} submitted successfully`);
            clearError();
            
        } else {
            const errorText = await response.text();
            console.log('❌ Vote failed:', response.status, '-', errorText);
            throw new Error(`Vote submission failed: ${response.status} - ${errorText}`);
        }

    } catch (error) {
        console.error('❌ Vote submission error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit vote';
        setError(errorMessage);
        throw new Error(errorMessage);
    }
}, [authContext, clearError, messages, currentSessionId, getCurrentUserId, saveVoteToStorage]); // 36

    const submitFeedback = useCallback(async (messageText: string, feedback: any) => {
        try {
            console.log('📝 Submitting feedback for message');
            
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

            const feedbackUrl = 'https://tgcsbe.iopex.ai/feedback';

            const requestBody = {
                message_id: aiMessage.id,
                user_id: getCurrentUserId(),
                feedback: typeof feedback === 'string' ? feedback : JSON.stringify(feedback),
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
                console.log('❌ Feedback error response:', errorText);
                throw new Error(`Feedback submission failed: ${response.status} - ${errorText}`);
            }

            const responseText = await response.text();
            console.log('✅ Feedback response body:', responseText);

            setMessages(prev => prev.map(msg => 
                msg.message === messageText && !msg.isUser ? {
                    ...msg,
                    feedback: feedback
                } : msg
            ));

            console.log('✅ Feedback submitted successfully');
            clearError();

        } catch (error) {
            console.error('❌ Feedback submission error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [authContext, clearError, messages, currentSessionId, getCurrentUserId]); // 37

    const testNetwork = useCallback(async () => {
        console.log('🧪 Starting network connectivity test...');
        setError(null);
        
        try {
            await testNetworkConnections();
            console.log('✅ Network test completed');
        } catch (error) {
            console.error('❌ Network test failed:', error);
            setError('Network connectivity test failed. Check your internet connection.');
        }
    }, []); // 38

    useEffect(() => {
        const initializeApp = async () => {
            if (!authContext.state.isAuthenticated) {
                console.log('⏭️ Skipping initialization - user not authenticated');
                return;
            }

            console.log('🚀 ChatProvider initializing with backend integration...');
            
            try {
                await Promise.all([
                    loadRecentQueries(),
                    refreshChatHistory(),
                    loadVotesFromStorage()
                ]);
                
                console.log('✅ All user data loaded successfully');
            } catch (error) {
                console.error('❌ Failed to load user data:', error);
                setError('Failed to load user data');
            }
            
            console.log('📱 App Session ID:', APP_SESSION_ID);
        };

        initializeApp();
    }, [authContext.state.isAuthenticated, loadRecentQueries, refreshChatHistory, loadVotesFromStorage]); // 39

    useEffect(() => {
        if (messages.length > 0 && currentSessionId && authContext.state.isAuthenticated) {
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
                    
                    console.log('💾 Session auto-saved with backend integration:', sessionTitle);
                } catch (error) {
                    console.error('❌ Failed to auto-save session:', error);
                }
            }, 15000);

            return () => {
                if (autoSaveTimerRef.current) {
                    clearTimeout(autoSaveTimerRef.current);
                }
            };
        }
    }, [messages, currentSessionId, authContext.state.isAuthenticated, getCurrentUserId, enhancedAutoSave]); // 40

    useEffect(() => {
        if (messages.length > 0 && authContext.state.isAuthenticated) {
            loadVotesFromStorage();
        }
    }, [messages.length, authContext.state.isAuthenticated, loadVotesFromStorage]); // 41

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
    }, [authContext.state.isAuthenticated]); // 42

    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            if (statusPollingRef.current) {
                clearInterval(statusPollingRef.current);
            }
        };
    }, []); // 43

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