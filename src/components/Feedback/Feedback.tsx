import React, { useEffect, useState } from 'react';

import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import CheckBox from '@react-native-community/checkbox';

import { styles } from './styles';

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
    harmful: boolean;
    untrue: boolean;
    unhelpful: boolean;
    setHarmful: (value: boolean) => void;
    setUntrue: (value: boolean) => void;
    setUnhelpful: (value: boolean) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
    visible,
    onClose,
    harmful,
    untrue,
    unhelpful,
    setHarmful,
    setUntrue,
    setUnhelpful,
}) => {
    const [feedbackText, setFeedbackText] = useState('');

    useEffect(() => {
        let reasons: string[] = [];

        if (harmful) reasons.push('This is harmful/unsafe.');
        if (untrue) reasons.push('This isn’t true.');
        if (unhelpful) reasons.push('This isn’t helpful.');

        setFeedbackText(reasons.join(' '));
    }, [harmful, untrue, unhelpful]);

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.feedbackOverlay}>
                <View style={styles.feedbackModal}>
                    <Text style={styles.feedbackTitle}>Provide feedback</Text>
                    <TextInput
                        style={styles.feedbackInput}
                        placeholder="What was the issue with the response? How could it be improved?"
                        placeholderTextColor="#aaa"
                        multiline
                        value={feedbackText}
                        onChangeText={setFeedbackText}
                    />
                    <View style={styles.checkboxRow}>
                        <CheckBox value={harmful} onValueChange={setHarmful} tintColors={{ true: '#fff', false: '#8A8A8A' }} />
                        <Text style={styles.checkboxLabel}>This is harmful/unsafe</Text>
                    </View>
                    <View style={styles.checkboxRow}>
                        <CheckBox value={untrue} onValueChange={setUntrue} tintColors={{ true: '#fff', false: '#8A8A8A' }} />
                        <Text style={styles.checkboxLabel}>This isn’t true</Text>
                    </View>
                    <View style={styles.checkboxRow}>
                        <CheckBox value={unhelpful} onValueChange={setUnhelpful} tintColors={{ true: '#fff', false: '#8A8A8A' }} />
                        <Text style={styles.checkboxLabel}>This isn’t helpful</Text>
                    </View>
                    <View>
                        <TouchableOpacity style={styles.submitBtn} onPress={onClose}>
                            <Text style={styles.submitBtnText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default FeedbackModal;