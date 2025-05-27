import { StyleSheet } from "react-native";

import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

import Colors from "../../theme/colors";

export const styles = StyleSheet.create({
    feedbackOverlay: {
        position: 'absolute',
        width,
        height,
        top: 0,
        left: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    feedbackModal: {
        backgroundColor: Colors.dark.background,
        padding: 20,
        borderRadius: 15,
        width: '90%',
    },
    feedbackTitle: {
        fontSize: 14,
        color: Colors.dark.text,
        marginBottom: 12,
    },
    feedbackInput: {
        height: 100,
        borderColor: Colors.dark.stroke,
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        color: Colors.dark.subText,
        marginBottom: 2,
        textAlignVertical: 'top',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2,
    },
    checkboxLabel: {
        color: Colors.dark.subText,
        marginLeft: 4,
    },
    submitBtn: {
        marginTop: 10,
        backgroundColor: Colors.dark.stroke,
        paddingVertical: 5,
        paddingHorizontal: 15,
        alignItems: 'center',
        borderRadius: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: Colors.dark.subText
    },
    submitBtnText: {
        color: Colors.dark.subText,
        fontSize: 12
    },
})