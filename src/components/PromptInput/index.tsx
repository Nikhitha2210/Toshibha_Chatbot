import React, { useEffect, useState } from 'react';

import { Alert, Image, Linking, PermissionsAndroid, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Voice from '@react-native-voice/voice';

import { styles } from './styles';
import IconAssets from '../../assets/icons/IconAssets';
import ListeningDots from '../ListeningDots';

type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    AiAssist: undefined
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PromptInput = () => {
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechTimeout, setSpeechTimeout] = useState<NodeJS.Timeout | null>(null);

    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = (error) => console.error('Speech Error:', error);

        const androidPermissionChecking = async () => {
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

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('Microphone permission granted');
                } else {
                    console.log('Microphone permission denied');
                }

                const getService = await Voice.getSpeechRecognitionServices();
                console.log('getService for audio', getService);
            }
        };

        androidPermissionChecking();

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        }

    }, [])

    const onSpeechStart = () => {
        console.log('Recording started');
    }

    const onSpeechEnd = () => {
        if (speechTimeout) {
            clearTimeout(speechTimeout);
            setSpeechTimeout(null);
        }

        setIsListening(false);
        console.log('Recording ended');
    }

    const onSpeechResults = (event: { value?: string[] }) => {

        console.log('OnSpeechResults', event);

        if (speechTimeout) {
            clearTimeout(speechTimeout);
            setSpeechTimeout(null);
        }

        const text = event.value && event.value[0] ? event.value[0] : '';
        setInputText(text);
    };

    const startListening = async () => {
        try {
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

            await Voice.start('en-US');
            setIsListening(true);

            if (speechTimeout) clearTimeout(speechTimeout);

            const timeout = setTimeout(() => {
                stopListening();
                Alert.alert('No input detected', 'Please speak into the microphone.');
            }, 10000);

            setSpeechTimeout(timeout);

        } catch (error) {
            console.log('Start Listening Error', error);
        }
    };

    const stopListening = async () => {
        try {
            await Voice.stop();
            setIsListening(false);

            if (speechTimeout) {
                clearTimeout(speechTimeout);
                setSpeechTimeout(null);
            }

        } catch (error) {
            console.log('Stop Listening Error', error);
        }
    }

    return (
        <View style={styles.askSection}>
            <TextInput
                style={styles.askText}
                placeholder="Type your question..."
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
                    <TouchableOpacity onPress={() => {
                        isListening ? stopListening() : startListening();
                    }}>
                        {isListening ? (
                            <ListeningDots />
                        ) : (
                            <IconAssets.Microphone />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('AiAssist')}>
                        <IconAssets.Send />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default PromptInput;