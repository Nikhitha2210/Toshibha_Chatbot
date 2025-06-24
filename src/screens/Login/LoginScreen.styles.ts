import { StyleSheet } from 'react-native';
import Colors from '../../theme/colors';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background2,
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 20,
        backgroundColor: Colors.dark.background2,
    },
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        paddingTop: 60, 
    },
    logoWrapper: {
        position: 'absolute',
        top: 50, 
        right: 20,
        zIndex: 1, 
    },
    logo: {
        height: 40, 
        width: 96, 
    },
    mainWrapper: {
        justifyContent: 'center',
        paddingHorizontal: 0,
        marginTop: 20, 
    },
    centreText: {
        marginBottom: 60,
        paddingTop: 20, 
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
        paddingVertical: 8,
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
        paddingVertical: 12,
        fontSize: 16,
    },
    signInButton: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
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
        paddingVertical: 12,
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
        paddingVertical: 20,
        alignItems: 'center',
        backgroundColor: Colors.dark.background2,
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