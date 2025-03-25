// src/config/env.ts
import { Platform } from 'react-native';
import {
  API_BASE_URL,
  AI_TUTOR_API_KEY,
  WORKFLOW_ID,
  CHATBOT_ID,
  AITUTOR_TOKEN,
  AITUTOR_RAG_KEY,
  RAG_API_URL
} from '@env';

// Fallback values for when .env variables are not available (development only)
const DEV_API_BASE_URL = 'https://aitutor-api.vercel.app/api/v1';
const DEV_AI_TUTOR_API_KEY = '';  // Keep empty in committed code
const DEV_WORKFLOW_ID = '';       // Keep empty in committed code
const DEV_CHATBOT_ID = '';        // Keep empty in committed code
const DEV_AITUTOR_TOKEN = 'cm7cquaij0007zxlmsa21xgmz'; // Public token can be included
const DEV_AITUTOR_RAG_KEY = '';   // Keep empty in committed code
const DEV_RAG_API_URL = 'https://rag-api-llm.up.railway.app';

// Configuration object with proper fallbacks
export const ENV = {
  API_BASE_URL: API_BASE_URL || DEV_API_BASE_URL,
  AI_TUTOR_API_KEY: AI_TUTOR_API_KEY || DEV_AI_TUTOR_API_KEY,
  WORKFLOW_ID: WORKFLOW_ID || DEV_WORKFLOW_ID,
  CHATBOT_ID: CHATBOT_ID || DEV_CHATBOT_ID,
  AITUTOR_TOKEN: AITUTOR_TOKEN || DEV_AITUTOR_TOKEN,
  AITUTOR_RAG_KEY: AITUTOR_RAG_KEY || DEV_AITUTOR_RAG_KEY,
  RAG_API_URL: RAG_API_URL || DEV_RAG_API_URL,
  
  // App Environment
  IS_DEV: __DEV__,
  PLATFORM: Platform.OS,
};

// Validation function to check if required env vars are set
export const validateEnv = (): boolean => {
  const requiredVars: EnvKey[] = [
    'API_BASE_URL',
    'AI_TUTOR_API_KEY',
    'WORKFLOW_ID',
    'CHATBOT_ID',
    'AITUTOR_TOKEN'
  ];
  
  const missingVars = requiredVars.filter(key => !ENV[key]);
  
  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
    return false;
  }
  
  return true;
};

// Make type-safe keys for ENV
type EnvKey = keyof typeof ENV;

// Call validation on import (in dev mode only)
if (__DEV__) {
  validateEnv();
}
