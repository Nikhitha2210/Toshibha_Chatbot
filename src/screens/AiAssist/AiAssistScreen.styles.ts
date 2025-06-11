import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const getStyles = (theme: 'light' | 'dark') => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme === 'dark' ? Colors.dark.background2 : Colors.light.background,
            paddingTop: 20
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
        messagesContainer: {
            flex: 1,
            marginBottom: 120, // Space for input
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            padding: 20,
            paddingBottom: 40,
            minHeight: SCREEN_HEIGHT * 0.5, // Ensure minimum scrollable height
        },
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
        },
        emptyStateText: {
            color: theme === 'dark' ? Colors.dark.subText : Colors.light.lightText,
            fontSize: 16,
            textAlign: 'center',
            fontStyle: 'italic',
        },
        inputWrapper: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 1,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
        },
        inputContainer: {
            backgroundColor: theme === 'dark' ? Colors.dark.background2 : Colors.light.background2,
            borderTopLeftRadius: 19,
            borderTopRightRadius: 19,
            paddingVertical: 20,
            paddingHorizontal: 20
        },
        leftEdgeGestureArea: {
            position: 'absolute',
            left: 0,
            top: 120, // Start below the header and topBar to avoid button interference
            width: 30,
            height: '70%', // Don't cover full height
            zIndex: 1, // Lower z-index to not block buttons
        }
    });
}