import { useEffect, useRef } from 'react';
import { Alert, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useChat } from '../../context/ChatContext';
import { usePrompt } from '../../context/PromptContext'; // Add this import

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
    AiAssist: { initialMessage: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PromptInput = ({ clearOnSend = false }: { clearOnSend?: boolean }) => {
    const navigation = useNavigation<NavigationProp>();

    const { inputText, setInputText, isListening, handleVoiceToggle, shouldFocusPromptInput, setShouldFocusPromptInput } = useVoiceInput();
    const { sendMessage, clearMessages, isLoading } = useChat();
    const { inputText: promptInputText, setInputText: setPromptInputText } = usePrompt(); // Add this

    const inputRef = useRef<TextInput>(null);

    const { theme } = useThemeContext();
    const styles = getStyles(theme);

    // Sync PromptContext text with VoiceInput text
    useEffect(() => {
        if (promptInputText && promptInputText !== inputText) {
            console.log('🔄 Syncing prompt text to input:', promptInputText);
            setInputText(promptInputText);
            setPromptInputText(''); // Clear prompt context after setting
        }
    }, [promptInputText, inputText, setInputText, setPromptInputText]);

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

        const messageText = inputText.trim();
        setInputText('');

        try {
            if (clearOnSend) {
                clearMessages();
                navigation.navigate('AiAssist', { initialMessage: messageText });
            }

            await sendMessage(messageText);

        } catch (error) {
            console.error('Error sending message:', error);
            setInputText(messageText);
        }
    };

    const handleSubmitEditing = () => {
        handleSend();
    };

    return (
        <View style={styles.askSection}>
            <View style={{ flex: 1, marginRight: 10 }}>
                <TextInput
                    ref={inputRef}
                    style={styles.askText}
                    placeholder="Ask Anything"
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSubmitEditing}
                    multiline
                    blurOnSubmit={true}
                    editable={!isLoading}
                />
            </View>
            <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center', marginRight: 5 }}>
                <TouchableOpacity onPress={handleVoiceToggle} disabled={isLoading}>
                    {isListening ? (
                        <ListeningDots />
                    ) : (
                        <IconAssets.Microphone width={25} height={25} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSend} disabled={isLoading || !inputText.trim()}>
                    <View style={{ opacity: (isLoading || !inputText.trim()) ? 0.5 : 1 }}>
                        <IconAssets.Send width={25} height={25} />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default PromptInput;