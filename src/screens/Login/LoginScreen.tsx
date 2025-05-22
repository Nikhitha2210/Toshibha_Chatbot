import React from 'react';

import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FAIcon, MIIcon } from '../../assets/icons/Icons';
import Colors from '../../theme/colors';

import styles from './LoginScreen.styles';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleSignIn = () => {
    navigation.navigate('Home');
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
              <Image
                source={require('../../assets/images/elevaite.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.mainWrapper}>
              <View style={styles.centreText}>
                <Text style={styles.title}>Sign in to ElevAlte</Text>
                <Text style={styles.subtitle}>Enter your login details below.</Text>
              </View>

              <View style={styles.inputWrapper}>
                <FAIcon name="envelope" size={20} color={Colors.dark.subText} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={Colors.dark.subText}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputWrapper}>
                <MIIcon name="lock" size={20} color={Colors.dark.subText} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.dark.subText}
                  secureTextEntry
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
                  source={require('../../assets/images/google.png')}
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