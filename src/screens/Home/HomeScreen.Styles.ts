import { StyleSheet } from "react-native";

import Colors from "../../theme/colors";

export const getStyles = (theme: 'light' | 'dark') => {
    const colorScheme = Colors[theme];

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background,
        },
        mainWrapper: {
            flex: 1,
            width: '100%',
            height: '100%',
            paddingTop: 20
        },
        centerContainer: {
            flex: 1,
        },
        headerText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme === 'dark' ? Colors.dark.text : Colors.light.heading,
            marginBottom: 8,
            marginTop: 30,
            textAlign: 'center'
        },
        headerSubText: {
            fontSize: 14,
            color: Colors.dark.subText,
            textAlign: 'center',
            marginBottom: 30
        },
        queriesContainer: {
            paddingHorizontal: 20,
            alignItems: 'center',
        },
        inputContainer: {
            backgroundColor: Colors.dark.background2,
            borderTopEndRadius: 20,
            borderTopStartRadius: 20,
            paddingVertical: 20,
            paddingHorizontal: 20
        },
    })
}