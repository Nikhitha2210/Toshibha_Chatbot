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
        flex: 1,
        alignItems: 'center',
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
    inputContainer: {
        backgroundColor: Colors.dark.background2,
        borderTopEndRadius: 20,
        borderTopStartRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 20
    },
    navigationWrapper: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: Dimensions.get('screen').width,
        height: '100%',
        backgroundColor: Colors.dark.background2,
    },
    navigationContentWrapper: {
        flex: 1,
        marginLeft: 90,
        paddingTop: 40,
        paddingBottom: 20,
    },
    advanceSearchText: {
        color: '#FF6A00',
        marginBottom: 20,
        textDecorationLine: 'underline'
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.stroke,
    },
    navigationProjects: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20
    },
    navigationProjectsIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain'
    },
    navigationProjectsText: {
        color: Colors.dark.text,
        marginLeft: 10
    },
    navigationExploreQueries: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    navigationExploreQueriesIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain'
    },
    navigationExploreQueriesText: {
        color: Colors.dark.text,
        marginLeft: 10
    },
    myQueriesWrapper: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginVertical: 15,
    },
    myQuerieText: {
        color: Colors.dark.subText,
        fontSize: 14,
        marginRight: 10
    },
    myQueryToogleWrapper: {
        width: 40,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.dark.primary,
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: 3
    },
    myQueryToogleButton: {
        width: 14,
        height: 14,
        backgroundColor: Colors.dark.text,
        borderRadius: 7
    },
    myQueriesIcon: {
        marginLeft: 10
    },
    recentQueriesWrapper: {
        marginBottom: 15
    },
    recentQueryTitle: {
        color: Colors.dark.text,
        marginBottom: 5
    },
    recentQueryText: {
        color: Colors.dark.subText,
        marginVertical: 2,
        marginLeft: 10,
        fontSize: 13
    },
    recentQueryIcon: {
        color: Colors.dark.primary,
    },
    settingWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    settingIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain'
    },
    settingsText: {
        color: Colors.dark.subText,
        marginLeft: 10
    }
});

export default styles;