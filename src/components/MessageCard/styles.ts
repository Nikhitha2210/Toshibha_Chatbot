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
        statusContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: theme === 'dark' ? Colors.dark.background3 : Colors.light.background,
            borderRadius: 6,
        },
        statusText: {
            color: '#FF6A00',
            fontSize: 13,
            fontStyle: 'italic',
            marginRight: 8,
        },
        loadingDots: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        dot: {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#FF6A00',
            marginHorizontal: 1,
        },
        dot1: {
            opacity: 0.4,
        },
        dot2: {
            opacity: 0.7,
        },
        dot3: {
            opacity: 1,
        },
        messageText: {
            color: theme === 'dark' ? Colors.dark.subText : Colors.light.iconGrey,
            fontSize: 14,
            marginBottom: 10,
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
        sourcesContainer: {
            marginTop: 12,
            marginBottom: 8,
        },
        sourcesLabel: {
            color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 4,
            marginLeft: 5,
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
}