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
        alignItems: 'center',
        marginTop: 60
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 8,
        marginTop: 30
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

    promptCardsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingHorizontal: 10,
        width: '100%',
    },
    card: {
        backgroundColor: Colors.dark.background2,
        borderRadius: 10,
        padding: 10,
        width: '30%',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        height: 100,
        borderWidth: 1,
        borderColor: '#333',
        position: 'relative',
    },
    cardIcon: {
        width: 20,
        height: 20,
        marginBottom: 5
    },
    cardTitle: {
        color: Colors.dark.text,
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 18
    },
    cardArrow: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 12,
        height: 12
    },
    recentQueriesContainer: {
        marginTop: 30,
        width: '90%',
    },
    recentQueriesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    recentTitle: {
        color: Colors.dark.text,
        fontWeight: 'bold',
        fontSize: 14
    },
    seeAllText: {
        color: Colors.dark.subText,
        fontSize: 12
    },
    recentCard: {
        backgroundColor: Colors.dark.background2,
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333'
    },
    recentCardTitle: {
        color: Colors.dark.text,
        fontWeight: 'bold',
        fontSize: 13,
        marginBottom: 4
    },
    recentCardSubtitle: {
        color: Colors.dark.subText,
        fontSize: 12
    },
});

export default styles;