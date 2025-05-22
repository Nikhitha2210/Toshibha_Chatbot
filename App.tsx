import React from 'react';

import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Navigation from './src/navigation';

const App = () => {
  return (
    <>
      {/* <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" /> */}
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