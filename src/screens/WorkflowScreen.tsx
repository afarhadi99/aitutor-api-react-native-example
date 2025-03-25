import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  Text,
  FlatList,
  StatusBar
} from 'react-native';
import { TextInput, Button, IconButton, useTheme, Divider } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Markdown from 'react-native-markdown-display';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import { generateStory } from '../api/apiService';

// Define an interface for the story result
interface StoryResult {
  result: string;
  success?: boolean;
}

// Define an interface for saved stories
interface SavedStory {
  id: string;
  prompt: string;
  result: StoryResult;
  timestamp: number;
}

const { width, height } = Dimensions.get('window');

const WorkflowScreen = () => {
  const [story, setStory] = useState('');
  const [result, setResult] = useState<StoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isResultSaved, setIsResultSaved] = useState(false);
  const [isLoadedFromHistory, setIsLoadedFromHistory] = useState(false);
  const theme = useTheme();
  
  // Animation values
  const drawerAnimation = useRef(new Animated.Value(0)).current;
  const mainContentAnimation = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);
  
  // Load saved stories when component mounts
  useEffect(() => {
    loadSavedStories();
  }, []);
  
  // Play lottie animation when loading
  useEffect(() => {
    if (loading && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [loading]);
  
  // Reset saved status when story input changes
  useEffect(() => {
    if (story !== '') {
      setIsResultSaved(false);
    }
  }, [story]);
  
  // Auto-save story when result is received
  useEffect(() => {
    // Only save if result exists, isn't already saved, and wasn't loaded from history
    if (result && !isResultSaved && !isLoadedFromHistory) {
      saveStory();
    }
  }, [result, isResultSaved, isLoadedFromHistory]);
  
  // Load saved stories from AsyncStorage
  const loadSavedStories = async () => {
    try {
      const savedStoriesJson = await AsyncStorage.getItem('@saved_stories');
      if (savedStoriesJson) {
        const stories = JSON.parse(savedStoriesJson) as SavedStory[];
        setSavedStories(stories.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (err) {
      console.error('Failed to load saved stories', err);
    }
  };
  
  // Save a story to AsyncStorage
  const saveStory = async () => {
    if (!result) return;
    
    try {
      const newStory: SavedStory = {
        id: Date.now().toString(),
        prompt: story,
        result,
        timestamp: Date.now()
      };
      
      const updatedStories = [newStory, ...savedStories];
      await AsyncStorage.setItem('@saved_stories', JSON.stringify(updatedStories));
      setSavedStories(updatedStories);
      setIsResultSaved(true);
      
      // Show animation feedback
      if (lottieRef.current) {
        lottieRef.current.play(0, 50);
      }
    } catch (err) {
      console.error('Failed to save story', err);
    }
  };
  
  // Delete a story from AsyncStorage
  const deleteStory = async (id: string) => {
    try {
      const updatedStories = savedStories.filter(story => story.id !== id);
      await AsyncStorage.setItem('@saved_stories', JSON.stringify(updatedStories));
      setSavedStories(updatedStories);
    } catch (err) {
      console.error('Failed to delete story', err);
    }
  };
  
  // Load a saved story
  const loadStory = (savedStory: SavedStory) => {
    setStory(savedStory.prompt);
    setResult(savedStory.result);
    setIsResultSaved(true); // Mark as saved since it's from history
    setIsLoadedFromHistory(true); // Mark that this was loaded from history
    toggleHistory(); // Close the history drawer
  };
  
  // Toggle history drawer
  const toggleHistory = () => {
    const toValue = isHistoryOpen ? 0 : 1;
    
    Animated.parallel([
      Animated.timing(drawerAnimation, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(mainContentAnimation, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start();
    
    setIsHistoryOpen(!isHistoryOpen);
  };
  
  // Generate a story
  const handleSubmit = async () => {
    if (!story.trim()) {
      setError('Please enter a story prompt');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);
    setIsResultSaved(false);
    setIsLoadedFromHistory(false); // Reset this flag when generating a new story

    try {
      const response = await generateStory(story);
      setResult(response);
      // Auto-save will be triggered by useEffect
    } catch (err) {
      setError('An error occurred while fetching the story.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Calculate styles for animations
  const drawerStyle = {
    transform: [
      {
        translateX: drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-width * 0.8, 0],
        }),
      },
    ],
  };
  
  const mainContentStyle = {
    transform: [
      {
        translateX: mainContentAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, width * 0.8],
        }),
      },
    ],
  };
  
  const overlayOpacity = mainContentAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Main Content */}
      <Animated.View style={[styles.mainContent, mainContentStyle]}>
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#334155']}
          style={styles.backgroundGradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.historyButton} 
                onPress={toggleHistory}
              >
                <Icon name="history" size={24} color="white" />
              </TouchableOpacity>
              
              <Animatable.Text 
                animation="fadeIn" 
                style={styles.headerTitle}
              >
                AI Story Generator
              </Animatable.Text>
              
              <View style={styles.headerRight}>
                {/* Removed save button since we're auto-saving */}
                <View style={styles.placeholderButton} />
              </View>
            </View>
            
            {/* Input Card */}
            <Animatable.View 
              animation="fadeInUp" 
              duration={800}
              style={styles.inputContainer}
            >
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
                style={styles.inputGradient}
              >
                <Text style={styles.inputLabel}>Enter your prompt</Text>
                <TextInput
                  value={story}
                  onChangeText={(text) => {
                    setStory(text);
                    if (isLoadedFromHistory && text !== story) {
                      setIsLoadedFromHistory(false); // If user edits a loaded story, treat it as new
                    }
                  }}
                  mode="flat"
                  multiline
                  numberOfLines={4}
                  placeholder="E.g., Tell me a story about a magical forest..."
                  style={[styles.input,]} // Force white color directly in the style prop
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  textColor='white'
                />
                
                {error ? (
                  <Animatable.Text 
                    animation="shake" 
                    style={styles.errorText}
                  >
                    {error}
                  </Animatable.Text>
                ) : null}
                
                <TouchableOpacity
                  style={[
                    styles.generateButton,
                    loading && styles.generateButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#7c3aed']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.generateButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Icon name="auto-fix" size={20} color="white" style={styles.buttonIcon} />
                        <Text style={styles.generateButtonText}>Generate Story</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animatable.View>

            {/* Loading Animation */}
            {loading && (
              <Animatable.View 
                animation="fadeIn"
                style={styles.loadingContainer}
              >
                <LottieView
                  ref={lottieRef}
                  source={require('../assets/animations/loading.json')}
                  style={styles.lottieAnimation}
                  autoPlay
                  loop
                />
                <Text style={styles.loadingText}>
                  Crafting your story...
                </Text>
              </Animatable.View>
            )}

            {/* Result Card */}
            {result && !loading && (
              <Animatable.View 
                animation="fadeInUp" 
                duration={800}
                style={styles.resultContainer}
              >
                <LinearGradient
                  colors={['rgba(236, 72, 153, 0.1)', 'rgba(236, 72, 153, 0.05)']}
                  style={styles.resultGradient}
                >
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>Your Story</Text>
                    {isResultSaved && (
                      <Icon name="check-circle" size={20} color="#10b981" />
                    )}
                  </View>
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.markdownContainer}>
                    <Markdown
                      style={{
                        body: { color: '#e2e8f0' },
                        heading1: { color: '#f9a8d4' },
                        heading2: { color: '#f9a8d4' },
                        heading3: { color: '#f9a8d4' },
                        heading4: { color: '#f9a8d4' },
                        heading5: { color: '#f9a8d4' },
                        heading6: { color: '#f9a8d4' },
                        hr: { backgroundColor: '#475569' },
                        strong: { color: '#f9a8d4' },
                        em: { color: '#f9a8d4' },
                        blockquote: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: '#ec4899' },
                        code_block: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#e2e8f0' },
                        code_inline: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#e2e8f0' },
                        list_item: { color: '#e2e8f0' },
                        paragraph: { color: '#e2e8f0', marginBottom: 10 }
                      }}
                    >
                      {result.result}
                    </Markdown>
                  </View>
                </LinearGradient>
              </Animatable.View>
            )}
          </ScrollView>
        </LinearGradient>
        
        {/* Overlay when drawer is open */}
        {isHistoryOpen && (
          <Animated.View 
            style={[styles.overlay, { opacity: overlayOpacity }]}
            onTouchStart={toggleHistory}
          />
        )}
      </Animated.View>
      
      {/* History Drawer */}
      <Animated.View style={[styles.historyDrawer, drawerStyle]}>
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          style={styles.historyGradient}
        >
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Story History</Text>
            <TouchableOpacity onPress={toggleHistory}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <Divider style={styles.divider} />
          
          {savedStories.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <Icon name="book-open-variant" size={64} color="rgba(255, 255, 255, 0.2)" />
              <Text style={styles.emptyHistoryText}>No saved stories yet</Text>
              <Text style={styles.emptyHistorySubtext}>
                Your saved stories will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={savedStories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Animatable.View
                  animation="fadeIn"
                  duration={500}
                  style={styles.historyItem}
                >
                  <TouchableOpacity 
                    style={styles.historyItemContent}
                    onPress={() => loadStory(item)}
                  >
                    <View style={styles.historyItemHeader}>
                      <Text style={styles.historyItemDate}>
                        {formatDate(item.timestamp)}
                      </Text>
                      <TouchableOpacity onPress={() => deleteStory(item.id)}>
                        <Icon name="delete-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.historyItemPrompt} numberOfLines={2}>
                      {item.prompt}
                    </Text>
                    
                    <Text style={styles.historyItemPreview} numberOfLines={3}>
                      {item.result.result.substring(0, 100)}...
                    </Text>
                  </TouchableOpacity>
                </Animatable.View>
              )}
              ItemSeparatorComponent={() => <Divider style={styles.historyDivider} />}
              contentContainerStyle={styles.historyList}
            />
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  historyButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  saveButton: {
    padding: 8,
  },
  placeholderButton: {
    width: 40,
  },
  inputContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputGradient: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
    minHeight: 120,
    fontSize: 16, // Adding font size for better readability
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
  },
  generateButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
  loadingText: {
    color: '#e2e8f0',
    fontSize: 16,
    marginTop: 10,
  },
  resultContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultGradient: {
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  markdownContainer: {
    // Changed from ScrollView to View to show full content
    paddingBottom: 20,
  },
  historyDrawer: {
    position: 'absolute',
    width: width * 0.8,
    height: '100%',
    left: 0,
    top: 0,
    zIndex: 10,
  },
  historyGradient: {
    flex: 1,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  historyList: {
    paddingBottom: 20,
  },
  emptyHistoryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
  },
  emptyHistoryText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyHistorySubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  historyItem: {
    marginVertical: 8,
  },
  historyItemContent: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  historyItemPrompt: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  historyItemPreview: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  historyDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: 1,
    marginVertical: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
});

export default WorkflowScreen;
