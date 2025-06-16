import React from 'react';

import { Text, View } from 'react-native';
import { TapGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import styles from './HomeContent.styles';

import Header from '../header';
import PromptCards from '../PromptCards';
import RecentQueries from '../RecentQueries';
import PromptInput from '../PromptInput';

interface HomeContentProps {
  onActivated: () => void;
  openMenu: () => void;
  overlayAnimatedStyle: any;
}

const HomeContent: React.FC<HomeContentProps> = ({ onActivated, openMenu, overlayAnimatedStyle }) => {
  return (
    <TapGestureHandler maxDelayMs={250} numberOfTaps={1} onActivated={onActivated}>
      <Animated.View style={styles.mainWrapper}>
        <Animated.View style={[styles.mainWrapperOverlay, overlayAnimatedStyle]} />
        <View style={styles.mainContent}>
          <Header onMenuPress={openMenu} />

          <View style={styles.centerContainer}>
            <Text style={styles.headerText}>What can I help with?</Text>
            <Text style={styles.headerSubText}>Use one of most common prompts{'\n'}below to begin</Text>
            <View style={styles.queriesContainer}>
              <PromptCards />
              <RecentQueries />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <PromptInput clearOnSend={true} />
          </View>
        </View>
      </Animated.View>
    </TapGestureHandler>
  );
};

export default HomeContent;