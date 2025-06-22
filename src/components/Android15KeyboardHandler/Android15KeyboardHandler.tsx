// Create: src/components/Android15KeyboardHandler/Android15KeyboardHandler.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Keyboard, Animated, Platform } from 'react-native';
import { isAndroid15OrNewer } from '../../utils/androidUtils';

interface Props {
  children: React.ReactNode;
  inputHeight?: number;
}

const Android15KeyboardHandler: React.FC<Props> = ({ children, inputHeight = 100 }) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Only apply special handling for Android 15+
    if (!isAndroid15OrNewer()) {
      return; // Use default behavior for older Android
    }

    console.log('🤖 Android 15+ detected - applying enhanced keyboard handling');

    const keyboardDidShow = (e: any) => {
      const height = e.endCoordinates.height;
      setKeyboardHeight(height);
      
      // Android 15 specific: Move content up more to account for new keyboard behavior
      const adjustedHeight = height + 20; // Extra padding for Android 15
      
      Animated.timing(animatedValue, {
        toValue: adjustedHeight,
        duration: 200, // Android 15 has faster animations
        useNativeDriver: false,
      }).start();
    };

    const keyboardDidHide = () => {
      setKeyboardHeight(0);
      
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    };

    const showListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    const hideListener = Keyboard.addListener('keyboardDidHide', keyboardDidHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [animatedValue]);

  // For Android 15+, wrap content in animated view
  if (isAndroid15OrNewer()) {
    return (
      <Animated.View style={{ 
        flex: 1,
        marginBottom: animatedValue 
      }}>
        {children}
      </Animated.View>
    );
}
}