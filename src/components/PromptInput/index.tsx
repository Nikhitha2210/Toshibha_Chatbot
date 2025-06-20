import { useEffect, useRef } from 'react';
import { Alert, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useChat } from '../../context/ChatContext';
import { usePrompt } from '../../context/PromptContext';

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

    const { 
        inputText, 
        setInputText, 
        isListening, 
        startListening, 
        stopListening,
        clearText,
        shouldFocusPromptInput, 
        setShouldFocusPromptInput 
    } = useVoiceInput();
    
    const { sendMessage, clearMessages, isLoading } = useChat();
    const { inputText: promptInputText, setInputText: setPromptInputText } = usePrompt();

    const inputRef = useRef<TextInput>(null);

    const { theme } = useThemeContext();
    const styles = getStyles(theme);

    // Sync with PromptContext (for when PromptCards/RecentQueries set text)
    useEffect(() => {
        if (promptInputText && promptInputText !== inputText) {
            console.log('🔄 Syncing prompt text to input:', promptInputText);
            setInputText(promptInputText);
            setPromptInputText(''); // Clear after setting
        }
    }, [promptInputText, inputText, setInputText, setPromptInputText]);

    useEffect(() => {
        if (shouldFocusPromptInput) {
            inputRef.current?.focus();
            setShouldFocusPromptInput(false);
        }
    }, [shouldFocusPromptInput, setShouldFocusPromptInput]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) {
            if (!inputText.trim()) {
                Alert.alert("Empty Input", "Please enter a query before sending.");
            }
            return;
        }

        const messageText = inputText.trim();
        
        // Clear the input
        clearText();

        try {
            if (clearOnSend) {
                clearMessages();
                navigation.navigate('AiAssist', { initialMessage: messageText });
            }

            await sendMessage(messageText);

        } catch (error) {
            console.error('Error sending message:', error);
            // Restore text on error
            setInputText(messageText);
        }
    };

    const handleSubmitEditing = () => {
        handleSend();
    };

    const handleTextChange = (text: string) => {
        setInputText(text);
    };

    console.log("🎤 Voice Status - isListening:", isListening, "inputText length:", inputText.length);

    return (
        <View style={styles.askSection}>
            {/* ✅ KEYBOARD SAFE: Voice status above everything, no layout interference */}
            {isListening && (
                <View style={{
                    position: 'absolute',
                    top: -45, // ✅ FIXED: Above input container, no keyboard conflict
                    left: 10,
                    right: 10,
                    alignItems: 'center',
                    zIndex: 9999, // ✅ FIXED: Highest z-index
                    pointerEvents: 'none', // ✅ FIXED: No touch blocking
                    elevation: 10, // ✅ FIXED: Android elevation
                }}>
                    <View style={{
                        backgroundColor: 'rgba(255, 104, 31, 0.95)',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 8, // Android shadow
                    }}>
                        <Text style={{ 
                            fontSize: 13, 
                            color: '#fff',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}>
                            🎤 Hold to talk, release when done
                        </Text>
                    </View>
                </View>
            )}

            <View style={{ flex: 1, marginRight: 10 }}>
                <TextInput
                    ref={inputRef}
                    style={styles.askText}
                    placeholder="Ask Anything"
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={handleTextChange}
                    onSubmitEditing={handleSubmitEditing}
                    multiline
                    blurOnSubmit={true}
                    editable={!isLoading && !isListening} // ✅ Disable typing while recording
                />
            </View>
            
            <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center', marginRight: 5 }}>
                {/* Clear Button - appears when there's text */}
                {inputText.length > 0 && !isListening && (
                    <TouchableOpacity 
                        onPress={clearText} 
                        disabled={isLoading}
                        style={{
                            width: 25,
                            height: 25,
                            borderRadius: 12.5,
                            backgroundColor: '#666',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <Text style={{ fontSize: 14, color: '#fff', fontWeight: 'bold' }}>×</Text>
                    </TouchableOpacity>
                )}

                {/* ✅ PERFECT: Push-to-Talk Voice Button - NO keyboard interference */}
                <TouchableOpacity
                    onPressIn={startListening}  // ✅ Start recording on press down
                    onPressOut={stopListening}  // ✅ Stop recording on press release
                    disabled={isLoading}
                    style={{
                        backgroundColor: isListening ? '#FF681F' : 'transparent',
                        borderRadius: 20,
                        padding: 8,
                        minWidth: 40,
                        minHeight: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: isListening ? 0 : 1,
                        borderColor: isListening ? 'transparent' : '#666'
                    }}
                    activeOpacity={0.8}
                >
                    {isListening ? (
                        <ListeningDots />
                    ) : (
                        <IconAssets.Microphone width={25} height={25} />
                    )}
                </TouchableOpacity>

                {/* Send Button */}
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