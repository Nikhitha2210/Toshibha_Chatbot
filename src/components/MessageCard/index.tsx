import React, { useMemo, useRef, useState } from 'react';

import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { styles } from './styles';
import IconAssets from '../../assets/icons/IconAssets';
import FeedbackModal from '../Feedback/Feedback';
import SourceModal from '../Source';

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
}

const MessageCard: React.FC<MessageCardProps> = ({ time, message, highlight }) => {
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [sourceVisible, setSourceVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'Links' | 'Images'>('Links');

    const [harmful, setHarmful] = useState(false);
    const [untrue, setUntrue] = useState(false);
    const [unhelpful, setUnhelpful] = useState(false);

    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);

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
        {
            id: 4,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
        {
            id: 5,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
        {
            id: 6,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
        {
            id: 7,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
        {
            id: 8,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
        {
            id: 9,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
        {
            id: 10,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
        {
            id: 11,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
        {
            id: 12,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
        {
            id: 13,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
        {
            id: 14,
            label: 'Source 3',
            title: 'Source Article Title 3',
            date: 'March 18',
            color: '#10B981',
        },
    ];

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.iconContainer}>
                    <IconAssets.Frame />
                </View>
                <Text style={styles.timeText}>{time}</Text>
            </View>
            <Text style={styles.messageText}>{message}</Text>

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

            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.sourceButton} onPress={() => setSourceVisible(true)}>
                    <Text style={styles.sourceText}>Sources</Text>
                </TouchableOpacity>

                <View style={styles.actionIcons}>
                    {liked ? (
                        <IconAssets.ThumbsUpBold onPress={() => {
                            setLiked(false);
                        }} />
                    ) : (
                        <IconAssets.ThumbsUp onPress={() => {
                            setLiked(true);
                            setDisliked(false);
                        }} />
                    )}
                    {disliked ? (
                        <IconAssets.ThumbsDownBold onPress={() => {
                            setDisliked(false);
                        }} />
                    ) : (
                        <IconAssets.ThumbsDown onPress={() => {
                            setDisliked(true);
                            setLiked(false);
                            setFeedbackVisible(true);
                        }} />
                    )}
                    <IconAssets.Flag />
                    <IconAssets.Copy />
                    <IconAssets.Refresh />
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