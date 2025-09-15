import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface StreamingMessageParserProps {
    text: string;
    isStreaming: boolean;
    theme: 'light' | 'dark';
}

interface ParsedContent {
    type: 'TEXT' | 'TABLE' | 'SOURCE';
    content: string;
}

const StreamingMessageParser: React.FC<StreamingMessageParserProps> = ({ 
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

    // Function to convert table string to markdown table
    const convertToMarkdownTable = (tableStr: string): string => {
        const lines = tableStr.trim().split('\n');
        let markdownTable = '';
        
        // Process each line of the table
        lines.forEach((line, index) => {
            // Clean up the line and split by pipe
            const cells = line.trim().split('|').filter(cell => cell.trim() !== '');
            
            if (cells.length > 0) {
                // Add the cells with proper markdown formatting
                markdownTable += '| ' + cells.join(' | ') + ' |\n';
                
                // Add the separator row after the header
                if (index === 0) {
                    markdownTable += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
                }
            }
        });
        
        return markdownTable;
    };

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

    const styles = getStyles(theme);

    return (
        <View style={styles.container}>
            {parsedContent.map((section, index) => {
                switch (section.type) {
                    case 'TEXT':
                        return (
                            <View key={`text-${index}`} style={styles.textSection}>
                                <Markdown style={markdownStyles}>
                                    {section.content}
                                </Markdown>
                            </View>
                        );
                    case 'TABLE':
                        return (
                            <View key={`table-${index}`} style={styles.tableSection}>
                                <Markdown style={markdownStyles}>
                                    {convertToMarkdownTable(section.content)}
                                </Markdown>
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
    tableSection: {
        marginVertical: 12,
    },
    sourceSection: {
        flexDirection: 'row',
        marginTop: 8,
        padding: 8,
        backgroundColor: theme === 'dark' ? 'rgba(230, 30, 30, 0.08)' : 'rgba(230, 30, 30, 0.05)',
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#E61E1E',
    },
    sourceLabel: {
        color: '#E61E1E',
        fontSize: 12,
        fontWeight: '600',
    },
    sourceContent: {
        color: theme === 'dark' ? '#ccc' : '#333',
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

export default StreamingMessageParser;