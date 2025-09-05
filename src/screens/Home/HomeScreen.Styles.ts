import { StyleSheet, Dimensions } from "react-native";
import Colors from "../../theme/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const getStyles = (theme: 'light' | 'dark') => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background,
        },
        
        headerContainer: {
            paddingHorizontal: 20,
            paddingTop: 0,
            backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background,
        },
        
        headerText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme === 'dark' ? Colors.dark.text : Colors.light.heading,
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
        
        contentContainer: {
            flex: 1,
            paddingHorizontal: 20,
            marginBottom: 120, // Space for fixed input at bottom
        },
        
        promptCardsContainer: {
            alignItems: 'center',
            marginBottom: 20,
        },
        
        recentQueriesContainer: {
            flex: 1,
            minHeight: 250,
            maxHeight: SCREEN_HEIGHT * 0.5,
        },
        
        inputWrapper: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme === 'dark' ? Colors.dark.background2 : Colors.light.background2,
            borderTopEndRadius: 20,
            borderTopStartRadius: 20,
            paddingVertical: 20,
            paddingHorizontal: 20,
            paddingBottom: 25,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
        },
        
        leftEdgeGestureArea: {
            position: 'absolute',
            left: 0,
            top: 100,
            width: 30,
            height: '80%',
            zIndex: 1,
        }
    })
}