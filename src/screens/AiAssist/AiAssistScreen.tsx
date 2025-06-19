import React, { useState, useRef, useEffect } from 'react'
import { 
    ActivityIndicator, 
    Animated, 
    Dimensions, 
    ScrollView, 
    Text, 
    TouchableOpacity, 
    View,
    SafeAreaView,
    Platform
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getStyles } from './AiAssistScreen.styles'
import Header from '../../components/header'
import PromptInput from '../../components/PromptInput'
import MessageCard from '../../components/MessageCard'
import IconAssets, { getThemedIcon } from '../../assets/icons/IconAssets';
import { useChat } from '../../context/ChatContext';
import Sidebar from '../../components/Sidebar';
import { useThemeContext } from '../../context/ThemeContext';

type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    AiAssist: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SCREEN_WIDTH = Dimensions.get('window').width;

const AiAssistScreen = () => {
    const [isModalVisible, setModalVisible] = useState(false);
    const slideAnim = useState(new Animated.Value(-SCREEN_WIDTH))[0];
    const scrollViewRef = useRef<ScrollView>(null);

    const navigation = useNavigation<NavigationProp>();
    const { messages, error, clearError, startNewSession } = useChat();
    const { theme } = useThemeContext();
    const styles = getStyles(theme);

    const ThemedNewChatIcon = getThemedIcon('NewChat', theme);

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

    const handleNewChat = () => {
        console.log('🆕 Starting new chat session and navigating to home');
        startNewSession();
        navigation.navigate('Home');
    };

    const swipeGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (e.absoluteX < 50 && e.translationX > 80) {
                openMenu();
            }
        })
        .runOnJS(true);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <Header onMenuPress={openMenu} />

                <View style={styles.topBar}>
                    <Text style={styles.topBarTitle}>Ask Toshiba</Text>
                    
                    <TouchableOpacity 
                        onPress={handleNewChat}
                        style={styles.newChatButton}
                        activeOpacity={0.7}
                    >
                        {ThemedNewChatIcon && <ThemedNewChatIcon width={24} height={24} />}
                    </TouchableOpacity>
                </View>

                {error && (
                    <View style={{
                        backgroundColor: '#ffebee',
                        padding: 10,
                        marginHorizontal: 10,
                        borderRadius: 8,
                        borderLeftWidth: 4,
                        borderLeftColor: '#f44336',
                        marginBottom: 10
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: '#c62828', fontSize: 14, flex: 1 }}>
                                ⚠️ {error}
                            </Text>
                            <TouchableOpacity onPress={clearError} style={{ marginLeft: 10 }}>
                                <Text style={{ color: '#1976d2', fontSize: 12 }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={styles.messagesContainer}>
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                        bounces={true}
                        alwaysBounceVertical={true}
                        scrollEnabled={true}
                        nestedScrollEnabled={false}
                    >
                        {messages.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    Ask me anything about Toshiba products!
                                </Text>
                            </View>
                        ) : (
                            <>
                                {messages.map((msg) => (
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
                                ))}
                            </>
                        )}
                    </ScrollView>
                </View>

                <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                        <PromptInput />
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
        </SafeAreaView>
    )
}

export default AiAssistScreen