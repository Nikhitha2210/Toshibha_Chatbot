import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Colors from '../../theme/colors';

type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    AiAssist: undefined;
    Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingsScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { logout } = useAuth();

    const logoutUser = () => {
        logout();
        navigation.navigate('Login');
    };

    const settingsOptions = [
        { id: '1', title: 'Logout', action: logoutUser },
    ];

    const renderItem = ({ item }: { item: { id: string; title: string; action: () => void } }) => (
        <TouchableOpacity style={styles.optionButton} onPress={item.action}>
            <Text style={styles.optionText}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Settings</Text>

            <FlatList
                data={settingsOptions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

export default SettingsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    backButton: {
        marginBottom: 10,
    },
    backButtonText: {
        fontSize: 36,
        color: '#1B4965',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        fontWeight: 'bold',
    },
    list: {
        paddingBottom: 20,
    },
    optionButton: {
        backgroundColor: Colors.dark.primary,
        padding: 15,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    optionText: {
        color: '#fff',
        fontSize: 14,
    },
});