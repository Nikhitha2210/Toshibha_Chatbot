import React from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { getThemedIcon } from '../../assets/icons/IconAssets';
import { useThemeContext } from '../../context/ThemeContext';

type HeaderTypes = {
    onMenuPress: () => void
}

const Header = (props: HeaderTypes) => {

    const { theme } = useThemeContext();

    const ThemedLogoIcon = getThemedIcon('Logo', theme);
    const ThemedMenuIcon = getThemedIcon('Menu', theme);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={props?.onMenuPress}>
                {ThemedMenuIcon && <ThemedMenuIcon style={styles.icon} />}
            </TouchableOpacity>
            {ThemedLogoIcon && <ThemedLogoIcon style={styles.logo} />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 25,
    },
    icon: {
        height: 25,
        width: 25,
        resizeMode: 'contain',
    },
    logo: {
        height: 40,
        width: 100,
        resizeMode: 'contain',
    },
});

export default Header;