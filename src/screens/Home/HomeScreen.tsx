import { useState } from 'react';

import { View, Animated, Dimensions, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
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
            if (e.translationX > 50) {
                openMenu();
            }
        })
        .runOnJS(true);

    return (
        <GestureDetector gesture={swipeGesture}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
                style={styles.container}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        <ScrollView
                            contentContainerStyle={{ flexGrow: 1 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.mainWrapper}>
                                <Header onMenuPress={openMenu} />
                                <View style={styles.centerContainer}>
                                    <Text style={styles.headerText}>What can I help with?</Text>
                                    <Text style={styles.headerSubText}>Use one of most common prompts{'\n'}below to begin</Text>
                                    <View style={styles.queriesContainer}>
                                        <PromptCards />
                                        <RecentQueries />
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                        <View style={styles.inputContainer}>
                            <PromptInput clearOnSend={true} />
                        </View>
                        <Sidebar
                            visible={isModalVisible}
                            slideAnim={slideAnim}
                            onClose={closeMenu}
                        />
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </GestureDetector>
    );
};

export default HomeScreen;