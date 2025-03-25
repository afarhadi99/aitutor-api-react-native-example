import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useTheme } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import homeLogo from '../assets/home-logo.png'; // Adjust the path as needed

// Define the screens in your navigation stack
type RootStackParamList = {
  Home: undefined;
  Workflow: undefined;
  Chatbot: undefined;
  Streaming: undefined;
  StreamingRag: undefined;
};

// Create a typed navigation prop
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const titleRef = useRef<Animatable.View>(null); // Update ref type to Animatable.View

  useEffect(() => {
    // Start a shimmer animation on the title
    const shimmerAnimation = () => {
      if (titleRef.current) {
        titleRef.current.animate(
          { 0: { opacity: 0.8 }, 0.5: { opacity: 1 }, 1: { opacity: 0.8 } },
          2000 // Numeric value for duration
        );
        
        // Loop the animation
        setTimeout(shimmerAnimation, 2000);
      }
    };
    
    shimmerAnimation();
  }, []);

  const navigateTo = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      {/* Background gradient with modern pattern */}
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.backgroundGradient}
      />
      
      {/* Decorative circles */}
      <View style={[styles.decorativeCircle, styles.circle1]} />
      <View style={[styles.decorativeCircle, styles.circle2]} />
      <View style={[styles.decorativeCircle, styles.circle3]} />
      
      {/* App header */}
      <Animatable.View 
        animation="fadeIn" 
        duration={1200} 
        style={styles.header}
      >
          <Animatable.View 
            ref={titleRef}
            style={styles.logoWrapper}
          >
            <Image 
              source={homeLogo} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </Animatable.View>
        
        <Animatable.Text 
          animation="fadeIn" 
          duration={1500}
          delay={300}
          style={styles.subtitle}
        >
          Explore the power of AI in your hands
        </Animatable.Text>
      </Animatable.View>

      {/* Cards container */}
      <Animatable.View 
        animation="fadeIn"
        duration={1000}
        style={styles.cardsContainer}
      >
        {/* Workflow Card */}
        <Animatable.View 
          animation="fadeInUp" 
          duration={800} 
          delay={300}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigateTo('Workflow')}
            style={styles.cardWrapper}
          >
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.iconContainer}>
                <Icon name="code-tags" size={32} color="#8b5cf6" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Workflow</Text>
                <Text style={styles.cardDescription}>
                  Generate AI responses from variable inputs
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#8b5cf6" style={styles.arrowIcon} />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Chatbot Card */}
        <Animatable.View 
          animation="fadeInUp" 
          duration={800} 
          delay={500}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigateTo('Chatbot')}
            style={styles.cardWrapper}
          >
            <LinearGradient
              colors={['rgba(236, 72, 153, 0.1)', 'rgba(236, 72, 153, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Icon name="robot" size={32} color="#ec4899" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Chatbot</Text>
                <Text style={styles.cardDescription}>
                  Interact with an embedded chatbot
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ec4899" style={styles.arrowIcon} />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Streaming Card */}
        <Animatable.View 
          animation="fadeInUp" 
          duration={800} 
          delay={700}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigateTo('Streaming')}
            style={styles.cardWrapper}
          >
            <LinearGradient
              colors={['rgba(249, 115, 22, 0.1)', 'rgba(249, 115, 22, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                <Icon name="message-processing" size={32} color="#f97316" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Streaming</Text>
                <Text style={styles.cardDescription}>
                  Real-time AI chat with custom UI
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#f97316" style={styles.arrowIcon} />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Streaming with RAG Card */}
        <Animatable.View 
          animation="fadeInUp" 
          duration={800} 
          delay={700}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigateTo('StreamingRag')}
            style={styles.cardWrapper}
          >
            <LinearGradient
              colors={['rgba(22, 249, 52, 0.1)', 'rgba(41, 249, 22, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(22, 249, 33, 0.15)' }]}>
                <Icon name="file" size={32} color="#16f921" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Streaming with RAG</Text>
                <Text style={styles.cardDescription}>
                  Use streaming chat and RAG document retrieval with AI Tutor API 
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#16f921" style={styles.arrowIcon} />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </Animatable.View>

      {/* Footer with version info */}
      <Animatable.View 
        animation="fadeIn"
        duration={1000}
        delay={1000}
        style={styles.footer}
      >
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 300,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    top: 100,
    left: -100,
  },
  circle3: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    bottom: -100,
    right: -50,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center', // Center the image horizontally
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 200, // Adjust based on your image's aspect ratio
    height: 50, // Adjust based on your image's aspect ratio
  },
  subtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardWrapper: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    height: '100%',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
});

export default HomeScreen;