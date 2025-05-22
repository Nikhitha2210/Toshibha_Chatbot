import React from 'react'

import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import styles from './HomeScreen.Styles';
import Header from '../../components/header';
import PromptInput from '../../components/PromptInput';
import PromptCards from '../../components/PromptCards';
import RecentQueries from '../../components/RecentQueries';
import SearchComponent from '../../components/Search';

const HomeScreen = () => {

    const gestureHandlerWidth = useSharedValue(0);

    const { width } = Dimensions.get('screen');

    const panContext = { startX: 0, value: 0 };

    const openMenu = () => {
        gestureHandlerWidth.value = withTiming(width - 90);
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
            if (value <= width - 90 && value > 0) {
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
                gestureHandlerWidth.value = withTiming(width - 90, { duration: 500 });
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

                {/* Navigation Container */}
                <View style={styles.navigationWrapper}>
                    <View style={styles.navigationContentWrapper}>
                        <SearchComponent />
                        <TouchableOpacity style={{ alignItems: 'center' }}>
                            <Text style={styles.advanceSearchText}>Advanced Search</Text>
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.navigationProjects}>
                            <Image source={require('../../assets/images/folder.png')} style={styles.navigationProjectsIcon} />
                            <Text style={styles.navigationProjectsText}>Projects</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navigationExploreQueries}>
                            <Image source={require('../../assets/images/star.png')} style={styles.navigationExploreQueriesIcon} />
                            <Text style={styles.navigationExploreQueriesText}>Explore Queries</Text>
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <View style={styles.myQueriesWrapper}>
                            <Text style={styles.myQuerieText}>My Queries</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={styles.myQueryToogleWrapper}>
                                    <View style={styles.myQueryToogleButton} />
                                </View>
                                <Image source={require('../../assets/images/filter.png')} style={styles.myQueriesIcon} />
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            {[
                                { title: 'Today', items: ['Cancellation Fees', 'Subscription Sign Up', 'Settings Configuration', 'Repairs'] },
                                { title: 'Past week', items: ['Cancellation Fees', 'Subscription Sign Up', 'Settings Configuration', 'Repairs'] },
                                { title: 'Older', items: ['Cancellation Fees', 'Subscription Sign Up', 'Settings Configuration', 'Repairs'] },
                            ].map(section => (
                                <View key={section.title} style={styles.recentQueriesWrapper}>
                                    <Text style={styles.recentQueryTitle}>{section.title}</Text>
                                    {section.items.map((item, index) => (
                                        <Text key={index} style={styles.recentQueryText}>
                                            <Text style={styles.recentQueryIcon}>• </Text>{item}
                                        </Text>
                                    ))}
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.settingWrapper}>
                            <Image
                                source={require('../../assets/images/settings.png')}
                                style={styles.settingIcon}
                            />
                            <Text style={styles.settingsText}>Settings</Text>
                        </TouchableOpacity>
                    </View>
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
                            </View>
                            <View style={styles.inputContainer}>
                                <PromptInput />
                            </View>
                        </View>
                    </Animated.View>
                </GestureDetector>

            </Animated.View>
        </GestureDetector >
    )
}

export default HomeScreen