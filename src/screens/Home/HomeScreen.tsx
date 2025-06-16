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

    const swipeGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (e.absoluteX < 50 && e.translationX > 80) {
                openMenu();
            }
        })
        .runOnJS(true);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Header onMenuPress={openMenu} />
                <Text style={styles.headerText}>What can I help with?</Text>
                <Text style={styles.headerSubText}>
                    Use one of most common prompts{'\n'}below to begin
                </Text>
            </View>

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
                    <View style={styles.promptCardsContainer}>
                        <PromptCards />
                    </View>

                    <View style={styles.recentQueriesContainer}>
                        <RecentQueries />
                    </View>
                </ScrollView>
            </View>

            <View style={styles.inputWrapper}>
                <View style={styles.inputContainer}>
                    <PromptInput clearOnSend={true} />
                </View>
            </View>

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