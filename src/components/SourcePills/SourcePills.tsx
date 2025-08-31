import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    Modal, 
    Dimensions, 
    ActivityIndicator,
    Alert,
    StatusBar,
    ScrollView
} from 'react-native';
import { StyleSheet } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(1);
  const [allGroupSources, setAllGroupSources] = useState<SourceReference[]>([]);

  const { state } = useAuth();

  if (!sources || sources.length === 0) {
    return null;
  }

  // Group sources by filename
  const groupedSources = sources.reduce((acc, source, index) => {
    const key = source.filename;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push({ ...source, originalIndex: index });
    return acc;
  }, {} as Record<string, (SourceReference & { originalIndex: number })[]>);

  // Filter sources that have URLs and create image array
  const sourcesWithUrls = sources.filter(source => source.url);
  const imageUrls = sourcesWithUrls.map(source => ({
    url: source.url!,
    props: {
      headers: {
        'Authorization': `Bearer ${state.tokens?.access_token}`,
        'Accept': 'image/png,image/jpeg,image/*',
        'Cache-Control': 'no-cache'
      }
    }
  }));

  const handlePillPress = (source: SourceReference, groupSources: (SourceReference & { originalIndex: number })[]) => {
    console.log('=== PILL PRESS DEBUG ===');
    console.log('Pill pressed for source:', source.filename);
    console.log('Group sources count:', groupSources.length);
    console.log('Source URL exists:', !!source.url);
    console.log('Total sources:', sources.length);
    console.log('Sources with URLs:', sourcesWithUrls.length);
    
    // Get all sources from this group that have URLs
    const groupSourcesWithUrls = groupSources.filter(s => s.url);
    
    if (groupSourcesWithUrls.length > 0) {
      // Find the index of the first source from this group among all sources that have URLs
      const imageIndex = sourcesWithUrls.findIndex(s => s.awsLink === groupSourcesWithUrls[0].awsLink);
      
      console.log('Found image index:', imageIndex);
      console.log('Setting selectedImageIndex to:', imageIndex);
      console.log('Display index will be:', imageIndex + 1);
      
      setSelectedSource(groupSourcesWithUrls[0]);
      setAllGroupSources(groupSourcesWithUrls);
      setSelectedImageIndex(imageIndex >= 0 ? imageIndex : 0);
      setCurrentDisplayIndex(imageIndex + 1);
      setImageModalVisible(true);
    } else {
      console.log('No URL available for any source in group');
      Alert.alert(
        'No Image Available',
        'This source does not have an associated image to display.',
        [{ text: 'OK' }]
      );
    }
    console.log('=== PILL PRESS DEBUG END ===');
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedSource(null);
    setAllGroupSources([]);
    setSelectedImageIndex(0);
    setCurrentDisplayIndex(1);
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

  // Update current source when image changes
  const handleImageChange = (index?: number) => {
    console.log('Image changed to index:', index);
    if (index !== undefined && sourcesWithUrls[index]) {
      const newSource = sourcesWithUrls[index];
      setSelectedSource(newSource);
      setCurrentDisplayIndex(index + 1);
      console.log('Updated to source:', newSource.filename, 'Display index:', index + 1);
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
        {Object.entries(groupedSources).map(([filename, groupSources]) => (
          <TouchableOpacity
            key={filename}
            style={[
              styles.pill,
              groupSources[0].url ? styles.pillClickable : styles.pillDisabled
            ]}
            onPress={() => handlePillPress(groupSources[0], groupSources)}
            activeOpacity={groupSources[0].url ? 0.7 : 1}
            disabled={!groupSources[0].url}
          >
            <View style={styles.pillContent}>
              <IconAssets.Copy style={styles.documentIcon} />
              <View style={styles.textContainer}>
                <Text 
                    selectable={true}
                    style={styles.filename} 
                    numberOfLines={1}
                >
                  {filename}
                </Text>
                <Text 
                    selectable={true}
                    style={styles.pages}
                >
                  {formatPageText(groupSources[0].pages)}
                  {groupSources.length > 1 && ` +${groupSources.length - 1} more`}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fixed Image Viewer with Proper Zoom */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        onRequestClose={closeImageModal}
      >
        <StatusBar hidden />
        <View style={styles.imageViewerContainer}>
          {/* Header */}
          <View style={styles.imageViewerHeader}>
            <View style={styles.headerContent}>
              <Text 
                selectable={true}
                style={styles.imageViewerTitle}
                numberOfLines={2}
              >
                {selectedSource?.filename}
              </Text>
              <Text 
                selectable={true}
                style={styles.imageViewerSubtitle}
              >
                {selectedSource && formatPageText(selectedSource.pages)}
              </Text>
            </View>
            <TouchableOpacity onPress={closeImageModal} style={styles.imageViewerCloseButton}>
              <Text style={styles.imageViewerCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Fixed Image Counter */}
          {sourcesWithUrls.length > 1 && (
            <View style={styles.imageIndicator}>
              <Text style={styles.imageIndicatorText}>
                {currentDisplayIndex} / {sourcesWithUrls.length}
              </Text>
            </View>
          )}

          {imageUrls.length > 0 && (
            <ImageViewer
              imageUrls={imageUrls}
              index={selectedImageIndex}
              onSwipeDown={closeImageModal}
              enableSwipeDown={true}
              onChange={handleImageChange}
              enableImageZoom={true}
              doubleClickInterval={250}
              saveToLocalByLongPress={false}
              renderIndicator={() => <></>}
              menuContext={{
                saveToLocal: 'Save to Photos',
                cancel: 'Cancel'
              }}
              renderFooter={(currentIndex?: number) => (
                <View style={styles.imageViewerFooter}>
                  <Text style={styles.imageViewerInstructions}>
                    Pinch to zoom • Double tap to reset • Swipe down to close
                  </Text>
                  {imageUrls.length > 1 && (
                    <Text style={styles.imageViewerNavigation}>
                      Swipe left/right to navigate between images
                    </Text>
                  )}
                </View>
              )}
              loadingRender={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF6A00" />
                  <Text style={styles.loadingText}>Loading image...</Text>
                </View>
              )}
              failImageSource={{
                url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
                width: 1,
                height: 1
              }}
              useNativeDriver={true}
            />
          )}
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
  
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 15,
  },
  headerContent: {
    flex: 1,
    marginRight: 15,
  },
  imageViewerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  imageViewerSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  imageViewerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageIndicator: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 1000,
  },
  imageIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  imageViewerFooter: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  imageViewerInstructions: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  imageViewerNavigation: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
});

export default SourcePills;