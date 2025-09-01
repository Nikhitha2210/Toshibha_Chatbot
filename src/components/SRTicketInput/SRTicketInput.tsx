// src/components/SRTicketInput/SRTicketInput.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, Alert } from 'react-native';
import { useChat } from '../../context/ChatContext';
import { useThemeContext } from '../../context/ThemeContext';

interface SRTicketInputProps {
    style?: any;
}

const SRTicketInput: React.FC<SRTicketInputProps> = ({ style }) => {
    const { 
        submitSRTicket, 
        currentSessionId, 
        selectedSession, 
        error, 
        clearError 
    } = useChat();
    
    const { theme } = useThemeContext();
    const [srInputValue, setSrInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Reset input when session changes and show existing SR number
    useEffect(() => {
        const existingSRNumber = selectedSession?.srNumber || '';
            console.log('🔍 SRTicketInput loading session:', selectedSession?.id, 'SR number:', existingSRNumber);
    console.log('🔍 Full selectedSession object:', JSON.stringify(selectedSession, null, 2));
        setSrInputValue(existingSRNumber);
        console.log('📋 Loading SR number for session:', selectedSession?.id, 'SR:', existingSRNumber);
    }, [selectedSession?.id, selectedSession?.srNumber]);

    const handleSRTicketSubmit = useCallback(async (inputValue: string) => {
        if (!inputValue.trim() || !currentSessionId || isSubmitting) {
            return;
        }

        // Don't submit if the value hasn't changed
        if (inputValue.trim() === selectedSession?.srNumber?.trim()) {
            return;
        }

        setIsSubmitting(true);
        clearError();

        try {
            await submitSRTicket(currentSessionId, inputValue.trim());
            console.log('✅ SR Ticket submitted successfully');
        } catch (error) {
            console.error('❌ Failed to submit SR Ticket:', error);
            Alert.alert('Error', 'Failed to submit SR Ticket. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [currentSessionId, submitSRTicket, isSubmitting, clearError, selectedSession?.srNumber]);

    const handleTextChange = useCallback((text: string) => {
        // Limit to 20 characters like the web app
        const trimmedText = text.slice(0, 20);
        setSrInputValue(trimmedText);
        
        // Clear any pending timeouts (no auto-submit)
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    }, []);

    const handleSubmitEditing = useCallback(() => {
        if (srInputValue.trim() && srInputValue !== selectedSession?.srNumber) {
            handleSRTicketSubmit(srInputValue);
        }
    }, [srInputValue, selectedSession?.srNumber, handleSRTicketSubmit]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const styles = getStyles(theme);

    return (
        <View style={[styles.container, style]}>
            <TextInput
                style={[
                    styles.input,
                    isSubmitting && styles.inputSubmitting,
                    error && styles.inputError
                ]}
                value={srInputValue}
                onChangeText={handleTextChange}
                onSubmitEditing={handleSubmitEditing}
                placeholder={selectedSession?.srNumber || "Enter SR Ticket Number"}
                placeholderTextColor={selectedSession?.srNumber ? '#c62828' : '#999'}
                maxLength={20}
                returnKeyType="done"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
            />
        </View>
    );
};

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    input: {
        height: 38,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#ffebee',
        borderWidth: 1,
        borderColor: '#f44336',
        borderLeftWidth: 4,
        borderLeftColor: '#f44336',
        borderRadius: 8,
        fontSize: 14,
        color: '#c62828',
        fontWeight: '500',
    },
    inputSubmitting: {
        opacity: 0.6,
        backgroundColor: '#ffebee',
    },
    inputError: {
        borderColor: '#f44336',
    },
});

export default SRTicketInput;