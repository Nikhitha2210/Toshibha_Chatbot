import { StyleSheet } from 'react-native';

import Colors from '../../theme/colors';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        backgroundColor: Colors.dark.background2,
    },
    wrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    logoWrapper: {
        position: 'absolute',
        top: 20,
        right: 24,
    },
    logo: {
        width: 120,
        height: 60,
    },
    mainWrapper: {
        justifyContent: 'center',
    },
    centreText: {
        marginBottom: 60
    },
    title: {
        color: Colors.dark.text,
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
    subtitle: {
        color: Colors.dark.subText,
        textAlign: 'center',
        marginTop: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.background,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: Colors.dark.text,
    },
    signInButton: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        opacity: 1,
    },
    signInButtonText: {
        color: Colors.dark.text,
        fontWeight: '600',
        fontSize: 16,
    },
    dividerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.dark.subText,
    },
    dividerText: {
        marginHorizontal: 10,
        color: Colors.dark.text,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        paddingVertical: 10,
        borderRadius: 10,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 8,
    },
    googleButtonText: {
        color: Colors.dark.text,
        fontSize: 16,
    },
    footer: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    footerText: {
        color: Colors.dark.text,
        fontSize: 12,
    },
    footerLink: {
        color: Colors.dark.primary,
    },
});

export default styles;