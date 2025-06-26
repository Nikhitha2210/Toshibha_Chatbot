import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Clipboard } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Markdown from 'react-native-markdown-display';

import { getStyles } from './styles';
import IconAssets, { getThemedIcon } from '../../assets/icons/IconAssets';
import FeedbackModal from '../Feedback/Feedback';
import SourceModal from '../Source';
import { useThemeContext } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import SourcePills from '../SourcePills/SourcePills';

interface HighlightData {
    title: string;
    rating: number;
    reviews: number;
    description: string;
}

export interface SourceReference {
    filename: string;
    pages: string;
    awsLink: string;
    url?: string;
}

interface MessageCardProps {
    time: string;
    message: string;
    highlight?: HighlightData;
    isUser?: boolean;
    isStreaming?: boolean;
    agentStatus?: string;
    sources?: SourceReference[];
    hasVoted?: boolean;
    voteType?: 'upvote' | 'downvote';
}

const TypingDots = () => {
    return (
        <View style={{ flexDirection: 'row', paddingVertical: 6 }}>
            {[0, 1, 2].map((_, i) => (
                <Text
                    key={i}
                    style={{
                        fontSize: 20,
                        color: '#FF6A00',
                        marginHorizontal: 2,
                        opacity: 0.3 + (i * 0.3),
                    }}
                >
                    •
                </Text>
            ))}
        </View>
    );
};

const MessageRenderer = ({ text, theme }: { text: string; theme: 'light' | 'dark' }) => {
    
    const handleCopyPress = () => {
        Clipboard.setString(text);
        Alert.alert('Copied', 'Text copied to clipboard!');
    };

    const markdownStyles = {
        body: {
            color: theme === 'dark' ? '#ccc' : '#333',
            fontSize: 14,
            lineHeight: 22,
        },
        heading1: {
            color: theme === 'dark' ? '#fff' : '#000',
            fontSize: 18,
            fontWeight: 'bold' as const,
            marginBottom: 8,
        },
        heading2: {
            color: theme === 'dark' ? '#fff' : '#000',
            fontSize: 16,
            fontWeight: 'bold' as const,
            marginBottom: 6,
        },
        heading3: {
            color: theme === 'dark' ? '#fff' : '#000',
            fontSize: 14,
            fontWeight: 'bold' as const,
            marginBottom: 4,
        },
        paragraph: {
            color: theme === 'dark' ? '#ccc' : '#333',
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 8,
        },
        list_item: {
            color: theme === 'dark' ? '#ccc' : '#333',
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 4,
        },
        bullet_list: {
            marginBottom: 8,
        },
        ordered_list: {
            marginBottom: 8,
        },
        table: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
            borderWidth: 1,
            borderColor: theme === 'dark' ? '#333' : '#ddd',
            borderRadius: 8,
            marginVertical: 8,
            overflow: 'hidden' as const,
        },
        thead: {
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#e9ecef',
        },
        th: {
            color: theme === 'dark' ? '#fff' : '#000',
            fontSize: 13,
            fontWeight: 'bold' as const,
            padding: 12,
            borderRightWidth: 1,
            borderRightColor: theme === 'dark' ? '#444' : '#ccc',
            textAlign: 'left' as const,
        },
        tr: {
            borderBottomWidth: 1,
            borderBottomColor: theme === 'dark' ? '#333' : '#ddd',
        },
        td: {
            color: theme === 'dark' ? '#ccc' : '#333',
            fontSize: 12,
            padding: 12,
            borderRightWidth: 1,
            borderRightColor: theme === 'dark' ? '#444' : '#ccc',
            textAlign: 'left' as const,
        },
        code_inline: {
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f1f3f4',
            color: theme === 'dark' ? '#ff6b6b' : '#d73a49',
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 3,
            fontSize: 13,
            fontFamily: 'monospace',
        },
        code_block: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f6f8fa',
            padding: 12,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: theme === 'dark' ? '#333' : '#e1e4e8',
            marginVertical: 8,
        },
        fence: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f6f8fa',
            padding: 12,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: theme === 'dark' ? '#333' : '#e1e4e8',
            marginVertical: 8,
        },
        blockquote: {
            backgroundColor: theme === 'dark' ? 'rgba(255, 106, 0, 0.05)' : 'rgba(255, 106, 0, 0.02)',
            borderLeftWidth: 4,
            borderLeftColor: '#FF6A00',
            paddingLeft: 12,
            paddingVertical: 8,
            marginVertical: 8,
            borderRadius: 4,
        },
        strong: {
            color: theme === 'dark' ? '#fff' : '#000',
            fontWeight: 'bold' as const,
        },
        em: {
            color: theme === 'dark' ? '#ccc' : '#333',
            fontStyle: 'italic' as const,
        },
        link: {
            color: '#FF6A00',
            textDecorationLine: 'underline' as const,
        },
        hr: {
            backgroundColor: theme === 'dark' ? '#333' : '#e1e4e8',
            height: 1,
            marginVertical: 16,
        },
    };

    return (
        <View style={{ marginVertical: 4 }}>
            <Markdown style={markdownStyles}>
                {text}
            </Markdown>
            
            <TouchableOpacity 
                onPress={handleCopyPress}
                style={{
                    marginTop: 8,
                    alignSelf: 'flex-end',
                    backgroundColor: theme === 'dark' ? '#333' : '#ddd',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <Text style={{ 
                    fontSize: 11, 
                    color: theme === 'dark' ? '#fff' : '#000',
                    marginRight: 4,
                }}>
                    📋
                </Text>
                <Text style={{ 
                    fontSize: 11, 
                    color: theme === 'dark' ? '#fff' : '#000' 
                }}>
                    Copy
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const MessageCard: React.FC<MessageCardProps> = ({
    time,
    message,
    highlight,
    isUser = false,
    isStreaming = false,
    agentStatus,
    sources = [],
    hasVoted = false,
    voteType
}) => {
    useEffect(() => {
        console.log('MessageCard Debug - Sources:', sources);
        console.log('MessageCard Debug - Is streaming:', isStreaming);
        console.log('MessageCard Debug - Message preview:', message.substring(0, 100) + '...');
        
        if (sources && sources.length > 0) {
            sources.forEach((source, index) => {
                console.log(`Source ${index + 1} in MessageCard:`, {
                    filename: source.filename,
                    pages: source.pages,
                    awsLink: source.awsLink,
                    url: source.url,
                    urlExists: !!source.url
                });
            });
        }
    }, [sources, message, isStreaming]);

    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [sourceVisible, setSourceVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'Links' | 'Images'>('Links');

    const [harmful, setHarmful] = useState(false);
    const [untrue, setUntrue] = useState(false);
    const [unhelpful, setUnhelpful] = useState(false);

    const [currentVoteType, setCurrentVoteType] = useState<'upvote' | 'downvote' | null>(
        hasVoted ? voteType || null : null
    );
    const [isVoting, setIsVoting] = useState(false);

    const { theme } = useThemeContext();
    const { submitVote, error, clearError } = useChat();

    const styles = getStyles(theme);
    const ThemedThumbsUpIcon = getThemedIcon('ThumbsUp', theme);
    const ThemedThumbsDownIcon = getThemedIcon('ThumbsDown', theme); 

    const isErrorMessage = message.toLowerCase().includes('error:') ||
        message.toLowerCase().includes('failed') ||
        message.toLowerCase().includes('network request failed');

    const handleVote = async (voteTypeToSubmit: 'upvote' | 'downvote') => {
        if (isVoting) return;

        try {
            setIsVoting(true);

            if (currentVoteType === voteTypeToSubmit) {
                setCurrentVoteType(null);
                return;
            }

            setCurrentVoteType(voteTypeToSubmit);
            await submitVote(message, voteTypeToSubmit);

            if (voteTypeToSubmit === 'downvote') {
                setFeedbackVisible(true);
            }

        } catch (error) {
            setCurrentVoteType(hasVoted ? voteType || null : null);
            Alert.alert('Error', 'Failed to submit vote. Please try again.');
        } finally {
            setIsVoting(false);
        }
    };

    const handleCopyUserMessage = () => {
        Clipboard.setString(message);
        Alert.alert('Copied', 'Message copied to clipboard!');
    };

    const sourceLinks = sources.map((source, index) => ({
        id: index + 1,
        label: `Source ${index + 1}`,
        title: source.filename,
        date: `Page ${source.pages}`,
        color: index === 0 ? '#A259FF' : index === 1 ? '#9CA3AF' : '#10B981',
        url: source.url
    }));

    if (isUser) {
        return (
            <View style={{ alignItems: 'flex-end', marginBottom: 20, paddingHorizontal: 10 }}>
                <Text 
                    selectable={true}
                    style={{ color: '#666', fontSize: 12, marginBottom: 5 }}
                >
                    {time}
                </Text>
                <TouchableOpacity 
                    onLongPress={handleCopyUserMessage}
                    style={{
                        backgroundColor: '#FF6A00',
                        borderRadius: 15,
                        borderBottomRightRadius: 5,
                        padding: 12,
                        maxWidth: '80%',
                    }}
                >
                    <Text 
                        selectable={true}
                        textBreakStrategy="balanced"
                        style={{ color: '#fff', fontSize: 14 }}
                    >
                        {message}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.iconContainer}>
                    <IconAssets.Frame />
                </View>
                <Text 
                    selectable={true}
                    style={styles.timeText}
                >
                    {time}
                </Text>

                {error && (
                    <TouchableOpacity
                        onPress={clearError}
                        style={{ marginLeft: 'auto', padding: 5 }}
                    >
                        <Icon name="alert-circle" size={20} color="#ff6b6b" />
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <View style={{
                    backgroundColor: '#ffebee',
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 10,
                    borderLeftWidth: 4,
                    borderLeftColor: '#f44336'
                }}>
                    <Text 
                        selectable={true}
                        style={{ color: '#c62828', fontSize: 14 }}
                    >
                        ⚠️ {error}
                    </Text>
                    <TouchableOpacity onPress={clearError} style={{ marginTop: 5 }}>
                        <Text style={{ color: '#1976d2', fontSize: 12 }}>Tap to dismiss</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isStreaming && agentStatus && (
                <View style={{
                    backgroundColor: 'rgba(255, 106, 0, 0.1)',
                    padding: 8,
                    borderRadius: 6,
                    marginBottom: 10,
                    borderLeftWidth: 3,
                    borderLeftColor: '#FF6A00'
                }}>
                    <Text 
                        selectable={true}
                        style={[styles.messageText, {
                            fontStyle: 'italic',
                            color: '#FF6A00',
                            fontSize: 13
                        }]}
                    >
                        {agentStatus}
                        {isStreaming && <Text style={{ color: '#FF6A00' }}>...</Text>}
                    </Text>
                </View>
            )}

            {isStreaming && !message ? (
                <View style={{ paddingVertical: 6 }}>
                    <TypingDots />
                </View>
            ) : (
                <View style={{ marginBottom: 10 }}>
                    {isErrorMessage ? (
                        <Text 
                            selectable={true}
                            textBreakStrategy="balanced"
                            style={[
                                styles.messageText,
                                {
                                    color: '#f44336',
                                    backgroundColor: '#ffebee',
                                    padding: 10,
                                    borderRadius: 6,
                                    fontFamily: 'monospace',
                                    fontSize: 13
                                }
                            ]}
                        >
                            {message}
                            {isStreaming && !agentStatus && <Text style={{ color: '#FF6A00' }}>|</Text>}
                        </Text>
                    ) : (
                        <MessageRenderer text={message} theme={theme} />
                    )}
                </View>
            )}

            {sources && sources.length > 0 && (
                <SourcePills sources={sources} theme={theme} />
            )}

            {isErrorMessage && (
                <TouchableOpacity
                    style={{
                        backgroundColor: '#FF6A00',
                        padding: 8,
                        borderRadius: 6,
                        marginTop: 8,
                        alignSelf: 'flex-start'
                    }}
                    onPress={() => {
                        clearError();
                        Alert.alert('Retry', 'Please try sending your message again.');
                    }}
                >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                        Try Again
                    </Text>
                </TouchableOpacity>
            )}

            {!isErrorMessage && (
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.sourceButton}
                        onPress={() => setSourceVisible(true)}
                        disabled={sources.length === 0}
                    >
                        <Text style={[
                            styles.sourceText,
                            sources.length === 0 && { opacity: 0.5 }
                        ]}>
                            Sources {sources.length > 0 && `(${sources.length})`}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.voteButtons}>
                        <TouchableOpacity
                            onPress={() => handleVote('upvote')}
                            style={[
                                styles.voteButton,
                                currentVoteType === 'upvote' && { 
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(34, 197, 94, 0.3)'
                                }
                            ]}
                            disabled={isVoting}
                            activeOpacity={0.7}
                        >
                            {currentVoteType === 'upvote' ? (
                                <IconAssets.ThumbsUpBold width={25} height={25} />
                            ) : (
                                ThemedThumbsUpIcon && <ThemedThumbsUpIcon width={25} height={25} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleVote('downvote')}
                            style={[
                                styles.voteButton,
                                currentVoteType === 'downvote' && { 
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(239, 68, 68, 0.3)'
                                }
                            ]}
                            disabled={isVoting}
                            activeOpacity={0.7}
                        >
                            {currentVoteType === 'downvote' ? (
                                <IconAssets.ThumbsDownBold width={25} height={25} />
                            ) : (
                                ThemedThumbsDownIcon && <ThemedThumbsDownIcon width={25} height={25} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <FeedbackModal
                visible={feedbackVisible}
                onClose={() => setFeedbackVisible(false)}
                harmful={harmful}
                untrue={untrue}
                unhelpful={unhelpful}
                setHarmful={setHarmful}
                setUntrue={setUntrue}
                setUnhelpful={setUnhelpful}
                messageText={message}
            />

            <SourceModal
                visible={sourceVisible}
                onClose={() => setSourceVisible(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sourceLinks={sourceLinks}
            />
        </View>
    );
};

export default MessageCard;