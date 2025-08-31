import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colors';
import IconAssets from '../../assets/icons/IconAssets';

const AuthenticatorScreen = () => {
    const navigation = useNavigation<any>();

    const challengeCode = '85';

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
                <View style={styles.content}>
                    <Text style={styles.title}>Approve sign in request</Text>
                    <Text style={styles.subtitle}>
                        Open your Authenticator app and enter the number shown to sign in.
                    </Text>

                    <View style={styles.codeBox}>
                        <Text style={styles.codeText}>{challengeCode}</Text>
                    </View>

                    <Text style={styles.hintText}>Didn’t receive a sign-in request?</Text>
                    <TouchableOpacity>
                        <Text style={styles.linkText}>Resend request.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('AlternativeMFAScreen')}>
                        <Text style={styles.linkTextAlt}>
                            I can’t use my Authenticator App right now.
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default AuthenticatorScreen;

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
    content: {
        marginTop: 60,
        alignItems: 'center',
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
        marginBottom: 40,
    },
    codeBox: {
        borderWidth: 2,
        borderColor: Colors.dark.primary,
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 30,
        marginBottom: 40,
    },
    codeText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: Colors.dark.text,
        textAlign: 'center',
    },
    hintText: {
        fontSize: 14,
        color: Colors.dark.subText,
        marginBottom: 10,
    },
    linkText: {
        fontSize: 14,
        color: Colors.dark.primary,
        marginBottom: 30,
    },
    linkTextAlt: {
        fontSize: 14,
        color: Colors.dark.primary,
        textAlign: 'center',
    },

});