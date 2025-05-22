import React from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import styles from './HomeScreen.Styles';
import PromptInput from '../../components/PromptInput';

const HomeScreen = () => {
  const gestureHandlerWidth = useSharedValue(0);
  const { width } = Dimensions.get('screen');

  const openMenu = () => {
    gestureHandlerWidth.value = withTiming(width - 70);
  };

  const closeMenu = () => {
    gestureHandlerWidth.value = withTiming(0);
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Optional: logic on gesture begin
    })
    .onUpdate((event) => {
      const value = event.translationX + gestureHandlerWidth.value;
      if (value <= width - 70 && value > 0) {
        gestureHandlerWidth.value = value;
      }
    })
    .onEnd((event) => {
      const finalPosition = gestureHandlerWidth.value;

      if (finalPosition > width - 200) {
        gestureHandlerWidth.value = withTiming(width - 70, { duration: 500 });
      } else {
        gestureHandlerWidth.value = withTiming(0, { duration: 500 });
      }
    });

  const tapGesture = Gesture.Tap()
    .maxDelay(250)
    .numberOfTaps(1)
    .onStart(() => {
      gestureHandlerWidth.value = withTiming(0, { duration: 300 });
    });

  const mainAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: gestureHandlerWidth.value },
      ],
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const opacity = Math.min(gestureHandlerWidth.value / width, 0.5);
    return {
      display: gestureHandlerWidth.value > 0 ? 'flex' : 'none',
      opacity,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, mainAnimatedStyle]}>
        <View style={styles.navigationWrapper}>
          <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
            <Text style={styles.btnText}>Close Menu</Text>
          </TouchableOpacity>
        </View>

        <GestureDetector gesture={tapGesture}>
          <Animated.View style={styles.mainWrapper}>
            <Animated.View style={[styles.mainWrapperOverlay, overlayAnimatedStyle]} />
            <View style={styles.mainContent}>
              <Text style={styles.headerText}>
                What can I help with?
              </Text>
              <Text style={styles.headerSubText}>
                Use one of most common prompts{'\n'}below to begin
              </Text>
              <PromptInput />
            </View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </GestureDetector>
  );
};

export default HomeScreen;
