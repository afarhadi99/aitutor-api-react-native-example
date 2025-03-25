/**
 * AI Tutor App
 * React Native App with AI-powered learning tools
 *
 * @format
 */

import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';

// If you haven't created these files yet, you'll need to create them
import { theme } from './src/styles/theme';
import AppNavigator from './src/navigation';

function App(): React.JSX.Element {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#e9d5ff" 
          translucent={false}
        />
        <AppNavigator />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
