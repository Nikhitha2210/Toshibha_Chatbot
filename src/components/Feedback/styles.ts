import { StyleSheet } from "react-native";

import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

import Colors from "../../theme/colors";

export const getStyles = (theme: 'light' | 'dark') => {
    const colorScheme = Colors[theme];

    return StyleSheet.create({
        feedbackOverlay: {
            position: 'absolute',
            width,
            height,
            top: 0,
            left: 0,
            backgroundColor: theme === 'dark'
                ? 'rgba(0, 0, 0, 0.5)'
                : 'rgba(255, 255, 255, 0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
        },
        feedbackModal: {
            backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background,
            padding: 20,
            borderRadius: 15,
            width: '90%',
            borderWidth: theme === 'light' ? 1 : 0,
            borderColor: theme === 'light' ? Colors.light.stroke : 'transparent'
        },
        feedbackTitle: {
            fontSize: 14,
            color: theme === 'dark' ? Colors.dark.text : Colors.light.iconGrey,
            marginBottom: 12,
        },
        feedbackInput: {
            height: 100,
            borderColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
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
}