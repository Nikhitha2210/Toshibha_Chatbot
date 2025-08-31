import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Text, FlatList } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colors';
import IconAssets from '../../assets/icons/IconAssets';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ROUTE_NAMES } from '../../navigation/constants';

const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { logout } = useAuth();

    const logoutUser = () => {
        logout();
        navigation.navigate('Login');
    };

    const handleSecurity = () => {
        navigation.navigate(ROUTE_NAMES.ResetPassword, { fromSettings: true });
    };

    const handleAuthentication = () => {
        navigation.navigate(ROUTE_NAMES.MFASettings);
    }

    const settingsOptions = [
        // { id: '1', title: 'Profile', icon: 'person', screen: 'Profile' },
        // { id: '2', title: 'Account', icon: 'settings', screen: 'Account' },
        { id: '3', title: 'Security', icon: 'lock-closed', action: handleSecurity },
        { id: '4', title: 'Logout', icon: 'log-out', action: logoutUser },
        // { id: '5', title: 'Authentication', icon: 'shield-checkmark', action: handleAuthentication },
    ];

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.optionButton}
            onPress={() => {
                if (item.action) {
                    item.action();
                } else if (item.screen) {
                    navigation.navigate(item.screen);
                }
            }}
        >
            <Ionicons name={item.icon} size={20} color="#fff" style={styles.icon} />
            <Text style={styles.optionText}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.wrapper}>
                    <View style={{ marginBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingTop: 25 }}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <IconAssets.ArrowLeftDark width={24} height={24} />
                        </TouchableOpacity>

                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <IconAssets.Logo style={styles.logo} />
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Account</Text>

                    <FlatList
                        data={settingsOptions}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                    />

                </View>
            </ScrollView>
        </View>
    );
};

export default SettingsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background2,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    wrapper: {
        flex: 1,
    },
    logo: {
        height: 40,
        width: 96,
    },
    backButton: {
        marginTop: 10,
        marginLeft: -8,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    list: {
        paddingBottom: 20,
    },
    optionButton: {
        backgroundColor: Colors.dark.background3,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        marginRight: 12,
    },
    optionText: {
        color: '#fff',
        fontSize: 16,
    },
});