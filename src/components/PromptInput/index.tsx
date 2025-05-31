import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useVoiceInput } from '../../hooks/useVoiceInput';

import { styles } from './styles';
import IconAssets from '../../assets/icons/IconAssets';

import ListeningDots from '../ListeningDots';

export type PromptType = {
    id: string;
    time: string;
    message: string;
    highlight: {
        title: string;
        rating: number;
        reviews: number;
        description: string;
    };
};

type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    AiAssist: { promptData: PromptType };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PromptInput = () => {
    const navigation = useNavigation<NavigationProp>();

    const { inputText, setInputText, isListening, handleVoiceToggle } = useVoiceInput();

    const handleSend = () => {
        const newPrompt = {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            message: inputText,
            highlight: {
                title: "Your Query Response",
                rating: 4.8,
                reviews: 8399,
                description: "Processing your request..."
            }
        }
        navigation.navigate('AiAssist', { promptData: newPrompt });

        setInputText('');
    }

    return (
        <View style={styles.askSection}>
            <TextInput
                style={styles.askText}
                placeholder="Type your question..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                multiline
            />
            <View style={styles.askInputContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.askButton}>
                        <Image source={require('../../assets/images/file.png')} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.askButton}>
                        <Text style={styles.btnText}>Search</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.askButton}>
                        <Text style={styles.btnText}>Deep Search</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleVoiceToggle}>
                        {isListening ? (
                            <ListeningDots />
                        ) : (
                            <IconAssets.Microphone />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSend}>
                        <IconAssets.Send />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default PromptInput;