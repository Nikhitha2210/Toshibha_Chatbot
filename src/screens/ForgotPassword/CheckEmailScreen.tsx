import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import IconAssets from '../../assets/icons/IconAssets';
import Colors from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { ROUTE_NAMES } from '../../navigation/constants';

const CheckEmailScreen = () => {
    const [isResending, setIsResending] = useState(false);
    
    const navigation = useNavigation<any>();
    const { forgotPassword } = useAuth();

    const handleResendLink = async () => {
        try {
            setIsResending(true);
            
            Alert.alert(
                'Resend Email',
                'Please enter your email address to resend the reset link.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Go Back',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to resend email. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const handleBackToLogin = () => {
        navigation.navigate(ROUTE_NAMES.Login);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.wrapper}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingTop: 25 }}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <IconAssets.ArrowLeftDark width={24} height={24} />
                        </TouchableOpacity>

                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <IconAssets.Logo style={styles.logo} />
                        </View>
                    </View>

                    <View style={styles.content}>
                        <IconAssets.Mail width={48} height={48} style={styles.mailIcon} />
                        <Text style={styles.title}>Check your mail</Text>
                        <Text style={styles.description}>
                            We have sent a password recovery instructions to your email.
                        </Text>

                        <TouchableOpacity 
                            style={[styles.button, isResending && { opacity: 0.5 }]} 
                            onPress={handleResendLink}
                            disabled={isResending}
                        >
                            {isResending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Resend Link</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.loginButton} 
                            onPress={handleBackToLogin}
                        >
                            <Text style={styles.loginButtonText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default CheckEmailScreen;

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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    mailIcon: {
        marginBottom: 24,
        tintColor: Colors.dark.primary,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 12,
    },
    description: {
        color: Colors.dark.subText,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
    loginButton: {
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.subText,
    },
    loginButtonText: {
        color: Colors.dark.subText,
        fontWeight: '600',
    },
});