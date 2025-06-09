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
    const { addMessage, clearMessages } = useChat();

    const inputRef = useRef<TextInput>(null);

    const { theme } = useThemeContext();

    const styles = getStyles(theme);

    useEffect(() => {
        if (shouldFocusPromptInput) {
            inputRef.current?.focus();
            setShouldFocusPromptInput(false);
        }
    }, [shouldFocusPromptInput]);

    const handleSend = () => {
        if (!inputText.trim()) {
            Alert.alert("Empty Input", "Please enter a query before sending.");
            return;
        }

        if (clearOnSend) {
            clearMessages();
        }

        const newPrompt = {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            message: inputText,
            highlight: {
                title: "Your Query Response",
                rating: 4.8,
                reviews: 8399,
                description: "Processing your request..."
            }
        }
        addMessage(newPrompt);
        navigation.navigate('AiAssist');

        setInputText('');
    }

    return (
        <View style={styles.askSection}>
            <TextInput
                ref={inputRef}
                style={styles.askText}
                placeholder="Ask Anything"
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                multiline
            />
            <View style={styles.askInputContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.askButton}>
                        <Image source={require('../../assets/images/file.png')} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.askButton}>
                        <Text style={styles.btnText}>Search</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.askButton}>
                        <Text style={styles.btnText}>Deep Search</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleVoiceToggle}>
                        {isListening ? (
                            <ListeningDots />
                        ) : (
                            <IconAssets.Microphone />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSend}>
                        <IconAssets.Send />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default PromptInput;