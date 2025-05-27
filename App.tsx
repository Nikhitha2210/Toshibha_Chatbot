import React from 'react';

import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Navigation from './src/navigation';

const App = () => {
  return (
    <>
      <GestureHandlerRootView style={styles.rootView}>
        <Navigation />
      </GestureHandlerRootView>
    </>
  );
};

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
});

export default App;