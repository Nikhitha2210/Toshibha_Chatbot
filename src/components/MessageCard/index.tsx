import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getStyles } from './styles';
import IconAssets from '../../assets/icons/IconAssets';
import FeedbackModal from '../Feedback/Feedback';
import SourceModal from '../Source';
import { useThemeContext } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';

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
    sources?: SourceReference[]; // Accept SourceReference array
    hasVoted?: boolean;
    voteType?: 'upvote' | 'downvote';
}

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
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [sourceVisible, setSourceVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'Links' | 'Images'>('Links');

    const [harmful, setHarmful] = useState(false);
    const [untrue, setUntrue] = useState(false);
    const [unhelpful, setUnhelpful] = useState(false);

    const [liked, setLiked] = useState(hasVoted && voteType === 'upvote');
    const [disliked, setDisliked] = useState(hasVoted && voteType === 'downvote');

    const { theme } = useThemeContext();
    const { submitVote, error, clearError } = useChat();

    const styles = getStyles(theme);

    // Check if this is an error message
    const isErrorMessage = message.toLowerCase().includes('error:') || 
                          message.toLowerCase().includes('failed') ||
                          message.toLowerCase().includes('network request failed');

    // Handle upvote with error handling
    const handleLike = async () => {
        if (liked || (hasVoted && voteType === 'upvote')) return;
        
        try {
            setLiked(true);
            setDisliked(false);
            
            await submitVote(message, 'upvote');
            console.log('✅ Upvote successful');
            
        } catch (error) {
            console.error('❌ Upvote error:', error);
            setLiked(false); // Revert on error
            Alert.alert('Error', 'Failed to submit vote. Please try again.');
        }
    };

    // Handle downvote with error handling
    const handleDislike = async () => {
        if (disliked || (hasVoted && voteType === 'downvote')) return;
        
        try {
            setDisliked(true);
            setLiked(false);
            setFeedbackVisible(true);
            
            await submitVote(message, 'downvote');
            console.log('✅ Downvote successful, feedback modal opened');
            
        } catch (error) {
            console.error('❌ Downvote error:', error);
            setDisliked(false); // Revert on error
            setFeedbackVisible(false);
            Alert.alert('Error', 'Failed to submit vote. Please try again.');
        }
    };

    // Convert SourceReference to format expected by SourceModal
    const sourceLinks = sources.map((source, index) => ({
        id: index + 1,
        label: `Source ${index + 1}`,
        title: source.filename,
        date: `Page ${source.pages}`,
        color: index === 0 ? '#A259FF' : index === 1 ? '#9CA3AF' : '#10B981',
        url: source.url
    }));

    // If it's a user message, show simple orange bubble (right side)
    if (isUser) {
        return (
            <View style={{ alignItems: 'flex-end', marginBottom: 20, paddingHorizontal: 10 }}>
                <Text style={{ color: '#666', fontSize: 12, marginBottom: 5 }}>{time}</Text>
                <View style={{
                    backgroundColor: '#FF6A00',
                    borderRadius: 15,
                    borderBottomRightRadius: 5,
                    padding: 12,
                    maxWidth: '80%',
                }}>
                    <Text style={{ color: '#fff', fontSize: 14 }}>{message}</Text>
                </View>
                {highlight && (
                    <View style={[styles.card, { marginTop: 8, maxWidth: '80%' }]}>
                        <Text style={styles.productTitle}>{highlight.title}</Text>
                        <View style={styles.ratingRow}>
                            <Icon name="star" size={16} color="#FFC107" />
                            <Text style={styles.ratingText}>
                                {highlight.rating} ({highlight.reviews.toLocaleString()})
                            </Text>
                        </View>
                        <Text style={styles.highlightDesc}>{highlight.description}</Text>
                    </View>
                )}
            </View>
        );
    }

    // AI message (left side) - Original design with voting and error handling
    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.iconContainer}>
                    <IconAssets.Frame />
                </View>
                <Text style={styles.timeText}>{time}</Text>
                
                {/* Show error indicator if there's an error */}
                {error && (
                    <TouchableOpacity 
                        onPress={clearError}
                        style={{ marginLeft: 'auto', padding: 5 }}
                    >
                        <Icon name="alert-circle" size={20} color="#ff6b6b" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Show global error message */}
            {error && (
                <View style={{
                    backgroundColor: '#ffebee',
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 10,
                    borderLeftWidth: 4,
                    borderLeftColor: '#f44336'
                }}>
                    <Text style={{ color: '#c62828', fontSize: 14 }}>
                        ⚠️ {error}
                    </Text>
                    <TouchableOpacity onPress={clearError} style={{ marginTop: 5 }}>
                        <Text style={{ color: '#1976d2', fontSize: 12 }}>Tap to dismiss</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Show agent status when streaming */}
            {isStreaming && agentStatus && (
                <View style={{
                    backgroundColor: 'rgba(255, 106, 0, 0.1)',
                    padding: 8,
                    borderRadius: 6,
                    marginBottom: 10,
                    borderLeftWidth: 3,
                    borderLeftColor: '#FF6A00'
                }}>
                    <Text style={[styles.messageText, { 
                        fontStyle: 'italic', 
                        color: '#FF6A00',
                        fontSize: 13 
                    }]}>
                        {agentStatus}
                        {isStreaming && <Text style={{ color: '#FF6A00' }}>...</Text>}
                    </Text>
                </View>
            )}

            {/* Message content with error styling */}
            <Text style={[
                styles.messageText,
                isErrorMessage && {
                    color: '#f44336',
                    backgroundColor: '#ffebee',
                    padding: 10,
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: 13
                }
            ]}>
                {message}
                {isStreaming && !agentStatus && <Text style={{ color: '#FF6A00' }}>|</Text>}
            </Text>

            {/* Retry button for error messages */}
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

            {highlight && !isErrorMessage && (
                <View style={styles.highlightBox}>
                    <Text style={styles.productTitle}>{highlight.title}</Text>
                    <View style={styles.ratingRow}>
                        <Icon name="star" size={16} color="#FFC107" />
                        <Text style={styles.ratingText}>
                            {highlight.rating} ({highlight.reviews.toLocaleString()})
                        </Text>
                    </View>
                    <Text style={styles.highlightDesc}>{highlight.description}</Text>
                </View>
            )}

            {/* Action buttons - hide for error messages */}
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
                        {liked || (hasVoted && voteType === 'upvote') ? (
                            <TouchableOpacity 
                                disabled
                                style={styles.voteButton}
                            >
                                <IconAssets.ThumbsUpBold />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity 
                                onPress={handleLike}
                                style={styles.voteButton}
                                activeOpacity={0.7}
                            >
                                <IconAssets.ThumbsUp />
                            </TouchableOpacity>
                        )}
                        
                        {disliked || (hasVoted && voteType === 'downvote') ? (
                            <TouchableOpacity 
                                disabled
                                style={styles.voteButton}
                            >
                                <IconAssets.ThumbsDownBold />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity 
                                onPress={handleDislike}
                                style={styles.voteButton}
                                activeOpacity={0.7}
                            >
                                <IconAssets.ThumbsDown />
                            </TouchableOpacity>
                        )}
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