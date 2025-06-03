import React from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import IconAssets from '../../assets/icons/IconAssets';

type HeaderTypes = {
    onMenuPress: () => void
}

const Header = (props: HeaderTypes) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={props?.onMenuPress}>
                <IconAssets.Menu style={styles.icon} />
            </TouchableOpacity>
            <IconAssets.Logo style={styles.logo} />
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