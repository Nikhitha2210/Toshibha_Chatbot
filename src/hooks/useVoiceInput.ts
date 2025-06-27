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
  const accumulatedTextRef = useRef<string>(''); // All speech from this session
  const baseTextRef = useRef<string>(''); // Text before voice started

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
        // Ignore errors when unmounting
      }
    }
  }, []);

  // Speech started
  const onSpeechStart = useCallback(() => {
    console.log('🎤 Voice recording started');
    safeSetState(() => {
      setIsListening(true);
    });
  }, [safeSetState]);

  // Final speech results (when user pauses)
  const onSpeechResults = useCallback((event: SpeechResultsEvent) => {
    const newText = event.value?.[0] || '';
    console.log(' Speech result:', newText);
    
    if (newText && newText.trim() && isComponentMountedRef.current && isRecordingRef.current) {
      // Add new text to accumulated text
      const currentText = accumulatedTextRef.current;
      const updatedText = currentText 
        ? `${currentText} ${newText}`.trim()
        : newText;
      
      accumulatedTextRef.current = updatedText;
      
      // Show in UI (base text + accumulated voice text)
      const displayText = baseTextRef.current 
        ? `${baseTextRef.current} ${updatedText}`.trim()
        : updatedText;
      
      safeSetState(() => {
        setInputText(displayText);
        setVoiceInputText(displayText);
      });
      
      console.log(' Accumulated speech:', updatedText);
    }
  }, [safeSetState]);

  // Partial results (real-time feedback)
  const onSpeechPartialResults = useCallback((event: SpeechResultsEvent) => {
    const partialText = event.value?.[0] || '';
    
    if (partialText && partialText.trim() && isComponentMountedRef.current && isRecordingRef.current) {
      // Show accumulated + current partial
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

  // Speech engine stopped (restart to keep listening)
  const onSpeechEnd = useCallback(() => {
    console.log(' Speech engine ended');
    
    // If we're still supposed to be recording, restart the engine
    if (isRecordingRef.current && isComponentMountedRef.current) {
      console.log(' Restarting speech engine to continue listening...');
      
      setTimeout(async () => {
        if (isRecordingRef.current && isComponentMountedRef.current) {
          try {
            await Voice.start('en-US', {
              EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
              EXTRA_PARTIAL_RESULTS: true,
              EXTRA_MAX_RESULTS: 1,
            });
          } catch (error) {
            console.log(' Error restarting voice:', error);
            // Stop if restart fails
            safeSetState(() => {
              setIsListening(false);
              isRecordingRef.current = false;
            });
          }
        }
      }, 100);
    } else {
      // User stopped manually
      safeSetState(() => {
        setIsListening(false);
      });
    }
  }, [safeSetState]);

  // Handle speech errors
  const onSpeechError = useCallback((event: SpeechErrorEvent) => {
    const errorCode = event.error?.code || 'unknown';
    console.log(' Speech error:', errorCode);
   
    
    if (errorCode === '7') {
      // No speech detected - this is normal, continue listening
      console.log(' No speech detected, continuing to listen...');
      return;
    }
    
    if (errorCode === '8' && isRecordingRef.current) {
      // Service busy, try to restart
      console.log(' Service busy, restarting...');
      setTimeout(async () => {
        if (isRecordingRef.current && isComponentMountedRef.current) {
          try {
            await Voice.start('en-US', {
              EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
              EXTRA_PARTIAL_RESULTS: true,
              EXTRA_MAX_RESULTS: 1,
            });
          } catch (error) {
            console.log(' Error restarting after busy:', error);
            safeSetState(() => {
              setIsListening(false);
              isRecordingRef.current = false;
            });
          }
        }
      }, 200);
      return;
    }
    
    // For other errors, stop listening
    console.log(' Stopping due to error:', errorCode);
    safeSetState(() => {
      setIsListening(false);
      isRecordingRef.current = false;
    });
    
    if (errorCode === '9') {
      Alert.alert('Permission Error', 'Microphone permission is required.');
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
      
      // Silent handlers
      Voice.onSpeechVolumeChanged = () => {};
      Voice.onSpeechRecognized = () => {};
      
      console.log(' Voice listeners setup');
    } catch (error) {
      console.log('Voice listener setup error:', error);
    }
  }, [onSpeechStart, onSpeechResults, onSpeechPartialResults, onSpeechEnd, onSpeechError]);

  // Check microphone permissions
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
    return true;
  }, []);

  const startListening = useCallback(async (): Promise<void> => {
    if (isRecordingRef.current || !isComponentMountedRef.current) {
      console.log(' Already listening or component unmounted');
      return;
    }

    console.log(' STARTING continuous voice recording...');

    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Microphone permission is required for voice input.');
      return;
    }

    try {
      // Store current text as base
      baseTextRef.current = inputText;
      accumulatedTextRef.current = '';
      
      // Clean up previous session
      await Voice.destroy().catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isComponentMountedRef.current) return;

      // Setup listeners
      setupVoiceListeners();
      
      // Mark as recording
      isRecordingRef.current = true;
      
      // Start voice recognition
      await Voice.start('en-US', {
        EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
        EXTRA_PARTIAL_RESULTS: true,
        EXTRA_MAX_RESULTS: 1,
      });
      
      console.log('✅ Continuous voice recording started - speak now!');
      
    } catch (error) {
      console.log(' Voice start error:', error);
      
      safeSetState(() => {
        setIsListening(false);
        isRecordingRef.current = false;
      });
      
      Alert.alert('Voice Error', 'Could not start voice recording. Please try again.');
    }
  }, [checkPermissions, setupVoiceListeners, inputText, safeSetState]);

  // ✅ STOP LISTENING - Click tick/stop button
  const stopListening = useCallback(async (): Promise<void> => {
    if (!isRecordingRef.current || !isComponentMountedRef.current) {
      console.log('Not currently listening');
      return;
    }

    console.log(' STOPPING voice recording...');

    // Mark as not recording (prevents restart)
    isRecordingRef.current = false;

    try {
      // Stop voice recognition
      await Promise.race([
        Promise.all([Voice.stop(), Voice.cancel()]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ]);
      
      // Finalize text
      if (isComponentMountedRef.current) {
        const finalText = baseTextRef.current && accumulatedTextRef.current
          ? `${baseTextRef.current} ${accumulatedTextRef.current}`.trim()
          : baseTextRef.current || accumulatedTextRef.current || inputText;
        
        safeSetState(() => {
          setInputText(finalText);
          setVoiceInputText(finalText);
          setIsListening(false);
        });
        
        console.log(' Final voice text:', finalText);
      }
      
    } catch (error) {
      console.log('Voice stop error (handled):', error);
      
      safeSetState(() => {
        setIsListening(false);
      });
    }
  }, [safeSetState, inputText]);

  // Clear text
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

  // Update text manually (typing)
  const updateInputText = useCallback((text: string) => {
    if (isComponentMountedRef.current) {
      setInputText(text);
      if (!isRecordingRef.current) {
        baseTextRef.current = text;
      }
    }
  }, []);

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
    
    // Voice controls - SIMPLE CLICK TO START/STOP
    startListening,  // Click microphone = start continuous listening
    stopListening,   // Click tick/stop = stop and finalize
    
    // Aliases
    startVoiceRecording: startListening,
    stopVoiceRecording: stopListening,
    clearVoiceInput: clearText,
  };
};