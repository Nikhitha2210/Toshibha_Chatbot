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
        paddingTop: 60, // Add top padding to avoid logo overlap
    },
    logoWrapper: {
        position: 'absolute',
        top: 50, // Moved down to avoid status bar
        right: 20, // More margin from edge
        zIndex: 1, // Ensure it's above content but not overlapping
    },
    logo: {
        height: 40, // Slightly smaller
        width: 96, // Proportionally smaller
    },
    mainWrapper: {
        justifyContent: 'center',
        paddingHorizontal: 0,
        marginTop: 20, // Add margin to push content below logo
    },
    centreText: {
        marginBottom: 60,
        paddingTop: 20, // Extra padding to ensure no overlap
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