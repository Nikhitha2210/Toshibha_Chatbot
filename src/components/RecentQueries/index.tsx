import React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

import { usePrompt } from '../../context/PromptContext';
import { useChat } from '../../context/ChatContext';
import { styles } from './styles';

const RecentQueries = () => {
    const { setInputText } = usePrompt();
    const { recentQueries } = useChat();

    const handleQueryPress = (queryText: string) => {
        setInputText(queryText)
    }

    const hasQueries = recentQueries && recentQueries.length > 0;

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const queryTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - queryTime.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        return queryTime.toLocaleDateString();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Recent Queries</Text>
            
            {hasQueries ? (
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    scrollEnabled={true}
                    bounces={true}
                    nestedScrollEnabled={true}
                >
                    {recentQueries.map((query) => (
                        <TouchableOpacity
                            key={query.id}
                            style={styles.queryCard}
                            onPress={() => handleQueryPress(query.question)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.queryText} numberOfLines={2}>
                                {query.question}
                            </Text>
                            <Text style={styles.queryTime}>
                                {formatTimeAgo(query.timestamp)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                        You haven't asked anything yet.{"\n"}Your recent queries will appear here.
                    </Text>
                </View>
            )}
        </View>
    )
}

export default RecentQueries;