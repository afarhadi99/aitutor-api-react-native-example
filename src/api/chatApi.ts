// src/api/chatApi.ts
import { ENV } from '../config/env';

// Create a custom API handler for the streaming endpoint
export const createChatApiHandler = () => {
  return async (messages: any) => {
    const token = ENV.AITUTOR_TOKEN;
    
    try {
      const response = await fetch(
        `https://aitutor-api.vercel.app/api/v1/chat/${token}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ENV.AI_TUTOR_API_KEY}`,
          },
          body: JSON.stringify({ messages }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Return the raw response for the useChat hook to process
      return response;
    } catch (error) {
      console.error('Streaming API Error:', error);
      throw error;
    }
  };
};
