// src/api/apiService.ts
import axios from 'axios';
import { ENV } from '../config/env';

// Base URL for your API
const API_URL = ENV.API_BASE_URL;
const API_KEY = ENV.AI_TUTOR_API_KEY;
const AITUTOR_TOKEN = ENV.AITUTOR_TOKEN;

// For session token authentication
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
};

// Create an axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    // Set the Authorization header with Bearer token
    if (API_KEY) {
      config.headers['Authorization'] = `Bearer ${API_KEY}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API functions
export const generateStory = async (story: string) => {
  try {
    const workflowId = ENV.WORKFLOW_ID;
    const response = await apiClient.post(`/run/${workflowId}`, { story });
    return response.data;
  } catch (error) {
    console.error('Error generating story:', error);
    throw error;
  }
};

export const getChatToken = async () => {
  try {
    const response = await apiClient.post('/chat/token', {
      chatbotId: ENV.CHATBOT_ID,
      sessionId: "user_session_" + Date.now()
    });
    return response.data;
  } catch (error) {
    console.error('Error getting chat token:', error);
    throw error;
  }
};

// New function for streaming chat
export const streamChat = async (messages: any[]) => {
  try {
    const controller = new AbortController();
    const signal = controller.signal;

    const response = await fetch(
      `https://aitutor-api.vercel.app/api/v1/chat/${AITUTOR_TOKEN}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ messages }),
        signal,
      }
    );

    return { response, controller };
  } catch (error) {
    console.error('Error in streaming chat:', error);
    throw error;
  }
};
