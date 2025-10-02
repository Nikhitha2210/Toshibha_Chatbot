import React, { JSX, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native';
import Colors from '../../theme/colors';

interface StreamingResponseParserProps {
    text: string;
    isStreaming: boolean;
    theme: 'light' | 'dark';
}

interface ParsedContent {
    type: 'TEXT' | 'TABLE' | 'SOURCE';
    content: string;
}

const StreamingResponseParser: React.FC<StreamingResponseParserProps> = ({ 
    text, 
    isStreaming, 
    theme 
}) => {
    const [parsedContent, setParsedContent] = useState<ParsedContent[]>([]);

    useEffect(() => {
        if (!text) {
            setParsedContent([]);
            return;
        }

        // Parse the text to identify different sections
        const sections: ParsedContent[] = [];
        
        // Regular expressions to match the different sections
        const textRegex = /<TEXT>(.*?)<\/TEXT>/gs;
        const tableRegex = /<TABLE>(.*?)<\/TABLE>/gs;
        const sourceRegex = /<SOURCE>(.*?)<\/SOURCE>/gs;
        
        // Find all TEXT sections
        let textMatch;
        let lastIndex = 0;
        
        // Process TEXT sections
        while ((textMatch = textRegex.exec(text)) !== null) {
            const matchStart = textMatch.index;
            const matchEnd = textRegex.lastIndex;
            
            // Add any text before the match as regular text
            if (matchStart > lastIndex) {
                const beforeText = text.substring(lastIndex, matchStart);
                if (beforeText.trim()) {
                    sections.push({ type: 'TEXT', content: beforeText });
                }
            }
            
            // Add the matched TEXT content
            sections.push({ type: 'TEXT', content: textMatch[1] });
            lastIndex = matchEnd;
        }
        
        // Add any remaining text after the last TEXT match
        if (lastIndex < text.length) {
            const remainingText = text.substring(lastIndex);
            
            // Process TABLE sections in the remaining text
            let tableMatch;
            let tableLastIndex = 0;
            
            while ((tableMatch = tableRegex.exec(remainingText)) !== null) {
                const tableMatchStart = tableMatch.index;
                const tableMatchEnd = tableRegex.lastIndex;
                
                // Add any text before the table
                if (tableMatchStart > tableLastIndex) {
                    const beforeTable = remainingText.substring(tableLastIndex, tableMatchStart);
                    if (beforeTable.trim()) {
                        sections.push({ type: 'TEXT', content: beforeTable });
                    }
                }
                
                // Add the table content
                sections.push({ type: 'TABLE', content: tableMatch[1] });
                tableLastIndex = tableMatchEnd;
            }
            
            // Process SOURCE sections in the remaining text
            if (tableLastIndex < remainingText.length) {
                const afterTableText = remainingText.substring(tableLastIndex);
                let sourceMatch;
                let sourceLastIndex = 0;
                
                while ((sourceMatch = sourceRegex.exec(afterTableText)) !== null) {
                    const sourceMatchStart = sourceMatch.index;
                    const sourceMatchEnd = sourceRegex.lastIndex;
                    
                    // Add any text before the source
                    if (sourceMatchStart > sourceLastIndex) {
                        const beforeSource = afterTableText.substring(sourceLastIndex, sourceMatchStart);
                        if (beforeSource.trim()) {
                            sections.push({ type: 'TEXT', content: beforeSource });
                        }
                    }
                    
                    // Add the source content
                    sections.push({ type: 'SOURCE', content: sourceMatch[1] });
                    sourceLastIndex = sourceMatchEnd;
                }
                
                // Add any remaining text after the last source
                if (sourceLastIndex < afterTableText.length) {
                    const finalText = afterTableText.substring(sourceLastIndex);
                    if (finalText.trim()) {
                        sections.push({ type: 'TEXT', content: finalText });
                    }
                }
            }
        }
        
        // If no sections were found, treat the entire text as a TEXT section
        if (sections.length === 0 && text.trim()) {
            sections.push({ type: 'TEXT', content: text });
        }
        
        setParsedContent(sections);
    }, [text]);

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

    const styles = getStyles(theme);

    return (
        <View style={styles.container}>
            {parsedContent.map((section, index) => {
                switch (section.type) {
                    case 'TEXT':
                        return (
                            <View key={`text-${index}`} style={styles.textSection}>
                                <Text style={styles.textContent}>
                                    {section.content}
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
                                <Text style={styles.sourceContent}>{section.content}</Text>
                            </View>
                        );
                    default:
                        return null;
                }
            })}
            {isStreaming && parsedContent.length === 0 && (
                <View style={styles.typingIndicator}>
                    <View style={[styles.typingDot, styles.typingDot1]} />
                    <View style={[styles.typingDot, styles.typingDot2]} />
                    <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
            )}
        </View>
    );
};

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
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
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.dark.primary,
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

export default StreamingResponseParser;