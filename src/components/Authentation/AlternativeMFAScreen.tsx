import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colors';
import IconAssets from '../../assets/icons/IconAssets';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AlternativeMFAScreen = () => {
    const navigation = useNavigation<any>();

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

                <View style={styles.textContainer}>
                    <Text style={styles.title}>Verify your identity</Text>
                    <Text style={styles.subtitle}>
                        Choose one of the following forms of multi-factor authentication.
                    </Text>
                </View>

                <TouchableOpacity style={styles.optionBox}>
                    <Ionicons name="chatbox-ellipses" size={28} color={Colors.dark.primary} />
                    <Text style={styles.optionText}>Use a verification code</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionBox}>
                    <Ionicons name="chatbubble" size={28} color={Colors.dark.primary} />
                    <Text style={styles.optionText}>Text ***-***-5499</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

export default AlternativeMFAScreen;

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
    textContainer: {
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 16,
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
        textAlign: 'center',
    },
    optionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.background2,
        borderColor: Colors.dark.stroke,
        borderWidth: 1,
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
    },
    optionText: {
        marginLeft: 16,
        fontSize: 15,
        color: Colors.dark.text,
        fontWeight: '500',
    },
});