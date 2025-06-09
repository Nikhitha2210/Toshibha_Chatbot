import { StyleSheet } from "react-native";

import Colors from "../../theme/colors";

export const getStyles = (theme: 'light' | 'dark') => {
    const colorScheme = Colors[theme];

    return StyleSheet.create({

        promptCardsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 20,
            width: '100%',
        },
        card: {
            backgroundColor: theme === 'dark' ? Colors.dark.background2 : Colors.light.background2,
            borderRadius: 15,
            padding: 12,
            width: '32%',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            height: 150,
            borderWidth: 1,
            borderColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
            position: 'relative',
        },
        cardIcon: {
            width: 25,
            height: 25,
            marginBottom: 8
        },
        cardTitle: {
            color: Colors.dark.subText,
            fontSize: 12,
            fontWeight: '500',
            lineHeight: 18
        },
        cardArrow: {
            position: 'absolute',
            bottom: 10,
            right: 10,
            width: 13,
            height: 13
        },
    })
}