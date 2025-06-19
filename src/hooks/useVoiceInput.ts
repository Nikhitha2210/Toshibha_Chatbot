import { useState, useRef, useCallback } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

export const useVoiceInput = () => {
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceInputText, setVoiceInputText] = useState<string>('');
  const [shouldFocusPromptInput, setShouldFocusPromptInput] = useState<boolean>(false);
  
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const accumulatedTextRef = useRef<string>('');

  // Properly typed event handlers
  const onSpeechStart = useCallback(() => {
    console.log('🎤 Speech started');
    setIsListening(true);
    accumulatedTextRef.current = '';
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const onSpeechResults = useCallback((event: SpeechResultsEvent) => {
    console.log('🎤 Speech results:', event.value);
    const recognizedText = event.value?.[0] || '';
    accumulatedTextRef.current = recognizedText;
    setVoiceInputText(recognizedText);
    setInputText(recognizedText);
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    silenceTimerRef.current = setTimeout(() => {
      console.log('🤫 Auto-stopping due to silence');
      stopListening();
    }, 2000);
  }, []);

  const onSpeechPartialResults = useCallback((event: SpeechResultsEvent) => {
    console.log('🎤 Partial results:', event.value);
    const partialText = event.value?.[0] || '';
    setVoiceInputText(partialText);
    setInputText(partialText);
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    silenceTimerRef.current = setTimeout(() => {
      console.log('🤫 Auto-stopping due to silence (partial)');
      stopListening();
    }, 2000);
  }, []);

  const onSpeechEnd = useCallback(() => {
    console.log('🎤 Speech ended');
    setIsListening(false);
    isRecordingRef.current = false;
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const onSpeechError = useCallback((event: SpeechErrorEvent) => {
    console.log('❌ Speech error details:', event.error);
    setIsListening(false);
    isRecordingRef.current = false;
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    const errorCode = event.error?.code || event.error?.message || 'unknown';
    console.log('Error code:', errorCode);
    
    if (errorCode !== '7' && errorCode !== 'network') {
      switch (errorCode) {
        case '6':
        case 'audio':
          console.log('Audio error - retrying...');
          break;
        case '8':
        case 'server':
          Alert.alert('Voice Error', 'Server temporarily unavailable. Please try again.');
          break;
        case '9':
        case 'insufficient':
          Alert.alert('Voice Error', 'Could not hear clearly. Please speak louder.');
          break;
        default:
          console.log('Voice error (ignored):', errorCode);
      }
    }
  }, []);

  // Empty handlers for unused events (to satisfy TypeScript)
  const onSpeechVolumeChanged = useCallback(() => {
    // Do nothing - we don't need volume change events
  }, []);

  const onSpeechRecognized = useCallback(() => {
    // Do nothing - we don't need recognition events
  }, []);

  // Setup voice listeners with proper function handlers
  const setupVoiceListeners = useCallback(() => {
    try {
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = onSpeechError;
      
      // Assign empty functions instead of null to satisfy TypeScript
      Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;
      Voice.onSpeechRecognized = onSpeechRecognized;
    } catch (error) {
      console.log('Setup error:', error);
    }
  }, [onSpeechStart, onSpeechResults, onSpeechPartialResults, onSpeechEnd, onSpeechError, onSpeechVolumeChanged, onSpeechRecognized]);

  // Enhanced permissions check
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const permissionStatus = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        
        if (permissionStatus) {
          return true;
        }

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to use voice input.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.log('Permission error:', err);
        return false;
      }
    }
    return true;
  }, []);

  // Forward declaration to fix circular dependency
  const stopListening = useCallback(async (): Promise<void> => {
    console.log('🛑 Stopping voice input...');
    
    try {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      await Voice.stop();
      await Voice.cancel();
      
      setIsListening(false);
      isRecordingRef.current = false;
      
      if (accumulatedTextRef.current) {
        setInputText(accumulatedTextRef.current);
        setVoiceInputText(accumulatedTextRef.current);
      }
      
      console.log('✅ Voice recognition stopped');
    } catch (error) {
      console.log('❌ Error stopping voice:', error);
      setIsListening(false);
      isRecordingRef.current = false;
    }
  }, []);

  const startListening = useCallback(async (): Promise<void> => {
    console.log('🎤 Starting voice input...');
    
    if (isRecordingRef.current) {
      console.log('⚠️ Already recording');
      return;
    }

    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Microphone permission is required for voice input.');
      return;
    }

    try {
      await Voice.destroy();
      setupVoiceListeners();
      
      isRecordingRef.current = true;
      setIsListening(true);
      
      await Voice.start('en-US', {
        EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
        EXTRA_CALLING_PACKAGE: 'com.toshibachatbot',
        EXTRA_PARTIAL_RESULTS: true,
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
        EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
      });
      
      console.log('✅ Voice recognition started');
    } catch (error) {
      console.log('❌ Error starting voice:', error);
      setIsListening(false);
      isRecordingRef.current = false;
      Alert.alert('Voice Error', 'Could not start voice recognition. Please check your microphone.');
    }
  }, [checkPermissions, setupVoiceListeners]);

  const handleVoiceToggle = useCallback(async (): Promise<void> => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearVoiceInput = useCallback((): void => {
    setVoiceInputText('');
    accumulatedTextRef.current = '';
  }, []);

  return {
    inputText,
    setInputText,
    isListening,
    voiceInputText,
    setVoiceInputText,
    shouldFocusPromptInput,
    setShouldFocusPromptInput,
    startListening,
    stopListening,
    handleVoiceToggle,
    clearVoiceInput,
  };
};