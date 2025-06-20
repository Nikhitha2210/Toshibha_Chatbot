import React, { useEffect, useState } from 'react';

import { Modal, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import CheckBox from '@react-native-community/checkbox';

import { getStyles } from './styles';
import IconAssets from '../../assets/icons/IconAssets';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useChat } from '../../context/ChatContext';
import ListeningDots from '../ListeningDots';
import { useThemeContext } from '../../context/ThemeContext';

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
    harmful: boolean;
    untrue: boolean;
    unhelpful: boolean;
    setHarmful: (value: boolean) => void;
    setUntrue: (value: boolean) => void;
    setUnhelpful: (value: boolean) => void;
    messageText?: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onClose, harmful, untrue, unhelpful, setHarmful, setUntrue, setUnhelpful, messageText }) => {

    const [feedbackText, setFeedbackText] = useState('');
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { 
        startListening, 
        stopListening, 
        isListening, 
        setInputText: setVoiceInputText, 
        inputText: voiceInputText,
        clearText
    } = useVoiceInput();
    
    const { submitFeedback } = useChat();

    const { theme } = useThemeContext();
    const styles = getStyles(theme);

    useEffect(() => {
        let reasons: string[] = [];
        if (harmful) reasons.push('This is harmful/unsafe.');
        if (untrue) reasons.push('This isn\'t true.');
        if (unhelpful) reasons.push('This isn\'t helpful.');

        if (!isVoiceActive) {
            setFeedbackText(reasons.join(' '));
        }
    }, [harmful, untrue, unhelpful, isVoiceActive]);

    useEffect(() => {
        if (isVoiceActive && voiceInputText) {
            setFeedbackText(voiceInputText);
        }
    }, [voiceInputText, isVoiceActive]);

    const handleVoiceToggle = async () => {
        if (isListening) {
            await stopListening();
            setIsVoiceActive(false);
        } else {
            // Set the current feedback text to voice input before starting
            setVoiceInputText(feedbackText);
            setIsVoiceActive(true);
            await startListening();
        }
    };

    const handleTextChange = (text: string) => {
        setFeedbackText(text);
        if (isVoiceActive) {
            setVoiceInputText(text);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            if (messageText && feedbackText.trim()) {
                await submitFeedback(messageText, {
                    feedback: feedbackText.trim(),
                    harmful,
                    untrue,
                    unhelpful
                });
                Alert.alert('Success', 'Feedback submitted successfully!');
            }
        } catch (error) {
            console.error('❌ Feedback submission failed:', error);
            Alert.alert('Error', 'Feedback submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
            handleClose();
        }
    };

    const handleClose = () => {
        if (isVoiceActive && isListening) {
            stopListening();
        }
        setIsVoiceActive(false);
        setFeedbackText('');
        setHarmful(false);
        setUntrue(false);
        setUnhelpful(false);
        onClose();
    };

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.feedbackOverlay}>
                <View style={styles.feedbackModal}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={styles.feedbackTitle}>Provide feedback</Text>
                        <TouchableOpacity 
                            onPressIn={async () => {
                                if (!isListening) {
                                    setVoiceInputText(feedbackText);
                                    setIsVoiceActive(true);
                                    await startListening();
                                }
                            }}
                            onPressOut={async () => {
                                if (isListening) {
                                    await stopListening();
                                    setIsVoiceActive(false);
                                }
                            }}
                            style={{ 
                                padding: 8,
                                borderRadius: 20,
                                backgroundColor: isListening ? '#FF681F' : 'transparent',
                                minWidth: 40,
                                minHeight: 40,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }} 
                            disabled={isSubmitting}
                        >
                            {isListening ? (
                                <ListeningDots />
                            ) : (
                                <IconAssets.Microphone />
                            )}
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[
                            styles.feedbackInput,
                            isVoiceActive && { borderColor: '#FF681F', borderWidth: 2 }
                        ]}
                        placeholder="What was the issue with the response? How could it be improved?"
                        placeholderTextColor="#aaa"
                        multiline
                        value={feedbackText}
                        onChangeText={handleTextChange}
                        editable={!isListening && !isSubmitting}
                    />

                    {isListening && (
                        <Text style={{ color: '#FF681F', fontSize: 12, marginBottom: 10 }}>
                            🎤 Hold to talk, release when done
                        </Text>
                    )}

                    <View style={styles.checkboxRow}>
                        <CheckBox
                            value={harmful}
                            onValueChange={setHarmful}
                            tintColors={{ true: theme === 'dark' ? '#fff' : '#000', false: '#8A8A8A' }}
                            disabled={isSubmitting}
                        />
                        <Text style={styles.checkboxLabel}>This is harmful/unsafe</Text>
                    </View>
                    <View style={styles.checkboxRow}>
                        <CheckBox
                            value={untrue}
                            onValueChange={setUntrue}
                            tintColors={{ true: theme === 'dark' ? '#fff' : '#000', false: '#8A8A8A' }}
                            disabled={isSubmitting}
                        />
                        <Text style={styles.checkboxLabel}>This isn't true</Text>
                    </View>
                    <View style={styles.checkboxRow}>
                        <CheckBox
                            value={unhelpful}
                            onValueChange={setUnhelpful}
                            tintColors={{ true: theme === 'dark' ? '#fff' : '#000', false: '#8A8A8A' }}
                            disabled={isSubmitting}
                        />
                        <Text style={styles.checkboxLabel}>This isn't helpful</Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: 'transparent' }]}
                            onPress={handleClose}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.submitBtnText, { color: '#8A8A8A' }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitBtn, { opacity: isSubmitting ? 0.5 : 1 }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitBtnText}>
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default FeedbackModal;