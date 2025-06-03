import { StyleSheet } from "react-native";

import Colors from "../../theme/colors";

export const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.dark.background,
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconContainer: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 20,
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    timeText: {
        color: Colors.dark.primary,
        fontSize: 14,
    },
    messageText: {
        color: Colors.dark.subText,
        fontSize: 14,
        marginBottom: 10,
    },
    highlightBox: {
        marginHorizontal: 35,
        marginVertical: 15
    },
    productTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: Colors.dark.text,
        marginBottom: 6,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    ratingText: {
        color: Colors.dark.subText,
        marginLeft: 4,
    },
    highlightDesc: {
        color: Colors.dark.subText,
        fontSize: 13,
    },
    actionsRow: {
        flexDirection: 'row',
        marginTop: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sourceButton: {
        backgroundColor: Colors.dark.stroke,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.dark.subText
    },
    sourceText: {
        color: Colors.dark.subText,
        fontSize: 10,
    },
    actionIcons: {
        flexDirection: 'row',
        gap: 10
    }
})