import { useState, useRef, useCallback, useEffect } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

export const useVoiceInput = () => {
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceInputText, setVoiceInputText] = useState<string>('');
  const [shouldFocusPromptInput, setShouldFocusPromptInput] = useState<boolean>(false);
  
  const isRecordingRef = useRef<boolean>(false);
  const isComponentMountedRef = useRef<boolean>(true);
  const accumulatedTextRef = useRef<string>('');
  const baseTextRef = useRef<string>('');
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const lastRestartRef = useRef<number>(0);

  const androidVersion = Platform.OS === 'android' ? parseInt(Platform.Version as unknown as string, 10) : 0;
  const isAndroid15Plus = androidVersion >= 34;

  useEffect(() => {
    isComponentMountedRef.current = true;
    
    return () => {
      isComponentMountedRef.current = false;
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    try {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      
      if (isRecordingRef.current) {
        Voice.stop().catch(() => {});
        Voice.cancel().catch(() => {});
      }
      
      Voice.removeAllListeners();
      Voice.destroy().catch(() => {});
      
      isRecordingRef.current = false;
      isInitializingRef.current = false;
    } catch (error) {}
  }, []);

  const safeSetState = useCallback((stateSetter: () => void) => {
    if (isComponentMountedRef.current) {
      try {
        stateSetter();
      } catch (error) {}
    }
  }, []);

  const resetTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, []);

  const scheduleTimeout = useCallback(() => {
    resetTimeout();
    
    const timeout = isAndroid15Plus ? 25000 : 45000;
    
    sessionTimeoutRef.current = setTimeout(() => {
      if (isRecordingRef.current && isComponentMountedRef.current) {
        stopListening();
      }
    }, timeout);
  }, [isAndroid15Plus]);

  const onSpeechStart = useCallback(() => {
    if (!isComponentMountedRef.current) return;
    
    safeSetState(() => {
      setIsListening(true);
    });
    
    scheduleTimeout();
  }, [safeSetState, scheduleTimeout]);

  const onSpeechResults = useCallback((event: SpeechResultsEvent) => {
    if (!isComponentMountedRef.current || !isRecordingRef.current) return;
    
    try {
      const newText = event.value?.[0] || '';
      
      if (newText && newText.trim()) {
        const currentText = accumulatedTextRef.current;
        const updatedText = currentText 
          ? `${currentText} ${newText}`.trim()
          : newText;
        
        accumulatedTextRef.current = updatedText;
        
        const displayText = baseTextRef.current 
          ? `${baseTextRef.current} ${updatedText}`.trim()
          : updatedText;
        
        safeSetState(() => {
          setInputText(displayText);
          setVoiceInputText(displayText);
        });
        
        scheduleTimeout();
      }
    } catch (error) {}
  }, [safeSetState, scheduleTimeout]);

  const onSpeechPartialResults = useCallback((event: SpeechResultsEvent) => {
    if (!isComponentMountedRef.current || !isRecordingRef.current) return;
    
    try {
      const partialText = event.value?.[0] || '';
      
      if (partialText && partialText.trim()) {
        const currentAccumulated = accumulatedTextRef.current;
        const tempText = currentAccumulated 
          ? `${currentAccumulated} ${partialText}`.trim()
          : partialText;
        
        const displayText = baseTextRef.current 
          ? `${baseTextRef.current} ${tempText}`.trim()
          : tempText;
        
        safeSetState(() => {
          setInputText(displayText);
          setVoiceInputText(displayText);
        });
      }
    } catch (error) {}
  }, [safeSetState]);

  const restartVoice = useCallback(async () => {
    if (!isRecordingRef.current || !isComponentMountedRef.current || isInitializingRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastRestartRef.current < 1000) {
      return;
    }
    lastRestartRef.current = now;

    isInitializingRef.current = true;

    try {
      await Voice.destroy();
      await new Promise(resolve => setTimeout(resolve, isAndroid15Plus ? 300 : 150));
      
      if (!isRecordingRef.current || !isComponentMountedRef.current) {
        isInitializingRef.current = false;
        return;
      }

      setupListeners();
      
      const config = isAndroid15Plus 
        ? {
            EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
            EXTRA_PARTIAL_RESULTS: true,
            EXTRA_MAX_RESULTS: 1,
            EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
            EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1500,
          }
        : {
            EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
            EXTRA_PARTIAL_RESULTS: true,
            EXTRA_MAX_RESULTS: 1,
          };

      await Voice.start('en-US', config);
      isInitializingRef.current = false;
      
    } catch (error) {
      isInitializingRef.current = false;
      
      if (isRecordingRef.current && isComponentMountedRef.current) {
        safeSetState(() => {
          setIsListening(false);
          isRecordingRef.current = false;
        });
        resetTimeout();
      }
    }
  }, [safeSetState, isAndroid15Plus, resetTimeout]);

  const onSpeechEnd = useCallback(() => {
    if (!isComponentMountedRef.current) return;
    
    if (isRecordingRef.current && !isInitializingRef.current) {
      setTimeout(() => {
        if (isRecordingRef.current && isComponentMountedRef.current) {
          restartVoice();
        }
      }, isAndroid15Plus ? 200 : 100);
    } else {
      safeSetState(() => {
        setIsListening(false);
      });
    }
  }, [restartVoice, safeSetState, isAndroid15Plus]);

  const onSpeechError = useCallback((event: SpeechErrorEvent) => {
    if (!isComponentMountedRef.current) return;
    
    try {
      const errorCode = event.error?.code || 'unknown';
      
      if (errorCode === '7' && isRecordingRef.current) {
        return;
      }
      
      if ((errorCode === '8' || errorCode === '5') && isRecordingRef.current && !isInitializingRef.current) {
        setTimeout(() => {
          if (isRecordingRef.current && isComponentMountedRef.current) {
            restartVoice();
          }
        }, isAndroid15Plus ? 500 : 300);
        return;
      }
      
      if (isRecordingRef.current) {
        safeSetState(() => {
          setIsListening(false);
          isRecordingRef.current = false;
        });
        resetTimeout();
      }
      
      if (errorCode === '9') {
        Alert.alert('Permission Error', 'Microphone permission is required.');
      }
    } catch (error) {}
  }, [safeSetState, restartVoice, resetTimeout, isAndroid15Plus]);

  const setupListeners = useCallback(() => {
    try {
      Voice.removeAllListeners();
      
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = onSpeechError;
      
      Voice.onSpeechVolumeChanged = () => {};
      Voice.onSpeechRecognized = () => {};
      
    } catch (error) {}
  }, [onSpeechStart, onSpeechResults, onSpeechPartialResults, onSpeechEnd, onSpeechError]);

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs microphone access for voice input.',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  }, []);

  const startListening = useCallback(async (): Promise<void> => {
    if (isRecordingRef.current || !isComponentMountedRef.current || isInitializingRef.current) {
      return;
    }

    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Microphone permission is required for voice input.');
        return;
      }

      baseTextRef.current = inputText;
      accumulatedTextRef.current = '';
      lastRestartRef.current = 0;
      
      await Voice.destroy().catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 150));
      
      if (!isComponentMountedRef.current) return;

      setupListeners();
      isRecordingRef.current = true;
      
      const config = isAndroid15Plus 
        ? {
            EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
            EXTRA_PARTIAL_RESULTS: true,
            EXTRA_MAX_RESULTS: 1,
            EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
            EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1500,
          }
        : {
            EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
            EXTRA_PARTIAL_RESULTS: true,
            EXTRA_MAX_RESULTS: 1,
          };

      await Voice.start('en-US', config);
      
    } catch (error) {
      safeSetState(() => {
        setIsListening(false);
        isRecordingRef.current = false;
      });
      
      Alert.alert('Voice Error', 'Could not start voice recording.');
    }
  }, [checkPermissions, setupListeners, inputText, safeSetState, isAndroid15Plus]);

  const stopListening = useCallback(async (): Promise<void> => {
    if (!isRecordingRef.current && !isListening) {
      return;
    }

    isRecordingRef.current = false;
    isInitializingRef.current = false;
    resetTimeout();

    try {
      await Promise.race([
        Promise.all([Voice.stop(), Voice.cancel()]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 1500)
        )
      ]);
      
      if (isComponentMountedRef.current) {
        const finalText = baseTextRef.current && accumulatedTextRef.current
          ? `${baseTextRef.current} ${accumulatedTextRef.current}`.trim()
          : baseTextRef.current || accumulatedTextRef.current || inputText;
        
        safeSetState(() => {
          setInputText(finalText);
          setVoiceInputText(finalText);
          setIsListening(false);
        });
      }
      
    } catch (error) {
      safeSetState(() => {
        setIsListening(false);
      });
    }
  }, [safeSetState, inputText, resetTimeout, isListening]);

  const clearText = useCallback((): void => {
    if (isComponentMountedRef.current) {
      safeSetState(() => {
        setVoiceInputText('');
        setInputText('');
        baseTextRef.current = '';
        accumulatedTextRef.current = '';
      });
    }
  }, [safeSetState]);

  const updateInputText = useCallback((text: string) => {
    if (isComponentMountedRef.current) {
      setInputText(text);
      if (!isRecordingRef.current) {
        baseTextRef.current = text;
      }
    }
  }, []);

  return {
    inputText,
    isListening,
    voiceInputText,
    shouldFocusPromptInput,
    setInputText: updateInputText,
    setVoiceInputText,
    setShouldFocusPromptInput,
    clearText,
    startListening,
    stopListening,
    startVoiceRecording: startListening,
    stopVoiceRecording: stopListening,
    clearVoiceInput: clearText,
  };
};