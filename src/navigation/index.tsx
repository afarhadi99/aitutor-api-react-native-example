// src/navigation/index.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

import WorkflowScreen from '../screens/WorkflowScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import HomeScreen from '../screens/HomeScreen';
import StreamingScreen from '../screens/StreamingScreen';
// Import with explicit type annotation
import StreamingRagScreen from '../screens/StreamingRagScreen';

// Define your stack parameter list
type RootStackParamList = {
  Home: undefined;
  Workflow: undefined;
  Chatbot: undefined;
  Streaming: undefined;
  StreamingRag: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6d28d9', // Purple color
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'AI Tutor API Example' }} 
        />
        <Stack.Screen 
          name="Workflow" 
          component={WorkflowScreen} 
          options={{ title: 'Workflow' }} 
        />
        <Stack.Screen 
          name="Chatbot" 
          component={ChatbotScreen} 
          options={{ title: 'Embed Chatbot' }} 
        />
        <Stack.Screen 
          name="Streaming" 
          component={StreamingScreen} 
          options={{ title: 'Streaming Chat' }} 
        />
    <Stack.Screen 
      name="StreamingRag" 
      component={StreamingRagScreen} 
      options={{ title: 'Streaming with RAG' }} 
    />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
