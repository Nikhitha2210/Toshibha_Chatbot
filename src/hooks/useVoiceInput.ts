import { useState, useRef, useCallback, useEffect } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

export const useVoiceInput = () => {
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceInputText, setVoiceInputText] = useState<string>('');
  const [shouldFocusPromptInput, setShouldFocusPromptInput] = useState<boolean>(false);
  
  // ✅ CRITICAL: Refs for safe voice management
  const isRecordingRef = useRef<boolean>(false);
  const isComponentMountedRef = useRef<boolean>(true);
  const listenersSetupRef = useRef<boolean>(false);
  const currentSessionTextRef = useRef<string>(''); // Text from current voice session only
  const baseTextRef = useRef<string>(''); // Text that was already in input before voice session

  // ✅ CRITICAL: Safe cleanup on unmount
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

  // ✅ CRITICAL: Safe state updates only when mounted - FIXED TYPESCRIPT
  const safeSetState = useCallback((stateSetter: () => void) => {
    if (isComponentMountedRef.current) {
      try {
        stateSetter();
      } catch (error) {
        // Ignore state update errors when component is unmounting
      }
    }
  }, []);

  // ✅ Voice event handlers - FIXED TYPESCRIPT
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
      currentSessionTextRef.current = recognizedText;
      
      // Combine base text + current session text
      const finalText = baseTextRef.current 
        ? `${baseTextRef.current} ${recognizedText}`.trim()
        : recognizedText;
      
      safeSetState(() => {
        setInputText(finalText);
        setVoiceInputText(finalText);
      });
    }
  }, [safeSetState]);

  const onSpeechPartialResults = useCallback((event: SpeechResultsEvent) => {
    const partialText = event.value?.[0] || '';
    
    if (partialText && partialText.trim() && isComponentMountedRef.current) {
      currentSessionTextRef.current = partialText;
      
      // Show partial results in real-time
      const tempText = baseTextRef.current 
        ? `${baseTextRef.current} ${partialText}`.trim()
        : partialText;
      
      safeSetState(() => {
        setInputText(tempText);
        setVoiceInputText(tempText);
      });
    }
  }, [safeSetState]);

  const onSpeechEnd = useCallback(() => {
    console.log('🎤 Voice stopped recording');
    safeSetState(() => {
      setIsListening(false);
      isRecordingRef.current = false;
    });
  }, [safeSetState]);

  const onSpeechError = useCallback((event: SpeechErrorEvent) => {
    const errorCode = event.error?.code || 'unknown';
    console.log('❌ Voice error (handled):', errorCode);
    
    safeSetState(() => {
      setIsListening(false);
      isRecordingRef.current = false;
    });
    
    // Only show alerts for critical errors, not common ones
    if (errorCode !== '8' && errorCode !== '9' && errorCode !== '7') {
      // Don't show error for permission denied, network errors, etc.
    }
  }, [safeSetState]);

  // ✅ CRITICAL: Setup voice listeners safely
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
      console.log('✅ Voice listeners setup successfully');
    } catch (error) {
      console.log('❌ Voice listener setup error:', error);
      listenersSetupRef.current = false;
    }
  }, [onSpeechStart, onSpeechResults, onSpeechPartialResults, onSpeechEnd, onSpeechError]);

  // ✅ Check microphone permissions
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

  // ✅ PERFECT: Start voice recording (onPressIn)
  const startListening = useCallback(async (): Promise<void> => {
    // Prevent multiple starts
    if (isRecordingRef.current || isListening || !isComponentMountedRef.current) {
      console.log('⚠️ Voice already active or component unmounted');
      return;
    }

    console.log('🎤 Starting voice recording...');

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
      
      // Start voice recognition
      await Voice.start('en-US', {
        EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
        EXTRA_PARTIAL_RESULTS: true,
        EXTRA_MAX_RESULTS: 1,
      });
      
      console.log('✅ Voice recording started successfully');
      
    } catch (error) {
      console.log('❌ Voice start error:', error);
      
      // Reset state on error
      safeSetState(() => {
        setIsListening(false);
        isRecordingRef.current = false;
      });
      
      Alert.alert('Voice Error', 'Could not start voice recording. Please try again.');
    }
  }, [checkPermissions, setupVoiceListeners, inputText, safeSetState, isListening]);

  // ✅ PERFECT: Stop voice recording (onPressOut)
  const stopListening = useCallback(async (): Promise<void> => {
    if (!isRecordingRef.current || !isComponentMountedRef.current) {
      console.log('⚠️ Voice not active or component unmounted');
      return;
    }

    console.log('🎤 Stopping voice recording...');

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
          isRecordingRef.current = false;
        });
      }
      
      console.log('✅ Voice recording stopped successfully');
      
    } catch (error) {
      console.log('⚠️ Voice stop error (handled):', error);
      
      // Always reset state even on error
      if (isComponentMountedRef.current) {
        safeSetState(() => {
          setIsListening(false);
          isRecordingRef.current = false;
        });
      }
    }
  }, [safeSetState, inputText]);

  // ✅ Clear all text
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

  // ✅ Manual text update (for typing) - FIXED TYPESCRIPT
  const updateInputText = useCallback((text: string) => {
    if (isComponentMountedRef.current) {
      setInputText(text);
      // Update base text so voice appends to typed text
      if (!isRecordingRef.current) {
        baseTextRef.current = text;
      }
    }
  }, []);

  // ✅ Toggle function (for backward compatibility)
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