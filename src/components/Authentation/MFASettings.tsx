import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Text, 
  Switch, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colors';
import IconAssets from '../../assets/icons/IconAssets';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { biometricService } from '../../services/biometric/BiometricService';
import { API_CONFIG } from '../../config/environment';
import EmailVerificationModal from '../../components/Authentation/EmailVerificationModal';

const MFASettings = () => {
  const navigation = useNavigation<any>();
  const { state, refreshUserData } = useAuth();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // MFA states
  const [emailMfaEnabled, setEmailMfaEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Modal state
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);

  useEffect(() => {
    loadMfaStatus();
  }, []);

  const loadMfaStatus = async () => {
    try {
      setLoading(true);

      // Load Email MFA status from user data
      if (state.user) {
        setEmailMfaEnabled(state.user.email_mfa_enabled || false);
      }

      // Check biometric availability
      const { available } = await biometricService.isBiometricAvailable();
      setBiometricAvailable(available);

      if (available) {
        const enabled = await biometricService.isBiometricEnabled();
        setBiometricEnabled(enabled);
      }

    } catch (error) {
      console.error('Error loading MFA status:', error);
      Alert.alert('Error', 'Failed to load MFA settings');
    } finally {
      setLoading(false);
    }
  };

 // ===== EMAIL MFA =====
const handleEmailMfaToggle = async (value: boolean) => {
  if (!state.tokens?.access_token) {
    Alert.alert('Error', 'No active session');
    return;
  }

  const accessToken = state.tokens.access_token; // Capture token in local variable

  try {
    setUpdating('email');

    if (value) {
      const response = await fetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/email-mfa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-ID': API_CONFIG.TENANT_ID,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setShowEmailVerificationModal(true);
        setUpdating(null);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send verification code');
      }
    } else {
      Alert.alert(
        'Disable Email Authentication?',
        'You will need to set up email authentication again if you want to re-enable it.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setUpdating(null) },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await fetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/email-mfa/disable`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`, // ✅ Using local variable
                    'X-Tenant-ID': API_CONFIG.TENANT_ID,
                    'Content-Type': 'application/json',
                  },
                });

                if (response.ok) {
                  setEmailMfaEnabled(false);
                  await refreshUserData();
                  Alert.alert('Disabled', 'Email authentication has been disabled');
                } else {
                  const error = await response.json();
                  throw new Error(error.detail || 'Failed to disable Email MFA');
                }
              } catch (error) {
                console.error('Email MFA disable error:', error);
                const message = error instanceof Error ? error.message : 'Failed to disable Email authentication';
                Alert.alert('Error', message);
                setEmailMfaEnabled(true);
              } finally {
                setUpdating(null);
              }
            }
          }
        ],
        { onDismiss: () => setUpdating(null) }
      );
    }
  } catch (error) {
    console.error('Email MFA toggle error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update Email authentication';
    Alert.alert('Error', message);
    setEmailMfaEnabled(false);
    setUpdating(null);
  }
};

  // Handler for successful email verification
  const handleEmailVerificationSuccess = async () => {
    setEmailMfaEnabled(true);
    await refreshUserData();
  };

  // Handler for email verification modal close
  const handleEmailVerificationClose = () => {
    setShowEmailVerificationModal(false);
    setEmailMfaEnabled(false); // Reset toggle if cancelled
  };

// ===== BIOMETRIC =====
const handleBiometricToggle = async (value: boolean) => {
  if (value) {
    // Enable biometric
    try {
      if (!state.tokens?.refresh_token || !state.tokens?.access_token) {
        Alert.alert('Error', 'No active session. Please login first.');
        return;
      }

      setUpdating('biometric');

      // ✅ STEP 1: Enable flag on backend FIRST
      const backendResponse = await fetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/biometric/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.tokens.access_token}`,
          'X-Tenant-ID': API_CONFIG.TENANT_ID,
          'Content-Type': 'application/json',
        },
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.detail || 'Failed to enable biometric on backend');
      }

      console.log('✅ Backend biometric flag enabled');

      // ✅ STEP 2: Register device locally
      const deviceFingerprint = await biometricService.getDeviceFingerprint();

      const success = await biometricService.enableBiometric(
        state.tokens.refresh_token,
        state.tokens.access_token,
        deviceFingerprint
      );
      
      if (success) {
        // ✅ STEP 3: Refresh user data to sync state
        await refreshUserData();
        
        setBiometricEnabled(true);
        Alert.alert(
          'Success!', 
          'Fingerprint login is now enabled. You can use your fingerprint to login quickly.'
        );
      } else {
        Alert.alert('Failed', 'Could not enable fingerprint. Please try again.');
      }
    } catch (error) {
      console.error('Biometric enable error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // User cancelled fingerprint scan
      if (errorMessage.toLowerCase().includes('cancel')) {
        console.log('User cancelled fingerprint setup');
        return;
      }
      
      Alert.alert('Error', 'Failed to enable fingerprint. Please try again.');
    } finally {
      setUpdating(null);
    }
  } else {
    // Disable biometric
    Alert.alert(
      'Disable Fingerprint?',
      'You will need to enter your password and verification code on next login.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating('biometric');
              
              // ✅ STEP 1: Disable on backend (also deletes devices)
              const backendResponse = await fetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/biometric/disable`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${state.tokens?.access_token}`,
                  'X-Tenant-ID': API_CONFIG.TENANT_ID,
                  'Content-Type': 'application/json',
                },
              });

              if (!backendResponse.ok) {
                const errorData = await backendResponse.json();
                throw new Error(errorData.detail || 'Failed to disable biometric on backend');
              }

              console.log('✅ Backend biometric flag disabled');

              // ✅ STEP 2: Clear local data
              await biometricService.disableBiometric(state.tokens?.access_token);
              
              // ✅ STEP 3: Refresh user data to sync state
              await refreshUserData();
              
              setBiometricEnabled(false);
              Alert.alert('Disabled', 'Fingerprint login has been disabled');
            } catch (error) {
              console.error('Biometric disable error:', error);
              Alert.alert('Error', 'Failed to disable fingerprint');
            } finally {
              setUpdating(null);
            }
          }
        }
      ]
    );
  }
};

  // Loading spinner
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <IconAssets.ArrowLeftDark width={24} height={24} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <IconAssets.Logo style={styles.logo} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Multi-Factor Authentication</Text>
          <Text style={styles.subtitle}>
            Secure your account with an additional layer of protection.
          </Text>

          {/* ===== EMAIL AUTHENTICATION =====
          <View style={styles.mfaOption}>
            <View style={styles.mfaOptionContent}>
              <Ionicons name="mail" size={24} color={Colors.dark.primary} style={styles.icon} />
              <View style={styles.mfaTextContainer}>
                <Text style={styles.mfaTitle}>Email Authentication</Text>
                <Text style={styles.mfaDescription}>
                  {state.user?.email 
                    ? `Send a code to ${state.user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`
                    : 'Send verification codes to your email'}
                </Text>
              </View>
            </View>
            <Switch
              value={emailMfaEnabled}
              onValueChange={handleEmailMfaToggle}
              disabled={updating === 'email'}
              trackColor={{ false: '#767577', true: Colors.dark.primary }}
              thumbColor={emailMfaEnabled ? '#fff' : '#f4f3f4'}
            />
          </View> */}

          {/* ===== BIOMETRIC (only show if available) ===== */}
          {biometricAvailable && (
            <View style={styles.mfaOption}>
              <View style={styles.mfaOptionContent}>
                <Ionicons name="finger-print" size={24} color={Colors.dark.primary} style={styles.icon} />
                <View style={styles.mfaTextContainer}>
                  <Text style={styles.mfaTitle}>Biometric Authentication</Text>
                  <Text style={styles.mfaDescription}>
                    {biometricEnabled 
                      ? 'Use your fingerprint for quick login'
                      : 'Enable fingerprint login on this device'}
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={updating === 'biometric'}
                trackColor={{ false: '#767577', true: Colors.dark.primary }}
                thumbColor={biometricEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          )}

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.dark.subText} />
            <Text style={styles.infoText}>
              Your MFA settings sync across all devices. Changes made here will apply everywhere you use this account.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        visible={showEmailVerificationModal}
        onClose={handleEmailVerificationClose}
        onSuccess={handleEmailVerificationSuccess}
        accessToken={state.tokens?.access_token || ''}
        userEmail={state.user?.email || ''}
      />
    </View>
  );
};

export default MFASettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background2,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 25,
  },
  backButton: {
    marginTop: 10,
    marginLeft: -8,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logo: {
    height: 40,
    width: 96,
  },
  content: {
    paddingHorizontal: 24,
    marginTop: 40,
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.dark.subText,
    fontSize: 14,
    marginBottom: 32,
    lineHeight: 20,
  },
  mfaOption: {
    backgroundColor: Colors.dark.background3,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mfaOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  mfaTextContainer: {
    flex: 1,
  },
  mfaTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mfaDescription: {
    color: Colors.dark.subText,
    fontSize: 13,
    lineHeight: 18,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.dark.background3,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    color: Colors.dark.subText,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
});