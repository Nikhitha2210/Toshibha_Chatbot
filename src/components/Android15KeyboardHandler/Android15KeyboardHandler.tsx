// src/components/Android15KeyboardHandler.tsx

import React, { useEffect, useState, ReactNode } from 'react';
import { 
  Keyboard, 
  Dimensions, 
  Platform, 
  StatusBar,
  View,
  ViewStyle,
  KeyboardEvent
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ FIXED: Add proper TypeScript interfaces
interface Android15KeyboardHandlerProps {
  children: ReactNode;
}

interface Android15InputWrapperProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const Android15KeyboardHandler: React.FC<Android15KeyboardHandlerProps> = ({ children }) => {
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [screenHeight, setScreenHeight] = useState<number>(Dimensions.get('window').height);
  const insets = useSafeAreaInsets();
  
  // ✅ FIXED: Remove DeviceInfo import, use Platform.Version directly
  const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

  useEffect(() => {
    if (!isAndroid15) return;

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      console.log('🎹 Android 15 Keyboard shown:', e.endCoordinates.height);
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('🎹 Android 15 Keyboard hidden');
      setKeyboardHeight(0);
    });

    const dimensionListener = Dimensions.addEventListener('change', ({ window }) => {
      setScreenHeight(window.height);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
      dimensionListener?.remove();
    };
  }, [isAndroid15]);

  if (!isAndroid15) {
    // For non-Android 15 devices, render children normally
    return <>{children}</>;
  }

  // Android 15 specific keyboard handling
  const adjustedHeight = screenHeight - keyboardHeight - (StatusBar.currentHeight || 0) - insets.bottom;

  return (
    <View style={{ 
      flex: 1, 
      height: keyboardHeight > 0 ? adjustedHeight : undefined,
      paddingTop: insets.top,
      paddingBottom: keyboardHeight > 0 ? 0 : insets.bottom 
    }}>
      {children}
    </View>
  );
};

// Enhanced PromptInput wrapper for Android 15
export const Android15InputWrapper: React.FC<Android15InputWrapperProps> = ({ children, style }) => {
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  
  // ✅ FIXED: Use Platform.Version directly instead of DeviceInfo
  const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

  useEffect(() => {
    if (!isAndroid15) return;

    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });

    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showListener?.remove();
      hideListener?.remove();
    };
  }, [isAndroid15]);

  if (!isAndroid15) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[
      style,
      keyboardVisible && {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        elevation: 1000,
      }
    ]}>
      {children}
    </View>
  );
};