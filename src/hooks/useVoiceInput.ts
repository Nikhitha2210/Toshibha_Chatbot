import { useEffect, useState } from "react";

import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";
import Voice from '@react-native-voice/voice';

import { usePrompt } from "../context/PromptContext"

export const useVoiceInput = () => {
    const [isListening, setIsListening] = useState(false);
    const [speechTimeout, setSpeechTimeout] = useState<NodeJS.Timeout | null>(null);
    const [speechEndTimeout, setSpeechEndTimeout] = useState<NodeJS.Timeout | null>(null);

    const { inputText, setInputText } = usePrompt();

    useEffect(() => {
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = (error) => console.error('Speech Error:', error);

        checkAndroidPermission();

        return () => {
            Voice.destroy().then(Voice.removeAllListeners)
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

            const services = await Voice.getSpeechRecognitionServices();
            console.log('Speech recognition services:', services);

        }
    };

    const onSpeechStart = () => {
        console.log('Recording started');
        if (speechEndTimeout) {
            clearTimeout(speechEndTimeout);
            setSpeechEndTimeout(null);
        }
    }

    const onSpeechEnd = () => {
        const endTimeout = setTimeout(() => {
            setIsListening(false);
            console.log('Recording ended after debounce');
            Voice.stop();
        }, 2000);
        setSpeechEndTimeout(endTimeout);
    };

    const onSpeechResults = (event: { value?: string[] }) => {
        if (speechTimeout) clearTimeout(speechTimeout);
        const text = event.value?.[0] ?? '';
        setInputText(text);
    }

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
                    )
                    return;
                }
            }
        }

        await Voice.start('en-US');
        setIsListening(true);

        const timeout = setTimeout(() => {
            stopListening();
            Alert.alert('No input detected', 'Please speak into the microphone.');
        }, 10000);
        setSpeechTimeout(timeout);
    };

    const stopListening = async () => {
        await Voice.stop();
        setIsListening(false);
        if (speechTimeout) clearTimeout(speechTimeout);
        if (speechEndTimeout) clearTimeout(speechEndTimeout);
    };

    const handleVoiceToggle = () => {
        isListening ? stopListening() : startListening();
    };

    return {
        isListening,
        inputText,
        setInputText,
        startListening,
        stopListening,
        handleVoiceToggle
    }
}