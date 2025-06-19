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
            <TouchableOpacity 
                onPress={props?.onMenuPress}
                style={styles.menuButton}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
                {ThemedMenuIcon && <ThemedMenuIcon style={styles.icon} />}
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
                {ThemedLogoIcon && <ThemedLogoIcon style={styles.logo} />}
            </View>
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
    menuButton: {
        padding: 8,
        borderRadius: 8,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        height: 25,
        width: 25,
        resizeMode: 'contain',
    },
    logoContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    logo: {
        height: 40,
        width: 100,
        resizeMode: 'contain',
    },
});

export default Header;