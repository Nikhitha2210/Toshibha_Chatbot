import React, { useState, useEffect, useRef } from 'react';
import { 
  Image, 
  Keyboard, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  View, 
  Alert, 
  ActivityIndicator, 
  Pressable,
  SafeAreaView as RN_SafeAreaView,
  Dimensions,
  BackHandler
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import styles from './LoginScreen.styles';
import Colors from '../../theme/colors';
import GoogleLogo from '../../assets/images/google.png';
import IconAssets from '../../assets/icons/IconAssets';
import { useAuth } from '../../context/AuthContext';
import { getDeviceInfo } from '../../utils/deviceDetection';
import { ROUTE_NAMES } from '../../navigation/constants';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  ForgotPassword: undefined;
  OTPScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const APP_VERSION = "1.10";

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [androidVersion, setAndroidVersion] = useState(0);

  const navigation = useNavigation<NavigationProp>();
  const { login, state, clearError } = useAuth(); 
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === 'android') {
      setAndroidVersion(parseInt(Platform.Version.toString(), 10));
    }
    
    if (Platform.OS === 'android' && parseInt(Platform.Version.toString(), 10) >= 33) {
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

  useFocusEffect(
    React.useCallback(() => {
      if (state.isAuthenticated) {
        console.log('User is authenticated, redirecting to Home');
        navigation.replace('Home');
      }
    }, [state.isAuthenticated, navigation])
  );

  const handleSignIn = async () => {
    Keyboard.dismiss();
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
        case 'MFA_REQUIRED_EMAIL':
        case 'MFA_REQUIRED_TOTP':
          // Don't show alert - user is being navigated to OTP screen
          return;
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

  return (
    <RN_SafeAreaView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollViewContent,
              Platform.OS === 'android' && androidVersion >= 33
                ? { paddingBottom: keyboardHeight + insets.bottom + 50 }
                : { paddingBottom: insets.bottom + 50 }
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            bounces={true}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
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
              version={APP_VERSION}
              passwordInputRef={passwordInputRef}
              scrollViewRef={scrollViewRef}
            />
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </RN_SafeAreaView>
  );
};

const LoginContent = ({
  email, setEmail, password, setPassword, emailError, setEmailError,
  passwordError, setPasswordError, showPassword, setShowPassword,
  handleSignIn, handleGoogleSignIn, state, clearError, version,
  passwordInputRef, scrollViewRef
}: any) => {
  const navigation = useNavigation<any>();

  const handleEmailSubmit = () => {
    passwordInputRef.current?.focus();
  };

  const handlePasswordSubmit = () => {
    handleSignIn();
  };
  
  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.logoWrapper}>
          <IconAssets.Logo style={styles.logo} />
          <Text style={styles.versionText}>v{version}</Text>
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
              onSubmitEditing={handleEmailSubmit}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={[styles.inputWrapper, passwordError && { borderColor: 'red', borderWidth: 1 }]}>
            <IconAssets.Lock style={styles.inputIcon} />
            <TextInput
              ref={passwordInputRef}
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
                clearError();
              }}
              onSubmitEditing={handlePasswordSubmit}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{
                padding: 8,
                marginLeft: 8,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconAssets.EyeOff width={20} height={20} />
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
          
          <Pressable style={styles.link} onPress={() => navigation.navigate(ROUTE_NAMES.ForgotPassword)}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Toshiba Global Commerce Solutions Field Service Assistant  •{' '}
          <Text style={styles.footerLink}> Powered by iOPEX ©2025 </Text>
        </Text>
      </View>
    </>
  );
};

export default LoginScreen;