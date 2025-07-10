import React, { useState, useEffect } from 'react';
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
  SafeAreaView
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const APP_VERSION = "1.0.2";

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const { login, state, clearError } = useAuth();

  useFocusEffect(
    React.useCallback(() => {
      if (state.isAuthenticated) {
        console.log('User is authenticated, redirecting to Home');
        navigation.replace('Home');
      }
    }, [state.isAuthenticated, navigation])
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={true}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            nestedScrollEnabled={false}
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
            />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const LoginContent = ({
  email, setEmail, password, setPassword, emailError, setEmailError,
  passwordError, setPasswordError, showPassword, setShowPassword,
  handleSignIn, handleGoogleSignIn, state, clearError, version
}: any) => {
  const navigation = useNavigation<any>();
  
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
            />
          </View>

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
                clearError();
              }}
              onSubmitEditing={handleSignIn}
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
          Copyright 2025–2026  •{' '}
          <Text style={styles.footerLink}>iOPEX Technologies</Text>
        </Text>
      </View>
    </>
  );
};

export default LoginScreen;