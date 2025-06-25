import React, { useState, useEffect } from 'react';
import {
    View,
    Animated,
    Dimensions,
    Text,
    SafeAreaView as RN_SafeAreaView,
    Keyboard,
    Platform
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [androidVersion, setAndroidVersion] = useState(0);

    const insets = useSafeAreaInsets();
    const EXTRA_BOTTOM_PADDING = 12; // <-- Add this extra value

    const { theme } = useThemeContext();
    const styles = getStyles(theme);

    useEffect(() => {
        if (Platform.OS === 'android') {
            setAndroidVersion(parseInt(Platform.Version.toString(), 10));
        }
        if (
            Platform.OS === 'android' &&
            parseInt(Platform.Version.toString(), 10) >= 35
        ) {
            const showListener = Keyboard.addListener('keyboardDidShow', (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            });
            const hideListener = Keyboard.addListener('keyboardDidHide', () => {
                setKeyboardHeight(0);
            });
            return () => {
                showListener.remove();
                hideListener.remove();
            };
        }
    }, []);

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
        <RN_SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Header onMenuPress={openMenu} />
                    <Text style={styles.headerText}>What can I help with?</Text>
                    <Text style={styles.headerSubText}>
                        Use one of most common prompts{'\n'}below to begin
                    </Text>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.promptCardsContainer}>
                        <PromptCards />
                    </View>

                    <View style={styles.recentQueriesContainer}>
                        <RecentQueries />
                    </View>
                </View>

                {/* Apply keyboard height + safe area insets + extra bottom padding */}
                <View style={[
                    styles.inputWrapper,
                    Platform.OS === 'android' && androidVersion >= 35
                        ? { paddingBottom: keyboardHeight + insets.bottom + EXTRA_BOTTOM_PADDING }
                        : { paddingBottom: insets.bottom + EXTRA_BOTTOM_PADDING }
                ]}>
                    <PromptInput clearOnSend />
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
        </RN_SafeAreaView>
    );
};

export default HomeScreen;
