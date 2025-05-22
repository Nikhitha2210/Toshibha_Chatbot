import React from 'react';

import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

type HeaderTypes = {
    onMenuPress: () => void
}

const Header = (props: HeaderTypes) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={props?.onMenuPress}>
                <Image
                    source={require('../../assets/images/menu.png')}
                    style={styles.icon}
                />
            </TouchableOpacity>

            <Image
                source={require('../../assets/images/elevaite.png')}
                style={styles.logo}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 20,
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