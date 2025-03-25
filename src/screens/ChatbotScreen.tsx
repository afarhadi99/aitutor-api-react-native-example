import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Card, Paragraph, Button, Title, useTheme } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getChatToken, setAuthToken } from '../api/apiService';
import LottieView from 'lottie-react-native';

// WebView is needed to embed the chatbot iframe
import { WebView } from 'react-native-webview';

// Define the type for the WebView error event
interface WebViewErrorEvent {
  nativeEvent: {
    description: string;
    code: number;
    url: string;
  };
}

const ChatbotScreen = () => {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const theme = useTheme();
  const lottieRef = React.useRef<LottieView>(null);

  useEffect(() => {
    // Get a token when the component mounts
    fetchToken();
  }, []);

  useEffect(() => {
    if (loading && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [loading]);

  const fetchToken = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getChatToken();
      if (response && response.token) {
        setToken(response.token);
        setAuthToken(response.token);
      } else {
        setError('Failed to get token');
      }
    } catch (err) {
      setError('Error fetching token');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // HTML content for embedding the chatbot
  const chatbotHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            overflow: hidden;
            background-color: #0f172a;
          }
          iframe {
            height: 100%;
            width: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe 
          src="https://aitutor-api.vercel.app/embed/chatbot/cm6w0fkel0001vfbweh9y6j1a"
          width="100%" 
          height="100%"
          allow="microphone"
        ></iframe>
      </body>
    </html>
  `;

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      <View style={styles.webviewContainer}>
        <WebView
          source={{ html: chatbotHTML }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <LottieView
                ref={lottieRef}
                source={require('../assets/animations/loading.json')}
                style={styles.lottieAnimation}
                autoPlay
                loop
              />
              <Text style={styles.loadingText}>Loading chatbot...</Text>
            </View>
          )}
          onError={(syntheticEvent: WebViewErrorEvent) => {
            const { nativeEvent } = syntheticEvent;
            setError(`WebView error: ${nativeEvent.description}`);
          }}
        />
      </View>

      {error ? (
        <Animatable.View 
          animation="fadeIn" 
          duration={500}
          style={styles.errorContainer}
        >
          <Card style={styles.errorCard}>
            <Card.Content>
              <Paragraph style={styles.errorText}>{error}</Paragraph>
              <Button 
                mode="contained" 
                onPress={fetchToken} 
                style={styles.retryButton}
                color="#8b5cf6"
              >
                Retry
              </Button>
            </Card.Content>
          </Card>
        </Animatable.View>
      ) : null}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webviewContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: 'white',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  errorCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 10,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#8b5cf6',
  },
});

export default ChatbotScreen;
