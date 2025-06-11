import React, { useState, useRef, useEffect } from 'react'

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

const SCREEN_WIDTH = Dimensions.get('window').width;

const AiAssistScreen = () => {
    const [isModalVisible, setModalVisible] = useState(false);
    const slideAnim = useState(new Animated.Value(-SCREEN_WIDTH))[0];
    const scrollViewRef = useRef<ScrollView>(null);

    const { messages } = useChat();
    const navigation = useNavigation();
    const { theme } = useThemeContext();
    const styles = getStyles(theme);

    const ThemedBackIcon = getThemedIcon('ArrowLeft', theme);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

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
            {/* Header - Outside gesture detector */}
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

            {/* Messages ScrollView - No gesture interference */}
            <View style={styles.messagesContainer}>
                <ScrollView 
                    ref={scrollViewRef}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    bounces={true}
                    alwaysBounceVertical={true}
                    contentInsetAdjustmentBehavior="automatic"
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>
                                Start a conversation by asking a question
                            </Text>
                        </View>
                    ) : (
                        messages.map((msg) => (
                            <MessageCard
                                key={msg.id}
                                time={msg.time}
                                message={msg.message}
                                isUser={msg.isUser}
                                isStreaming={msg.isStreaming || false}
                                agentStatus={msg.agentStatus}
                                sources={msg.sources || []}
                                hasVoted={msg.hasVoted || false}
                                voteType={msg.voteType}
                                highlight={msg.highlight}
                            />
                        ))
                    )}
                </ScrollView>
            </View>

            {/* Fixed input at bottom */}
            <View style={styles.inputWrapper}>
                <View style={styles.inputContainer}>
                    <PromptInput />
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
    )
}

export default AiAssistScreen