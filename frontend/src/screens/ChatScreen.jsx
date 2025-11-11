import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import socketChatService from '../services/chat/socketChatService';
import { showError, showSuccess } from '../utils/alerts';
import { colors, spacing, fontSizes, fontWeights, borderRadius, shadows } from '../styles/globalStyles';

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { chatId, contact, needContext } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const scrollViewRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    initializeChat();
    setupSocketListeners();
    
    return () => {
      cleanupSocketListeners();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const initializeChat = async () => {
    setLoading(true);
    try {
      // Conectar ao Socket.IO
      const connected = await socketChatService.connect();
      if (connected) {
        setSocketConnected(true);
        
        // Entrar na conversa
        socketChatService.joinConversation(chatId);
      }

      // Carregar mensagens existentes
      await loadMessages();
    } catch (error) {
      console.error('Erro ao inicializar chat:', error);
      showError('Erro ao carregar conversa.');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Nova mensagem recebida
    socketChatService.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Usuário digitando
    socketChatService.on('user_typing', (data) => {
      if (data.userId !== user.id) {
        setOtherUserTyping(data.isTyping);
      }
    });

    // Status de conexão
    socketChatService.on('connection_status', (status) => {
      setSocketConnected(status.connected);
    });

    // Erro de conexão
    socketChatService.on('connection_error', (error) => {
      console.error('Erro de conexão Socket.IO:', error);
      setSocketConnected(false);
    });

    // Autenticado
    socketChatService.on('authenticated', () => {
      setSocketConnected(true);
      socketChatService.joinConversation(chatId);
    });
  };

  const cleanupSocketListeners = () => {
    socketChatService.leaveConversation(chatId);
  };

  const loadMessages = async () => {
    try {
      const response = await api.get(`/messages/${contact.id}`);
      if (response.success) {
        setMessages(response.data.messages || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Enviar via Socket.IO (tempo real)
      const sent = socketChatService.sendMessage(chatId, messageText, contact.id);
      
      if (!sent) {
        // Fallback para HTTP se Socket.IO falhar
        const response = await api.post('/messages', {
          receiver_id: contact.id,
          message: messageText,
        });

        if (response.success) {
          showSuccess('Mensagem enviada');
          const newMsg = {
            id: response.data.message.id,
            sender_id: user.id,
            receiver_id: contact.id,
            message: messageText,
            created_at: new Date().toISOString(),
            sender_name: user.name,
          };
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
        } else {
          showError('Erro ao enviar mensagem.');
          setNewMessage(messageText); // Restaurar mensagem
        }
      } else {
        // Mensagem enviada via Socket.IO - será adicionada quando receber confirmação
        const tempMessage = {
          id: Date.now(), // ID temporário
          sender_id: user.id,
          receiver_id: contact.id,
          message: messageText,
          created_at: new Date().toISOString(),
          sender_name: user.name,
          isSending: true,
        };
        setMessages(prev => [...prev, tempMessage]);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showError('Erro ao enviar mensagem.');
      setNewMessage(messageText); // Restaurar mensagem
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text) => {
    setNewMessage(text);
    
    // Enviar indicador de digitação
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      socketChatService.setTyping(chatId, true);
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      socketChatService.setTyping(chatId, false);
    }

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Parar de digitar após 2 segundos de inatividade
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socketChatService.setTyping(chatId, false);
      }
    }, 2000);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderMessage = (message) => {
    const isOwn = message.sender_id === user.id;
    const isSending = message.isSending;

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
        accessible={true}
        accessibilityLabel={`Mensagem ${isOwn ? 'enviada' : 'recebida'}: ${message.message}`}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.ownBubble : styles.otherBubble,
            isSending && styles.sendingBubble,
          ]}
        >
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownText : styles.otherText,
          ]}>
            {message.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwn ? styles.ownTime : styles.otherTime,
          ]}>
            {formatTime(message.created_at)}
            {isSending && ' • Enviando...'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando conversa...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              { backgroundColor: contact.isOnline ? colors.success : colors.gray400 }
            ]} />
            <Text style={styles.statusText}>
              {contact.isOnline ? 'Online' : 'Offline'}
            </Text>
            {socketConnected && (
              <Text style={styles.socketStatus}>• Tempo Real</Text>
            )}
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📞</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contexto da Necessidade */}
      {needContext && (
        <View style={styles.contextCard}>
          <Text style={styles.contextTitle}>{needContext.title}</Text>
          <Text style={styles.contextDescription}>{needContext.description}</Text>
          <View style={[
            styles.urgencyBadge,
            { backgroundColor: needContext.urgency === 'critica' ? colors.error : colors.warning }
          ]}>
            <Text style={styles.urgencyText}>
              {needContext.urgency === 'critica' ? 'Crítica' : 'Alta'}
            </Text>
          </View>
        </View>
      )}

      {/* Indicador de Digitação */}
      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{contact.name} está digitando...</Text>
        </View>
      )}

      {/* Mensagens */}
      <KeyboardAvoidingView 
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          accessible={true}
          accessibilityLabel="Lista de mensagens da conversa"
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {/* Input de Mensagem */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={handleTyping}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.gray500}
            multiline
            maxLength={1000}
            editable={!sending}
            accessible={true}
            accessibilityLabel="Campo de texto para digitar mensagem"
            accessibilityHint="Digite sua mensagem e pressione enviar"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            accessible={true}
            accessibilityLabel={sending ? "Enviando mensagem" : "Enviar mensagem"}
            accessibilityRole="button"
            accessibilityState={{ busy: sending }}
          >
            {sending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.sendButtonText}>→</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  backButtonText: {
    fontSize: fontSizes.xl,
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs / 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  socketStatus: {
    fontSize: fontSizes.sm,
    color: colors.success,
    marginLeft: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  actionButtonText: {
    fontSize: fontSizes.lg,
  },
  contextCard: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  contextTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  contextDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  urgencyText: {
    fontSize: fontSizes.xs,
    color: colors.white,
    fontWeight: fontWeights.bold,
  },
  typingIndicator: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  typingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageContainer: {
    marginBottom: spacing.sm,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.small,
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.small,
    ...shadows.small,
  },
  sendingBubble: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.4,
  },
  ownText: {
    color: colors.white,
  },
  otherText: {
    color: colors.textPrimary,
  },
  messageTime: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs / 2,
  },
  ownTime: {
    color: colors.white,
    opacity: 0.8,
  },
  otherTime: {
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
});

export default ChatScreen;