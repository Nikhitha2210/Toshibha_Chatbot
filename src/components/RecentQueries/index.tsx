import React from 'react'

import { Text, View } from 'react-native'
import { styles } from './styles';

const RecentQueries = () => {
    return (
        <View style={styles.recentQueriesContainer}>
            <View style={styles.recentQueriesHeader}>
                <Text style={styles.recentTitle}>Recent Queries</Text>
                <Text style={styles.seeAllText}>see all</Text>
            </View>

            <View style={styles.recentCard}>
                <Text style={styles.recentCardTitle}>Part Number LookUp</Text>
                <Text style={styles.recentCardSubtitle}>How to Troubleshoot Common Issues with the X200 Smartwatch</Text>
            </View>
            <View style={styles.recentCard}>
                <Text style={styles.recentCardTitle}>Firmware Update Guide</Text>
                <Text style={styles.recentCardSubtitle}>Steps to Optimize Battery Life on the X200 Smartwatch</Text>
            </View>
            <View style={styles.recentCard}>
                <Text style={styles.recentCardTitle}>User Manual Overview</Text>
                <Text style={styles.recentCardSubtitle}>Understanding the Features and Functions of the X200 Smartwatch</Text>
            </View>
        </View>

    )
}

export default RecentQueries;