import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const getStyles = (theme: 'light' | 'dark') => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme === 'dark' ? Colors.dark.background2 : Colors.light.background,
        },
        topBar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 10,
            paddingTop: 25,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
        },
        topBarTitle: {
            fontSize: 18,
            color: Colors.dark.subText,
            fontWeight: '600',
        },
        newChatButton: {
            padding: 8,
            borderRadius: 8,
            minWidth: 40,
            minHeight: 40,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
        },
        
        // ✅ FIXED MESSAGES CONTAINER - proper flex structure
        messagesContainer: {
            flex: 1, // Takes remaining space
            marginBottom: 120, // Space for absolute positioned input
        },
        
        // ✅ FIXED SCROLLVIEW - full height within container
        scrollView: {
            flex: 1,
            backgroundColor: 'transparent',
        },
        
        // ✅ FIXED SCROLL CONTENT - proper padding for input space
        scrollContent: {
            padding: 20,
            paddingBottom: 60, // Extra space for last message above input
            flexGrow: 1,
            minHeight: SCREEN_HEIGHT * 0.3, // Minimum scrollable height
        },
        
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: SCREEN_HEIGHT * 0.4,
        },
        emptyStateText: {
            color: theme === 'dark' ? Colors.dark.subText : Colors.light.lightText,
            fontSize: 16,
            textAlign: 'center',
            fontStyle: 'italic',
        },
        
        // ✅ FIXED INPUT WRAPPER - absolute positioning keeps it at bottom
        inputWrapper: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 1,
            elevation: 10, // Android shadow
            shadowColor: '#000', // iOS shadow
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
        },
        
        inputContainer: {
            backgroundColor: theme === 'dark' ? Colors.dark.background2 : Colors.light.background2,
            borderTopLeftRadius: 19,
            borderTopRightRadius: 19,
            paddingVertical: 20,
            paddingHorizontal: 20,
            paddingBottom: 25, // Extra padding for Samsung devices
        },
        
        leftEdgeGestureArea: {
            position: 'absolute',
            left: 0,
            top: 120,
            width: 30,
            height: '70%',
            zIndex: 1,
        }
    });
}