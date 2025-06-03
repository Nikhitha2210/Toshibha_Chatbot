import React from 'react';

import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PromptProvider } from './src/context/PromptContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ChatProvider } from './src/context/ChatContext';

import Navigation from './src/navigation';

const App = () => {
  return (
    <PromptProvider>
      <ChatProvider>
        <ThemeProvider>
          <GestureHandlerRootView style={styles.rootView}>
            <Navigation />
          </GestureHandlerRootView>
        </ThemeProvider>
      </ChatProvider>
    </PromptProvider>
  );
};

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
});

export default App;