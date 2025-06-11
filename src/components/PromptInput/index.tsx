import { useEffect, useRef } from 'react';

import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useChat } from '../../context/ChatContext';

import { getStyles } from './styles';
import IconAssets from '../../assets/icons/IconAssets';

import ListeningDots from '../ListeningDots';
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

type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    AiAssist: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PromptInput = ({ clearOnSend = false }: { clearOnSend?: boolean }) => {
    const navigation = useNavigation<NavigationProp>();

    const { inputText, setInputText, isListening, handleVoiceToggle, shouldFocusPromptInput, setShouldFocusPromptInput } = useVoiceInput();
    const { sendMessage, clearMessages, isLoading } = useChat();

    const inputRef = useRef<TextInput>(null);

    const { theme } = useThemeContext();

    const styles = getStyles(theme);

    useEffect(() => {
        if (shouldFocusPromptInput) {
            inputRef.current?.focus();
            setShouldFocusPromptInput(false);
        }
    }, [shouldFocusPromptInput]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) {
            if (!inputText.trim()) {
                Alert.alert("Empty Input", "Please enter a query before sending.");
            }
            return;
        }

        // Store the message text before clearing
        const messageText = inputText.trim();
        
        // Clear input immediately for better UX
        setInputText('');

        try {
            // Clear previous messages if coming from home screen
            if (clearOnSend) {
                clearMessages();
                // Navigate to AI Assist screen first
                navigation.navigate('AiAssist');
            }
            
            // Send the message (this will add user message immediately and then stream AI response)
            await sendMessage(messageText);
            
        } catch (error) {
            console.error('Error sending message:', error);
            // Restore text if sending failed
            setInputText(messageText);
        }
    };

    // Handle Enter key press
    const handleSubmitEditing = () => {
        handleSend();
    };

    return (
        <View style={styles.askSection}>
            <TextInput
                ref={inputRef}
                style={styles.askText}
                placeholder="Ask Anything"
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSubmitEditing} // Enter key support
                multiline
                blurOnSubmit={true} // Dismiss keyboard after enter
                editable={!isLoading} // Disable input while loading
            />
            <View style={styles.askInputContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.askButton} disabled={isLoading}>
                        <Image source={require('../../assets/images/file.png')} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.askButton} disabled={isLoading}>
                        <Text style={styles.btnText}>Search</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.askButton} disabled={isLoading}>
                        <Text style={styles.btnText}>Deep Search</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleVoiceToggle} disabled={isLoading}>
                        {isListening ? (
                            <ListeningDots />
                        ) : (
                            <IconAssets.Microphone />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSend} disabled={isLoading || !inputText.trim()}>
                        <View style={{ opacity: (isLoading || !inputText.trim()) ? 0.5 : 1 }}>
                            <IconAssets.Send />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default PromptInput;