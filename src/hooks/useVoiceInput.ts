import { useState, useRef, useCallback, useEffect } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

export const useVoiceInput = () => {
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceInputText, setVoiceInputText] = useState<string>('');
  const [shouldFocusPromptInput, setShouldFocusPromptInput] = useState<boolean>(false);
  
  // Refs for voice management
  const isRecordingRef = useRef<boolean>(false);
  const isComponentMountedRef = useRef<boolean>(true);
  const accumulatedTextRef = useRef<string>('');
  const baseTextRef = useRef<string>('');

  // Cleanup on unmount
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    return () => {
      isComponentMountedRef.current = false;
      try {
        if (isRecordingRef.current) {
          Voice.stop().catch(() => {});
          Voice.cancel().catch(() => {});
        }
        Voice.removeAllListeners();
        Voice.destroy().catch(() => {});
        isRecordingRef.current = false;
      } catch (error) {
        // Silent cleanup
      }
    };
  }, []);

  // Safe state updates
  const safeSetState = useCallback((stateSetter: () => void) => {
    if (isComponentMountedRef.current) {
      try {
        stateSetter();
      } catch (error) {
        // Ignore errors
      }
    }
  }, []);

  // Speech handlers
  const onSpeechStart = useCallback(() => {
    safeSetState(() => setIsListening(true));
  }, [safeSetState]);

  const onSpeechResults = useCallback((event: SpeechResultsEvent) => {
    const newText = event.value?.[0] || '';
    if (newText.trim() && isComponentMountedRef.current && isRecordingRef.current) {
      const currentText = accumulatedTextRef.current;
      const updatedText = currentText ? `${currentText} ${newText}`.trim() : newText;
      accumulatedTextRef.current = updatedText;
      
      const displayText = baseTextRef.current 
        ? `${baseTextRef.current} ${updatedText}`.trim()
        : updatedText;
      
      safeSetState(() => {
        setInputText(displayText);
        setVoiceInputText(displayText);
      });
    }
  }, [safeSetState]);

  const onSpeechPartialResults = useCallback((event: SpeechResultsEvent) => {
    const partialText = event.value?.[0] || '';
    if (partialText.trim() && isComponentMountedRef.current && isRecordingRef.current) {
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
  }, [safeSetState]);

  const onSpeechEnd = useCallback(async () => {
    if (!isRecordingRef.current || !isComponentMountedRef.current) return;

    let retries = 3;
    const tryRestart = async () => {
      if (!isRecordingRef.current || !isComponentMountedRef.current) return;
      try {
        await Voice.start('en-US', {
          EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
          EXTRA_PARTIAL_RESULTS: true,
          EXTRA_MAX_RESULTS: 1,
        });
      } catch (error) {
        if (retries-- > 0) {
          setTimeout(tryRestart, 200);
        } else {
          safeSetState(() => {
            setIsListening(false);
            isRecordingRef.current = false;
          });
        }
      }
    };
    setTimeout(tryRestart, 100);
  }, [safeSetState]);

  const onSpeechError = useCallback((event: SpeechErrorEvent) => {
    const errorCode = event.error?.code || 'unknown';
    if (errorCode === '7') return; // No speech detected
    if (errorCode === '8' && isRecordingRef.current) {
      setTimeout(async () => {
        if (isRecordingRef.current && isComponentMountedRef.current) {
          try {
            await Voice.start('en-US', {
              EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
              EXTRA_PARTIAL_RESULTS: true,
              EXTRA_MAX_RESULTS: 1,
            });
          } catch (error) {
            safeSetState(() => {
              setIsListening(false);
              isRecordingRef.current = false;
            });
          }
        }
      }, 200);
      return;
    }
    safeSetState(() => {
      setIsListening(false);
      isRecordingRef.current = false;
    });
    if (errorCode === '9') {
      Alert.alert('Permission Error', 'Microphone permission required');
    }
  }, [safeSetState]);

  // Setup voice listeners
  const setupVoiceListeners = useCallback(() => {
    try {
      Voice.removeAllListeners();
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechVolumeChanged = () => {};
      Voice.onSpeechRecognized = () => {};
    } catch (error) {
      console.error('Listener setup error:', error);
    }
  }, [onSpeechStart, onSpeechResults, onSpeechPartialResults, onSpeechEnd, onSpeechError]);

  // Check microphone permissions
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
            title: 'Microphone Permission',
            message: 'Needed for voice input',
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

  // Start listening
  const startListening = useCallback(async (): Promise<void> => {
    if (isRecordingRef.current) return;

    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Microphone access needed');
      return;
    }

    try {
      baseTextRef.current = inputText;
      accumulatedTextRef.current = '';
      await Voice.destroy().catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 100));
      setupVoiceListeners();
      isRecordingRef.current = true;
      await Voice.start('en-US', {
        EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
        EXTRA_PARTIAL_RESULTS: true,
        EXTRA_MAX_RESULTS: 1,
      });
    } catch (error) {
      safeSetState(() => {
        setIsListening(false);
        isRecordingRef.current = false;
      });
      Alert.alert('Error', 'Failed to start recording');
    }
  }, [checkPermissions, setupVoiceListeners, inputText, safeSetState]);

  // Stop listening
  const stopListening = useCallback(async (): Promise<void> => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;

    try {
      await Promise.race([
        Promise.all([Voice.stop(), Voice.cancel()]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ]);
      
      const finalText = baseTextRef.current && accumulatedTextRef.current
        ? `${baseTextRef.current} ${accumulatedTextRef.current}`.trim()
        : baseTextRef.current || accumulatedTextRef.current || inputText;
      
      safeSetState(() => {
        setInputText(finalText);
        setVoiceInputText(finalText);
        setIsListening(false);
      });
    } catch (error) {
      safeSetState(() => setIsListening(false));
    }
  }, [safeSetState, inputText]);

  // Clear text
  const clearText = useCallback((): void => {
    safeSetState(() => {
      setVoiceInputText('');
      setInputText('');
      baseTextRef.current = '';
      accumulatedTextRef.current = '';
    });
  }, [safeSetState]);

  // Update text manually
  const updateInputText = useCallback((text: string) => {
    setInputText(text);
    if (!isRecordingRef.current) baseTextRef.current = text;
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
