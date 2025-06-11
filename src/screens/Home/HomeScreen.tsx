import { useState } from 'react';
import { View, Animated, Dimensions, Text, ScrollView } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { getStyles } from './HomeScreen.Styles';
import Header from '../../components/header';
import Sidebar from '../../components/Sidebar';
import PromptCards from '../../components/PromptCards';
import RecentQueries from '../../components/RecentQueries';
import PromptInput from '../../components/PromptInput';
import { useThemeContext } from '../../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

const HomeScreen = () => {
    const [isModalVisible, setModalVisible] = useState(false);
    const slideAnim = useState(new Animated.Value(-SCREEN_WIDTH))[0];

    const { theme } = useThemeContext();
    const styles = getStyles(theme);

    const openMenu = () => {
        setModalVisible(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
        }).start();
    };

    const closeMenu = () => {
        Animated.timing(slideAnim, {
            toValue: -SCREEN_WIDTH,
            duration: 100,
            useNativeDriver: true,
        }).start(() => setModalVisible(false));
    };

    // Swipe gesture only for left edge swipe detection
    const swipeGesture = Gesture.Pan()
        .onUpdate((e) => {
            // Only detect swipe from very left edge
            if (e.absoluteX < 50 && e.translationX > 80) {
                openMenu();
            }
        })
        .runOnJS(true);

    return (
        <View style={styles.container}>
            {/* Fixed Header - Outside of any gesture detector */}
            <View style={styles.headerContainer}>
                <Header onMenuPress={openMenu} />
                <Text style={styles.headerText}>What can I help with?</Text>
                <Text style={styles.headerSubText}>
                    Use one of most common prompts{'\n'}below to begin
                </Text>
            </View>

            {/* Scrollable Content - No gesture interference */}
            <View style={styles.contentContainer}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    scrollEnabled={true}
                    bounces={true}
                    alwaysBounceVertical={true}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Prompt Cards */}
                    <View style={styles.promptCardsContainer}>
                        <PromptCards />
                    </View>
                    
                    {/* Recent Queries */}
                    <View style={styles.recentQueriesContainer}>
                        <RecentQueries />
                    </View>
                </ScrollView>
            </View>

            {/* Fixed Input at Bottom */}
            <View style={styles.inputWrapper}>
                <View style={styles.inputContainer}>
                    <PromptInput clearOnSend={true} />
                </View>
            </View>

            {/* Gesture detector only on left edge - doesn't interfere with content */}
            <GestureDetector gesture={swipeGesture}>
                <View style={styles.leftEdgeGestureArea} />
            </GestureDetector>

            <Sidebar
                visible={isModalVisible}
                slideAnim={slideAnim}
                onClose={closeMenu}
            />
        </View>
    );
};

export default HomeScreen;