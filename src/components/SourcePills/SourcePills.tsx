import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Image, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native';
import Colors from '../../theme/colors';
import IconAssets from '../../assets/icons/IconAssets';
import { SourceReference } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SourcePillsProps {
  sources: SourceReference[];
  theme: 'light' | 'dark';
}

const SourcePills: React.FC<SourcePillsProps> = ({ sources, theme }) => {
  const [selectedSource, setSelectedSource] = useState<SourceReference | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const { state } = useAuth();

  if (!sources || sources.length === 0) {
    return null;
  }

  const handlePillPress = (source: SourceReference) => {
    console.log('🔍 === PILL PRESS DEBUG ===');
    console.log('🖼️ Pill pressed for source:', source);
    console.log('🖼️ Source URL:', source.url);
    console.log('🖼️ AWS Link:', source.awsLink);
    
    if (source.url) {
      console.log('✅ URL exists, opening modal...');
      setSelectedSource(source);
      setImageModalVisible(true);
      setImageLoading(true);
      setImageError(false);
    } else {
      console.log('❌ No URL available for source');
    }
    console.log('🔍 === PILL PRESS DEBUG END ===');
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedSource(null);
    setImageLoading(true);
    setImageError(false);
  };

  const formatPageText = (pages: string) => {
    if (pages.includes(',')) {
      return `Pages ${pages}`;
    } else if (pages.includes('-')) {
      return `Pages ${pages}`;
    } else {
      return `Page ${pages}`;
    }
  };

  const styles = getStyles(theme);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsContainer}
      >
        {sources.map((source, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.pill,
              source.url ? styles.pillClickable : styles.pillDisabled
            ]}
            onPress={() => handlePillPress(source)}
            activeOpacity={source.url ? 0.7 : 1}
            disabled={!source.url}
          >
            <View style={styles.pillContent}>
              <IconAssets.Copy style={styles.documentIcon} />
              <View style={styles.textContainer}>
                <Text style={styles.filename} numberOfLines={1}>
                  {source.filename}
                </Text>
                <Text style={styles.pages}>
                  {formatPageText(source.pages)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedSource?.filename}
              </Text>
              <TouchableOpacity onPress={closeImageModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.imageScrollContainer}
              contentContainerStyle={styles.imageScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={true}
            >
              {selectedSource?.url && (
                <>
                  <Image
                    source={{ 
                      uri: selectedSource.url,
                      headers: {
                        'Authorization': `Bearer ${state.tokens?.access_token}`,
                        'Accept': 'image/png,image/jpeg,image/*',
                        'Cache-Control': 'no-cache'
                      }
                    }}
                    style={styles.modalImage}
                    resizeMode="contain"
                    onLoadStart={() => {
                      console.log('🖼️ === IMAGE LOADING START ===');
                      console.log('🖼️ Image loading started for:', selectedSource?.filename);
                      console.log('🖼️ Full URL being loaded:', selectedSource?.url);
                      console.log('🖼️ Auth token available:', !!state.tokens?.access_token);
                      setImageLoading(true);
                      setImageError(false);
                    }}
                    onLoad={() => {
                      console.log('✅ === IMAGE LOADED SUCCESSFULLY ===');
                      console.log('✅ Image loaded for:', selectedSource?.filename);
                      console.log('✅ URL that worked:', selectedSource?.url);
                      setImageLoading(false);
                      setImageError(false);
                    }}
                    onError={(error) => {
                      console.log('❌ === IMAGE LOADING FAILED ===');
                      console.log('❌ Failed to load image for:', selectedSource?.filename);
                      console.log('❌ Failed URL:', selectedSource?.url);
                      console.log('❌ Error details:', error);
                      console.log('❌ Error nativeEvent:', error.nativeEvent);
                      console.log('❌ Auth token available:', !!state.tokens?.access_token);
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />

                  {/* Loading indicator */}
                  {imageLoading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="#FF6A00" />
                      <Text style={styles.loadingText}>Loading image...</Text>
                    </View>
                  )}

                  {/* Error state */}
                  {imageError && (
                    <View style={styles.errorOverlay}>
                      <Text style={styles.errorText}>
                        Failed to load image
                      </Text>
                      <Text style={styles.errorSubtext}>
                        Backend endpoint may not be available
                      </Text>
                      <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => {
                          setImageError(false);
                          setImageLoading(true);
                        }}
                      >
                        <Text style={styles.retryButtonText}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.pageInfo}>
                {selectedSource && formatPageText(selectedSource.pages)}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
  pillsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    paddingVertical: 8,
    gap: 8,
  },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    minWidth: 120,
    maxWidth: 200,
  },
  pillClickable: {
    backgroundColor: theme === 'dark' ? Colors.dark.background3 : Colors.light.background2,
    borderColor: theme === 'dark' ? Colors.dark.primary : Colors.light.primary,
  },
  pillDisabled: {
    backgroundColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
    borderColor: theme === 'dark' ? Colors.dark.subText : Colors.light.lightText,
    opacity: 0.6,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentIcon: {
    width: 16,
    height: 16,
    tintColor: theme === 'dark' ? Colors.dark.primary : Colors.light.primary,
  },
  textContainer: {
    flex: 1,
  },
  filename: {
    fontSize: 12,
    fontWeight: '600',
    color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 2,
  },
  pages: {
    fontSize: 10,
    color: theme === 'dark' ? Colors.dark.subText : Colors.light.lightText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontWeight: 'bold',
  },
  imageScrollContainer: {
    flex: 1,
  },
  imageScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  modalImage: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? Colors.dark.stroke : Colors.light.stroke,
    alignItems: 'center',
  },
  pageInfo: {
    fontSize: 14,
    color: theme === 'dark' ? Colors.dark.subText : Colors.light.lightText,
    fontWeight: '500',
  },
  // Loading and error state styles
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: theme === 'dark' ? Colors.dark.background3 : Colors.light.background2,
  },
  errorText: {
    fontSize: 18,
    color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: theme === 'dark' ? Colors.dark.subText : Colors.light.lightText,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6A00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SourcePills;