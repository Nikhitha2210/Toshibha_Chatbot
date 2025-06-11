import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from './src/context/AuthContext';
import { PromptProvider } from './src/context/PromptContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ChatProvider } from './src/context/ChatContext';

import Navigation from './src/navigation';

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ChatProvider>
          <PromptProvider>
            <GestureHandlerRootView style={styles.rootView}>
              <Navigation />
            </GestureHandlerRootView>
          </PromptProvider>
        </ChatProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
});

export default App;