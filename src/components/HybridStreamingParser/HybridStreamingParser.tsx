import React, { JSX, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import Colors from '../../theme/colors';

interface HybridStreamingParserProps {
    text: string;
    isStreaming: boolean;
    theme: 'light' | 'dark';
}

interface ParsedContent {
    type: 'TEXT' | 'TABLE' | 'SOURCE' | 'MARKDOWN';
    content: string;
}

const HybridStreamingParser: React.FC<HybridStreamingParserProps> = ({ 
    text, 
    isStreaming, 
    theme 
}) => {
    const [parsedContent, setParsedContent] = useState<ParsedContent[]>([]);
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        if (!text) {
            setParsedContent([]);
            setDisplayedText('');
            return;
        }

        // For streaming, show incremental text updates
        if (isStreaming) {
            setDisplayedText(text);
            
            // Parse the accumulated text for structured content
            const sections = parseContent(text);
            setParsedContent(sections);
        } else {
            // For final content, parse everything
            const sections = parseContent(text);
            setParsedContent(sections);
            setDisplayedText(text);
        }
    }, [text, isStreaming]);

    const parseContent = (inputText: string): ParsedContent[] => {
        const sections: ParsedContent[] = [];
        
        // Check if text has structured streaming tags
        const hasStreamingTags = inputText.includes('<TEXT>') || inputText.includes('<TABLE>') || inputText.includes('<SOURCE>');
        
        if (hasStreamingTags) {
            // Parse structured content
            const textRegex = /<TEXT>(.*?)<\/TEXT>/gs;
            const tableRegex = /<TABLE>(.*?)<\/TABLE>/gs;
            const sourceRegex = /<SOURCE>(.*?)<\/SOURCE>/gs;
            
            let processedText = inputText;
            let lastIndex = 0;
            
            // Process TEXT sections
            let textMatch;
            const textMatches: Array<{start: number, end: number, content: string}> = [];
            
            while ((textMatch = textRegex.exec(inputText)) !== null) {
                textMatches.push({
                    start: textMatch.index,
                    end: textRegex.lastIndex,
                    content: textMatch[1]
                });
            }
            
            // Process TABLE sections
            let tableMatch;
            const tableMatches: Array<{start: number, end: number, content: string}> = [];
            
            while ((tableMatch = tableRegex.exec(inputText)) !== null) {
                tableMatches.push({
                    start: tableMatch.index,
                    end: tableRegex.lastIndex,
                    content: tableMatch[1]
                });
            }
            
            // Process SOURCE sections
            let sourceMatch;
            const sourceMatches: Array<{start: number, end: number, content: string}> = [];
            
            while ((sourceMatch = sourceRegex.exec(inputText)) !== null) {
                sourceMatches.push({
                    start: sourceMatch.index,
                    end: sourceRegex.lastIndex,
                    content: sourceMatch[1]
                });
            }
            
            // Combine and sort all matches by position
            const allMatches = [
                ...textMatches.map(m => ({...m, type: 'TEXT' as const})),
                ...tableMatches.map(m => ({...m, type: 'TABLE' as const})),
                ...sourceMatches.map(m => ({...m, type: 'SOURCE' as const}))
            ].sort((a, b) => a.start - b.start);
            
            // Build sections with interspersed regular text
            let currentIndex = 0;
            
            for (const match of allMatches) {
                // Add any text before this match
                if (match.start > currentIndex) {
                    const beforeText = inputText.substring(currentIndex, match.start);
                    if (beforeText.trim()) {
                        sections.push({ type: 'TEXT', content: beforeText.trim() });
                    }
                }
                
                // Add the matched content
                sections.push({ type: match.type, content: match.content });
                currentIndex = match.end;
            }
            
            // Add any remaining text after the last match
            if (currentIndex < inputText.length) {
                const remainingText = inputText.substring(currentIndex);
                if (remainingText.trim()) {
                    sections.push({ type: 'TEXT', content: remainingText.trim() });
                }
            }
        } else {
            // No structured tags, treat as regular markdown
            sections.push({ type: 'MARKDOWN', content: inputText });
        }
        
        // If no sections were found, treat entire text as MARKDOWN
        if (sections.length === 0 && inputText.trim()) {
            sections.push({ type: 'MARKDOWN', content: inputText.trim() });
        }
        
        return sections;
    };

    // Your exact markdown styles from MessageRenderer
    const markdownStyles = {
        body: {
            color: theme === 'dark' ? '#ccc' : '#333',
            fontSize: 14,
            lineHeight: 22,
        },
        heading1: {
            color: theme === 'dark' ? '#fff' : '#000',
            fontSize: 18,
            fontWeight: 'bold' as const,
            marginBottom: 8,
        },
        heading2: {
            color: theme === 'dark' ? '#fff' : '#000',
            fontSize: 16,
            fontWeight: 'bold' as const,
            marginBottom: 6,
        },
        heading3: {
            color: theme === 'dark' ? '#fff' : '#000',
            fontSize: 14,
            fontWeight: 'bold' as const,
            marginBottom: 4,
        },
        paragraph: {
            color: theme === 'dark' ? '#ccc' : '#333',
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 8,
        },
        list_item: {
            color: theme === 'dark' ? '#ccc' : '#333',
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 4,
        },
        bullet_list: {
            marginBottom: 8,
        },
        ordered_list: {
            marginBottom: 8,
        },
        table: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
            borderWidth: 1,
            borderColor: theme === 'dark' ? '#333' : '#ddd',
            borderRadius: 8,
            marginVertical: 8,
            overflow: 'hidden' as const,
        },
        thead: {
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#e9ecef',
        },
        th: {
            color: theme === 'dark' ? '#fff' : '#000',
            fontSize: 13,
            fontWeight: 'bold' as const,
            padding: 12,
            borderRightWidth: 1,
            borderRightColor: theme === 'dark' ? '#444' : '#ccc',
            textAlign: 'left' as const,
        },
        tr: {
            borderBottomWidth: 1,
            borderBottomColor: theme === 'dark' ? '#333' : '#ddd',
        },
        td: {
            color: theme === 'dark' ? '#ccc' : '#333',
            fontSize: 12,
            padding: 12,
            borderRightWidth: 1,
            borderRightColor: theme === 'dark' ? '#444' : '#ccc',
            textAlign: 'left' as const,
        },
        code_inline: {
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f1f3f4',
            color: theme === 'dark' ? '#ff6b6b' : '#d73a49',
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 3,
            fontSize: 13,
            fontFamily: 'monospace',
        },
        code_block: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f6f8fa',
            padding: 12,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: theme === 'dark' ? '#333' : '#e1e4e8',
            marginVertical: 8,
        },
        fence: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f6f8fa',
            padding: 12,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: theme === 'dark' ? '#333' : '#e1e4e8',
            marginVertical: 8,
        },
        blockquote: {
            backgroundColor: theme === 'dark' ? 'rgba(230, 30, 30, 0.05)' : 'rgba(230, 30, 30, 0.02)', 
            borderLeftWidth: 4,
            borderLeftColor: '#E61E1E',
            paddingLeft: 12,
            paddingVertical: 8,
            marginVertical: 8,
            borderRadius: 4,
        },
        strong: {
            color: theme === 'dark' ? '#fff' : '#000',
            fontWeight: 'bold' as const,
        },
        em: {
            color: theme === 'dark' ? '#ccc' : '#333',
            fontStyle: 'italic' as const,
        },
        link: {
            color: '#E61E1E',
            textDecorationLine: 'underline' as const,
        },
        hr: {
            backgroundColor: theme === 'dark' ? '#333' : '#e1e4e8',
            height: 1,
            marginVertical: 16,
        },
    };

    // Function to convert table string to simple table display
    const renderTable = (tableStr: string): JSX.Element => {
        const lines = tableStr.trim().split('\n');
        const rows = lines.map((line, index) => {
            const cells = line.trim().split('|').filter(cell => cell.trim() !== '');
            
            return (
                <View key={index} style={[styles.tableRow, index === 0 && styles.tableHeader]}>
                    {cells.map((cell, cellIndex) => (
                        <View key={cellIndex} style={styles.tableCell}>
                            <Text style={[
                                styles.tableCellText,
                                { color: theme === 'dark' ? Colors.dark.text : Colors.light.text },
                                index === 0 && styles.tableHeaderText
                            ]}>
                                {cell.trim()}
                            </Text>
                        </View>
                    ))}
                </View>
            );
        });

        return (
            <View style={[
                styles.tableContainer,
                { borderColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke }
            ]}>
                {rows}
            </View>
        );
    };

    const handleCopyPress = () => {
        Clipboard.setString(text);
        Alert.alert('Copied', 'Text copied to clipboard!');
    };

    const styles = getStyles(theme);

    // Show typing indicator if streaming but no content yet
    if (isStreaming && !displayedText) {
        return (
            <View style={styles.container}>
                <View style={styles.typingIndicator}>
                    <View style={[styles.typingDot, styles.typingDot1]} />
                    <View style={[styles.typingDot, styles.typingDot2]} />
                    <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {parsedContent.map((section, index) => {
                switch (section.type) {
                    case 'MARKDOWN':
                        return (
                            <View key={`markdown-${index}`} style={styles.markdownSection}>
                                <Markdown style={markdownStyles}>
                                    {section.content}
                                    {isStreaming && index === parsedContent.length - 1 ? '|' : ''}
                                </Markdown>
                            </View>
                        );
                    case 'TEXT':
                        return (
                            <View key={`text-${index}`} style={styles.textSection}>
                                <Text 
                                    selectable={true}
                                    style={styles.textContent}
                                >
                                    {section.content}
                                    {isStreaming && index === parsedContent.length - 1 && (
                                        <Text style={{ color: '#E61E1E' }}>|</Text>
                                    )}
                                </Text>
                            </View>
                        );
                    case 'TABLE':
                        return (
                            <View key={`table-${index}`} style={styles.tableSection}>
                                {renderTable(section.content)}
                            </View>
                        );
                    case 'SOURCE':
                        return (
                            <View key={`source-${index}`} style={styles.sourceSection}>
                                <Text style={styles.sourceLabel}>Source: </Text>
                                <Text 
                                    selectable={true}
                                    style={styles.sourceContent}
                                >
                                    {section.content}
                                </Text>
                            </View>
                        );
                    default:
                        return null;
                }
            })}
            
            {/* Show typing indicator during streaming */}
            {isStreaming && (
                <View style={styles.streamingIndicator}>
                    <View style={[styles.typingDot, styles.typingDot1]} />
                    <View style={[styles.typingDot, styles.typingDot2]} />
                    <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
            )}

            {/* Copy button */}
            <TouchableOpacity 
                onPress={handleCopyPress}
                style={{
                    marginTop: 8,
                    alignSelf: 'flex-end',
                    backgroundColor: theme === 'dark' ? '#333' : '#ddd',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <Text style={{ 
                    fontSize: 11, 
                    color: theme === 'dark' ? '#fff' : '#000',
                    marginRight: 4,
                }}>
                    📋
                </Text>
                <Text style={{ 
                    fontSize: 11, 
                    color: theme === 'dark' ? '#fff' : '#000' 
                }}>
                    Copy
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
    },
    markdownSection: {
        marginBottom: 8,
    },
    textSection: {
        marginBottom: 8,
    },
    textContent: {
        color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
        fontSize: 14,
        lineHeight: 20,
    },
    tableSection: {
        marginVertical: 12,
    },
    tableContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
    },
    tableHeader: {
        backgroundColor: theme === 'dark' ? Colors.dark.background3 : Colors.light.background2,
    },
    tableCell: {
        flex: 1,
        padding: 8,
        borderRightWidth: 1,
        borderRightColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
    },
    tableCellText: {
        fontSize: 12,
        textAlign: 'center',
    },
    tableHeaderText: {
        fontWeight: 'bold',
    },
    sourceSection: {
        flexDirection: 'row',
        marginTop: 8,
        padding: 8,
        backgroundColor: theme === 'dark' ? Colors.dark.background3 : Colors.light.background2,
        borderRadius: 6,
    },
    sourceLabel: {
        color: theme === 'dark' ? Colors.dark.primary : Colors.light.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    sourceContent: {
        color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
        fontSize: 12,
        flex: 1,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    streamingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        marginTop: 8,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E61E1E',
        marginHorizontal: 2,
    },
    typingDot1: {
        opacity: 0.4,
    },
    typingDot2: {
        opacity: 0.7,
    },
    typingDot3: {
        opacity: 1,
    },
});

export default HybridStreamingParser;