import React from 'react'

import { Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getStyles } from './styles'

import { usePrompt } from '../../context/PromptContext'
import { useThemeContext } from '../../context/ThemeContext'
import { useChat } from '../../context/ChatContext'

import IconAssets from '../../assets/icons/IconAssets'

type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    AiAssist: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PromptCards = () => {
    const { setInputText } = usePrompt();
    const { sendMessage, clearMessages } = useChat();
    const navigation = useNavigation<NavigationProp>();

    const { theme, toggleTheme, colors } = useThemeContext();

    const styles = getStyles(theme);

    const handleCardPress = async (cardText: string) => {
        try {
            // Set the input text
            setInputText(cardText);

            // Clear previous messages
            clearMessages();

            // Small delay to ensure navigation completes
            setTimeout(async () => {
                try {
                    // Send the message (this will show question immediately and then AI response)
                    await sendMessage(cardText);
                } catch (error) {
                    console.error('Error sending preset message:', error);
                }
            }, 100);

        } catch (error) {
            console.error('Error handling card press:', error);
        }
    };

    return (
        <View style={styles.promptCardsContainer}>

            <TouchableOpacity
                style={styles.card}
                onPress={() => handleCardPress('Part Number LookUp')}
                activeOpacity={0.7}
            >
                <View>
                    <IconAssets.Solid style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Part Number LookUp</Text>
                </View>
                <IconAssets.Arrow style={styles.cardArrow} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.card}
                onPress={() => handleCardPress('Troubleshooting')}
                activeOpacity={0.7}
            >
                <View>
                    <IconAssets.Speedometer style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Troubleshooting</Text>
                </View>
                <IconAssets.Arrow style={styles.cardArrow} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.card}
                onPress={() => handleCardPress('Technical Support')}
                activeOpacity={0.7}
            >
                <View>
                    <IconAssets.Speedometer style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Technical Support</Text>
                </View>
                <IconAssets.Arrow style={styles.cardArrow} />
            </TouchableOpacity>
        </View>

    )
}

export default PromptCards