import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Text, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colors';
import IconAssets from '../../assets/icons/IconAssets';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OTPScreen = () => {
    const navigation = useNavigation<any>();
    const { completeLogin, resendOtp, state, clearError } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const inputs = useRef<TextInput[]>([]);

    const handleChange = (text: string, index: number) => {
        if (/^\d$/.test(text) || text === '') {
            const newOtp = [...otp];
            newOtp[index] = text;
            setOtp(newOtp);

            if (text && index < 5) {
                inputs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async () => {
        const otpCode = otp.join('');
        
        if (otpCode.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the complete 6-digit verification code.');
            return;
        }

        if (!otpCode.match(/^\d{6}$/)) {
            Alert.alert('Invalid OTP', 'Verification code must contain only numbers.');
            return;
        }

        try {
            setIsVerifying(true);
            clearError();
            await completeLogin(otpCode);
            // Navigation to Home happens automatically in AuthContext
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Verification failed';
            
            // Clear the OTP inputs on error
            setOtp(['', '', '', '', '', '']);
            if (inputs.current[0]) {
                inputs.current[0].focus();
            }

            Alert.alert('Verification Failed', errorMessage);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            await resendOtp();
            Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to resend code';
            Alert.alert('Resend Failed', errorMessage);
        }
    };

    const handleGoBack = () => {
        clearError();
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <IconAssets.ArrowLeftDark width={24} height={24} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <IconAssets.Logo style={styles.logo} />
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>Enter verification code</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to your email address.
                    </Text>
                </View>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            style={[
                                styles.otpInput,
                                state.error && { borderColor: 'red' }
                            ]}
                            value={digit}
                            onChangeText={(text) => handleChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            maxLength={1}
                            keyboardType="numeric"
                            ref={(ref) => {
                                if (ref) inputs.current[index] = ref;
                            }}
                            selectTextOnFocus={true}
                            editable={!isVerifying && !state.isLoading}
                        />
                    ))}
                </View>

                {state.error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{state.error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.verifyButton,
                        (isVerifying || state.isLoading || otp.join('').length !== 6) && { opacity: 0.5 }
                    ]}
                    onPress={handleVerifyOTP}
                    disabled={isVerifying || state.isLoading || otp.join('').length !== 6}
                >
                    {isVerifying || state.isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.verifyButtonText}>Verify Code</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.actions}>
                    <Text style={styles.hintText}>Didn't receive a code?</Text>
                    <TouchableOpacity 
                        onPress={handleResendOTP}
                        disabled={state.isLoading}
                    >
                        <Text style={[
                            styles.linkText,
                            state.isLoading && { opacity: 0.5 }
                        ]}>
                            Resend code
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleGoBack}>
                        <Text style={styles.linkText}>Use different credentials</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default OTPScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background2,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingTop: 25,
    },
    backButton: {
        marginTop: 10,
        marginLeft: -8,
    },
    logo: {
        height: 40,
        width: 96,
    },
    textContainer: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.dark.subText,
        textAlign: 'center',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: SCREEN_WIDTH < 350 ? 6 : SCREEN_WIDTH < 400 ? 8 : 10, // Responsive gap
    },
    otpInput: {
        borderWidth: 2,
        borderColor: Colors.dark.primary,
        width: SCREEN_WIDTH < 350 ? 38 : SCREEN_WIDTH < 400 ? 42 : 45, // Responsive width
        height: 58,
        borderRadius: 8,
        fontSize: 22,
        color: Colors.dark.text,
        textAlign: 'center',
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
        marginHorizontal: 10,
    },
    errorText: {
        color: '#c62828',
        fontSize: 14,
        textAlign: 'center',
    },
    verifyButton: {
        backgroundColor: Colors.dark.primary,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 10,
        marginBottom: 30,
    },
    verifyButtonText: {
        color: Colors.dark.text,
        fontWeight: '600',
        fontSize: 16,
    },
    actions: {
        marginTop: 20,
        alignItems: 'center',
    },
    hintText: {
        fontSize: 14,
        color: Colors.dark.subText,
        marginBottom: 10,
    },
    linkText: {
        fontSize: 14,
        color: Colors.dark.primary,
        marginBottom: 12,
    },
});