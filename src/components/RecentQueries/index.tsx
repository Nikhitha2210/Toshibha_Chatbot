import React from 'react'

import { Text, TouchableOpacity, View } from 'react-native'

import { usePrompt } from '../../context/PromptContext';

import { styles } from './styles';

const RecentQueries = () => {

    const { setInputText } = usePrompt();

    const recentQueries = [
        {
            title: "Part Number LookUp",
            subtitle: "How to Troubleshoot Common Issues with the X200 Smartwatch"
        },
        {
            title: "Firmware Update Guide",
            subtitle: "Steps to Optimize Battery Life on the X200 Smartwatch"
        },
        {
            title: "User Manual Overview",
            subtitle: "Understanding the Features and Functions of the X200 Smartwatch"
        }
    ];

    const handleQueryPress = (queryText: string) => {
        setInputText(queryText)
    }

    return (
        <View style={styles.recentQueriesContainer}>
            <View style={styles.recentQueriesHeader}>
                <Text style={styles.recentTitle}>Recent Queries</Text>
                <Text style={styles.seeAllText}>see all</Text>
            </View>

            {recentQueries.map((query, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.recentCard}
                    onPress={() => handleQueryPress(query.subtitle)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.recentCardTitle}>{query.title}</Text>
                    <Text style={styles.recentCardSubtitle}>{query.subtitle}</Text>
                </TouchableOpacity>
            ))}
        </View>

    )
}

export default RecentQueries;