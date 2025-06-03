import React from 'react'

import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

import { usePrompt } from '../../context/PromptContext';
import { useChat } from '../../context/ChatContext';

import { styles } from './styles';

const RecentQueries = () => {

    const { setInputText } = usePrompt();
    const { messages } = useChat();


    const handleQueryPress = (queryText: string) => {
        setInputText(queryText)
    }

    const hasMessages = messages && messages.length > 0;

    return (
        <View style={styles.recentQueriesContainer}>
            <View style={styles.recentQueriesHeader}>
                <Text style={styles.recentTitle}>Recent Queries</Text>
            </View>

            <ScrollView contentContainerStyle={hasMessages ? null : styles.emptyStateContainer}>
                {hasMessages ? (
                    messages.map((msg) => (
                        <TouchableOpacity
                            style={styles.recentCard}
                            onPress={() => handleQueryPress(msg.message)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.recentCardTitle}>{msg.message}</Text>
                            <Text style={styles.recentCardSubtitle}>{msg.time}</Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View>
                        <Text style={styles.emptyStateText}>
                            You haven't asked anything yet.{"\n"}Your recent queries will appear here.
                        </Text>
                    </View>
                )}
            </ScrollView>

        </View>

    )
}

export default RecentQueries;