import { StyleSheet } from "react-native";

import Colors from "../../theme/colors";

export const styles = StyleSheet.create({
    askSection: {
        marginTop: 20,
        width: '90%',
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#333'
    },
    askText: {
        color: Colors.dark.text,
        marginBottom: 8,
        fontSize: 13
    },
    askInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    askButton: {
        backgroundColor: Colors.dark.background2,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#444'
    },
    btnText: {
        color: 'white'
    },
    micIcon: {
        width: 24,
        height: 24
    }
})