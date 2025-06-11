import { createContext, ReactNode, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { useAuth } from './AuthContext';

const uuidv4 = () => uuid.v4() as string;

// Create a persistent session ID that stays the same for the app session
const APP_SESSION_ID = 'session-' + uuidv4();

export interface SourceReference {
    filename: string;
    pages: string;
    awsId: string;
    url?: string;
}

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
}

export interface RecentQuery {
    id: string;
    question: string;
    timestamp: string;
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
    agentStatus: string;
    startNewSession: () => void;
    loadSession: (sessionId: string) => void;
    addToRecentQueries: (question: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEYS = {
    SESSIONS: '@chat/sessions',
    RECENT_QUERIES: '@chat/recent_queries',
} as const;

// Helper function to extract sources from response text (matching web app format)
const extractSourcesFromText = (text: string): SourceReference[] => {
    const sources: SourceReference[] = [];
    
    // Look for patterns like: [aws_id: filename_page_1] or Source: filename page 1 [aws_id: filename_page_1]
    const patterns = [
        /\[aws_id:\s*([^\]]+)\]/g,
        /Source:\s*([^[]+)\s*\[aws_id:\s*([^\]]+)\]/g
    ];
    
    // Pattern 1: Just aws_id
    let match;
    while ((match = patterns[0].exec(text)) !== null) {
        const awsId = match[1].trim();
        
        // Extract filename and page from aws_id (format: filename_page_X)
        let filename = '';
        let pages = '';
        
        if (awsId.includes('_page_')) {
            const parts = awsId.split('_page_');
            filename = parts[0] + '.pdf';
            pages = parts[1];
        } else {
            filename = awsId + '.pdf';
            pages = '1';
        }
        
        sources.push({
            filename,
            pages,
            awsId,
            url: undefined // Will be populated later
        });
    }
    
    // Pattern 2: Source with filename and aws_id
    while ((match = patterns[1].exec(text)) !== null) {
        const sourceText = match[1].trim();
        const awsId = match[2].trim();
        
        // Extract filename and pages from source text
        const sourceMatch = sourceText.match(/(.+?)\s+page\s+(\d+)/i);
        if (sourceMatch) {
            const filename = sourceMatch[1].trim() + '.pdf';
            const pages = sourceMatch[2];
            
            sources.push({
                filename,
                pages,
                awsId,
                url: undefined
            });
        }
    }
    
    return sources;
};

// Helper function to get S3 image URL (matching web app format)
const getImageUrl = async (awsId: string): Promise<string | null> => {
    try {
        // Based on your teammate's info: AWS ID format is filename_pagenum_pagenum
        // Convert to S3 URL - you'll need to replace with your actual S3 bucket URL
        const imageUrl = `https://your-s3-bucket-name.s3.amazonaws.com/${awsId}.png`;
        
        // TODO: Replace 'your-s3-bucket-name' with your actual S3 bucket name
        // Example: https://toshiba-docs.s3.amazonaws.com/6800_Hardware_Service_Guide_(2)_page_41.png
        
        console.log('Generated S3 URL:', imageUrl);
        return imageUrl;
    } catch (error) {
        console.error('Error getting image URL:', error);
        return null;
    }
};

// Helper function to get loading message from agent status
const getLoadingMessageFromAgentStatus = (agentStatus: string): string => {
    if (
        agentStatus.includes("UnsupportedProduct") ||
        agentStatus.includes("NotenoughContext") ||
        agentStatus.includes("finalfinalFormatedOutput")
    ) {
        return "Generating an answer";
    } else if (
        agentStatus.includes("getIssuseContexFromDetails") ||
        agentStatus.includes("finalFormatedOutput") ||
        agentStatus.includes("func_incidentScoringChain")
    ) {
        return "Getting context for the issue";
    } else if (
        agentStatus.includes("getIssuseContexFromSummary") ||
        agentStatus.includes("processQdrantOutput")
    ) {
        return "Processing the context from the database";
    } else if (agentStatus.includes("getReleatedChatText")) {
        return "Getting related chat history";
    } else if (agentStatus.includes("Reformulating")) {
        return "Reformulating query...";
    } else if (agentStatus.includes("Searching")) {
        return "Searching knowledge base...";
    }
    
    return agentStatus || "Processing...";
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [agentStatus, setAgentStatus] = useState("Ready");
    const authContext = useAuth();

    // Load persisted data on app start
    useEffect(() => {
        loadPersistedData();
    }, []);

    const loadPersistedData = async () => {
        try {
            const [storedSessions, storedQueries] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
                AsyncStorage.getItem(STORAGE_KEYS.RECENT_QUERIES),
            ]);

            if (storedSessions) {
                const parsedSessions = JSON.parse(storedSessions);
                setSessions(parsedSessions);
            }

            if (storedQueries) {
                const parsedQueries = JSON.parse(storedQueries);
                setRecentQueries(parsedQueries);
            }
        } catch (error) {
            console.error('Failed to load persisted data:', error);
        }
    };

    const saveSessionsToStorage = async (sessionsToSave: ChatSession[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessionsToSave));
        } catch (error) {
            console.error('Failed to save sessions:', error);
        }
    };

    const saveRecentQueriesToStorage = async (queriesToSave: RecentQuery[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.RECENT_QUERIES, JSON.stringify(queriesToSave));
        } catch (error) {
            console.error('Failed to save recent queries:', error);
        }
    };

    const addToRecentQueries = useCallback(async (question: string) => {
        const newQuery: RecentQuery = {
            id: uuidv4(),
            question: question.trim(),
            timestamp: new Date().toISOString(),
        };

        const updatedQueries = [newQuery, ...recentQueries.filter(q => q.question !== question.trim())]
            .slice(0, 10); // Keep only last 10 queries

        setRecentQueries(updatedQueries);
        await saveRecentQueriesToStorage(updatedQueries);
    }, [recentQueries]);

    const addMessage = useCallback((message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
        setMessages(prev => prev.map(msg => 
            msg.id === id ? { ...msg, ...updates } : msg
        ));
    }, []);

    const startNewSession = useCallback(() => {
        // Save current session if it has messages
        if (messages.length > 0 && currentSessionId) {
            const sessionTitle = messages.find(msg => msg.isUser)?.message.slice(0, 50) || 'New Chat';
            const newSession: ChatSession = {
                id: currentSessionId,
                title: sessionTitle,
                timestamp: new Date().toISOString(),
                messages: [...messages]
            };
            
            const updatedSessions = [newSession, ...sessions.filter(s => s.id !== currentSessionId)];
            setSessions(updatedSessions);
            saveSessionsToStorage(updatedSessions);
        }
        
        // Start new session
        const newSessionId = uuidv4();
        setCurrentSessionId(newSessionId);
        clearMessages();
    }, [messages, currentSessionId, clearMessages, sessions]);

    const loadSession = useCallback((sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setCurrentSessionId(sessionId);
            setMessages(session.messages);
        }
    }, [sessions]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;

        const messageText = text.trim();

        // Start new session if no current session
        if (!currentSessionId) {
            const newSessionId = uuidv4();
            setCurrentSessionId(newSessionId);
        }

        // Validate session before sending message
        const isSessionValid = await authContext.validateSessionBeforeRequest();
        if (!isSessionValid) {
            console.error('Session invalid, cannot send message');
            return;
        }

        setIsLoading(true);
        setAgentStatus("Processing your request...");

        // Add user message immediately
        const userMessage: ChatMessage = {
            id: uuidv4(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            message: messageText,
            isUser: true,
            highlight: {
                title: "Your Query",
                rating: 0,
                reviews: 0,
                description: messageText
            }
        };

        addMessage(userMessage);

        // Add to recent queries
        await addToRecentQueries(messageText);

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

        try {
            console.log('=== Chat Request ===');
            console.log('URL: http://192.168.1.221:8000/run');
            
            // Get token and user data
            const token = authContext.state.tokens?.access_token;
            const userData = authContext.state.user;

            const userId = (userData as any)?.id || (userData as any)?.user_id || (userData as any)?.userId || (userData as any)?.uid || 'user-' + uuidv4();

            console.log('Token found:', !!token);
            console.log('User data found:', !!userData);

            // Declare status polling variable at the right scope
            let statusPollingInterval: NodeJS.Timeout | null = null;
            
            const startStatusPolling = () => {
                statusPollingInterval = setInterval(async () => {
                    try {
                        const statusResponse = await fetch(
                            `http://192.168.1.221:8000/currentStatus?uid=${userId}&sid=${currentSessionId}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                }
                            }
                        );
                        
                        if (statusResponse.ok) {
                            const statusText = await statusResponse.text();
                            if (statusText && statusText.trim()) {
                                // Parse SSE format
                                const lines = statusText.split('\n');
                                for (const line of lines) {
                                    if (line.startsWith('data: ')) {
                                        const data = line.substring(6);
                                        if (data && data !== '[DONE]') {
                                            const newStatus = getLoadingMessageFromAgentStatus(data);
                                            setAgentStatus(newStatus);
                                            updateMessage(aiMessageId, {
                                                agentStatus: newStatus,
                                                isStreaming: true
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.log('Status polling error:', error);
                    }
                }, 1000); // Poll every second
            };

            const stopStatusPolling = () => {
                if (statusPollingInterval) {
                    clearInterval(statusPollingInterval);
                    statusPollingInterval = null;
                }
            };

            // Start status polling
            startStatusPolling();

            const requestBody = {
                query: messageText,
                qid: aiMessageId,
                uid: userId,
                sid: currentSessionId,
                messages: messages.filter(msg => !msg.isStreaming).map(msg => ({
                    content: msg.message,
                    isBot: !msg.isUser
                })),
                collection: 'chatbot'
            };

            console.log('Request body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch('http://192.168.1.221:8000/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('✅ Response received, starting to process...');
            
            // Get the response text for streaming
            const responseText = await response.text();
            console.log('Full response:', responseText);

            let fullMessage = '';
            let finalSources: SourceReference[] = [];

            // Simple streaming simulation - you can enhance this based on your response format
            const lines = responseText.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6);
                        if (jsonStr.trim() === '[DONE]') {
                            console.log('Stream completed');
                            break;
                        }

                        const data = JSON.parse(jsonStr);
                        
                        if (data.type === 'status') {
                            const status = getLoadingMessageFromAgentStatus(data.message || 'Processing...');
                            setAgentStatus(status);
                            updateMessage(aiMessageId, {
                                agentStatus: status,
                                isStreaming: true
                            });
                        } else if (data.type === 'chunk') {
                            const chunk = data.message || '';
                            fullMessage += chunk;
                            updateMessage(aiMessageId, {
                                message: fullMessage,
                                isStreaming: true
                            });
                            
                            await new Promise(resolve => setTimeout(resolve, 50));
                        }
                    }
                } catch (parseError) {
                    console.warn('Failed to parse line:', line, parseError);
                    if (line.trim()) {
                        fullMessage += line + ' ';
                        updateMessage(aiMessageId, {
                            message: fullMessage,
                            isStreaming: true
                        });
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                }
            }

            // If no streaming data, treat entire response as message
            if (!fullMessage && responseText) {
                fullMessage = responseText;
                // Simulate streaming for non-streaming responses
                const words = responseText.split(' ');
                for (let i = 0; i < words.length; i++) {
                    const chunk = words.slice(0, i + 1).join(' ');
                    updateMessage(aiMessageId, {
                        message: chunk,
                        isStreaming: true
                    });
                    await new Promise(resolve => setTimeout(resolve, 80));
                }
            }

            // Extract sources from the final message
            const extractedSources = extractSourcesFromText(fullMessage);
            console.log('Extracted sources:', extractedSources);
            
            // Get image URLs for sources
            for (const source of extractedSources) {
                if (source.awsId && !source.url) {
                    try {
                        const imageUrl = await getImageUrl(source.awsId);
                        if (imageUrl) {
                            source.url = imageUrl;
                        }
                        console.log('Source processed:', source.filename, 'AWS ID:', source.awsId, 'URL:', source.url);
                    } catch (error) {
                        console.error('Error getting image URL for source:', source.filename, error);
                    }
                }
            }

            finalSources = extractedSources;

            // Finalize message
            updateMessage(aiMessageId, {
                message: fullMessage,
                isStreaming: false,
                agentStatus: undefined,
                sources: finalSources,
                highlight: {
                    title: "AI Response",
                    rating: 4.8,
                    reviews: 8399,
                    description: "Response completed"
                }
            });

            console.log('✅ Message processing completed');
            console.log('Final sources:', finalSources);

            // Stop status polling
            stopStatusPolling();

            // Auto-save session after successful message
            if (currentSessionId && fullMessage) {
                const sessionTitle = messageText.slice(0, 50);
                const updatedMessages = [...messages, userMessage, {
                    ...aiMessage,
                    message: fullMessage,
                    isStreaming: false,
                    agentStatus: undefined,
                    sources: finalSources
                }];
                
                const sessionToSave: ChatSession = {
                    id: currentSessionId,
                    title: sessionTitle,
                    timestamp: new Date().toISOString(),
                    messages: updatedMessages
                };
                
                const updatedSessions = [sessionToSave, ...sessions.filter(s => s.id !== currentSessionId)];
                setSessions(updatedSessions);
                await saveSessionsToStorage(updatedSessions);
            }

        } catch (error) {
            console.error('Send message error:', error);
            
            // Update with error message
            updateMessage(aiMessageId, {
                message: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
                isStreaming: false,
                agentStatus: undefined,
                highlight: {
                    title: "Error",
                    rating: 0,
                    reviews: 0,
                    description: "Failed to get response"
                }
            });
        } finally {
            setIsLoading(false);
            setAgentStatus("Ready");
        }
    }, [messages, isLoading, addMessage, updateMessage, authContext, currentSessionId, sessions, addToRecentQueries]);

    const submitVote = useCallback(async (messageText: string, voteType: 'upvote' | 'downvote') => {
        try {
            const isSessionValid = await authContext.validateSessionBeforeRequest();
            if (!isSessionValid) {
                throw new Error('Session expired. Please log in again.');
            }

            const token = authContext.state.tokens?.access_token;
            const userData = authContext.state.user;

            const response = await fetch('http://192.168.1.221:8000/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: messageText,
                    vote: voteType,
                    uid: (userData as any)?.id || (userData as any)?.user_id || (userData as any)?.userId || (userData as any)?.uid || 'user-' + uuidv4(),
                    sid: APP_SESSION_ID
                })
            });

            if (!response.ok) {
                throw new Error(`Vote submission failed: ${response.status}`);
            }

            setMessages(prev => prev.map(msg => 
                msg.message === messageText && !msg.isUser ? {
                    ...msg,
                    hasVoted: true,
                    voteType: voteType
                } : msg
            ));

            console.log(`✅ ${voteType} submitted successfully`);
        } catch (error) {
            console.error('Vote submission error:', error);
            throw error;
        }
    }, [authContext]);

    const submitFeedback = useCallback(async (messageText: string, feedback: any) => {
        try {
            const isSessionValid = await authContext.validateSessionBeforeRequest();
            if (!isSessionValid) {
                throw new Error('Session expired. Please log in again.');
            }

            const token = authContext.state.tokens?.access_token;
            const userData = authContext.state.user;

            const response = await fetch('http://192.168.1.221:8000/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: messageText,
                    feedback,
                    uid: (userData as any)?.id || (userData as any)?.user_id || (userData as any)?.userId || (userData as any)?.uid || 'user-' + uuidv4(),
                    sid: APP_SESSION_ID
                })
            });

            if (!response.ok) {
                throw new Error(`Feedback submission failed: ${response.status}`);
            }

            setMessages(prev => prev.map(msg => 
                msg.message === messageText && !msg.isUser ? {
                    ...msg,
                    feedback: feedback
                } : msg
            ));

            console.log('✅ Feedback submitted successfully');
        } catch (error) {
            console.error('Feedback submission error:', error);
            throw error;
        }
    }, [authContext]);

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
            agentStatus,
            startNewSession,
            loadSession,
            addToRecentQueries
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