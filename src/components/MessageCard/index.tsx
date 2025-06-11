import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getStyles } from './styles';
import IconAssets from '../../assets/icons/IconAssets';
import FeedbackModal from '../Feedback/Feedback';
import SourceModal from '../Source';
import SourcePills from '../SourcePills/SourcePills';
import { useThemeContext } from '../../context/ThemeContext';
import { useChat, SourceReference } from '../../context/ChatContext';

interface HighlightData {
    title: string;
    rating: number;
    reviews: number;
    description: string;
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
    const { submitVote, agentStatus: currentAgentStatus } = useChat();

    const styles = getStyles(theme);

    // Handle upvote
    const handleLike = async () => {
        if (liked || (hasVoted && voteType === 'upvote')) return; // Already upvoted
        
        // Update UI immediately for better UX
        setLiked(true);
        setDisliked(false);
        
        try {
            await submitVote(message, 'upvote');
            console.log('✅ Upvote successful');
        } catch (error) {
            console.error('❌ Upvote error:', error);
            // Keep the UI updated even if backend fails
            // setLiked(false); // Uncomment to revert on error
        }
    };

    // Handle downvote
    const handleDislike = async () => {
        if (disliked || (hasVoted && voteType === 'downvote')) return; // Already downvoted
        
        // Update UI immediately and show feedback modal
        setDisliked(true);
        setLiked(false);
        setFeedbackVisible(true); // Show feedback modal immediately
        
        try {
            await submitVote(message, 'downvote');
            console.log('✅ Downvote successful, feedback modal opened');
        } catch (error) {
            console.error('❌ Downvote error:', error);
            // Keep the UI updated and modal open even if backend fails
            // setDisliked(false); // Uncomment to revert on error
            // setFeedbackVisible(false); // Uncomment to close modal on error
        }
    };

    const sourceLinks = [
        {
            id: 1,
            label: 'Source 1',
            title: 'Source Article Title 1',
            date: 'March 18',
            color: '#A259FF',
        },
        {
            id: 2,
            label: 'Source 2',
            title: 'Source Article Title 2',
            date: 'March 18',
            color: '#9CA3AF',
        },
        {
            id: 3,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
    ];

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

    // AI message (left side) - Original design with voting and sources
    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.iconContainer}>
                    <IconAssets.Frame />
                </View>
                <Text style={styles.timeText}>{time}</Text>
            </View>

            {/* Show agent status when streaming */}
            {isStreaming && (agentStatus || currentAgentStatus) && (
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>
                        {agentStatus || currentAgentStatus}
                    </Text>
                    <View style={styles.loadingDots}>
                        <View style={[styles.dot, styles.dot1]} />
                        <View style={[styles.dot, styles.dot2]} />
                        <View style={[styles.dot, styles.dot3]} />
                    </View>
                </View>
            )}

            <Text style={styles.messageText}>
                {message}
                {isStreaming && <Text style={{ color: '#FF6A00' }}>|</Text>}
            </Text>

            {highlight && (
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

            {/* Source Pills */}
            {sources && sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                    <Text style={styles.sourcesLabel}>Sources:</Text>
                    <SourcePills sources={sources} theme={theme} />
                </View>
            )}

            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.sourceButton} onPress={() => setSourceVisible(true)}>
                    <Text style={styles.sourceText}>Sources</Text>
                </TouchableOpacity>

                <View style={styles.actionIcons}>
                    {liked || (hasVoted && voteType === 'upvote') ? (
                        <TouchableOpacity onPress={() => {
                            // Already voted, can't change
                        }}>
                            <IconAssets.ThumbsUpBold />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleLike}>
                            <IconAssets.ThumbsUp />
                        </TouchableOpacity>
                    )}
                    
                    {disliked || (hasVoted && voteType === 'downvote') ? (
                        <TouchableOpacity onPress={() => {
                            // Already voted, can't change
                        }}>
                            <IconAssets.ThumbsDownBold />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleDislike}>
                            <IconAssets.ThumbsDown />
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity>
                        <IconAssets.Flag />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <IconAssets.Copy />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <IconAssets.Refresh />
                    </TouchableOpacity>
                </View>
            </View>

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