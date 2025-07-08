import React from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'

import { usePrompt } from '../../context/PromptContext';
import { useChat } from '../../context/ChatContext';
import { getStyles } from './styles';
import { useThemeContext } from '../../context/ThemeContext';

const RecentQueries = () => {
    const { setInputText } = usePrompt();
    const { recentQueries, error, clearError } = useChat();

    const { theme } = useThemeContext();
    const styles = getStyles(theme);

    const handleQueryPress = (queryText: string) => {
        try {
            console.log('RecentQuery clicked:', queryText);
            setInputText(queryText);
            if (error) clearError();
            console.log('Input text set to:', queryText);
        } catch (err) {
            console.error('Error setting input text:', err);
        }
    }

    const formatTimeAgo = (timestamp: string): string => {
        try {
            const now = new Date();
            const queryTime = new Date(timestamp);
            const diffMs = now.getTime() - queryTime.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return queryTime.toLocaleDateString();
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Recently';
        }
    };

    const hasQueries = recentQueries && recentQueries.length > 0;

    const renderQueryItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.recentCard}
            onPress={() => handleQueryPress(item.message)}
            activeOpacity={0.7}
        >
            <Text style={styles.recentCardTitle} numberOfLines={2}>
                {item.message}
            </Text>
            <Text style={styles.recentCardSubtitle}>
                {formatTimeAgo(item.timestamp)}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.recentQueriesContainer}>
            <View style={styles.recentQueriesHeader}>
                <Text style={styles.recentTitle}>Recent Queries</Text>
                {error && (
                    <TouchableOpacity onPress={clearError}>
                        <Text style={{ color: '#ff6b6b', fontSize: 10 }}>Clear Error</Text>
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <View style={{
                    backgroundColor: '#ffebee',
                    padding: 8,
                    borderRadius: 6,
                    marginBottom: 10,
                    borderLeftWidth: 3,
                    borderLeftColor: '#f44336'
                }}>
                    <Text style={{ color: '#c62828', fontSize: 12 }}>
                        Error loading recent queries: {error}
                    </Text>
                </View>
            )}

            {hasQueries ? (
                <FlatList
                    data={recentQueries}
                    renderItem={renderQueryItem}
                    keyExtractor={(item) => item.id}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 10 }}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    scrollEnabled={true}
                    bounces={true}
                    keyboardShouldPersistTaps="handled"
                    removeClippedSubviews={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                />
            ) : (
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>
                        You haven't asked anything yet.{"\n"}Your recent queries will appear here.
                    </Text>
                </View>
            )}
        </View>
    )
}

export default RecentQueries;