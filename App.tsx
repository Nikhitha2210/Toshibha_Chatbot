import React from 'react';

import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PromptProvider } from './src/context/PromptContext';

import Navigation from './src/navigation';

const App = () => {
  return (
    <PromptProvider>
      <GestureHandlerRootView style={styles.rootView}>
        <Navigation />
      </GestureHandlerRootView>
    </PromptProvider>
  );
};

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
});

export default App;