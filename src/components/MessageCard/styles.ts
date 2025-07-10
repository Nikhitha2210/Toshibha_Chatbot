import { StyleSheet } from "react-native";
import Colors from "../../theme/colors";

export const getStyles = (theme: 'light' | 'dark') => {
    const colorScheme = Colors[theme];

    return StyleSheet.create({
        card: {
            backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background2,
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
            color: theme === 'dark' ? Colors.dark.subText : Colors.light.iconGrey,
            fontSize: 14,
            lineHeight: 20,
        },
        highlightBox: {
            marginHorizontal: 35,
            marginVertical: 15
        },
        productTitle: {
            fontWeight: 'bold',
            fontSize: 16,
            color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
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
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        sourceButton: {
            backgroundColor: Colors.dark.stroke,
            paddingVertical: 5,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: Colors.dark.subText
        },
        sourceText: {
            color: Colors.dark.subText,
            fontSize: 12,
        },
        voteButtons: {
            flexDirection: 'row',
            gap: 5,
        },
        voteButton: {
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 44,
            minHeight: 44,
        },
        actionIcons: {
            flexDirection: 'row',
            gap: 10
        },
        statusContainer: {
            backgroundColor: 'rgba(230, 30, 30, 0.1)',
            padding: 8,
            borderRadius: 6,
            marginBottom: 10,
            borderLeftWidth: 3,
            borderLeftColor: '#E61E1E',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        statusText: {
            fontStyle: 'italic',
            color: '#E61E1E',
            fontSize: 13,
            flex: 1,
        },
        loadingDots: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
        },
        loadingDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#E61E1E',
        },
    })
}