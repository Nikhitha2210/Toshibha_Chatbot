import { Dimensions, StyleSheet } from 'react-native';

import Colors from '../../theme/colors';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        width: (2 * Dimensions.get('screen').width),
        left: -Dimensions.get('screen').width,
        backgroundColor: Colors.dark.background
    },
    mainWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: Dimensions.get('screen').width,
        height: '100%'
    },
    mainWrapperOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9,
        opacity: 0.5,
    },
    mainContent: {
        alignItems: 'center',
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 8
    },
    headerSubText: {
        fontSize: 14,
        color: Colors.dark.subText,
        textAlign: 'center'
    },

    navigationWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: Dimensions.get('screen').width,
        height: '100%',
        backgroundColor: Colors.dark.background2
    },

    closeButton: {
        backgroundColor: 'red',
        paddingVertical: 10,
        paddingHorizontal: 20
    },
    openButton: {
        backgroundColor: 'green',
        paddingVertical: 10,
        paddingHorizontal: 20
    },
    btnText: {
        color: 'white'
    },

});

export default styles;