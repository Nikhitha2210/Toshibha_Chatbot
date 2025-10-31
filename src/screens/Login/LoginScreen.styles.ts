import { StyleSheet } from 'react-native';
import Colors from '../../theme/colors';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background2,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
        backgroundColor: Colors.dark.background2,
    },
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        minHeight: 600,
    },
    logoWrapper: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
        alignItems: 'flex-end',
    },
    logo: {
        height: 40,
        width: 96,
    },
    versionText: {
        color: Colors.dark.subText,
        fontSize: 12,
        marginTop: 4,
        fontWeight: '400',
        opacity: 0.7,
    },
    mainWrapper: {
        justifyContent: 'center',
        paddingHorizontal: 0,
        marginTop: 80,
        paddingBottom: 20,
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
        marginTop: 'auto',
    },
    footerText: {
        color: Colors.dark.text,
        fontSize: 12,
        textAlign: 'center'
    },
    footerLink: {
        color: Colors.dark.primary,
    },
    versionFooterText: {
        color: Colors.dark.subText,
        fontSize: 10,
        marginTop: 8,
        opacity: 0.6,
        fontWeight: '300',
    },
    link: {
        alignItems: 'center',
        flex: 1,
        marginTop: 10
    },
    linkText: {
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        color: Colors.dark.primary,
    },
    // NEW STYLES FOR BIOMETRIC FALLBACK
    biometricFallbackContainer: {
        marginTop: 20,
        padding: 16,
        backgroundColor: Colors.dark.background3,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: Colors.dark.primary,
    },
    biometricFallbackTitle: {
        color: Colors.dark.text,
        fontSize: 15,
        marginBottom: 8,
        fontWeight: '600',
    },
    biometricFallbackDescription: {
        color: Colors.dark.subText,
        fontSize: 13,
        marginBottom: 14,
        lineHeight: 18,
    },
    biometricRetryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 13,
        backgroundColor: Colors.dark.primary,
        borderRadius: 8,
        marginBottom: 10,
    },
    biometricRetryIcon: {
        marginRight: 8,
    },
    biometricRetryText: {
        color: Colors.dark.text,
        fontSize: 15,
        fontWeight: '600',
    },
    biometricPasswordLink: {
        alignItems: 'center',
        padding: 8,
    },
    biometricPasswordLinkText: {
        color: Colors.dark.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    eyeIconContainer: {
        padding: 8,
        marginLeft: 8,
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    errorText: {
        color: '#c62828',
        fontSize: 14,
    },
});

export default styles;