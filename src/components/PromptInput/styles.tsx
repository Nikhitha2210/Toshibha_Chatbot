import { StyleSheet } from "react-native";

import Colors from "../../theme/colors";

export const getStyles = (theme: 'light' | 'dark') => {
    const colorScheme = Colors[theme];

    return StyleSheet.create({
        askSection: {
            width: '100%',
            backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background,
            paddingVertical: 10,
            paddingHorizontal: 10,
            borderRadius: 10,
            borderColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
            borderWidth: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        askText: {
            color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
            fontSize: 13
        },
        askInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        askButton: {
            backgroundColor: theme === 'dark' ? Colors.dark.background2 : Colors.light.background,
            paddingVertical: 5,
            paddingHorizontal: 15,
            borderRadius: 10,
            marginRight: 3,
            borderWidth: 1,
            borderColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
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
}