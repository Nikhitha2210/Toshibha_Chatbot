import React, { useState } from 'react'

import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';

import styles from './HomeScreen.Styles';
import Header from '../../components/header';
import PromptInput from '../../components/PromptInput';
import PromptCards from '../../components/PromptCards';
import RecentQueries from '../../components/RecentQueries';
import SearchComponent from '../../components/Search';
import IconAssets from '../../assets/icons/IconAssets';

const HomeScreen = () => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const gestureHandlerWidth = useSharedValue(0);

    const { width } = Dimensions.get('screen');

    const openMenu = () => {
        gestureHandlerWidth.value = withTiming(width - 90);
    };

    const mainAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [gestureHandlerWidth.value === 0 ? { translateX: withTiming(0) } : { translateX: gestureHandlerWidth.value }],
        };
    });

    const onGestureEvent = useAnimatedGestureHandler({
        onStart: (e, ctx) => {
            ctx.startX = gestureHandlerWidth.value;
        },
        onActive: (e, ctx: any) => {
            const value = ctx.startX + e.translationX;

            if (value <= width - 90 && value > 0) {
                gestureHandlerWidth.value = value;
                ctx.value = value;
            }
        },
        onEnd: (e, ctx: any) => {
            if (ctx.value > width - 200) {
                gestureHandlerWidth.value = withTiming(width - 90, { duration: 500 });
            }

            if (e.translationX < 0) {
                gestureHandlerWidth.value = withTiming(0, { duration: 500 });
            }

            if (ctx.value < width - 200) {
                gestureHandlerWidth.value = withTiming(0, { duration: 500 });
            }
        },
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
    };

    const onSearchFocus = () => {
        gestureHandlerWidth.value = withTiming(width);
    };

    const animatedNavigationContentStyle = useAnimatedStyle(() => {
        return {
            flex: 1,
            marginLeft: gestureHandlerWidth.value === width ? withTiming(0) : 90,
            paddingTop: 40,
            paddingBottom: 20,
        };
    });

    return (
        <PanGestureHandler onGestureEvent={onGestureEvent}>
            <Animated.View style={[styles.container, mainAnimatedStyle]}>

                <TapGestureHandler maxDelayMs={250} numberOfTaps={1}>
                    {/* Navigation Container */}
                    <Animated.View style={styles.navigationWrapper}>
                        <Animated.View style={animatedNavigationContentStyle}>
                            <SearchComponent
                                onSearchFocus={() => setIsSearchFocused(true)}
                                onBackPress={() => {
                                    setIsSearchFocused(false);
                                    gestureHandlerWidth.value = withTiming(0, { duration: 300 });
                                }}
                            />
                            <TouchableOpacity style={{ alignItems: 'center' }}>
                                <Text style={styles.advanceSearchText}>Advanced Search</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.navigationProjects}>
                                <IconAssets.Folder style={styles.navigationProjectsIcon} />
                                <Text style={styles.navigationProjectsText}>Projects</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.navigationExploreQueries}>
                                <IconAssets.Star style={styles.navigationExploreQueriesIcon} />
                                <Text style={styles.navigationExploreQueriesText}>Explore Queries</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <View style={styles.myQueriesWrapper}>
                                <Text style={styles.myQuerieText}>My Queries</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={styles.myQueryToogleWrapper}>
                                        <View style={styles.myQueryToogleButton} />
                                    </View>
                                    <IconAssets.Filter style={styles.myQueriesIcon} />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
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
                                </ScrollView>
                            </View>
                            <TouchableOpacity style={styles.settingWrapper}>
                                <IconAssets.Setting style={styles.settingIcon} />
                                <Text style={styles.settingsText}>Settings</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>
                </TapGestureHandler>

                {/* Main Container */}
                <TapGestureHandler maxDelayMs={250} numberOfTaps={1} onActivated={onActivated}>
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
                </TapGestureHandler>

            </Animated.View>
        </PanGestureHandler >
    )
}

export default HomeScreen