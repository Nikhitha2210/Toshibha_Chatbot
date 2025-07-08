import { 
    Keyboard, 
    ScrollView, 
    StyleSheet, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    TouchableWithoutFeedback, 
    View, 
    Alert, 
    ActivityIndicator,
    Platform,
    SafeAreaView as RN_SafeAreaView
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconAssets from '../../assets/icons/IconAssets';
import Colors from '../../theme/colors';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [currentPasswordError, setCurrentPasswordError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [confirmPasswordError, setConfirmPasswordError] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [androidVersion, setAndroidVersion] = useState(0);
    const insets = useSafeAreaInsets();

    type ResetPasswordRouteParams = {
        params: {
            fromSettings?: boolean;
        };
    };

    const route = useRoute<RouteProp<ResetPasswordRouteParams, 'params'>>();
    const fromSettings = route.params?.fromSettings === true;

    const navigation = useNavigation<any>();
    const { clearError, resetPassword, changePasswordUser } = useAuth();

    useEffect(() => {
        if (Platform.OS === 'android') {
            setAndroidVersion(parseInt(Platform.Version.toString(), 10));
        }
        
        if (Platform.OS === 'android' && parseInt(Platform.Version.toString(), 10) >= 35) {
            const showListener = Keyboard.addListener('keyboardDidShow', (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            });
            const hideListener = Keyboard.addListener('keyboardDidHide', () => {
                setKeyboardHeight(0);
            });
            return () => {
                showListener.remove();
                hideListener.remove();
            };
        }
    }, []);

    const handleConfirm = async () => {
        clearError();

        let isValid = true;

        if (fromSettings) {
            if (!currentPassword.trim()) {
                setCurrentPasswordError(true);
                isValid = false;
            } else {
                setCurrentPasswordError(false);
            }
        }

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

            let result;
            
            if (fromSettings) {
                result = await changePasswordUser(currentPassword, password);
            } else {
                result = await resetPassword(password);
            }

            if (result.success) {
                setShowSuccessDialog(true);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
            
            if (errorMessage.includes('Current password is incorrect')) {
                setCurrentPasswordError(true);
                Alert.alert('Incorrect Password', 'Your current password is incorrect.');
            } else {
                Alert.alert('Reset Failed', errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <RN_SafeAreaView style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container}>
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={[
                                styles.scrollViewContent,
                                Platform.OS === 'android' && androidVersion >= 35
                                    ? { paddingBottom: keyboardHeight + insets.bottom + 50 }
                                    : { paddingBottom: insets.bottom + 50 }
                            ]}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            bounces={true}
                            showsVerticalScrollIndicator={true}
                            scrollEnabled={true}
                        >
                            <View style={styles.wrapper}>
                                <View style={styles.headerContainer}>
                                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                                        <IconAssets.ArrowLeftDark width={24} height={24} />
                                    </TouchableOpacity>

                                    <View style={styles.logoContainer}>
                                        <IconAssets.Logo style={styles.logo} />
                                    </View>
                                </View>

                                <View style={styles.textBlock}>
                                    <Text style={styles.title}>Reset password</Text>
                                    <Text style={styles.description}>
                                        Your new password must be different from previously used passwords.
                                    </Text>
                                </View>

                                {fromSettings && (
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Current Password</Text>
                                        <View style={[styles.inputWrapper, currentPasswordError && { borderColor: 'red', borderWidth: 1 }]}>
                                            <IconAssets.Lock style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Current Password"
                                                placeholderTextColor={Colors.dark.subText}
                                                secureTextEntry={!showCurrentPassword}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                value={currentPassword}
                                                onChangeText={(text) => {
                                                    setCurrentPassword(text);
                                                    setCurrentPasswordError(false);
                                                }}
                                                editable={!isSubmitting}
                                            />
                                            <TouchableOpacity
                                                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                                style={styles.eyeButton}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                disabled={isSubmitting}
                                            >
                                                <IconAssets.EyeOff width={20} height={20} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Password</Text>
                                    <View style={[styles.inputWrapper, passwordError && { borderColor: 'red', borderWidth: 1 }]}>
                                        <IconAssets.Lock style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
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
                                            style={styles.eyeButton}
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
                                            style={styles.input}
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
                                            style={styles.eyeButton}
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
            </RN_SafeAreaView>

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
    scrollView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        minHeight: '100%',
    },
    wrapper: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingTop: 25,
        marginBottom: 40,
    },
    logoContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    logo: {
        height: 40,
        width: 96,
    },
    backButton: {
        marginLeft: -8,
        padding: 8,
    },
    textBlock: {
        marginTop: 80,
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
        paddingVertical: 12,
        minHeight: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingVertical: 0,
    },
    eyeButton: {
        padding: 8,
        marginLeft: 8,
        minWidth: 40,
        minHeight: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        minHeight: 50,
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
        paddingVertical: 12,
        paddingHorizontal: 40,
        minHeight: 44,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});