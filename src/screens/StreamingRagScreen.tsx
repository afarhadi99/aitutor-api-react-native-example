// src/screens/StreamingRagScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';
import * as Animatable from 'react-native-animatable';
import { Divider } from 'react-native-paper';
import { pick } from '@react-native-documents/picker';
import Markdown from 'react-native-markdown-display';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface TokenResponse {
  success: boolean;
  token: string;
  expires_in: number;
  error?: { message: string; code: string };
}

interface UploadedFile {
  fileId: string;
  fileName: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  token?: string;
  tokenExpiry?: number;
  attachedFileIds: string[];
}

const { width } = Dimensions.get('window');

const STORAGE_KEY = '@streamingrag_chats';
const CURRENT_CHAT_KEY = '@current_streamingrag_chat';
const UPLOADED_FILES_KEY = '@uploaded_files';

const StreamingRagScreen = () => {
  // State for chat functionality
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // State for chat and file history
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isFileModalVisible, setIsFileModalVisible] = useState(false);

  // State for token management
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // State for header height
  const [headerHeight, setHeaderHeight] = useState(0);

  // Animation values
  const slideAnimation = useRef(new Animated.Value(-width)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const fileSlideAnimation = useRef(new Animated.Value(width)).current;
  const fileFadeAnimation = useRef(new Animated.Value(0)).current;

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const historyListRef = useRef<FlatList>(null);

  // Load data on mount
  useEffect(() => {
    loadChats();
    loadUploadedFiles();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && (messages.length > 0 || streamingContent)) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, streamingContent]);

  // Generate a new token
  const generateToken = async (): Promise<string> => {
    try {
      if (currentChatId) {
        const chatIndex = chats.findIndex((chat) => chat.id === currentChatId);
        if (chatIndex !== -1) {
          const chat = chats[chatIndex];
          if (chat.token && chat.tokenExpiry && chat.tokenExpiry > Date.now()) {
            setCurrentToken(chat.token);
            return chat.token;
          }
        }
      }
      const response = await fetch('https://aitutor-api.vercel.app/api/v1/chat/token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENV.AI_TUTOR_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId: ENV.CHATBOT_ID,
          sessionId: `session_${Date.now()}`,
        }),
      });
      const data: TokenResponse = await response.json();
      if (!data.success || !data.token) throw new Error(data.error?.message || 'Failed to generate token');
      const expiryTime = Date.now() + (data.expires_in - 5) * 1000;
      if (currentChatId) {
        const chatIndex = chats.findIndex((chat) => chat.id === currentChatId);
        if (chatIndex !== -1) {
          const updatedChats = [...chats];
          updatedChats[chatIndex] = { ...updatedChats[chatIndex], token: data.token, tokenExpiry: expiryTime };
          setChats(updatedChats);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChats));
        }
      }
      setCurrentToken(data.token);
      return data.token;
    } catch (error) {
      console.error('Error generating token:', error);
      return ENV.AITUTOR_TOKEN;
    }
  };

  // Load chats
  const loadChats = async () => {
    try {
      const storedChats = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedChats: Chat[] = storedChats
        ? JSON.parse(storedChats).map((chat: Chat) => ({
            ...chat,
            attachedFileIds: chat.attachedFileIds || [],
          }))
        : [];
      setChats(parsedChats.sort((a, b) => b.updatedAt - a.updatedAt));
      const currentId = await AsyncStorage.getItem(CURRENT_CHAT_KEY);
      if (currentId && parsedChats.some((chat) => chat.id === currentId)) {
        setCurrentChatId(currentId);
        const currentChat = parsedChats.find((chat) => chat.id === currentId);
        if (currentChat) {
          setMessages(currentChat.messages);
          if (currentChat.token && currentChat.tokenExpiry && currentChat.tokenExpiry > Date.now()) {
            setCurrentToken(currentChat.token);
          } else {
            generateToken();
          }
        }
      } else if (parsedChats.length > 0) {
        setCurrentChatId(parsedChats[0].id);
        setMessages(parsedChats[0].messages);
        await AsyncStorage.setItem(CURRENT_CHAT_KEY, parsedChats[0].id);
        if (parsedChats[0].token && parsedChats[0].tokenExpiry && parsedChats[0].tokenExpiry > Date.now()) {
          setCurrentToken(parsedChats[0].token);
        } else {
          generateToken();
        }
      } else {
        createNewChat();
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      createNewChat();
    }
  };

  // Load uploaded files
  const loadUploadedFiles = async () => {
    try {
      const storedFiles = await AsyncStorage.getItem(UPLOADED_FILES_KEY);
      if (storedFiles) setUploadedFiles(JSON.parse(storedFiles));
    } catch (error) {
      console.error('Error loading uploaded files:', error);
    }
  };

  // Save current chat with partial updates
  const saveCurrentChat = async (updates: Partial<Chat>) => {
    try {
      const chatIndex = chats.findIndex((chat) => chat.id === currentChatId);
      if (chatIndex === -1) return;
      const updatedChat = { ...chats[chatIndex], ...updates, updatedAt: Date.now() };
      const updatedChats = [...chats];
      updatedChats[chatIndex] = updatedChat;
      setChats(updatedChats.sort((a, b) => b.updatedAt - a.updatedAt));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  // Create a new chat
  const createNewChat = async (title: string = 'New Chat') => {
    try {
      const token = await generateToken();
      const newChat: Chat = {
        id: Date.now().toString(),
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        token,
        tokenExpiry: Date.now() + 55 * 1000,
        attachedFileIds: [],
      };
      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      setCurrentChatId(newChat.id);
      setMessages([]);
      setCurrentToken(token);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChats));
      await AsyncStorage.setItem(CURRENT_CHAT_KEY, newChat.id);
      if (isHistoryVisible) toggleHistory();
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  // Delete a chat with confirmation
  const deleteChat = async (chatId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedChats = chats.filter((chat) => chat.id !== chatId);
              setChats(updatedChats);
              if (chatId === currentChatId) {
                if (updatedChats.length > 0) {
                  setCurrentChatId(updatedChats[0].id);
                  setMessages(updatedChats[0].messages);
                  if (updatedChats[0].token && updatedChats[0].tokenExpiry && updatedChats[0].tokenExpiry > Date.now()) {
                    setCurrentToken(updatedChats[0].token);
                  } else {
                    generateToken();
                  }
                  await AsyncStorage.setItem(CURRENT_CHAT_KEY, updatedChats[0].id);
                } else {
                  createNewChat();
                }
              }
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChats));
            } catch (error) {
              console.error('Error deleting chat:', error);
            }
          },
        },
      ],
    );
  };

  // Load a specific chat
  const loadChat = async (chatId: string) => {
    try {
      const chat = chats.find((c) => c.id === chatId);
      if (!chat) return;
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      if (chat.token && chat.tokenExpiry && chat.tokenExpiry > Date.now()) {
        setCurrentToken(chat.token);
      } else {
        generateToken();
      }
      await AsyncStorage.setItem(CURRENT_CHAT_KEY, chatId);
      if (isHistoryVisible) toggleHistory();
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  // Rename a chat
  const renameChat = async (chatId: string, newTitle: string) => {
    try {
      const chatIndex = chats.findIndex((chat) => chat.id === chatId);
      if (chatIndex === -1) return;
      const updatedChats = [...chats];
      updatedChats[chatIndex] = { ...updatedChats[chatIndex], title: newTitle };
      setChats(updatedChats);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  // Toggle history drawer
  const toggleHistory = () => {
    if (isHistoryVisible) {
      Animated.parallel([
        Animated.timing(slideAnimation, { toValue: -width, duration: 300, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(fadeAnimation, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setIsHistoryVisible(false));
    } else {
      setIsHistoryVisible(true);
      Animated.parallel([
        Animated.timing(slideAnimation, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(fadeAnimation, { toValue: 0.5, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  };

  // Toggle file modal
  const toggleFileModal = () => {
    if (isFileModalVisible) {
      Animated.parallel([
        Animated.timing(fileSlideAnimation, { toValue: width, duration: 300, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(fileFadeAnimation, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setIsFileModalVisible(false));
    } else {
      setIsFileModalVisible(true);
      Animated.parallel([
        Animated.timing(fileSlideAnimation, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(fileFadeAnimation, { toValue: 0.5, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  };

  // Upload a file
  const uploadFile = async (pickedFile: any) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: pickedFile.uri,
        name: pickedFile.name,
        type: pickedFile.type || 'application/octet-stream',
      });
      const response = await fetch(`${ENV.RAG_API_URL}/upload_file`, {
        method: 'POST',
        headers: { 'Authorization': ENV.AITUTOR_RAG_KEY },
        body: formData,
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error.message);
      return { fileId: data.file_id, fileName: pickedFile.name };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Handle file upload
  const handleUploadFile = async () => {
    try {
      const [pickedFile] = await pick({ type: ['application/pdf', 'text/plain'] });
      const uploadedFile = await uploadFile(pickedFile);
      const newUploadedFiles = [...uploadedFiles, uploadedFile];
      setUploadedFiles(newUploadedFiles);
      await AsyncStorage.setItem(UPLOADED_FILES_KEY, JSON.stringify(newUploadedFiles));
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Delete a file with confirmation
  const deleteFile = async (fileId: string) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file? It will be removed from all chats.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedFiles = uploadedFiles.filter((file) => file.fileId !== fileId);
              setUploadedFiles(updatedFiles);
              await AsyncStorage.setItem(UPLOADED_FILES_KEY, JSON.stringify(updatedFiles));
              const updatedChats = chats.map((chat) => ({
                ...chat,
                attachedFileIds: chat.attachedFileIds.filter((id) => id !== fileId),
              }));
              setChats(updatedChats);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChats));
            } catch (error) {
              console.error('Error deleting file:', error);
            }
          },
        },
      ],
    );
  };

  // Search RAG API
  const searchRAG = async (query: string, fileIds: string[]) => {
    try {
      const response = await fetch(`${ENV.RAG_API_URL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ENV.AITUTOR_RAG_KEY,
        },
        body: JSON.stringify({ query, file_ids: fileIds, k: 5 }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error.message);
      return data.documents;
    } catch (error) {
      console.error('Error searching RAG:', error);
      throw error;
    }
  };

  // Toggle file attachment
  const toggleFileAttachment = (fileId: string) => {
    if (!currentChatId) return;
    const chat = chats.find((chat) => chat.id === currentChatId);
    if (!chat) return;
    const attachedFileIds = chat.attachedFileIds || [];
    const newAttachedFileIds = attachedFileIds.includes(fileId)
      ? attachedFileIds.filter((id) => id !== fileId)
      : [...attachedFileIds, fileId];
    saveCurrentChat({ attachedFileIds: newAttachedFileIds });
  };

  // Extract streaming content
  const extractStreamContent = (text: string): string => {
    if (!text) return '';
    const matches = text.match(/0:"([^"]*)"/g) || [];
    let content = matches.map((match) => match.match(/0:"([^"]*)"/)![1]).join('');
    return content.replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/\\t/g, '    ').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  };

  // Generate chat title from first message
  const generateChatTitle = (content: string): string => {
    const trimmed = content.trim();
    if (!trimmed) return 'Untitled Chat';
    const words = trimmed.split(/\s+/);
    const titleWords = words.slice(0, 3);
    let title = titleWords.join(' ');
    if (words.length > 3) title += '...';
    return title;
  };

  // Handle sending a message with automatic title generation
  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: Date.now() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    const currentChat = chats.find((chat) => chat.id === currentChatId);
    if (currentChat) {
      await saveCurrentChat({ messages: updatedMessages });
    }
    let token = currentToken || (await generateToken());
    let apiMessages = updatedMessages.map((msg) => ({ role: msg.role, content: msg.content }));
    const attachedFileIds = currentChat?.attachedFileIds || [];
    if (attachedFileIds.length > 0) {
      try {
        const documents = await searchRAG(input, attachedFileIds);
        const context = documents.map((doc: any) => doc.content).join('\n\n');
        const enhancedPrompt = `Answer the query based on the following document content:\n\n${context}\n\nQuery: ${input}`;
        apiMessages[apiMessages.length - 1].content = enhancedPrompt;
      } catch (error) {
        console.error('Error in RAG search:', error);
      }
    }
    const xhr = new XMLHttpRequest();
    let responseText = '';
    xhr.open('POST', `https://aitutor-api.vercel.app/api/v1/chat/${token}/stream`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${ENV.AI_TUTOR_API_KEY}`);
    xhr.onprogress = () => {
      try {
        responseText = xhr.responseText;
        setStreamingContent(extractStreamContent(responseText));
      } catch (error) {
        console.error('Error processing streaming content:', error);
      }
    };
    xhr.onload = () => {
      try {
        if (xhr.status === 200) {
          const extractedContent = extractStreamContent(xhr.responseText);
          const assistantMessage: Message = { id: Date.now().toString(), role: 'assistant', content: extractedContent, timestamp: Date.now() };
          const finalMessages = [...updatedMessages, assistantMessage];
          setMessages(finalMessages);
          const assistantMessages = finalMessages.filter(msg => msg.role === 'assistant');
          if (assistantMessages.length === 1) {
            const newTitle = generateChatTitle(assistantMessages[0].content);
            saveCurrentChat({ messages: finalMessages, title: newTitle });
          } else {
            saveCurrentChat({ messages: finalMessages });
          }
        } else {
          console.error('Error in chat: Status', xhr.status);
          const errorMessage: Message = { id: Date.now().toString(), role: 'assistant', content: 'Sorry, an error occurred. Please try again.', timestamp: Date.now() };
          const finalMessages = [...updatedMessages, errorMessage];
          setMessages(finalMessages);
          saveCurrentChat({ messages: finalMessages });
          if (xhr.status === 401) generateToken();
        }
      } catch (error) {
        console.error('Error in onload:', error);
        const errorMessage: Message = { id: Date.now().toString(), role: 'assistant', content: 'Sorry, an error occurred while processing the response.', timestamp: Date.now() };
        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);
        saveCurrentChat({ messages: finalMessages });
        generateToken();
      } finally {
        setIsLoading(false);
        setStreamingContent('');
      }
    };
    xhr.onerror = () => {
      console.error('Error in chat: Network error');
      const errorMessage: Message = { id: Date.now().toString(), role: 'assistant', content: 'Sorry, a network error occurred. Please check your connection and try again.', timestamp: Date.now() };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveCurrentChat({ messages: finalMessages });
      generateToken();
      setIsLoading(false);
      setStreamingContent('');
    };
    try {
      xhr.send(JSON.stringify({ messages: apiMessages }));
    } catch (error) {
      console.error('Error sending request:', error);
      setIsLoading(false);
      setStreamingContent('');
      const errorMessage: Message = { id: Date.now().toString(), role: 'assistant', content: 'Sorry, an error occurred while sending your message.', timestamp: Date.now() };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveCurrentChat({ messages: finalMessages });
      generateToken();
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (date.getFullYear() === now.getFullYear()) return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get current chat title
  const getCurrentChatTitle = () => {
    if (!currentChatId) return 'New Chat';
    const currentChat = chats.find((chat) => chat.id === currentChatId);
    return currentChat ? currentChat.title : 'New Chat';
  };

  // Get file icon based on extension
  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'file';
      case 'txt':
        return 'text';
      default:
        return 'file';
    }
  };

  // Render messages
  const renderMessages = () => {
    const allMessages = [...messages];
    if (streamingContent) allMessages.push({ id: 'streaming', role: 'assistant', content: streamingContent, timestamp: Date.now() });
    return (
      <FlatList
        ref={flatListRef}
        data={allMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Animatable.View
            animation="fadeIn"
            duration={500}
            style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}
          >
            <View style={styles.messageBubbleContent}>
              <View style={styles.messageBubbleHeader}>
                <Text style={styles.messageSender}>{item.role === 'user' ? 'You' : 'AI'}</Text>
                <Text style={styles.messageTime}>{formatDate(item.timestamp)}</Text>
              </View>
              {item.role === 'user' ? (
                <Text style={styles.messageContent}>{item.content}</Text>
              ) : (
                <Markdown style={markdownStyles}>{item.content}</Markdown>
              )}
            </View>
          </Animatable.View>
        )}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Animatable.View animation="pulse" easing="ease-out" iterationCount="infinite">
              <Icon name="message-text-outline" size={64} color="rgba(255, 255, 255, 0.2)" />
            </Animatable.View>
            <Text style={styles.emptyText}>Start a conversation</Text>
            <Text style={styles.emptySubtext}>Type a message or upload files to chat with context</Text>
          </View>
        }
        style={{ flex: 1 }}
      />
    );
  };

  // Render history drawer
  const renderHistoryDrawer = () => {
    if (!isHistoryVisible) return null;
    return (
      <>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnimation }]} onTouchStart={toggleHistory} />
        <Animated.View style={[styles.historyDrawer, { transform: [{ translateX: slideAnimation }] }]}>
          <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.historyContent}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Chat History</Text>
              <TouchableOpacity style={styles.closeButton} onPress={toggleHistory}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.newChatButton} onPress={() => createNewChat()}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.newChatButtonGradient}>
                <Icon name="plus" size={20} color="#fff" style={styles.newChatIcon} />
                <Text style={styles.newChatText}>New Chat</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Divider style={styles.divider} />
            {chats.length === 0 ? (
              <View style={styles.emptyHistoryContainer}>
                <Icon name="chat-outline" size={64} color="rgba(255, 255, 255, 0.2)" />
                <Text style={styles.emptyHistoryText}>No chat history</Text>
                <Text style={styles.emptyHistorySubtext}>Your conversations will appear here</Text>
              </View>
            ) : (
              <FlatList
                ref={historyListRef}
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Animatable.View animation="fadeIn" duration={500}>
                    <TouchableOpacity
                      style={[styles.chatItem, currentChatId === item.id && styles.activeChatItem]}
                      onPress={() => loadChat(item.id)}
                    >
                      <View style={styles.chatItemContent}>
                        <View style={styles.chatItemInfo}>
                          <Text
                            style={[styles.chatItemTitle, currentChatId === item.id && styles.activeChatItemTitle]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.title}
                          </Text>
                          <Text style={styles.chatItemDate}>{formatDate(item.updatedAt)}</Text>
                        </View>
                        <View style={styles.chatItemActions}>
                          <TouchableOpacity
                            style={styles.chatItemAction}
                            onPress={() => renameChat(item.id, `Chat ${Math.floor(Math.random() * 1000)}`)}
                          >
                            <Icon name="pencil" size={18} color="#64748b" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.chatItemAction} onPress={() => deleteChat(item.id)}>
                            <Icon name="delete-outline" size={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {item.messages.length > 0 && (
                        <Text style={styles.chatItemPreview} numberOfLines={1}>
                          {item.messages[item.messages.length - 1].content}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </Animatable.View>
                )}
                contentContainerStyle={styles.chatList}
                ItemSeparatorComponent={() => <View style={styles.chatItemSeparator} />}
              />
            )}
          </LinearGradient>
        </Animated.View>
      </>
    );
  };

  // Render file modal with icons
  const renderFileModal = () => {
    if (!isFileModalVisible) return null;
    const currentChat = chats.find((chat) => chat.id === currentChatId);
    return (
      <>
        <Animated.View style={[styles.backdrop, { opacity: fileFadeAnimation }]} onTouchStart={toggleFileModal} />
        <Animated.View style={[styles.fileModal, { transform: [{ translateX: fileSlideAnimation }] }]}>
          <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.fileModalContent}>
            <View style={styles.fileModalHeader}>
              <Text style={styles.fileModalTitle}>Manage Files</Text>
              <TouchableOpacity onPress={toggleFileModal}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadFile}>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.uploadButtonGradient}>
                <Icon name="upload" size={20} color="#fff" style={styles.uploadIcon} />
                <Text style={styles.uploadText}>Upload File</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Divider style={styles.divider} />
            <FlatList
              data={uploadedFiles}
              keyExtractor={(item) => item.fileId}
              renderItem={({ item }) => {
                const isAttached = currentChat?.attachedFileIds?.includes(item.fileId) || false;
                return (
                  <View style={styles.fileItem}>
                    <TouchableOpacity onPress={() => toggleFileAttachment(item.fileId)} style={styles.fileItemContent}>
                      <LinearGradient
                        colors={isAttached ? ['#10b981', '#059669'] : ['#64748b', '#475569']}
                        style={styles.fileItemGradient}
                      >
                        <Icon name={getFileIcon(item.fileName)} size={24} color="#fff" style={styles.fileIcon} />
                        <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                          {item.fileName}
                        </Text>
                        <Icon
                          name={isAttached ? 'check-circle' : 'circle-outline'}
                          size={24}
                          color={isAttached ? '#fff' : '#e2e8f0'}
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fileDeleteButton} onPress={() => deleteFile(item.fileId)}>
                      <Icon name="delete-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                );
              }}
              contentContainerStyle={styles.fileList}
              ListEmptyComponent={
                <View style={styles.emptyFileContainer}>
                  <Icon name="file-outline" size={64} color="rgba(255, 255, 255, 0.2)" />
                  <Text style={styles.emptyFileText}>No files uploaded</Text>
                  <Text style={styles.emptyFileSubtext}>Upload files to enhance your chat with RAG</Text>
                </View>
              }
            />
          </LinearGradient>
        </Animated.View>
      </>
    );
  };

  return (
    <LinearGradient colors={['#111827', '#1f2937', '#374151']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.chatContainer}
          keyboardVerticalOffset={headerHeight + (Platform.OS === 'ios' ? 0 : 20)}
        >
          {/* Header */}
          <View
            style={styles.header}
            onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          >
            <TouchableOpacity style={styles.headerButton} onPress={toggleHistory}>
              <Icon name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            <Animatable.View animation="fadeIn" duration={500} style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {getCurrentChatTitle()}
              </Text>
            </Animatable.View>
            <TouchableOpacity style={styles.headerButton} onPress={toggleFileModal}>
              <Icon name="paperclip" size={24} color="#fff" />
              {chats.find((chat) => chat.id === currentChatId)?.attachedFileIds?.length ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {chats.find((chat) => chat.id === currentChatId)?.attachedFileIds.length}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => createNewChat()}>
              <Icon name="plus" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          {renderMessages()}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <LinearGradient colors={['#374151', '#4b5563']} style={styles.inputGradient}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Type your message..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                maxLength={1000}
                editable={!isLoading}
              />
              <Animatable.View
                animation={input.trim() && !isLoading ? 'bounceIn' : undefined}
                duration={500}
              >
                <TouchableOpacity
                  style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={!input.trim() || isLoading}
                >
                  <LinearGradient colors={['#2563eb', '#4f46e5']} style={styles.sendButtonGradient}>
                    {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="send" size={20} color="#fff" />}
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>

        {/* Drawers */}
        {renderHistoryDrawer()}
        {renderFileModal()}
      </SafeAreaView>
    </LinearGradient>
  );
};

// Markdown styles
const markdownStyles = {
  body: { color: '#fff', fontSize: 16 },
  heading1: { color: '#fff', fontSize: 24, marginTop: 16, marginBottom: 8 },
  heading2: { color: '#fff', fontSize: 20, marginTop: 16, marginBottom: 8 },
  heading3: { color: '#fff', fontSize: 18, marginTop: 16, marginBottom: 8 },
  paragraph: { marginTop: 8, marginBottom: 8 },
  list_item: { marginTop: 4 },
  code_inline: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 2, borderRadius: 4 },
  code_block: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 8, borderRadius: 4 },
  fence: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 8, borderRadius: 4 },
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  chatContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ec4899',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  messageList: { padding: 16, paddingBottom: 16, flexGrow: 1 },
  messageBubble: {
    marginBottom: 12,
    maxWidth: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#2563eb' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#4b5563' },
  messageBubbleContent: { padding: 12 },
  messageBubbleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  messageSender: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  messageTime: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginLeft: 8 },
  messageContent: { fontSize: 16, color: '#fff', lineHeight: 22 },
  inputContainer: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  inputGradient: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8 },
  input: { flex: 1, color: '#fff', fontSize: 16, maxHeight: 100, minHeight: 40 },
  sendButton: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', marginLeft: 8 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black', zIndex: 10 },
  historyDrawer: { position: 'absolute', top: 0, left: 0, width: width * 0.8, height: '100%', zIndex: 20 },
  historyContent: { flex: 1, padding: 16 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  historyTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  closeButton: { padding: 4 },
  newChatButton: { marginBottom: 16, borderRadius: 8, overflow: 'hidden' },
  newChatButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  newChatIcon: { marginRight: 8 },
  newChatText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  divider: { backgroundColor: 'rgba(255, 255, 255, 0.1)', height: 1, marginBottom: 16 },
  chatList: { flexGrow: 1 },
  chatItem: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: 12, marginBottom: 8 },
  activeChatItem: { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderLeftWidth: 3, borderLeftColor: '#8b5cf6' },
  chatItemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chatItemInfo: { flex: 1, marginRight: 8 },
  chatItemTitle: { fontSize: 16, fontWeight: '500', color: '#fff', marginBottom: 4 },
  activeChatItemTitle: { color: '#c4b5fd', fontWeight: 'bold' },
  chatItemDate: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' },
  chatItemPreview: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginTop: 8 },
  chatItemActions: { flexDirection: 'row' },
  chatItemAction: { padding: 4, marginLeft: 4 },
  chatItemSeparator: { height: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtext: { color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', paddingHorizontal: 20 },
  emptyHistoryContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyHistoryText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptyHistorySubtext: { color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', maxWidth: '80%' },
  fileModal: { position: 'absolute', top: 0, right: 0, width: width * 0.8, height: '100%', zIndex: 20 },
  fileModalContent: { flex: 1, padding: 16 },
  fileModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  fileModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  uploadButton: { marginBottom: 16, borderRadius: 8, overflow: 'hidden' },
  uploadButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  uploadIcon: { marginRight: 8 },
  uploadText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  fileList: { flexGrow: 1 },
  fileItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  fileItemContent: { flex: 1, borderRadius: 8, overflow: 'hidden' },
  fileItemGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  fileIcon: { marginRight: 8 },
  fileName: { fontSize: 16, color: '#fff', flex: 1 },
  fileDeleteButton: { padding: 8 },
  emptyFileContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyFileText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptyFileSubtext: { color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', maxWidth: '80%' },
});

export default StreamingRagScreen;