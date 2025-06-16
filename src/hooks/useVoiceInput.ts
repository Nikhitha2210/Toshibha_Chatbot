import { useEffect, useRef, useState } from "react";
import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";
import Voice from '@react-native-voice/voice';
import { usePrompt } from "../context/PromptContext";

export const useVoiceInput = () => {
    const [isListening, setIsListening] = useState(false);
    const [shouldFocusPromptInput, setShouldFocusPromptInput] = useState(false);
    
    const { inputText, setInputText } = usePrompt();
    
    const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastResultTimeRef = useRef<number>(0);

    useEffect(() => {
        Voice.onSpeechResults = (event: { value?: string[] }) => {
            const text = event.value?.[0] ?? '';
            if (text.trim()) {
                setInputText(text);
                lastResultTimeRef.current = Date.now();
                console.log('Got final result:', text);
            }
        };

        Voice.onSpeechPartialResults = (event: { value?: string[] }) => {
            const text = event.value?.[0] ?? '';
            if (text.trim()) {
                setInputText(text);
                lastResultTimeRef.current = Date.now();
                console.log('Got partial result:', text);
            }
        };

        Voice.onSpeechError = (error) => {
            console.error('Speech Error:', error);
        };

        checkAndroidPermission();

        return () => {
            if (autoStopTimeoutRef.current) {
                clearTimeout(autoStopTimeoutRef.current);
            }
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const checkAndroidPermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: 'Microphone Permission',
                    message: 'This app needs access to your microphone to recognize speech',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );

            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                console.warn('Microphone permission denied');
            }
        }
    };

    const stopListening = async () => {
        console.log('🛑 STOPPING VOICE INPUT');
        
        if (autoStopTimeoutRef.current) {
            clearTimeout(autoStopTimeoutRef.current);
            autoStopTimeoutRef.current = null;
        }
        
        try {
            await Voice.stop();
        } catch (error) {
            console.warn('Voice stop error:', error);
        }
        
        setIsListening(false);
        console.log('✅ isListening set to FALSE');
    };

    const startListening = async () => {
        if (Platform.OS === 'android') {
            const permission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            if (!permission) {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert(
                        'Microphone Permission Required',
                        'Please enable microphone permission in settings to use voice input.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open Settings', onPress: () => Linking.openSettings() },
                        ]
                    );
                    return;
                }
            }
        }

        try {
            console.log('🚀 STARTING VOICE INPUT');
            
            await Voice.start('en-US');
            setIsListening(true);
            lastResultTimeRef.current = Date.now();
            
            console.log('✅ isListening set to TRUE');
            
            autoStopTimeoutRef.current = setTimeout(() => {
                console.log('⏰ 5 seconds passed - AUTO STOPPING');
                stopListening();
            }, 10000); // 10 seconds total
            
        } catch (error) {
            console.error('❌ Error starting voice recognition:', error);
            setIsListening(false);
        }
    };

    const handleVoiceToggle = () => {
        console.log('🔄 TOGGLE - Current isListening:', isListening);
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const clearInput = () => {
        setInputText('');
    };

    return {
        isListening,
        inputText,
        setInputText,
        startListening,
        stopListening,
        handleVoiceToggle,
        clearInput,
        shouldFocusPromptInput,
        setShouldFocusPromptInput
    };
};