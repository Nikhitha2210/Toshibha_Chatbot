import React, { useState } from 'react';

import { Modal, Text, TouchableOpacity, Animated, Dimensions, View, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getStyles } from './Sidebar.styles';
import IconAssets from '../../assets/icons/IconAssets';

import { useThemeContext } from '../../context/ThemeContext';

import SearchComponent from '../Search';
import { useVoiceInput } from '../../hooks/useVoiceInput';

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
    const sidebarWidth = useState(new Animated.Value(SCREEN_WIDTH * 0.7))[0];

    const navigation = useNavigation<NavigationProp>();

    const { theme, toggleTheme, colors } = useThemeContext();
    const styles = getStyles(theme);

    const { setInputText, setShouldFocusPromptInput } = useVoiceInput();

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

    const handleEditPress = () => {
        handleClose();
        navigation.navigate('Home');
        setInputText('');
        setShouldFocusPromptInput(true);
    };

    return (
        <Modal visible={visible} transparent animationType="none">
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <Animated.View style={[styles.sidebarWrapper, { transform: [{ translateX: slideAnim }] }]}>
                <Animated.View style={[styles.sidebar, { width: sidebarWidth }]}>
                    <SearchComponent onFocus={expandSidebar} onBlur={resetSidebar} onEditPress={handleEditPress} />
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
                    <TouchableOpacity onPress={toggleTheme} style={{ margin: 20, alignSelf: 'center', padding: 10, backgroundColor: colors.primary, borderRadius: 8 }}>
                        <Text style={{ color: colors.background }}>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

export default Sidebar;