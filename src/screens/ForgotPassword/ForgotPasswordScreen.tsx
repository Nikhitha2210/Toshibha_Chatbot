import { Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import IconAssets from '../../assets/icons/IconAssets';
import Colors from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { ROUTE_NAMES } from '../../navigation/constants';

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const navigation = useNavigation<any>();
    const { forgotPassword } = useAuth();

    const handleSendLink = async () => {
        let isValid = true;

        if (!email.trim()) {
            setEmailError(true);
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError(true);
            isValid = false;
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        } else {
            setEmailError(false);
        }

        if (!isValid) {
            return;
        }

        try {
            setIsSubmitting(true);
            
            const result = await forgotPassword(email.trim());
            
            if (result.success) {
                navigation.navigate(ROUTE_NAMES.CheckEmail);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
            Alert.alert('Request Failed', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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

                        <View style={styles.textBlock}>
                            <Text style={styles.title}>Forgot your password?</Text>
                            <Text style={styles.description}>
                                Enter the email associated with your account and we will send an email with instructions to reset your password.
                            </Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <View style={[styles.inputWrapper, emailError && { borderColor: 'red', borderWidth: 1 }]}>
                                <IconAssets.Mail style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    placeholderTextColor={Colors.dark.subText}
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        setEmailError(false);
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!isSubmitting}
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.button, isSubmitting && { opacity: 0.5 }]} 
                            onPress={handleSendLink}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Send Link</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default ForgotPasswordScreen;

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
    logoWrapper: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
    },
    logo: {
        height: 40,
        width: 96,
    },
    backButton: {
        marginTop: 10,
        marginLeft: -8,
    },
    textBlock: {
        marginTop: 160,
        marginBottom: 32,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        color: Colors.dark.subText,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.background3,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
    },
    button: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});