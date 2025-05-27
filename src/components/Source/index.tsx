import React from 'react';

import Modal from 'react-native-modal';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { styles } from './styles';

interface SourceLink {
    id: number;
    label: string;
    title: string;
    date: string;
    color: string;
}

interface SourceModalProps {
    visible: boolean;
    onClose: () => void;
    activeTab: 'Links' | 'Images';
    setActiveTab: (tab: 'Links' | 'Images') => void;
    sourceLinks: SourceLink[];
}

const SourceModal: React.FC<SourceModalProps> = ({
    visible,
    onClose,
    activeTab,
    setActiveTab,
    sourceLinks,
}) => {
    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            onSwipeComplete={onClose}
            swipeDirection="down"
            style={{ justifyContent: 'flex-end', margin: 0 }}
        >
            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />

                <View style={styles.tabsRow}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('Links')}
                        style={[styles.tabButton, activeTab === 'Links' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === 'Links' && styles.activeTabText]}>
                            Links
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('Images')}
                        style={[styles.tabButton, activeTab === 'Images' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === 'Images' && styles.activeTabText]}>
                            Images
                        </Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'Links' && (
                    <ScrollView style={styles.linksContainer} showsVerticalScrollIndicator={true}>
                        {sourceLinks.map((item) => (
                            <View key={item.id} style={styles.linkItem}>
                                <View style={[styles.sourceDot, { backgroundColor: item.color }]} />
                                <View>
                                    <Text style={styles.sourceLabel}>{item.label}</Text>
                                    <Text style={styles.sourceTitle}>{item.title}</Text>
                                    <Text style={styles.sourceDate}>{item.date}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
};

export default SourceModal;