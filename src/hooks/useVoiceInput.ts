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
  const listenersSetupRef = useRef<boolean>(false);
  const currentSessionTextRef = useRef<string>(''); // Text from current voice session only
  const baseTextRef = useRef<string>(''); // Text that was already in input before voice session

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
        listenersSetupRef.current = false;
      } catch (error) {
        // Silent cleanup
      }
    };
  }, []);

  const safeSetState = useCallback((stateSetter: () => void) => {
    if (isComponentMountedRef.current) {
      try {
        stateSetter();
      } catch (error) {
      }
    }
  }, []);

  const onSpeechStart = useCallback(() => {
    console.log('🎤 Voice started recording');
    safeSetState(() => {
      setIsListening(true);
    });
  }, [safeSetState]);

  const onSpeechResults = useCallback((event: SpeechResultsEvent) => {
    const recognizedText = event.value?.[0] || '';
    console.log('🎤 Final voice result:', recognizedText);
    
    if (recognizedText && recognizedText.trim() && isComponentMountedRef.current) {
      const existingSessionText = currentSessionTextRef.current;
      const newSessionText = existingSessionText 
        ? `${existingSessionText} ${recognizedText}`.trim()
        : recognizedText;
      
      currentSessionTextRef.current = newSessionText;
      
      // Combine base text + accumulated session text
      const finalText = baseTextRef.current 
        ? `${baseTextRef.current} ${newSessionText}`.trim()
        : newSessionText;
      
      safeSetState(() => {
        setInputText(finalText);
        setVoiceInputText(finalText);
      });
      
      console.log('🎤 Accumulated text:', newSessionText);
    }
    
    console.log('🎤 Got final results but continuing to listen for more speech...');
  }, [safeSetState]);

  const onSpeechPartialResults = useCallback((event: SpeechResultsEvent) => {
    const partialText = event.value?.[0] || '';
    
    if (partialText && partialText.trim() && isComponentMountedRef.current) {
      const existingSessionText = currentSessionTextRef.current;
      const tempSessionText = existingSessionText 
        ? `${existingSessionText} ${partialText}`.trim()
        : partialText;
      
      const tempText = baseTextRef.current 
        ? `${baseTextRef.current} ${tempSessionText}`.trim()
        : tempSessionText;
      
      safeSetState(() => {
        setInputText(tempText);
        setVoiceInputText(tempText);
      });
      
      console.log('🎤 Showing partial:', tempSessionText);
    }
  }, [safeSetState]);

  const onSpeechEnd = useCallback(() => {
    console.log('🎤 Speech engine ended - but we will restart it to keep listening');
    

    if (isRecordingRef.current && isComponentMountedRef.current) {
      setTimeout(async () => {
        if (isRecordingRef.current && isComponentMountedRef.current) {
          try {
            console.log('🎤 Restarting voice recognition to continue listening...');
            console.log('🎤 Preserved session text:', currentSessionTextRef.current);
            
            await Voice.start('en-US', {
              EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
              EXTRA_PARTIAL_RESULTS: true,
              EXTRA_MAX_RESULTS: 1,
            });
          } catch (error) {
            console.log('❌ Error restarting voice:', error);
            safeSetState(() => {
              setIsListening(false);
              isRecordingRef.current = false;
            });
          }
        }
      }, 100);
    } else {
      safeSetState(() => {
        setIsListening(false);
        isRecordingRef.current = false;
      });
    }
  }, [safeSetState]);

  const onSpeechError = useCallback((event: SpeechErrorEvent) => {
    const errorCode = event.error?.code || 'unknown';
    console.log('Voice error:', errorCode);
    
    if (errorCode === '7' || errorCode === '8' || errorCode === '9') {

      if (errorCode === '7' && isRecordingRef.current && isComponentMountedRef.current) {
        console.log(' No speech detected, but continuing to listen...');
        // Restart to keep listening
        setTimeout(async () => {
          if (isRecordingRef.current && isComponentMountedRef.current) {
            try {
              await Voice.start('en-US', {
                EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
                EXTRA_PARTIAL_RESULTS: true,
                EXTRA_MAX_RESULTS: 1,
              });
            } catch (error) {
              console.log('Error restarting after no speech:', error);
              safeSetState(() => {
                setIsListening(false);
                isRecordingRef.current = false;
              });
            }
          }
        }, 100);
        return;
      }
    }
    
    // For other errors, stop listening
    safeSetState(() => {
      setIsListening(false);
      isRecordingRef.current = false;
    });
  }, [safeSetState]);

  const setupVoiceListeners = useCallback(() => {
    if (listenersSetupRef.current || !isComponentMountedRef.current) {
      return;
    }

    try {
      Voice.removeAllListeners();
      
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = onSpeechError;
      
      // Silent handlers for other events
      Voice.onSpeechVolumeChanged = () => {};
      Voice.onSpeechRecognized = () => {};
      
      listenersSetupRef.current = true;
      console.log('Voice listeners setup successfully');
    } catch (error) {
      console.log('Voice listener setup error:', error);
      listenersSetupRef.current = false;
    }
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
        console.log('Permission error:', err);
        return false;
      }
    }
    return true; // iOS permissions handled automatically
  }, []);

  const startListening = useCallback(async (): Promise<void> => {
    // Prevent multiple starts
    if (isRecordingRef.current || isListening || !isComponentMountedRef.current) {
      console.log('⚠️ Voice already active or component unmounted');
      return;
    }

    console.log('🎤 Starting voice recording (manual stop only)...');

    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Microphone permission is required for voice input.');
      return;
    }

    try {
      // Store the current text as base text (for appending)
      baseTextRef.current = inputText;
      currentSessionTextRef.current = '';
      
      // Clean up any previous voice session
      await Voice.destroy().catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      
      if (!isComponentMountedRef.current) return;

      // Setup listeners
      setupVoiceListeners();
      
      // Mark as recording BEFORE starting
      isRecordingRef.current = true;
      
      await Voice.start('en-US', {
        EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
        EXTRA_PARTIAL_RESULTS: true,
        EXTRA_MAX_RESULTS: 1,
        // Remove auto-stop settings
      });
      
      console.log('Voice recording started (will only stop when user clicks tick)');
      
    } catch (error) {
      console.log('Voice start error:', error);
      
      // Reset state on error
      safeSetState(() => {
        setIsListening(false);
        isRecordingRef.current = false;
      });
      
      Alert.alert('Voice Error', 'Could not start voice recording. Please try again.');
    }
  }, [checkPermissions, setupVoiceListeners, inputText, safeSetState, isListening]);

  // ✅ Stop voice recording - Manual stop only
  const stopListening = useCallback(async (): Promise<void> => {
    if (!isRecordingRef.current || !isComponentMountedRef.current) {
      console.log('⚠️ Voice not active or component unmounted');
      return;
    }

    console.log('Stopping voice recording (manual stop)...');

    // ✅ FIXED: Mark as not recording FIRST to prevent restart
    isRecordingRef.current = false;

    try {
      // Stop voice recognition
      await Promise.race([
        Promise.all([Voice.stop(), Voice.cancel()]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Voice stop timeout')), 2000)
        )
      ]);
      
      // Update final text state
      if (isComponentMountedRef.current) {
        const finalText = baseTextRef.current && currentSessionTextRef.current
          ? `${baseTextRef.current} ${currentSessionTextRef.current}`.trim()
          : baseTextRef.current || currentSessionTextRef.current || inputText;
        
        safeSetState(() => {
          setInputText(finalText);
          setVoiceInputText(finalText);
          setIsListening(false);
        });
      }
      
      console.log('Voice recording stopped successfully');
      
    } catch (error) {
      console.log('Voice stop error (handled):', error);
      
      // Always reset state even on error
      if (isComponentMountedRef.current) {
        safeSetState(() => {
          setIsListening(false);
        });
      }
    }
  }, [safeSetState, inputText]);

  const clearText = useCallback((): void => {
    if (isComponentMountedRef.current) {
      safeSetState(() => {
        setVoiceInputText('');
        setInputText('');
        baseTextRef.current = '';
        currentSessionTextRef.current = '';
      });
    }
  }, [safeSetState]);

  const updateInputText = useCallback((text: string) => {
    if (isComponentMountedRef.current) {
      setInputText(text);
      // Update base text so voice appends to typed text
      if (!isRecordingRef.current) {
        baseTextRef.current = text;
      }
    }
  }, []);

  const handleVoiceToggle = useCallback(async (): Promise<void> => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    // State
    inputText,
    isListening,
    voiceInputText,
    shouldFocusPromptInput,
    
    // Text management
    setInputText: updateInputText,
    setVoiceInputText,
    setShouldFocusPromptInput,
    clearText,
    
    // Voice controls
    startListening,  // Use for onPressIn
    stopListening,   // Use for onPressOut
    handleVoiceToggle,
    
    // Aliases for clarity
    startPushToTalk: startListening,
    stopPushToTalk: stopListening,
    clearVoiceInput: clearText,
  };
};