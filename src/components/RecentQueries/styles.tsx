import { StyleSheet } from "react-native";
import Colors from "../../theme/colors";

export const styles = StyleSheet.create({
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
        maxHeight: 250, // Limit height to ensure it doesn't take too much space
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