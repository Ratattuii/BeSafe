import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform, RefreshControl, AppState } from 'react-native';
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
  const [refreshing, setRefreshing] = useState(false);
  const [showNeedContext, setShowNeedContext] = useState(false);
  
  const scrollViewRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketListenersRef = useRef([]);
  const isMountedRef = useRef(true);
  const appState = useRef(AppState.currentState);

  // Função para gerar mensagem inicial baseada no contexto da necessidade
  const generateInitialMessage = useCallback(() => {
    if (!needContext) return '';
    
    let message = `Olá! Tenho interesse em ajudar com a necessidade "${needContext.title}".`;
    
    if (needContext.description) {
      message += `\n\nDescrição: ${needContext.description}`;
    }
    
    if (needContext.quantity && needContext.unit) {
      message += `\nQuantidade: ${needContext.quantity} ${needContext.unit}`;
    }
    
    message += `\n\nPodemos conversar sobre os detalhes?`;
    return message;
  }, [needContext]);

  useEffect(() => {
    isMountedRef.current = true;
    initializeChat();
    
    // Preencher mensagem inicial se for um chat novo com contexto de necessidade
    if (needContext && messages.length === 0 && !loading) {
      const initialMessage = generateInitialMessage();
      setNewMessage(initialMessage);
    }

    // Listener para mudanças no estado do app
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App voltou ao foreground, recarregando mensagens...');
        loadMessages();
        reconnectSocket();
      }
      appState.current = nextAppState;
    });

    return () => {
      isMountedRef.current = false;
      subscription.remove();
      cleanupSocketListeners();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, contact.id, needContext]);

  const initializeChat = async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    try {
      await loadMessages();
      await connectSocket();
    } catch (error) {
      console.error('Erro ao inicializar chat:', error);
      showError('Erro ao carregar conversa.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const reconnectSocket = async () => {
    if (!isMountedRef.current) return;
    
    try {
      await connectSocket();
    } catch (error) {
      console.error('Erro ao reconectar socket:', error);
    }
  };

  const connectSocket = async () => {
    try {
      if (socketChatService.isConnected()) {
        setupSocketListeners();
        await socketChatService.joinConversation(chatId);
        setSocketConnected(true);
        return;
      }

      const connected = await socketChatService.connect();
      if (connected) {
        setSocketConnected(true);
        setupSocketListeners();
        await socketChatService.joinConversation(chatId);
        console.log(`Usuário ${user.id} entrou na conversa ${chatId}`);
      } else {
        console.warn('Socket não conectado, usando fallback HTTP');
      }
    } catch (error) {
      console.error('Erro ao conectar socket:', error);
    }
  };

  const setupSocketListeners = () => {
    cleanupSocketListeners();

    const newMessageListener = (message) => {
      console.log('Nova mensagem recebida via socket para todos:', message);
      if (isMountedRef.current) {
        handleNewMessage(message);
      }
    };

    const messageSentListener = (confirmedMessage) => {
      console.log('Mensagem confirmada via socket:', confirmedMessage);
      if (isMountedRef.current) {
        handleMessageSent(confirmedMessage);
      }
    };

    const userTypingListener = (data) => {
      console.log('Evento de digitação recebido:', data);
      if (isMountedRef.current && data.userId !== user.id && data.conversationId === chatId) {
        setOtherUserTyping(data.isTyping);
        
        if (data.isTyping) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setOtherUserTyping(false);
            }
          }, 3000);
        }
      }
    };

    const connectionStatusListener = (status) => {
      console.log('Status da conexão:', status);
      if (isMountedRef.current) {
        setSocketConnected(status.connected);
        
        if (status.connected) {
          setTimeout(() => {
            if (isMountedRef.current) {
              loadMessages();
            }
          }, 1000);
        }
      }
    };

    const userJoinedListener = (data) => {
      console.log('Usuário entrou na conversa:', data);
    };

    const userLeftListener = (data) => {
      console.log('Usuário saiu da conversa:', data);
    };

    const messageEditedListener = (data) => {
      console.log('Mensagem editada:', data);
      if (isMountedRef.current) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.messageId ? { ...msg, message: data.newMessage } : msg
          )
        );
      }
    };

    const messageDeletedListener = (data) => {
      console.log('Mensagem deletada:', data);
      if (isMountedRef.current) {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      }
    };

    socketChatService.on('new_message', newMessageListener);
    socketChatService.on('message_sent', messageSentListener);
    socketChatService.on('user_typing', userTypingListener);
    socketChatService.on('connection_status', connectionStatusListener);
    socketChatService.on('user_joined', userJoinedListener);
    socketChatService.on('user_left', userLeftListener);
    socketChatService.on('message_edited', messageEditedListener);
    socketChatService.on('message_deleted', messageDeletedListener);

    socketListenersRef.current = [
      { event: 'new_message', listener: newMessageListener },
      { event: 'message_sent', listener: messageSentListener },
      { event: 'user_typing', listener: userTypingListener },
      { event: 'connection_status', listener: connectionStatusListener },
      { event: 'user_joined', listener: userJoinedListener },
      { event: 'user_left', listener: userLeftListener },
      { event: 'message_edited', listener: messageEditedListener },
      { event: 'message_deleted', listener: messageDeletedListener },
    ];
  };

  const cleanupSocketListeners = () => {
    if (chatId) {
      socketChatService.leaveConversation(chatId);
    }
    
    socketListenersRef.current.forEach(({ event, listener }) => {
      socketChatService.off(event, listener);
    });
    socketListenersRef.current = [];
  };

  const handleNewMessage = useCallback((message) => {
    setMessages(prev => {
      const messageExists = prev.some(msg => 
        msg.id === message.id || 
        (msg.tempId && msg.tempId === message.tempId) ||
        (msg.message === message.message && msg.sender_id === message.sender_id && Math.abs(new Date(msg.created_at) - new Date(message.created_at)) < 1000)
      );
      
      if (messageExists) {
        console.log('Mensagem duplicada ignorada:', message.id);
        return prev;
      }
      
      console.log('Adicionando nova mensagem no estado:', message);
      return [...prev, { ...message, isSending: false }];
    });
    
    scrollToBottom();
    
    if (message.sender_id !== user.id) {
      showSuccess(`Nova mensagem de ${contact.name}`);
    }
  }, [user.id, contact.name]);

  const handleMessageSent = useCallback((confirmedMessage) => {
    setMessages(prev => 
      prev.map(msg => {
        const isMatch = msg.tempId === confirmedMessage.tempId || 
          (msg.isSending && msg.message === confirmedMessage.message && msg.sender_id === confirmedMessage.sender_id);
        
        if (isMatch) {
          console.log('Substituindo mensagem temporária por confirmada:', confirmedMessage);
          return { ...confirmedMessage, isSending: false };
        }
        return msg;
      })
    );
  }, []);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/messages/${contact.id}`);
      console.log('Resposta da API de mensagens:', response);
      
      if (response.success && isMountedRef.current) {
        setMessages(response.data.messages || []);
        scrollToBottom();
      } else {
        showError('Erro ao carregar mensagens.');
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      showError('Erro ao carregar mensagens.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    
    if (!socketConnected) {
      await reconnectSocket();
    }
    
    setRefreshing(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      tempId,
      sender_id: user.id,
      receiver_id: contact.id,
      message: messageText,
      created_at: new Date().toISOString(),
      sender_name: user.name,
      isSending: true,
    };
    
    console.log('Enviando mensagem temporária:', tempMessage);
    
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      if (socketConnected) {
        console.log('Enviando mensagem via Socket.IO para conversa:', chatId);
        const sent = await socketChatService.sendMessage(chatId, messageText, contact.id, tempId);
        console.log('Mensagem enviada via socket, resultado:', sent);
        
        if (!sent) {
          throw new Error('Falha no envio via socket');
        }
        
      } else {
        console.log('Usando fallback HTTP para enviar mensagem');
        const response = await api.post('/messages', {
          receiver_id: contact.id,
          message: messageText,
          temp_id: tempId,
          conversation_id: chatId,
        });

        if (response.success) {
          console.log('Mensagem enviada via HTTP:', response.data.message);
          
          if (socketConnected) {
            socketChatService.broadcastMessage(chatId, response.data.message);
          }
          
          setMessages(prev => 
            prev.map(msg => 
              msg.tempId === tempId 
                ? { ...response.data.message, isSending: false } 
                : msg
            )
          );
        } else {
          throw new Error('Falha no envio via HTTP');
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showError('Erro ao enviar mensagem. Tente novamente.');
      
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === tempId 
            ? { ...msg, isSending: false, failed: true } 
            : msg
        )
      );
      
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text) => {
    setNewMessage(text);
    
    if (socketConnected) {
      if (text.length > 0 && !isTyping) {
        setIsTyping(true);
        socketChatService.setTyping(chatId, true, user.id);
      } else if (text.length === 0 && isTyping) {
        setIsTyping(false);
        socketChatService.setTyping(chatId, false, user.id);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping && isMountedRef.current) {
          setIsTyping(false);
          socketChatService.setTyping(chatId, false, user.id);
        }
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '--:--';
    }
  };

  const handleBackPress = () => {
    navigation.navigate('ChatList');
  };

  const retrySendMessage = (failedMessage) => {
    setNewMessage(failedMessage.message);
    setMessages(prev => prev.filter(msg => msg.tempId !== failedMessage.tempId && msg.id !== failedMessage.id));
  };

  const showNeedContextDetails = () => {
    if (!needContext) return;
    
    Alert.alert(
      needContext.title || 'Detalhes da Necessidade',
      `📋 ${needContext.description || 'Sem descrição disponível'}\n\n` +
      `🔄 Urgência: ${needContext.urgency || 'Não especificada'}\n` +
      `📦 Quantidade: ${needContext.quantity || 'N/A'} ${needContext.unit || ''}\n` +
      `🏷️ Categoria: ${needContext.category || 'Geral'}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderNeedContextButton = () => {
    if (!needContext) return null;

    return (
      <TouchableOpacity 
        style={styles.needInfoButton}
        onPress={showNeedContextDetails}
      >
        <Text style={styles.needInfoButtonText}>📋 Necessidade</Text>
      </TouchableOpacity>
    );
  };

  const renderMessage = (message, index) => {
    const isOwn = message.sender_id === user.id;
    const isSending = message.isSending;
    const isFailed = message.failed;

    const messageKey = message.tempId || message.id || `msg-${index}-${message.created_at}-${message.sender_id}`;

    return (
      <View
        key={messageKey}
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
            isFailed && styles.failedBubble,
          ]}
        >
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownText : styles.otherText,
          ]}>
            {message.message}
          </Text>
          <View style={styles.messageTimeContainer}>
            <Text style={[
              styles.messageTime,
              isOwn ? styles.ownTime : styles.otherTime,
            ]}>
              {formatTime(message.created_at)}
              {isSending && ' • Enviando...'}
              {isFailed && ' • Falha no envio'}
            </Text>
            {isFailed && (
              <TouchableOpacity 
                onPress={() => retrySendMessage(message)}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            )}
          </View>
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
            <Text style={[
              styles.socketStatus,
              { color: socketConnected ? colors.success : colors.error }
            ]}>
              {socketConnected ? ' • Tempo Real' : ' • Offline'}
            </Text>
          </View>
        </View>
        
        {renderNeedContextButton()}
        
        <TouchableOpacity 
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Contexto da Necessidade - Banner */}
      {needContext && (
        <TouchableOpacity 
          style={styles.contextCard}
          onPress={showNeedContextDetails}
        >
          <View style={styles.contextHeader}>
            <Text style={styles.contextTitle}>{needContext.title}</Text>
            <View style={[
              styles.urgencyBadge,
              { backgroundColor: needContext.urgency === 'critica' ? colors.error : colors.warning }
            ]}>
              <Text style={styles.urgencyText}>
                {needContext.urgency === 'critica' ? 'Crítica' : 
                 needContext.urgency === 'alta' ? 'Alta' : 
                 needContext.urgency === 'media' ? 'Média' : 'Baixa'}
              </Text>
            </View>
          </View>
          <Text style={styles.contextDescription} numberOfLines={2}>
            {needContext.description}
          </Text>
          <Text style={styles.contextDetails}>
            📦 {needContext.quantity} {needContext.unit} • 🏷️ {needContext.category}
          </Text>
        </TouchableOpacity>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          accessible={true}
          accessibilityLabel="Lista de mensagens da conversa"
        >
          {messages.map((message, index) => renderMessage(message, index))}
          {messages.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhuma mensagem ainda</Text>
              <Text style={styles.emptyStateSubtext}>
                {needContext 
                  ? 'Envie uma mensagem para conversar sobre esta necessidade'
                  : 'Envie a primeira mensagem para iniciar a conversa'
                }
              </Text>
            </View>
          )}
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
    marginLeft: spacing.xs,
    fontWeight: fontWeights.medium,
  },
  needInfoButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.small,
    marginRight: spacing.sm,
  },
  needInfoButtonText: {
    fontSize: fontSizes.xs,
    color: colors.primary,
    fontWeight: fontWeights.medium,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  refreshButtonText: {
    fontSize: fontSizes.lg,
    color: colors.primary,
  },
  contextCard: {
    backgroundColor: colors.primaryLight,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  contextTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  urgencyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  urgencyText: {
    fontSize: fontSizes.xs,
    color: colors.white,
    fontWeight: fontWeights.bold,
  },
  contextDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: fontSizes.sm * 1.4,
  },
  contextDetails: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
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
    flexGrow: 1,
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
  failedBubble: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
    borderWidth: 1,
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
  messageTimeContainer: {
    marginTop: spacing.xs / 2,
  },
  messageTime: {
    fontSize: fontSizes.xs,
  },
  ownTime: {
    color: colors.white,
    opacity: 0.8,
  },
  otherTime: {
    color: colors.textSecondary,
  },
  retryButton: {
    marginTop: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.error,
    borderRadius: borderRadius.small,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: fontSizes.sm,
    color: colors.gray500,
    textAlign: 'center',
  },
});

export default ChatScreen;