import React, { useState } from 'react'

import { Animated, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

import { getStyles } from './AiAssistScreen.styles'
import Header from '../../components/header'
import PromptInput from '../../components/PromptInput'
import MessageCard from '../../components/MessageCard'
import IconAssets, { getThemedIcon } from '../../assets/icons/IconAssets';
import { useChat } from '../../context/ChatContext';
import Sidebar from '../../components/Sidebar';
import { useThemeContext } from '../../context/ThemeContext';

export type PromptType = {
    id: string;
    time: string;
    message: string;
    highlight: {
        title: string;
        rating: number;
        reviews: number;
        description: string;
    };
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const AiAssistScreen = () => {
    const [isModalVisible, setModalVisible] = useState(false);
    const slideAnim = useState(new Animated.Value(-SCREEN_WIDTH))[0];

    const { messages } = useChat();

    const navigation = useNavigation();

    const { theme } = useThemeContext();

    const styles = getStyles(theme);

    const ThemedBackIcon = getThemedIcon('ArrowLeft', theme);

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
            <View style={styles.container}>
                <Header onMenuPress={openMenu} />
                <View style={styles.topBar}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            {ThemedBackIcon && <ThemedBackIcon />}
                        </TouchableOpacity>
                        <Text style={styles.topBarTitle}>AI Assist</Text>
                    </View>
                    <TouchableOpacity onPress={() => console.log('Options')}>
                        <IconAssets.VerticalDots />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                    {messages.map((msg) => (
                        <MessageCard
                            key={msg.id}
                            time={msg.time}
                            message={msg.message}
                            highlight={msg.highlight}
                        />
                    ))}
                </ScrollView>

                <View style={styles.wrapper}>
                    <View style={styles.inputContainer}>
                        <PromptInput />
                    </View>
                </View>
                <Sidebar
                    visible={isModalVisible}
                    slideAnim={slideAnim}
                    onClose={closeMenu}
                />
            </View >
        </GestureDetector>
    )
}

export default AiAssistScreen