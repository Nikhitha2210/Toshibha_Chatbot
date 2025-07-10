import { StyleSheet } from 'react-native';

import Colors from '../../theme/colors';

export const getStyles = (theme: 'light' | 'dark') => {
    const colorScheme = Colors[theme];

    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
        },
        sidebarWrapper: {
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
        },
        sidebar: {
            height: '100%',
            backgroundColor: theme === 'dark' ? colorScheme.background2 : colorScheme.background,
            paddingHorizontal: 10,
            paddingTop: 20
        },
        advanceSearchText: {
            color: '#E61E1E',
            marginBottom: 20,
            textDecorationLine: 'underline',
            fontSize: 16,
            fontWeight: '600'
        },
        divider: {
            height: 1,
            backgroundColor: colorScheme.stroke,
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
            color: colorScheme.text,
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
            color: colorScheme.text,
            marginLeft: 10
        },
        myQueriesWrapper: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginVertical: 15,
        },
        myQuerieText: {
            color: theme === 'dark' ? Colors.dark.subText : Colors.light.text,
            fontSize: 14,
            fontWeight: '600'
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
            color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
            marginBottom: 8,
            fontSize: 14,
            fontWeight: '600'
        },
        recentQueryText: {
            color: theme === 'dark' ? Colors.dark.subText : Colors.light.lightText,
            marginVertical: 3,
            marginLeft: 10,
            fontSize: 13,
            lineHeight: 18
        },
        recentQueryIcon: {
            color: Colors.dark.primary,
        },
        sessionItem: {
            paddingVertical: 4,
            paddingHorizontal: 5,
            borderRadius: 6,
            marginVertical: 1,
        },
        settingWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        settingIcon: {
            width: 20,
            height: 20,
            resizeMode: 'contain'
        },
        settingsText: {
            color: theme === 'dark' ? Colors.dark.subText : Colors.light.text,
            marginLeft: 10
        },
        settingsScreen: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },

        backButton: {
            alignSelf: 'flex-start',
            marginBottom: 20,
        },

        backButtonText: {
            fontSize: 16,
            color: Colors.dark.primary,
        },

        logoutButton: {
            backgroundColor: '#B42626',
            padding: 12,
            borderRadius: 8,
        },

        logoutButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },

    });
}