import { StyleSheet } from "react-native";

import Colors from "../../theme/colors";

export const styles = StyleSheet.create({
    askSection: {
        width: '100%',
        backgroundColor: Colors.dark.background,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10
    },
    askText: {
        color: Colors.dark.subText,
        fontSize: 13
    },
    askInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    askButton: {
        backgroundColor: Colors.dark.background2,
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginRight: 3,
        borderWidth: 1,
        borderColor: Colors.dark.stroke
    },
    btnText: {
        color: Colors.dark.subText,
        fontSize: 12
    },
    micIcon: {
        width: 22,
        height: 22
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#333',
        marginHorizontal: 2,
    }
})