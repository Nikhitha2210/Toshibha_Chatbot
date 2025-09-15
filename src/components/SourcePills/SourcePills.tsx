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
  const [allImageUrls, setAllImageUrls] = useState<any[]>([]);
  const [allImageNames, setAllImageNames] = useState<string[]>([]);

  const { state } = useAuth();

  if (!sources || sources.length === 0) {
    return null;
  }

  // Generate +/- 2 pages for a source (web app feature)
  const generatePageUrls = (source: SourceReference, centerPage: number) => {
    const urls: any[] = [];
    const names: string[] = [];
    
    // Generate 5 pages: center ± 2
    for (let offset = -2; offset <= 2; offset++) {
      const pageNum = centerPage + offset;
      if (pageNum > 0) { // Only positive page numbers
        // Replace the page number in the original URL
        const newUrl = source.url?.replace(`_page_${centerPage}`, `_page_${pageNum}`) || '';
        
        urls.push({
          url: newUrl,
          props: {
            headers: {
              'Authorization': `Bearer ${state.tokens?.access_token}`,
              'Accept': 'image/png,image/jpeg,image/*',
              'Cache-Control': 'no-cache'
            }
          }
        });
        
        names.push(`${source.filename} Page ${pageNum}`);
      }
    }
    
    return { urls, names };
  };

  // Group sources by filename (like web app)
  const groupedSources = sources.reduce((acc, source, index) => {
    const key = source.filename;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push({ ...source, originalIndex: index });
    return acc;
  }, {} as Record<string, (SourceReference & { originalIndex: number })[]>);

  const handlePillPress = (source: SourceReference, groupSources: (SourceReference & { originalIndex: number })[]) => {
    console.log('=== ENHANCED PILL PRESS DEBUG ===');
    console.log('Pill pressed for source:', source.filename);
    console.log('Group sources count:', groupSources.length);
    console.log('Source URL exists:', !!source.url);
    
    if (!source.url) {
      console.log('No URL available for source');
      Alert.alert(
        'No Image Available',
        'This source does not have an associated image to display.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Generate all image URLs for all sources in the group with +/- 2 pages
    const allUrls: any[] = [];
    const allNames: string[] = [];
    let startIndex = 0;

    groupSources.forEach((groupSource, groupIndex) => {
      if (groupSource.url) {
        // Extract center page number
        const centerPage = parseInt(groupSource.pages.split(',')[0].split('-')[0].trim());
        console.log(`Generating pages for ${groupSource.filename}, center page: ${centerPage}`);
        
        // Generate center ± 2 pages
        const { urls, names } = generatePageUrls(groupSource, centerPage);
        
        // If this is the source that was clicked, remember where its center page is
        if (groupSource.awsLink === source.awsLink) {
          startIndex = allUrls.length + 2; // Center page is at offset 2 in the 5-page array
          console.log(`Selected source will start at index: ${startIndex}`);
        }
        
        allUrls.push(...urls);
        allNames.push(...names);
      }
    });

    console.log(`Total generated URLs: ${allUrls.length}`);
    console.log(`Starting at index: ${startIndex}`);
    
    setAllImageUrls(allUrls);
    setAllImageNames(allNames);
    setSelectedSource(source);
    setSelectedImageIndex(startIndex);
    setCurrentDisplayIndex(startIndex + 1);
    setImageModalVisible(true);
    
    console.log('=== ENHANCED PILL PRESS DEBUG END ===');
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedSource(null);
    setAllImageUrls([]);
    setAllImageNames([]);
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
    if (index !== undefined && allImageNames[index]) {
      setCurrentDisplayIndex(index + 1);
      console.log('Updated display index to:', index + 1);
      console.log('Current image name:', allImageNames[index]);
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

      {/* Enhanced Image Viewer with +/- 2 Pages */}
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
                {allImageNames[selectedImageIndex] || selectedSource?.filename}
              </Text>
              <Text 
                selectable={true}
                style={styles.imageViewerSubtitle}
              >
                {/* Enhanced viewing: ± 2 pages around reference */}
              </Text>
            </View>
            <TouchableOpacity onPress={closeImageModal} style={styles.imageViewerCloseButton}>
              <Text style={styles.imageViewerCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Enhanced Image Counter */}
          {allImageUrls.length > 1 && (
            <View style={styles.imageIndicator}>
              <Text style={styles.imageIndicatorText}>
                {currentDisplayIndex} / {allImageUrls.length}
              </Text>
            </View>
          )}

          {allImageUrls.length > 0 && (
            <ImageViewer
              imageUrls={allImageUrls}
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
                  {allImageUrls.length > 1 && (
                    <Text style={styles.imageViewerNavigation}>
                      Swipe left/right for ± 2 pages context • Total: {allImageUrls.length} pages
                    </Text>
                  )}
                </View>
              )}
              loadingRender={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF6A00" />
                  <Text style={styles.loadingText}>Loading enhanced view...</Text>
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
    fontSize: 12,
    fontStyle: 'italic',
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