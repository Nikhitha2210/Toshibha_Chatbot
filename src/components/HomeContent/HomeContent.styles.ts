import { Dimensions, StyleSheet } from 'react-native';

import Colors from '../../theme/colors';

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
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
        flex: 1,
        paddingTop: 20,
    },
    centerContainer: {
        flex: 1,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
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
});

export default styles;