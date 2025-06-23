import React, { useState, useEffect } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import styles from './LoginScreen.styles';
import Colors from '../../theme/colors';
import GoogleLogo from '../../assets/images/google.png';
import IconAssets from '../../assets/icons/IconAssets';
import { useAuth } from '../../context/AuthContext';
import { getDeviceInfo } from '../../utils/deviceDetection';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ NEW: Password visibility toggle
  const [deviceInfo, setDeviceInfo] = useState({
    isSamsung: false,
    isNothing: false,
    isStock: false
  });

  const navigation = useNavigation<NavigationProp>();
  const { login, state, clearError } = useAuth();

  // ✅ FIXED: Prevent back navigation to login when authenticated
  useFocusEffect(
    React.useCallback(() => {
      if (state.isAuthenticated) {
        console.log('✅ User is authenticated, redirecting to Home');
        navigation.replace('Home'); // Use replace instead of navigate to prevent back navigation
      }
    }, [state.isAuthenticated, navigation])
  );

  useEffect(() => {
    const detectDevice = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
      console.log('🔍 Device detected:', info);
    };
    detectDevice();
  }, []);

  const handleSignIn = async () => {
    clearError();

    let isValid = true;

    if (!email.trim()) {
      setEmailError(true);
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(true);
      isValid = false;
    } else {
      setEmailError(false);
    }

    if (!password.trim()) {
      setPasswordError(true);
      isValid = false;
    } else {
      setPasswordError(false);
    }

    if (!isValid) {
      return;
    }

    try {
      await login(email.trim(), password);
      // ✅ FIXED: Use replace instead of navigate to prevent back navigation
      navigation.replace('Home');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      let displayMessage = '';

      switch (errorMessage) {
        case 'email_not_verified':
          displayMessage = 'Please verify your email address before logging in.';
          break;
        case 'Invalid email or password':
          displayMessage = 'Invalid email or password. Please try again.';
          setEmailError(true);
          setPasswordError(true);
          break;
        default:
          if (errorMessage.includes('timed out') || errorMessage.includes('Could not connect')) {
            displayMessage = 'Cannot connect to server. Please check your internet connection and try again.';
          } else {
            displayMessage = errorMessage;
          }
      }

      Alert.alert('Login Failed', displayMessage);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Sign In',
      'Google authentication will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  };

  // Samsung devices need KeyboardAvoidingView, Nothing phones work better without
  if (deviceInfo.isSamsung) {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollViewContent} 
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={false}
          >
            <LoginContent 
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              emailError={emailError}
              setEmailError={setEmailError}
              passwordError={passwordError}
              setPasswordError={setPasswordError}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              handleSignIn={handleSignIn}
              handleGoogleSignIn={handleGoogleSignIn}
              state={state}
              clearError={clearError}
            />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  // Nothing Phone and other devices - original working approach
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent} 
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <LoginContent 
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            emailError={emailError}
            setEmailError={setEmailError}
            passwordError={passwordError}
            setPasswordError={setPasswordError}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            handleSignIn={handleSignIn}
            handleGoogleSignIn={handleGoogleSignIn}
            state={state}
            clearError={clearError}
          />
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

// Shared login content component
const LoginContent = ({ 
  email, setEmail, password, setPassword, emailError, setEmailError, 
  passwordError, setPasswordError, showPassword, setShowPassword, 
  handleSignIn, handleGoogleSignIn, state, clearError 
}: any) => (
  <>
    <View style={styles.wrapper}>
      <View style={styles.logoWrapper}>
        <IconAssets.Logo style={styles.logo} />
      </View>

      <View style={styles.mainWrapper}>
        <View style={styles.centreText}>
          <Text style={styles.title}>Sign in to ElevAlte</Text>
          <Text style={styles.subtitle}>Enter your login details below.</Text>
        </View>

        <View style={[styles.inputWrapper, emailError && { borderColor: 'red', borderWidth: 1 }]}>
          <IconAssets.Mail style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.dark.subText}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError(false);
              clearError();
            }}
          />
        </View>

        {/* ✅ FIXED: Password field with toggle visibility */}
        <View style={[styles.inputWrapper, passwordError && { borderColor: 'red', borderWidth: 1 }]}>
          <IconAssets.Lock style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]} // ✅ Make input flexible for eye icon
            placeholder="Password"
            placeholderTextColor={Colors.dark.subText}
            secureTextEntry={!showPassword} // ✅ Toggle based on showPassword state
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError(false);
              clearError();
            }}
            onSubmitEditing={handleSignIn}
          />
          {/* ✅ NEW: Eye icon to toggle password visibility */}
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={{ 
              padding: 8,
              marginLeft: 8,
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ 
              fontSize: 18, 
              color: Colors.dark.subText,
            }}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        </View>

        {state.error && (
          <View style={{ backgroundColor: '#ffebee', padding: 10, borderRadius: 5, marginBottom: 10 }}>
            <Text style={{ color: '#c62828', fontSize: 14 }}>
              {state.error}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.signInButton, state.isLoading && { opacity: 0.7 }]}
          onPress={handleSignIn}
          disabled={state.isLoading}
        >
          {state.isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.signInButtonText}>Sign in</Text>
          )}
        </TouchableOpacity>

        {/* <View style={styles.dividerWrapper}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View> */}

        {/* <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={state.isLoading}
        >
          <Image source={GoogleLogo} style={styles.googleIcon} />
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity> */}
      </View>
    </View>

    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Copyright 2023–2024  •{' '}
        <Text style={styles.footerLink}>iOPEX Technologies</Text>
      </Text>
    </View>
  </>
);

export default LoginScreen;