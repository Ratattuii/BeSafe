import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../styles/globalStyles';

const ChatScreen = ({ route, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);
  
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Props da navegação (mockadas)
  const chatData = route?.params || {
    chatId: 1,
    contact: {
      name: 'Cruz Vermelha Brasileira',
      avatar: 'https://via.placeholder.com/40x40/FF1434/white?text=CV',
      type: 'institution',
      isOnline: true,
    },
    needContext: {
      title: 'Medicamentos para UTI',
      urgency: 'critica',
      description: 'Precisamos urgentemente de medicamentos para pacientes em estado crítico.',
    }
  };

  // Dados mockados de mensagens
  const mockMessages = [
    {
      id: 1,
      text: 'Olá! Vi que vocês precisam de medicamentos para UTI. Posso ajudar com alguns itens.',
      senderId: 0, // usuário atual
      timestamp: '2023-10-01T10:00:00Z',
      type: 'text',
    },
    {
      id: 2,
      text: 'Que ótimo! Muito obrigado pelo interesse em ajudar. Quais medicamentos você tem disponível?',
      senderId: 1, // contato
      timestamp: '2023-10-01T10:05:00Z',
      type: 'text',
    },
    {
      id: 3,
      text: 'Tenho alguns antibióticos e analgésicos. Posso enviar a lista completa se quiser.',
      senderId: 0,
      timestamp: '2023-10-01T10:07:00Z',
      type: 'text',
    },
    {
      id: 4,
      text: 'Por favor, isso seria muito útil! Nossa equipe médica pode verificar o que é mais necessário no momento.',
      senderId: 1,
      timestamp: '2023-10-01T10:10:00Z',
      type: 'text',
    },
    {
      id: 5,
      text: 'Aqui está a lista dos medicamentos disponíveis:',
      senderId: 0,
      timestamp: '2023-10-01T10:15:00Z',
      type: 'text',
    },
    {
      id: 6,
      text: 'https://via.placeholder.com/200x150/4CAF50/white?text=Lista+Medicamentos',
      senderId: 0,
      timestamp: '2023-10-01T10:16:00Z',
      type: 'image',
    },
  ];

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    // Auto scroll para baixo quando novas mensagens chegam
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    
    // TODO: Implementar carregamento real
    // GET /chats/${chatId}/messages
    
    // Simula carregamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setMessages(mockMessages);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Adiciona mensagem otimisticamente
    const newMsg = {
      id: Date.now(),
      text: messageText,
      senderId: 0,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    setMessages(prev => [...prev, newMsg]);

    try {
      // TODO: Implementar envio real
      // POST /chats/${chatId}/messages
      // Body: { text: messageText, type: 'text' }
      
      console.log('Enviando mensagem:', messageText);
      
    } catch (error) {
      // Remove mensagem em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== newMsg.id));
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleImagePicker = () => {
    // TODO: Implementar seletor de imagens
    console.log('Abrir seletor de imagens');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critica': return colors.urgent;
      case 'alta': return colors.warning;
      case 'media': return colors.success;
      case 'baixa': return colors.gray500;
      default: return colors.gray500;
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation?.goBack?.()}
        accessible={true}
        accessibilityLabel="Voltar para lista de conversas"
        accessibilityRole="button"
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.contactInfo}>
        <Image source={{ uri: chatData.contact.avatar }} style={styles.contactAvatar} />
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{chatData.contact.name}</Text>
          <Text style={styles.contactStatus}>
            {chatData.contact.isOnline ? '🟢 Online' : '⚫ Offline'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          // TODO: Abrir menu de opções
          console.log('Menu do chat');
        }}
        accessible={true}
        accessibilityLabel="Menu do chat"
        accessibilityRole="button"
      >
        <Text style={styles.menuButtonText}>⋮</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNeedContext = () => (
    <View style={[styles.needContext, isDesktop && styles.needContextDesktop]}>
      <View style={styles.needHeader}>
        <View style={[
          styles.urgencyDot,
          { backgroundColor: getUrgencyColor(chatData.needContext.urgency) }
        ]} />
        <Text style={styles.needTitle}>{chatData.needContext.title}</Text>
      </View>
      <Text style={styles.needDescription}>
        {chatData.needContext.description}
      </Text>
    </View>
  );

  const renderMessage = (message) => {
    const isMyMessage = message.senderId === 0;

    if (message.type === 'image') {
      return (
        <View
          key={message.id}
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
          ]}
        >
          <TouchableOpacity style={styles.imageMessage}>
            <Image source={{ uri: message.text }} style={styles.messageImage} />
          </TouchableOpacity>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}
        accessible={true}
        accessibilityLabel={`${isMyMessage ? 'Você' : chatData.contact.name}: ${message.text}`}
      >
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {message.text}
          </Text>
        </View>
        <Text style={[
          styles.messageTime,
          isMyMessage ? styles.myMessageTime : styles.otherMessageTime
        ]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    );
  };

  const renderMessages = () => (
    <ScrollView
      ref={scrollViewRef}
      style={styles.messagesContainer}
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {messages.map(renderMessage)}
    </ScrollView>
  );

  const renderMessageInput = () => (
    <View style={[styles.inputContainer, isDesktop && styles.inputContainerDesktop]}>
      <TouchableOpacity
        style={styles.attachButton}
        onPress={handleImagePicker}
        accessible={true}
        accessibilityLabel="Anexar imagem"
        accessibilityRole="button"
      >
        <Text style={styles.attachButtonText}>📷</Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.messageInput, isDesktop && styles.messageInputDesktop]}
        value={newMessage}
        onChangeText={setNewMessage}
        placeholder="Digite sua mensagem..."
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={1000}
        accessible={true}
        accessibilityLabel="Campo de mensagem"
        accessibilityHint="Digite sua mensagem aqui"
      />

      <TouchableOpacity
        style={[
          styles.sendButton,
          (!newMessage.trim() || loading) && styles.sendButtonDisabled
        ]}
        onPress={sendMessage}
        disabled={!newMessage.trim() || loading}
        accessible={true}
        accessibilityLabel="Enviar mensagem"
        accessibilityRole="button"
        accessibilityState={{ disabled: !newMessage.trim() || loading }}
      >
        <Text style={styles.sendButtonText}>➤</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMobileLayout = () => (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {renderHeader()}
      {renderNeedContext()}
      {renderMessages()}
      {renderMessageInput()}
    </KeyboardAvoidingView>
  );

  const renderDesktopLayout = () => (
    <View style={styles.desktopContainer}>
      {renderHeader()}
      {renderNeedContext()}
      <View style={styles.desktopChatContent}>
        {renderMessages()}
        {renderMessageInput()}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {isDesktop ? renderDesktopLayout() : renderMobileLayout()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Desktop Layout
  desktopContainer: {
    flex: 1,
    backgroundColor: colors.white,
    margin: 20,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  desktopChatContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  headerDesktop: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: colors.secondary,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  contactStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
  },

  // Contexto da necessidade
  needContext: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  needContextDesktop: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  needHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  needTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  needDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Mensagens
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageContainer: {
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 4,
  },
  myMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.textPrimary,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  myMessageTime: {
    color: colors.textSecondary,
  },
  otherMessageTime: {
    color: colors.textSecondary,
  },

  // Mensagem de imagem
  imageMessage: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },

  // Input de mensagem
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    gap: 8,
  },
  inputContainerDesktop: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButtonText: {
    fontSize: 18,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundLight,
    maxHeight: 100,
  },
  messageInputDesktop: {
    paddingVertical: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  sendButtonText: {
    fontSize: 18,
    color: colors.white,
  },
});

export default ChatScreen;
