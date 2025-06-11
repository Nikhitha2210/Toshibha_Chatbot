import React, { useState } from 'react';
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
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import styles from './LoginScreen.styles';
import Colors from '../../theme/colors';
import GoogleLogo from '../../assets/images/google.png';
import IconAssets from '../../assets/icons/IconAssets';
import { useAuth } from '../../context/AuthContext';


type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen = () => {
  const [email, setEmail] = useState('nikhitha.kandula@iopex.com'); // Pre-filled for testing
  const [password, setPassword] = useState('hIPOwy4B>>%MoV#D'); // Pre-filled for testing
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const { login, state, clearError } = useAuth();

  const handleSignIn = async () => {
    console.log('=== LoginScreen handleSignIn Start ===');
    
    // Clear any previous errors
    clearError();
    
    // Validation
    let isValid = true;

    if (!email.trim()) {
      console.log('Email validation failed: empty');
      setEmailError(true);
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('Email validation failed: invalid format');
      setEmailError(true);
      isValid = false;
    } else {
      setEmailError(false);
    }

    if (!password.trim()) {
      console.log('Password validation failed: empty');
      setPasswordError(true);
      isValid = false;
    } else {
      setPasswordError(false);
    }

    if (!isValid) {
      console.log('Validation failed, stopping login');
      return;
    }

    console.log('Validation passed, attempting login');
    console.log('Email:', email.trim());
    console.log('Password length:', password.length);

    try {
      console.log('=== Calling login function ===');
      
      // Attempt login with REAL authentication
      await login(email.trim(), password);
      
      console.log('=== Login function completed successfully ===');
      console.log('Navigating to Home screen');
      
      // If we get here, login was successful - navigate to Home
      navigation.navigate('Home');
      
    } catch (error) {
      console.log('=== Login function threw error ===');
      console.log('Error object:', error);
      console.log('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.log('Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      // Handle specific authentication errors
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      console.log('Processing error message:', errorMessage);
      
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

      console.log('Final display message:', displayMessage);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.wrapper}>
            <View style={styles.logoWrapper}>
              <IconAssets.Logo style={styles.logo} />
            </View>

            <View style={styles.mainWrapper}>
              <View style={styles.centreText}>
                <Text style={styles.title}>Sign in to ElevAlte</Text>
                <Text style={styles.subtitle}>Enter your login details below.</Text>
              </View>

              <View style={[
                styles.inputWrapper, 
                emailError && { borderColor: 'red', borderWidth: 1 }
              ]}>
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

              <View style={[
                styles.inputWrapper, 
                passwordError && { borderColor: 'red', borderWidth: 1 }
              ]}>
                <IconAssets.Lock style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.dark.subText}
                  secureTextEntry
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
              </View>

              {/* Show authentication error if any */}
              {state.error && (
                <View style={{ 
                  backgroundColor: '#ffebee', 
                  padding: 10, 
                  borderRadius: 5, 
                  marginBottom: 10 
                }}>
                  <Text style={{ color: '#c62828', fontSize: 14 }}>
                    {state.error}
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={[
                  styles.signInButton, 
                  state.isLoading && { opacity: 0.7 }
                ]} 
                onPress={handleSignIn}
                disabled={state.isLoading}
              >
                <Text style={styles.signInButtonText}>
                  {state.isLoading ? 'Signing In...' : 'Sign in'}
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerWrapper}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={state.isLoading}
              >
                <Image source={GoogleLogo} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Copyright 2023–2024  •{' '}
              <Text style={styles.footerLink}>iOPEX Technologies</Text>
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;