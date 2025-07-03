import { Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import IconAssets from '../../assets/icons/IconAssets';
import Colors from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [confirmPasswordError, setConfirmPasswordError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigation = useNavigation<any>();
    const { clearError, resetPassword } = useAuth();

    const handleConfirm = async () => {
        clearError();

        let isValid = true;

        if (!password.trim()) {
            setPasswordError(true);
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError(true);
            isValid = false;
            Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
            return;
        } else {
            setPasswordError(false);
        }

        if (!confirmPassword.trim()) {
            setConfirmPasswordError(true);
            isValid = false;
        } else if (password !== confirmPassword) {
            setConfirmPasswordError(true);
            isValid = false;
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        } else {
            setConfirmPasswordError(false);
        }

        if (!isValid) {
            return;
        }

        try {
            setIsSubmitting(true);
            
            const result = await resetPassword(password);
            
            if (result.success) {
                setShowSuccessDialog(true);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
            Alert.alert('Reset Failed', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <ScrollView
                        contentContainerStyle={styles.scrollViewContent}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.wrapper}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, paddingTop: 25 }}>
                                <IconAssets.Logo style={styles.logo} />
                            </View>

                            <View style={styles.textBlock}>
                                <Text style={styles.title}>Reset password</Text>
                                <Text style={styles.description}>
                                    Your new password must be different from previously used passwords.
                                </Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <View style={[styles.inputWrapper, passwordError && { borderColor: 'red', borderWidth: 1 }]}>
                                    <IconAssets.Lock style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Password"
                                        placeholderTextColor={Colors.dark.subText}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            setPasswordError(false);
                                        }}
                                        editable={!isSubmitting}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={{
                                            padding: 8,
                                            marginLeft: 8,
                                        }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        disabled={isSubmitting}
                                    >
                                        <IconAssets.EyeOff width={20} height={20} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={[styles.inputWrapper, confirmPasswordError && { borderColor: 'red', borderWidth: 1 }]}>
                                    <IconAssets.Lock style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Confirm Password"
                                        placeholderTextColor={Colors.dark.subText}
                                        secureTextEntry={!showConfirmPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
                                            setConfirmPasswordError(false);
                                            clearError();
                                        }}
                                        editable={!isSubmitting}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={{
                                            padding: 8,
                                            marginLeft: 8,
                                        }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        disabled={isSubmitting}
                                    >
                                        <IconAssets.EyeOff width={20} height={20} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, isSubmitting && { opacity: 0.5 }]}
                                onPress={handleConfirm}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Confirm</Text>
                                )}
                            </TouchableOpacity>

                        </View>
                    </ScrollView>
                </View>
            </TouchableWithoutFeedback>
            {showSuccessDialog && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <IconAssets.Mail width={48} height={48} />
                        </View>
                        <Text style={styles.modalTitle}>Password Reset</Text>
                        <Text style={styles.modalDescription}>
                            Log into your account with your new password.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setShowSuccessDialog(false);
                                navigation.navigate('Login');
                            }}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </>
    );
};

export default ResetPassword;

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
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    modalContent: {
        backgroundColor: Colors.dark.background3,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: '80%',
    },
    modalIcon: {
        marginBottom: 16,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    modalDescription: {
        color: Colors.dark.subText,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButton: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 40,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});