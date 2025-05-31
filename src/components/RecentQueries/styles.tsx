import { StyleSheet } from "react-native";

import Colors from "../../theme/colors";

export const styles = StyleSheet.create({
    recentQueriesContainer: {
        marginTop: 20,
        width: '100%',
    },
    recentQueriesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    recentTitle: {
        color: Colors.dark.subText,
        fontWeight: 'bold',
        fontSize: 14
    },
    seeAllText: {
        color: Colors.dark.subText,
        fontSize: 13
    },
    recentCard: {
        backgroundColor: Colors.dark.background3,
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333'
    },
    recentCardTitle: {
        color: Colors.dark.text,
        fontWeight: 'bold',
        fontSize: 13,
        marginBottom: 4
    },
    recentCardSubtitle: {
        color: Colors.dark.subText,
        fontSize: 12
    },
})