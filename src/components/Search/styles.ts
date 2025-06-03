import { StyleSheet } from 'react-native';
import Colors from '../../theme/colors';

export const getStyles = (theme: 'light' | 'dark') => {

    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
            paddingHorizontal: 10
        },
        searchWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '85%',
            borderRadius: 10,
            paddingHorizontal: 10,
            backgroundColor: theme === 'dark' ? Colors.dark.subText : Colors.light.background2,
        },
        searchIcon: {
            width: 20,
            height: 20,
            resizeMode: 'contain',
        },
        searchInput: {
            width: '85%',
            fontSize: 15,
        },
        clearIcon: {
            width: 18,
            height: 18,
        },
        pencilIconWrapper: {
            width: 20,
            height: 20,
        },
        pencilIcon: {
            width: '100%',
            height: '100%',
            resizeMode: 'contain',
        },
    });
}