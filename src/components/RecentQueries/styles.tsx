import { StyleSheet } from "react-native";
import Colors from "../../theme/colors";

export const styles = StyleSheet.create({
    recentQueriesContainer: {
        marginTop: 20,
        width: '100%',
        paddingHorizontal: 0,
        paddingTop: 10,
        minHeight: 200,
        maxHeight: 400,
    },
    recentQueriesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    recentTitle: {
        color: Colors.dark.subText,
        fontWeight: 'bold',
        fontSize: 14
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
    emptyStateContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    emptyStateText: {
        color: Colors.dark.subText,
        fontSize: 13,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    // Alternative styles for different layout
    container: {
        flex: 1,
        width: '100%',
    },
    title: {
        color: Colors.dark.subText,
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 15,
    },
    scrollView: {
        flex: 1,
        maxHeight: 250,
    },
    scrollContent: {
        paddingBottom: 10,
    },
    queryCard: {
        backgroundColor: Colors.dark.background3,
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333'
    },
    queryText: {
        color: Colors.dark.text,
        fontWeight: 'bold',
        fontSize: 13,
        marginBottom: 4,
        lineHeight: 18,
    },
    queryTime: {
        color: Colors.dark.subText,
        fontSize: 12,
    },
    emptyState: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        flex: 1,
    },
    emptyText: {
        color: Colors.dark.subText,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
});