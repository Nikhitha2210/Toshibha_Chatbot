import { StyleSheet } from 'react-native';

import Colors from '../../theme/colors';

export const getStyles = (theme: 'light' | 'dark') => {
    const colorScheme = Colors[theme];

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme === 'dark' ? Colors.dark.background2 : Colors.light.background,
            paddingTop: 20
        },
        topBar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 10,
            paddingTop: 25,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
        },
        topBarTitle: {
            fontSize: 18,
            color: Colors.dark.subText,
            fontWeight: '600',
        },
        scrollContainer: {
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 10
        },
        scrollContent: {
            paddingBottom: 20,
        },
        wrapper: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
            paddingTop: 1
        },
        inputContainer: {
            backgroundColor: theme === 'dark' ? Colors.dark.background2 : Colors.light.background2,
            borderTopLeftRadius: 19,
            borderTopRightRadius: 19,
            paddingVertical: 20,
            paddingHorizontal: 20
        }
    });
}