import React from 'react'

import { Dimensions, Text, TouchableOpacity, View } from 'react-native'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import styles from "./HomeScreen.Styles";
import Header from '../../components/header';
import PromptInput from '../../components/PromptInput';
import PromptCards from '../../components/PromptCards';
import RecentQueries from '../../components/RecentQueries';

const HomeScreen = () => {

    const gestureHandlerWidth = useSharedValue(0);

    const { width } = Dimensions.get('screen');

    const panContext = { startX: 0, value: 0 };

    const openMenu = () => {
        gestureHandlerWidth.value = withTiming(width - 70);
    };

    const closeMenu = () => {
        gestureHandlerWidth.value = withTiming(0);
    };

    const mainAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [gestureHandlerWidth.value === 0 ? { translateX: withTiming(0) } : { translateX: gestureHandlerWidth.value }],
        };
    });

    const panGesture = Gesture.Pan()
        .onStart((e) => {
            panContext.startX = gestureHandlerWidth.value;
        })
        .onUpdate((e) => {
            const value = panContext.startX + e.translationX;
            if (value <= width - 70 && value > 0) {
                gestureHandlerWidth.value = value;
                panContext.value = value;
            }
        })
        .onEnd((e) => {
            const draggedDistance = gestureHandlerWidth.value;
            const threshold = width / 3;

            if (e.translationX < -30) {
                gestureHandlerWidth.value = withTiming(0, { duration: 500 });
            } else if (draggedDistance > threshold) {
                gestureHandlerWidth.value = withTiming(width - 70, { duration: 500 });
            } else {
                gestureHandlerWidth.value = withTiming(0, { duration: 500 });
            }
        });

    const overlayAnimatedStyle = useAnimatedStyle(() => {
        let value = Math.floor((gestureHandlerWidth.value / width) * 100) / 100;
        return {
            display: gestureHandlerWidth.value ? 'flex' : 'none',
            opacity: Math.min(value, 0.50),
        };
    });

    const onActivated = () => {
        gestureHandlerWidth.value = withTiming(0, { duration: 300 });
        // hideNavigationContextMenu();
    };

    const tapGesture = Gesture.Tap()
        .maxDelay(250)
        .numberOfTaps(1)
        .onEnd(() => {
            runOnJS(onActivated)();
        });

    // const hideNavigationContextMenu = ()=>{
    //     setIsNavigationContextMenuOpen(false);
    //     setTimeout((()=>{
    //         setNavigationContextMenuPosition({...navigationContextMenuPosition, absoluteX:0, absoluteY:-500});
    //     }));
    // };

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.container, mainAnimatedStyle]}>

                <View style={styles.navigationWrapper}>
                    <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                        <Text style={styles.btnText}>Close Menu</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Container */}
                <GestureDetector gesture={tapGesture}>
                    <Animated.View style={styles.mainWrapper}>
                        <Animated.View style={[styles.mainWrapperOverlay, overlayAnimatedStyle]} />
                        <View style={styles.mainContent} >
                            <Header onMenuPress={openMenu} />
                            <View style={styles.centerContainer}>
                                <Text style={styles.headerText}>What can I help with?</Text>
                                <Text style={styles.headerSubText}>Use one of most common prompts{'\n'}below to begin</Text>
                                <View style={styles.queriesContainer}>
                                    <PromptCards />
                                    <RecentQueries />
                                </View>
                                <PromptInput />
                            </View>
                        </View>
                    </Animated.View>
                </GestureDetector>

            </Animated.View>
        </GestureDetector>
    )
}

export default HomeScreen