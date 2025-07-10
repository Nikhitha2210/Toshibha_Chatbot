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
    //  NEW: Local voice text management for feedback modal
    const [localVoiceText, setLocalVoiceText] = useState('');

    const { 
        startListening, 
        stopListening, 
        isListening, 
        inputText: voiceInputText, // This comes from the voice hook
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
        if (isVoiceActive && isListening && voiceInputText) {
            setFeedbackText(voiceInputText);
        }
    }, [voiceInputText, isVoiceActive, isListening]);

    const handleFeedbackVoiceToggle = async () => {
        if (isListening) {
            console.log('🎤 Stopping voice, preserving text:', voiceInputText);
            await stopListening();
            setIsVoiceActive(false);
            
            if (voiceInputText && voiceInputText.trim()) {
                console.log(' Preserving voice text:', voiceInputText);
                setLocalVoiceText(voiceInputText);
                setFeedbackText(voiceInputText);
            } else if (localVoiceText) {
                console.log(' Using local voice text:', localVoiceText);
                setFeedbackText(localVoiceText);
            }
        } else {
            console.log(' Starting voice with current text:', feedbackText);
            setIsVoiceActive(true);
            await startListening();
        }
    };

    const handleTextChange = (text: string) => {
        console.log(' Text changed to:', text);
        setFeedbackText(text);
        setLocalVoiceText(text);
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
            console.error(' Feedback submission failed:', error);
            Alert.alert('Error', 'Feedback submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
            handleClose();
        }
    };

    const handleClose = () => {
        console.log(' Closing feedback modal');
        if (isVoiceActive && isListening) {
            stopListening();
        }
        setIsVoiceActive(false);
        setFeedbackText('');
        setLocalVoiceText(''); //  Clear local voice text too
        clearText(); // Clear voice input text
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
                        
                        {/* FIXED: Voice input controls with same pattern as PromptInput */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {/*  Clear Button - appears when there's text and not listening */}
                            {feedbackText.length > 0 && !isListening && (
                                <TouchableOpacity 
                                    onPress={() => {
                                        setFeedbackText('');
                                        clearText();
                                    }} 
                                    disabled={isSubmitting}
                                    style={{
                                        width: 25,
                                        height: 25,
                                        borderRadius: 12.5,
                                        backgroundColor: '#666',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 5,
                                    }}
                                >
                                    <Text style={{ fontSize: 12, color: '#fff', fontWeight: 'bold' }}>×</Text>
                                </TouchableOpacity>
                            )}

                            {isListening && (
                                <TouchableOpacity 
                                    onPress={handleFeedbackVoiceToggle} 
                                    style={{
                                        backgroundColor: '#22C55E', // Green checkmark
                                        borderRadius: 20,
                                        padding: 8,
                                        minWidth: 40,
                                        minHeight: 40,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <Text style={{ fontSize: 16, color: '#fff', fontWeight: 'bold' }}>✓</Text>
                                </TouchableOpacity>
                            )}

                            {!isListening && (
                                <TouchableOpacity 
                                    onPress={handleFeedbackVoiceToggle}
                                    style={{ 
                                        padding: 8,
                                        borderRadius: 20,
                                        backgroundColor: 'transparent',
                                        minWidth: 40,
                                        minHeight: 40,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderWidth: 1,
                                        borderColor: '#666'
                                    }} 
                                    disabled={isSubmitting}
                                >
                                    <IconAssets.Microphone width={20} height={20} />
                                </TouchableOpacity>
                            )}

                            {isListening && (
                                <View style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minWidth: 30,
                                }}>
                                    <ListeningDots />
                                </View>
                            )}
                        </View>
                    </View>

                    {isListening && (
                        <View style={{
                            backgroundColor: 'rgba(230, 30, 30, 0.95)',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 15,
                            marginBottom: 10,
                            alignSelf: 'center',
                        }}>
                            <Text style={{ 
                                fontSize: 12, 
                                color: '#fff',
                                fontWeight: '600',
                                textAlign: 'center'
                            }}>
                                🎤 Listening... Tap ✓ when done speaking
                            </Text>
                        </View>
                    )}

                    <TextInput
                        style={[
                            styles.feedbackInput,
                            isListening && { borderColor: '#E61E1E', borderWidth: 2 }
                        ]}
                        placeholder="What was the issue with the response? How could it be improved?"
                        placeholderTextColor="#aaa"
                        multiline
                        value={feedbackText}
                        onChangeText={handleTextChange}
                        editable={!isListening && !isSubmitting}
                    />

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