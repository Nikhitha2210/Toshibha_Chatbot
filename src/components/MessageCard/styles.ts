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
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    bottomSheet: {
        backgroundColor: Colors.dark.background3,
        padding: 20,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '70%',
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: Colors.dark.subText,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 12,
    },
    tabsRow: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.background2,
        borderRadius: 10,
        alignSelf: 'center',
        marginBottom: 16,
        marginTop: 8,
        padding: 5
    },
    tabButton: {
        flex: 1,
        paddingVertical: 4,
        paddingHorizontal: 16,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: Colors.dark.stroke,
    },
    activeTabText: {
        color: Colors.dark.primary
    },
    tabText: {
        color: Colors.dark.subText,
        fontSize: 14,
    },
    linksContainer: {
        gap: 12,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    sourceDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 5,
    },
    sourceLabel: {
        color: Colors.dark.subText,
        fontSize: 12,
    },
    sourceTitle: {
        color: Colors.dark.text,
        fontSize: 13,
        fontWeight: 'bold',
    },
    sourceDate: {
        color: Colors.dark.subText,
        fontSize: 12,
    },
})