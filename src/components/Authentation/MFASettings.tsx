import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colors';
import IconAssets from '../../assets/icons/IconAssets';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MFASettings = () => {
    const navigation = useNavigation<any>();
    const [selectedMethod, setSelectedMethod] = useState<'' | 'authenticator' | 'sms'>('');

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <IconAssets.ArrowLeftDark width={24} height={24} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <IconAssets.Logo style={styles.logo} />
                    </View>
                </View>

                <View style={{ paddingHorizontal: 40, alignItems: 'center', marginBottom: 24, marginTop: 70 }}>
                    <Text style={styles.title}>Choose your Multi-Factor Authentication Method</Text>
                    <Text style={styles.subtitle}>
                        Choose one of the following forms of multi-factor authentication.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.optionCard,
                        selectedMethod === 'authenticator' && styles.selectedCard,
                    ]}
                    onPress={() => {
                        setSelectedMethod('authenticator');
                        navigation.navigate('AuthenticatorScreen');
                    }}
                    activeOpacity={0.8}
                >
                    <View style={styles.optionContent}>
                        <Ionicons name="qr-code" size={36} color={Colors.dark.primary} />
                        <View style={styles.optionText}>
                            <Text style={styles.optionTitle}>Authenticator App</Text>
                            <Text style={styles.optionSubtitle}>
                                Get a code on any device from an app.
                            </Text>
                        </View>
                        {selectedMethod === 'authenticator' && (
                            <Ionicons name="checkmark" size={20} color={Colors.dark.primary} />
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.optionCard,
                        selectedMethod === 'sms' && styles.selectedCard,
                    ]}
                    onPress={() => {
                        setSelectedMethod('sms');
                        navigation.navigate('OTPScreen');
                    }}
                    activeOpacity={0.8}
                >
                    <View style={styles.optionContent}>
                        <Ionicons name="chatbox-ellipses" size={36} color={Colors.dark.primary} />
                        <View style={styles.optionText}>
                            <Text style={styles.optionTitle}>Text Message (SMS)</Text>
                            <Text style={styles.optionSubtitle}>
                                We’ll send a code to your phone{'\n'}***_***_5499
                            </Text>
                        </View>
                        {selectedMethod === 'sms' && (
                            <Ionicons name="checkmark" size={20} color={Colors.dark.primary} />
                        )}
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

export default MFASettings;

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
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: Colors.dark.subText,
        marginBottom: 24,
        textAlign: 'center',
    },
    optionCard: {
        borderWidth: 1,
        borderColor: Colors.dark.stroke,
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        backgroundColor: Colors.dark.background2,
    },
    selectedCard: {
        borderColor: Colors.dark.primary,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        flex: 1,
        marginLeft: 16,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    optionSubtitle: {
        fontSize: 13,
        color: Colors.dark.subText,
        marginTop: 4,
    },
});