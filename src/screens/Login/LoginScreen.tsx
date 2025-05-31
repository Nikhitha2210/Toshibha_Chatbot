import React, { useState } from 'react';

import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import styles from './LoginScreen.styles';

import Colors from '../../theme/colors';
import GoogleLogo from '../../assets/images/google.png'

import IconAssets from '../../assets/icons/IconAssets';

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

  const navigation = useNavigation<NavigationProp>();

  const handleSignIn = () => {

    let isValid = true;

    if (!email) {
      setEmailError(true);
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(true);
      isValid = false
    } else {
      setEmailError(false);
    }

    if (!password) {
      setPasswordError(true);
      isValid = false;
    } else {
      setPasswordError(false);
    }

    if (!isValid) return;

    navigation.navigate("Home");
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

              <View style={[styles.inputWrapper, emailError && { borderColor: 'red', borderWidth: 1 }]}>
                <IconAssets.Mail style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={Colors.dark.subText}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError(false);
                  }}
                />
              </View>

              <View style={[styles.inputWrapper, passwordError && { borderColor: 'red', borderWidth: 1 }]}>
                <IconAssets.Lock style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.dark.subText}
                  secureTextEntry
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError(false);
                  }}
                />
              </View>

              <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                <Text style={styles.signInButtonText}>Sign in</Text>
              </TouchableOpacity>

              <View style={styles.dividerWrapper}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleButton}>
                <Image
                  source={GoogleLogo}
                  style={styles.googleIcon}
                />
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