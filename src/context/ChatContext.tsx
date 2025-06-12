import { createContext, ReactNode, useContext, useState, useCallback, useEffect } from "react";
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

// Create a persistent session ID that stays the same for the app session
const APP_SESSION_ID = 'session-' + uuidv4();

export interface ChatMessage {
    id: string;
    time: string;
    message: string;
    isUser: boolean;
    isStreaming?: boolean;
    agentStatus?: string;
    sources?: SourceReference[]; // Use SourceReference[] to match MessageCard
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

type ChatContextType = {
    messages: ChatMessage[];
    sessions: ChatSession[];
    recentQueries: RecentQuery[];
    currentSessionId: string | null;
    addMessage: (message: ChatMessage) => void;
    clearMessages: () => void;
    sendMessage: (text: string) => Promise<void>;
    submitVote: (messageText: string, voteType: 'upvote' | 'downvote') => Promise<void>;
    submitFeedback: (messageText: string, feedback: any) => Promise<void>;
    isLoading: boolean;
    startNewSession: () => void;
    loadSession: (sessionId: string) => void;
    error: string | null;
    clearError: () => void;
    testNetwork: () => Promise<void>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const authContext = useAuth();

    // Enhanced API call wrapper with better error handling
    const safeApiCall = async (apiCall: () => Promise<any>, fallbackError = 'API call failed') => {
        try {
            return await apiCall();
        } catch (error) {
            console.error('🚨 Safe API Call Error:', error);
            
            let errorMessage = fallbackError;
            
            if (error instanceof Error) {
                errorMessage = error.message;
                
                // Enhance error messages for better user understanding
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
    };

    const addMessage = useCallback((message: ChatMessage) => {
        try {
            setMessages(prev => [...prev, message]);
            setError(null); // Clear any previous errors
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
                .slice(0, 10); // Keep only last 10 unique queries

            setRecentQueries(updatedQueries);
            await AsyncStorage.setItem('recent_queries', JSON.stringify(updatedQueries));
            console.log('✅ Recent query saved:', queryText);
        } catch (error) {
            console.error('Error saving recent query:', error);
            // Don't throw error for recent queries - it's not critical
        }
    }, [recentQueries]);

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
            // Don't throw - not critical
        }
    }, []);

    const startNewSession = useCallback(() => {
        try {
            // Save current session if it has messages
            if (messages.length > 0 && currentSessionId) {
                const sessionTitle = messages.find(msg => msg.isUser)?.message.slice(0, 50) || 'New Chat';
                const newSession: ChatSession = {
                    id: currentSessionId,
                    title: sessionTitle,
                    timestamp: new Date().toISOString(),
                    messages: [...messages]
                };
                
                setSessions(prev => [newSession, ...prev.filter(s => s.id !== currentSessionId)]);
                console.log('✅ Session saved:', sessionTitle);
            }
            
            // Start new session
            const newSessionId = uuidv4();
            setCurrentSessionId(newSessionId);
            clearMessages();
            clearError();
            console.log('✅ New session started:', newSessionId);
        } catch (error) {
            console.error('Error starting new session:', error);
            setError('Failed to start new session');
        }
    }, [messages, currentSessionId, clearMessages, clearError]);

    const loadSession = useCallback((sessionId: string) => {
        try {
            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                setCurrentSessionId(sessionId);
                setMessages(session.messages);
                clearError();
                console.log('✅ Session loaded:', session.title);
            } else {
                setError('Session not found');
            }
        } catch (error) {
            console.error('Error loading session:', error);
            setError('Failed to load session');
        }
    }, [sessions, clearError]);

    // Helper function to extract sources from response text
    const extractSourcesFromText = (text: string): SourceReference[] => {
        try {
            const sources: SourceReference[] = [];
            
            // Pattern 1: [aws_id: filename_page_1]
            const awsIdPattern = /\[aws_id:\s*([^\]]+)\]/g;
            let match;
            
            while ((match = awsIdPattern.exec(text)) !== null) {
                const awsLink = match[1].trim();
                
                // Extract filename and page from aws_id
                const parts = awsLink.split('_page_');
                if (parts.length >= 2) {
                    const filename = parts[0].replace(/_/g, ' ');
                    const pageNum = parts[1];
                    
                    sources.push({
                        filename: filename,
                        pages: pageNum,
                        awsLink: awsLink,
                        url: getImageUrl(awsLink) // Use environment config
                    });
                }
            }
            
            // Pattern 2: Source: filename page X [aws_id: ...]
            const sourcePattern = /Source:\s*([^[]+)\[aws_id:\s*([^\]]+)\]/g;
            while ((match = sourcePattern.exec(text)) !== null) {
                const sourceText = match[1].trim();
                const awsLink = match[2].trim();
                
                // Extract filename and page from source text
                const pageMatch = sourceText.match(/(.+?)\s+page\s+(\d+)/i);
                if (pageMatch) {
                    const filename = pageMatch[1].trim();
                    const pageNum = pageMatch[2];
                    
                    // Check if we already have this source
                    const existingSource = sources.find(s => s.awsLink === awsLink);
                    if (!existingSource) {
                        sources.push({
                            filename: filename,
                            pages: pageNum,
                            awsLink: awsLink,
                            url: getImageUrl(awsLink) // Use environment config
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
    };

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) {
            console.log('⏭️ Skipping send - empty text or already loading');
            return;
        }

        console.log('=== 🚀 STARTING SEND MESSAGE ===');
        console.log('📝 Message text:', text);
        console.log('📱 Session ID:', APP_SESSION_ID);

        try {
            // Start new session if no current session
            if (!currentSessionId) {
                const newSessionId = uuidv4();
                setCurrentSessionId(newSessionId);
                console.log('🆕 Created new session:', newSessionId);
            }

            // Validate session before sending message
            const isSessionValid = await authContext.validateSessionBeforeRequest();
            if (!isSessionValid) {
                throw new Error('Session expired. Please log in again.');
            }

            setIsLoading(true);
            setError(null);

            // Save as recent query
            await saveRecentQuery(text);

            // Add user message immediately
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

            // Add AI message placeholder
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

            // Get token and user data
            const token = authContext.state.tokens?.access_token;
            const userData = authContext.state.user;

            if (!token) {
                throw new Error('No authentication token available');
            }

            const requestBody = {
                query: text,
                qid: uuidv4(),
                uid: (userData as any)?.id || (userData as any)?.user_id || (userData as any)?.userId || (userData as any)?.uid || 'user-' + uuidv4(),
                sid: APP_SESSION_ID,
                messages: messages.filter(msg => !msg.isStreaming).map(msg => ({
                    content: msg.message,
                    isBot: !msg.isUser
                })),
                collection: 'chatbot'
            };

            const chatUrl = getChatApiUrl('/run');
            console.log('📡 Sending chat request to:', chatUrl);
            console.log('📤 Request body:', requestBody);

            // Start status polling
            let statusPollingInterval: NodeJS.Timeout | null = null;

            const startStatusPolling = () => {
                const statusUrl = getChatApiUrl(`/currentStatus?uid=${requestBody.uid}&sid=${APP_SESSION_ID}`);
                console.log('🔄 Starting status polling:', statusUrl);
                
                statusPollingInterval = setInterval(async () => {
                    try {
                        const statusResponse = await safeFetch(statusUrl);
                        if (statusResponse.ok) {
                            const statusText = await statusResponse.text();
                            console.log('📊 Status response:', statusText);
                            
                            // Parse SSE format: data: {"status": "..."}
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
                                            console.log('📊 Status update:', data.status);
                                        }
                                    } catch (parseError) {
                                        console.log('⚠️ Status parse error:', parseError);
                                    }
                                }
                            }
                        }
                    } catch (statusError) {
                        console.log('⚠️ Status polling error:', statusError);
                    }
                }, 2000); // Poll every 2 seconds
            };

            const stopStatusPolling = () => {
                if (statusPollingInterval) {
                    clearInterval(statusPollingInterval);
                    statusPollingInterval = null;
                    console.log('🛑 Status polling stopped');
                }
            };

            // Start status polling
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
            
            // Get the response text
            const responseText = await response.text();
            console.log('📝 Full response length:', responseText.length);
            console.log('📝 Response preview:', responseText.substring(0, 200) + '...');

            let fullMessage = '';
            let extractedSources: SourceReference[] = [];

            // Parse response
            if (responseText) {
                // Try to parse as JSON first
                try {
                    const jsonResponse = JSON.parse(responseText);
                    fullMessage = jsonResponse.message || jsonResponse.response || jsonResponse.text || responseText;
                } catch {
                    // If not JSON, use as plain text
                    fullMessage = responseText;
                }

                extractedSources = extractSourcesFromText(fullMessage);
                console.log('📋 Extracted sources count:', extractedSources.length);
                
                // Simulate streaming for better UX
                const words = fullMessage.split(' ');
                for (let i = 0; i < words.length; i += 3) { // Process 3 words at a time
                    const chunk = words.slice(0, i + 3).join(' ');
                    updateMessage(aiMessageId, {
                        message: chunk,
                        isStreaming: true
                    });
                    
                    // Small delay for streaming effect
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            // Stop status polling
            stopStatusPolling();

            // Finalize message
            updateMessage(aiMessageId, {
                message: fullMessage,
                isStreaming: false,
                agentStatus: undefined,
                sources: extractedSources, // Pass SourceReference[] directly
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
            
            const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
            setError(errorMessage);
            
            // Update AI message with error
            const aiMessages = messages.filter(msg => !msg.isUser && msg.isStreaming);
            if (aiMessages.length > 0) {
                updateMessage(aiMessages[0].id, {
                    message: `Error: ${errorMessage}`,
                    isStreaming: false,
                    agentStatus: undefined,
                    sources: [], // Empty SourceReference array
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
    }, [messages, isLoading, addMessage, updateMessage, authContext, currentSessionId, saveRecentQuery]);

    const submitVote = useCallback(async (messageText: string, voteType: 'upvote' | 'downvote') => {
        try {
            console.log(`🗳️ Submitting ${voteType} for message`);
            
            const isSessionValid = await authContext.validateSessionBeforeRequest();
            if (!isSessionValid) {
                throw new Error('Session expired. Please log in again.');
            }

            const token = authContext.state.tokens?.access_token;
            const userData = authContext.state.user;

            const voteUrl = getChatApiUrl('/vote');
            
            await safeApiCall(async () => {
                const response = await safeFetch(voteUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        message: messageText,
                        vote: voteType,
                        uid: (userData as any)?.id || 'user-' + uuidv4(),
                        sid: APP_SESSION_ID
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Vote submission failed: ${response.status}`);
                }

                return response;
            });

            // Update message to show vote
            setMessages(prev => prev.map(msg => 
                msg.message === messageText && !msg.isUser ? {
                    ...msg,
                    hasVoted: true,
                    voteType: voteType
                } : msg
            ));

            console.log(`✅ ${voteType} submitted successfully`);
            clearError();

        } catch (error) {
            console.error('Vote submission error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit vote';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [authContext, clearError]);

    const submitFeedback = useCallback(async (messageText: string, feedback: any) => {
        try {
            console.log('📝 Submitting feedback for message');
            
            const isSessionValid = await authContext.validateSessionBeforeRequest();
            if (!isSessionValid) {
                throw new Error('Session expired. Please log in again.');
            }

            const token = authContext.state.tokens?.access_token;
            const userData = authContext.state.user;

            const feedbackUrl = getChatApiUrl('/feedback');

            await safeApiCall(async () => {
                const response = await safeFetch(feedbackUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        message: messageText,
                        feedback,
                        uid: (userData as any)?.id || 'user-' + uuidv4(),
                        sid: APP_SESSION_ID
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Feedback submission failed: ${response.status}`);
                }

                return response;
            });

            // Update message to show feedback submitted
            setMessages(prev => prev.map(msg => 
                msg.message === messageText && !msg.isUser ? {
                    ...msg,
                    feedback: feedback
                } : msg
            ));

            console.log('✅ Feedback submitted successfully');
            clearError();

        } catch (error) {
            console.error('Feedback submission error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [authContext, clearError]);

    // Network testing function
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
    }, []);

    // Load recent queries on mount
    useEffect(() => {
        console.log('🚀 ChatProvider initializing...');
        loadRecentQueries();
        
        // Test network connectivity on startup (optional)
        // testNetwork();
        
        console.log('📱 App Session ID:', APP_SESSION_ID);
        console.log('⚙️ API Configuration:', API_CONFIG);
    }, [loadRecentQueries]);

    // Auto-save sessions periodically
    useEffect(() => {
        if (messages.length > 0 && currentSessionId) {
            const saveSession = async () => {
                try {
                    const sessionTitle = messages.find(msg => msg.isUser)?.message.slice(0, 50) || 'Chat Session';
                    const sessionData = {
                        id: currentSessionId,
                        title: sessionTitle,
                        timestamp: new Date().toISOString(),
                        messages: messages
                    };
                    
                    await AsyncStorage.setItem(`session_${currentSessionId}`, JSON.stringify(sessionData));
                    console.log('💾 Session auto-saved:', sessionTitle);
                } catch (error) {
                    console.error('❌ Failed to auto-save session:', error);
                }
            };

            // Auto-save every 30 seconds if there are messages
            const autoSaveInterval = setInterval(saveSession, 30000);
            
            return () => {
                clearInterval(autoSaveInterval);
            };
        }
    }, [messages, currentSessionId]);

    return (
        <ChatContext.Provider value={{
            messages,
            sessions,
            recentQueries,
            currentSessionId,
            addMessage,
            clearMessages,
            sendMessage,
            submitVote,
            submitFeedback,
            isLoading,
            startNewSession,
            loadSession,
            error,
            clearError,
            testNetwork,
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