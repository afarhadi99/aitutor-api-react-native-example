// src/screens/StreamingScreen.tsx
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';
import * as Animatable from 'react-native-animatable';
import { Divider } from 'react-native-paper';

// Define message interface
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Define token interface
interface TokenResponse {
  success: boolean;
  token: string;
  expires_in: number;
  error?: {
    message: string;
    code: string;
  };
}

// Define chat interface
interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  token?: string;
  tokenExpiry?: number;
}

const { width } = Dimensions.get('window');

const STORAGE_KEY = '@streaming_chats';
const CURRENT_CHAT_KEY = '@current_streaming_chat';

const StreamingScreen = () => {
  // State for chat functionality
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // State for chat history
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  // State for token management
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // State for header height
  const [headerHeight, setHeaderHeight] = useState(0);

  // Animation values
  const slideAnimation = useRef(new Animated.Value(-width)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const historyListRef = useRef<FlatList>(null);

  // Load chat history when component mounts
  useEffect(() => {
    loadChats();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && (messages.length > 0 || streamingContent)) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, streamingContent]);

  // Generate a new token for API calls
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

      if (!data.success || !data.token) {
        throw new Error(data.error?.message || 'Failed to generate token');
      }

      const expiryTime = Date.now() + (data.expires_in - 5) * 1000;

      if (currentChatId) {
        const chatIndex = chats.findIndex((chat) => chat.id === currentChatId);
        if (chatIndex !== -1) {
          const updatedChats = [...chats];
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            token: data.token,
            tokenExpiry: expiryTime,
          };
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

  // Load chats from AsyncStorage
  const loadChats = async () => {
    try {
      const storedChats = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedChats: Chat[] = storedChats ? JSON.parse(storedChats) : [];
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

  // Save current chat with AI response-based naming
  const saveCurrentChat = async (updatedMessages: Message[]) => {
    try {
      if (!currentChatId) return;

      const chatIndex = chats.findIndex((chat) => chat.id === currentChatId);
      if (chatIndex === -1) return;

      let chatTitle = chats[chatIndex].title;
      if (chatTitle === 'New Chat') {
        const firstAssistantMessage = updatedMessages.find((msg) => msg.role === 'assistant');
        if (firstAssistantMessage) {
          chatTitle = firstAssistantMessage.content.substring(0, 30);
          if (firstAssistantMessage.content.length > 30) chatTitle += '...';
        }
      }

      const updatedChat: Chat = {
        ...chats[chatIndex],
        title: chatTitle,
        messages: updatedMessages,
        updatedAt: Date.now(),
      };

      const updatedChats = [...chats];
      updatedChats[chatIndex] = updatedChat;
      updatedChats.sort((a, b) => b.updatedAt - a.updatedAt);

      setChats(updatedChats);
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

  // Delete a chat
  const deleteChat = async (chatId: string) => {
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

  // Extract content from streaming response
  const extractStreamContent = (text: string): string => {
    if (!text) return '';
    const matches = text.match(/0:"([^"]*)"/g) || [];
    let content = matches.map((match) => (match.match(/0:"([^"]*)"/)?.[1] || '')).join('');
    content = content.replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/\\t/g, '    ').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    return content;
  };

  // Handle sending a message
  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: Date.now() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    await saveCurrentChat(updatedMessages);

    let token = currentToken || (await generateToken());

    const xhr = new XMLHttpRequest();
    let responseText = '';
    const apiMessages = updatedMessages.map((msg) => ({ role: msg.role, content: msg.content }));

    xhr.open('POST', `https://aitutor-api.vercel.app/api/v1/chat/${token}/stream`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${ENV.AI_TUTOR_API_KEY}`);

    xhr.onprogress = () => {
      try {
        responseText = xhr.responseText;
        const extractedContent = extractStreamContent(responseText);
        setStreamingContent(extractedContent);
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
          saveCurrentChat(finalMessages);
        } else {
          console.error('Error in chat: Status', xhr.status);
          const errorMessage: Message = { id: Date.now().toString(), role: 'assistant', content: 'Sorry, an error occurred. Please try again.', timestamp: Date.now() };
          const finalMessages = [...updatedMessages, errorMessage];
          setMessages(finalMessages);
          saveCurrentChat(finalMessages);
          if (xhr.status === 401) generateToken();
        }
      } catch (error) {
        console.error('Error in onload:', error);
        const errorMessage: Message = { id: Date.now().toString(), role: 'assistant', content: 'Sorry, an error occurred while processing the response.', timestamp: Date.now() };
        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);
        saveCurrentChat(finalMessages);
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
      saveCurrentChat(finalMessages);
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
      saveCurrentChat(finalMessages);
      generateToken();
    }
  };

  // Format date for display
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

  // Render all messages plus the streaming content if available
  const renderMessages = () => {
    const allMessages = [...messages];
    if (streamingContent) {
      allMessages.push({ id: 'streaming', role: 'assistant', content: streamingContent, timestamp: Date.now() });
    }

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
              <Text style={styles.messageContent}>{item.content}</Text>
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
            <Text style={styles.emptySubtext}>Type a message below to chat with the AI assistant</Text>
          </View>
        }
        style={{ flex: 1 }}
      />
    );
  };

  // Render chat history drawer
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
                <Icon name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.newChatButton} onPress={() => createNewChat()}>
              <LinearGradient
                colors={['#8b5cf6', '#6d28d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newChatButtonGradient}
              >
                <Icon name="plus" size={20} color="white" style={styles.newChatIcon} />
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
                          >
                            {item.title}
                          </Text>
                          <Text style={styles.chatItemDate}>{formatDate(item.updatedAt)}</Text>
                        </View>
                        <View style={styles.chatItemActions}>
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

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.chatContainer}
          keyboardVerticalOffset={headerHeight + (Platform.OS === 'ios' ? 0 : 20)}
        >
          <View style={styles.header} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
            <TouchableOpacity style={styles.headerButton} onPress={toggleHistory}>
              <Icon name="menu" size={24} color="white" />
            </TouchableOpacity>
            <Animatable.View animation="fadeIn" duration={500} style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>{getCurrentChatTitle()}</Text>
            </Animatable.View>
            <TouchableOpacity style={styles.headerButton} onPress={() => createNewChat()}>
              <Icon name="plus" size={24} color="white" />
            </TouchableOpacity>
          </View>
          {renderMessages()}
          <View style={styles.inputContainer}>
            <LinearGradient
              colors={['rgba(15, 23, 42, 0.9)', 'rgba(30, 41, 59, 0.9)']}
              style={styles.inputGradient}
            >
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
              <TouchableOpacity
                style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={handleSubmit}
                disabled={!input.trim() || isLoading}
              >
                <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.sendButtonGradient}>
                  {isLoading ? <ActivityIndicator size="small" color="white" /> : <Icon name="send" size={20} color="white" />}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
        {renderHistoryDrawer()}
      </SafeAreaView>
    </LinearGradient>
  );
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', fontFamily: 'sans-serif' },
  messageList: { padding: 16, paddingBottom: 16, flexGrow: 1 },
  messageBubble: { marginBottom: 12, maxWidth: '85%', borderRadius: 16, overflow: 'hidden' },
  messageBubbleContent: { padding: 12 },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  messageBubbleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  messageSender: { fontSize: 14, fontWeight: 'bold', color: 'white', fontFamily: 'sans-serif' },
  messageTime: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginLeft: 8, fontFamily: 'sans-serif' },
  messageContent: { fontSize: 16, color: 'white', lineHeight: 22, fontFamily: 'sans-serif' },
  inputContainer: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  inputGradient: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8 },
  input: { flex: 1, color: 'white', fontSize: 16, maxHeight: 100, minHeight: 40, fontFamily: 'sans-serif' },
  sendButton: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', marginLeft: 8 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black', zIndex: 10 },
  historyDrawer: { position: 'absolute', top: 0, left: 0, width: width * 0.8, height: '100%', zIndex: 20 },
  historyContent: { flex: 1, padding: 16 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  historyTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', fontFamily: 'sans-serif' },
  closeButton: { padding: 4 },
  newChatButton: { marginBottom: 16, borderRadius: 8, overflow: 'hidden' },
  newChatButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  newChatIcon: { marginRight: 8 },
  newChatText: { color: 'white', fontWeight: 'bold', fontSize: 16, fontFamily: 'sans-serif' },
  divider: { backgroundColor: 'rgba(255, 255, 255, 0.1)', height: 1, marginBottom: 16 },
  chatList: { flexGrow: 1 },
  chatItem: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: 12, marginBottom: 8 },
  activeChatItem: { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderLeftWidth: 3, borderLeftColor: '#8b5cf6' },
  chatItemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chatItemInfo: { flex: 1, marginRight: 8 },
  chatItemTitle: { fontSize: 16, fontWeight: '500', color: 'white', marginBottom: 4, fontFamily: 'sans-serif' },
  activeChatItemTitle: { color: '#c4b5fd', fontWeight: 'bold', fontFamily: 'sans-serif' },
  chatItemDate: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'sans-serif' },
  chatItemPreview: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginTop: 8, fontFamily: 'sans-serif' },
  chatItemActions: { flexDirection: 'row' },
  chatItemAction: { padding: 4, marginLeft: 4 },
  chatItemSeparator: { height: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8, fontFamily: 'sans-serif' },
  emptySubtext: { color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', paddingHorizontal: 20, fontFamily: 'sans-serif' },
  emptyHistoryContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyHistoryText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8, fontFamily: 'sans-serif' },
  emptyHistorySubtext: { color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', maxWidth: '80%', fontFamily: 'sans-serif' },
});

export default StreamingScreen;