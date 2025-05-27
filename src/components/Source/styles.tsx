import { StyleSheet } from "react-native";

import Colors from "../../theme/colors";

export const styles = StyleSheet.create({
    bottomSheet: {
        backgroundColor: Colors.dark.background3,
        padding: 20,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '85%',
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