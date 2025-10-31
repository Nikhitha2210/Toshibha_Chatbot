import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Colors from '../../theme/colors';
import { API_CONFIG } from '../../config/environment';

interface EmailVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string;
  userEmail: string;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  visible,
  onClose,
  onSuccess,
  accessToken,
  userEmail,
}) => {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit code');
      return;
    }

    try {
      setVerifying(true);

      const response = await fetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/email-mfa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-ID': API_CONFIG.TENANT_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mfa_code: code }),
      });

      if (response.ok) {
        Alert.alert('Success!', 'Email authentication has been enabled');
        setCode('');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        Alert.alert('Verification Failed', error.detail || 'Invalid code. Please try again.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      
      const response = await fetch(`${API_CONFIG.AUTH_API_BASE_URL}/api/email-mfa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-ID': API_CONFIG.TENANT_ID,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Code Sent', 'A new verification code has been sent to your email');
      } else {
        throw new Error('Failed to resend code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleCancel = () => {
    setCode('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            {userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
          </Text>

          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="000000"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            editable={!verifying}
          />

          <TouchableOpacity
            style={[
              styles.verifyButton,
              (verifying || code.length !== 6) && styles.verifyButtonDisabled
            ]}
            onPress={handleVerify}
            disabled={verifying || code.length !== 6}
          >
            {verifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleResend} 
            style={styles.resendButton}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color={Colors.dark.primary} />
            ) : (
              <Text style={styles.resendText}>Didn't receive a code? Resend</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: Colors.dark.background3,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.subText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    backgroundColor: Colors.dark.background2,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.stroke,
  },
  verifyButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  resendText: {
    color: Colors.dark.primary,
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.dark.subText,
    fontSize: 14,
  },
});

export default EmailVerificationModal;