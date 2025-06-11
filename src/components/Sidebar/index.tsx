import React, { useState } from 'react';

import { Modal, Text, TouchableOpacity, Animated, Dimensions, View, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getStyles } from './Sidebar.styles';
import { getThemedIcon } from '../../assets/icons/IconAssets';

import { useThemeContext } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';

import SearchComponent from '../Search';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import Colors from '../../theme/colors';
import ThemeToggle from '../../theme/ThemeToggle';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface SidebarProps {
    visible: boolean;
    slideAnim: Animated.Value;
    onClose: () => void;
}

type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    AiAssist: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Sidebar: React.FC<SidebarProps> = ({ visible, slideAnim, onClose }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMyQueriesEnabled, setIsMyQueriesEnabled] = useState(true);

    const sidebarWidth = useState(new Animated.Value(SCREEN_WIDTH * 0.7))[0];

    const navigation = useNavigation<NavigationProp>();
    const { sessions, loadSession, startNewSession } = useChat();

    const { theme } = useThemeContext();
    const styles = getStyles(theme);

    const { setInputText, setShouldFocusPromptInput } = useVoiceInput();

    const ThemedFolderIcon = getThemedIcon('Folder', theme);
    const ThemedStarIcon = getThemedIcon('Star', theme);
    const ThemedSettingsIcon = getThemedIcon('Settings', theme);
    const ThemedFilterIcon = getThemedIcon('Filter', theme);

    const expandSidebar = () => {
        setIsExpanded(true);
        sidebarWidth.setValue(SCREEN_WIDTH * 0.7);
        Animated.timing(sidebarWidth, {
            toValue: SCREEN_WIDTH,
            duration: 100,
            useNativeDriver: false,
        }).start();
    };

    const resetSidebar = () => {
        setIsExpanded(false);
        Animated.timing(sidebarWidth, {
            toValue: SCREEN_WIDTH * 0.7,
            duration: 100,
            useNativeDriver: false,
        }).start();
    };

    const handleClose = () => {
        resetSidebar();
        Animated.timing(slideAnim, {
            toValue: -SCREEN_WIDTH,
            duration: 100,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    const handleNewChat = () => {
        handleClose();
        startNewSession();
        navigation.navigate('Home');
        setInputText('');
        setShouldFocusPromptInput(true);
    };

    const handleSessionClick = (sessionId: string) => {
        handleClose();
        loadSession(sessionId);
        navigation.navigate('AiAssist');
    };

    // Group sessions by time
    const groupSessionsByTime = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const grouped = {
            today: [] as typeof sessions,
            yesterday: [] as typeof sessions,
            pastWeek: [] as typeof sessions,
            older: [] as typeof sessions
        };

        sessions.forEach(session => {
            const sessionDate = new Date(session.timestamp);
            if (sessionDate >= today) {
                grouped.today.push(session);
            } else if (sessionDate >= yesterday) {
                grouped.yesterday.push(session);
            } else if (sessionDate >= weekAgo) {
                grouped.pastWeek.push(session);
            } else {
                grouped.older.push(session);
            }
        });

        return grouped;
    };

    const groupedSessions = groupSessionsByTime();

    return (
        <Modal visible={visible} transparent animationType="none">
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <Animated.View style={[styles.sidebarWrapper, { transform: [{ translateX: slideAnim }] }]}>
                <Animated.View style={[styles.sidebar, { width: sidebarWidth }]}>
                    <SearchComponent onFocus={expandSidebar} onBlur={resetSidebar} onEditPress={handleNewChat} />
                    
                    <TouchableOpacity style={{ alignItems: 'center' }} onPress={handleNewChat}>
                        <Text style={styles.advanceSearchText}>+ New Chat</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.divider} />
                    
                    <TouchableOpacity style={styles.navigationProjects}>
                        {ThemedFolderIcon && <ThemedFolderIcon style={styles.navigationProjectsIcon} />}
                        <Text style={styles.navigationProjectsText}>Projects</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.navigationExploreQueries}>
                        {ThemedStarIcon && <ThemedStarIcon style={styles.navigationExploreQueriesIcon} />}
                        <Text style={styles.navigationExploreQueriesText}>Explore Queries</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.myQueriesWrapper}>
                        <Text style={styles.myQuerieText}>My Sessions</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                                style={[
                                    styles.myQueryToogleWrapper,
                                    {
                                        backgroundColor: isMyQueriesEnabled ? Colors.dark.primary : '#ccc',
                                        alignItems: isMyQueriesEnabled ? 'flex-end' : 'flex-start',
                                    },
                                ]}
                                onPress={() => setIsMyQueriesEnabled(!isMyQueriesEnabled)}
                            >
                                <View
                                    style={[
                                        styles.myQueryToogleButton,
                                        {
                                            backgroundColor: isMyQueriesEnabled ? Colors.dark.text : '#fff',
                                        },
                                    ]}
                                />
                            </TouchableOpacity>
                            {ThemedFilterIcon && <ThemedFilterIcon style={styles.myQueriesIcon} />}
                        </View>
                    </View>
                    
                    <View style={{ flex: 1 }}>
                        <ScrollView 
                            contentContainerStyle={{ flexGrow: 1 }} 
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled={true}
                        >
                            {isMyQueriesEnabled && (
                                <>
                                    {/* Today's Sessions */}
                                    {groupedSessions.today.length > 0 && (
                                        <View style={styles.recentQueriesWrapper}>
                                            <Text style={styles.recentQueryTitle}>Today</Text>
                                            {groupedSessions.today.map((session) => (
                                                <TouchableOpacity
                                                    key={session.id}
                                                    onPress={() => handleSessionClick(session.id)}
                                                    style={styles.sessionItem}
                                                >
                                                    <Text style={styles.recentQueryText}>
                                                        <Text style={styles.recentQueryIcon}>• </Text>
                                                        {session.title}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {/* Yesterday's Sessions */}
                                    {groupedSessions.yesterday.length > 0 && (
                                        <View style={styles.recentQueriesWrapper}>
                                            <Text style={styles.recentQueryTitle}>Yesterday</Text>
                                            {groupedSessions.yesterday.map((session) => (
                                                <TouchableOpacity
                                                    key={session.id}
                                                    onPress={() => handleSessionClick(session.id)}
                                                    style={styles.sessionItem}
                                                >
                                                    <Text style={styles.recentQueryText}>
                                                        <Text style={styles.recentQueryIcon}>• </Text>
                                                        {session.title}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {/* Past Week Sessions */}
                                    {groupedSessions.pastWeek.length > 0 && (
                                        <View style={styles.recentQueriesWrapper}>
                                            <Text style={styles.recentQueryTitle}>Past Week</Text>
                                            {groupedSessions.pastWeek.map((session) => (
                                                <TouchableOpacity
                                                    key={session.id}
                                                    onPress={() => handleSessionClick(session.id)}
                                                    style={styles.sessionItem}
                                                >
                                                    <Text style={styles.recentQueryText}>
                                                        <Text style={styles.recentQueryIcon}>• </Text>
                                                        {session.title}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {/* Older Sessions */}
                                    {groupedSessions.older.length > 0 && (
                                        <View style={styles.recentQueriesWrapper}>
                                            <Text style={styles.recentQueryTitle}>Older</Text>
                                            {groupedSessions.older.map((session) => (
                                                <TouchableOpacity
                                                    key={session.id}
                                                    onPress={() => handleSessionClick(session.id)}
                                                    style={styles.sessionItem}
                                                >
                                                    <Text style={styles.recentQueryText}>
                                                        <Text style={styles.recentQueryIcon}>• </Text>
                                                        {session.title}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {/* Empty State */}
                                    {sessions.length === 0 && (
                                        <View style={styles.recentQueriesWrapper}>
                                            <Text style={[styles.recentQueryText, { textAlign: 'center', fontStyle: 'italic' }]}>
                                                No chat sessions yet.{'\n'}Start a conversation to see your history here.
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </ScrollView>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <TouchableOpacity style={styles.settingWrapper}>
                            {ThemedSettingsIcon && <ThemedSettingsIcon style={styles.settingIcon} />}
                            <Text style={styles.settingsText}>Settings</Text>
                        </TouchableOpacity>
                        <ThemeToggle />
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

export default Sidebar;