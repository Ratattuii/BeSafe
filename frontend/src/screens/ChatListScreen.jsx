import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  AppState,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import socketChatService from '../services/chat/socketChatService';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../styles/globalStyles';

const ChatListScreen = ({ navigation }) => {
  console.log('=== CHAT LIST SCREEN RENDER ===');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const socketListenersRef = useRef([]);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    console.log('🔵 useEffect - Inicializando ChatListScreen');
    initializeChatList();

    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('🔄 AppState mudou:', appState.current, '->', nextAppState);
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App voltou ao foreground, recarregando chats...');
        loadChats();
      }
      appState.current = nextAppState;
    });

    return () => {
      console.log('🧹 Cleanup - ChatListScreen');
      subscription.remove();
      cleanupSocketListeners();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('🎯 ChatListScreen em foco - recarregando dados');
      loadChats();
      connectSocket();
      
      return () => {
        console.log('📝 ChatListScreen perdeu foco');
      };
    }, [])
  );

  const initializeChatList = async () => {
    console.log('🚀 Inicializando lista de chats...');
    setLoading(true);
    setError(null);
    try {
      await loadChats();
      await connectSocket();
    } catch (error) {
      console.error('❌ Erro ao inicializar lista de chats:', error);
      setError('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = async () => {
    console.log('🔌 Conectando socket...');
    try {
      if (socketChatService.isConnected()) {
        console.log('✅ Socket já está conectado');
        setupSocketListeners();
        setSocketConnected(true);
        return;
      }

      const connected = await socketChatService.connect();
      if (connected) {
        console.log('✅ Socket conectado com sucesso');
        setSocketConnected(true);
        setupSocketListeners();
      } else {
        console.log('❌ Falha ao conectar socket');
      }
    } catch (error) {
      console.error('❌ Erro ao conectar socket:', error);
    }
  };

  const setupSocketListeners = () => {
    console.log('🎧 Configurando listeners do socket...');
    cleanupSocketListeners();

    const newMessageListener = (message) => {
      console.log('📨 Nova mensagem recebida na lista de chats:', message);
      updateChatWithNewMessage(message);
    };

    const connectionStatusListener = (status) => {
      console.log('📡 Status da conexão:', status);
      setSocketConnected(status.connected);
    };

    socketChatService.on('new_message', newMessageListener);
    socketChatService.on('connection_status', connectionStatusListener);

    socketListenersRef.current = [
      { event: 'new_message', listener: newMessageListener },
      { event: 'connection_status', listener: connectionStatusListener },
    ];
    
    console.log('✅ Listeners do socket configurados');
  };

  const cleanupSocketListeners = () => {
    console.log('🧹 Limpando listeners do socket...');
    socketListenersRef.current.forEach(({ event, listener }) => {
      socketChatService.off(event, listener);
    });
    socketListenersRef.current = [];
  };

  const updateChatWithNewMessage = (message) => {
    console.log('🔄 Atualizando chat com nova mensagem:', message);
    setChats(prevChats => {
      const existingChatIndex = prevChats.findIndex(chat => 
        chat.contact.id === message.sender_id || chat.contact.id === message.receiver_id
      );

      console.log('📊 Chat existente encontrado no índice:', existingChatIndex);

      if (existingChatIndex >= 0) {
        const updatedChats = [...prevChats];
        const chat = updatedChats[existingChatIndex];
        
        updatedChats[existingChatIndex] = {
          ...chat,
          lastMessage: {
            text: message.message,
            timestamp: new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            senderId: message.sender_id,
            isRead: message.sender_id === user.id,
          },
          unreadCount: message.sender_id === user.id 
            ? chat.unreadCount 
            : chat.unreadCount + 1,
          updatedAt: new Date().toISOString(),
        };

        const [movedChat] = updatedChats.splice(existingChatIndex, 1);
        updatedChats.unshift(movedChat);

        console.log('✅ Chat atualizado e movido para o topo');
        return updatedChats;
      } else {
        console.log('🆕 Nova conversa detectada, recarregando lista...');
        loadChats();
        return prevChats;
      }
    });
  };

  const loadChats = async () => {
    console.log('📥 Carregando chats da API...');
    setError(null);
    
    try {
      const response = await api.get('/messages/conversations');
      console.log('📨 Resposta completa da API:', response);
      
      if (response.success) {
        // A API retorna um objeto, não um array direto
        const data = response.data;
        console.log('📊 Estrutura dos dados:', data);
        
        // Verificar diferentes estruturas possíveis
        let conversations = [];
        
        if (Array.isArray(data)) {
          // Se data já é um array
          conversations = data;
        } else if (data && Array.isArray(data.conversations)) {
          // Se data tem propriedade conversations
          conversations = data.conversations;
        } else if (data && typeof data === 'object') {
          // Se data é um objeto, tentar extrair conversas
          conversations = Object.values(data).filter(item => 
            item && typeof item === 'object' && (item.other_user_id || item.user_id)
          );
        }
        
        console.log(`✅ ${conversations.length} conversas extraídas da API`);
        
        // Transformar os dados para o formato esperado
        const formattedChats = conversations.map((conversation, index) => {
          // Log para debug da estrutura
          console.log(`📋 Conversa ${index}:`, conversation);
          
          const contactId = conversation.other_user_id || conversation.user_id || conversation.id;
          const contactName = conversation.other_user_name || conversation.user_name || conversation.name || 'Usuário';
          const lastMessage = conversation.last_message || conversation.message || 'Nenhuma mensagem ainda';
          const lastMessageAt = conversation.last_message_at || conversation.updated_at || conversation.created_at;
          
          return {
            id: conversation.conversation_id || conversation.id || `temp-${contactId}`,
            contact: {
              id: contactId,
              name: contactName,
              avatar: conversation.other_user_avatar || conversation.avatar || `https://via.placeholder.com/50x50/666/white?text=${contactName.charAt(0)}`,
              type: conversation.user_type || 'user',
              isOnline: conversation.is_online || false,
            },
            lastMessage: {
              text: lastMessage,
              senderId: conversation.last_message_sender_id || conversation.sender_id || contactId,
              created_at: lastMessageAt,
              isRead: conversation.is_read || false,
            },
            unreadCount: conversation.unread_count || 0,
            needContext: conversation.need_context ? {
              title: conversation.need_context.title,
              urgency: conversation.need_context.urgency || 'media',
            } : null,
            updatedAt: lastMessageAt,
          };
        });

        // Ordenar por data de atualização
        const sortedChats = formattedChats.sort((a, b) => 
          new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );

        console.log('🎯 Chats formatados:', sortedChats);
        setChats(sortedChats);
      } else {
        console.error('❌ Erro na resposta da API:', response);
        setError(response.message || 'Erro ao carregar conversas');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar chats:', error);
      setError('Erro de conexão ao carregar conversas');
      setChats([]);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 Refresh manual acionado');
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat) => {
    console.log('👆 Chat pressionado:', chat.contact?.name || 'Contato sem nome');
    console.log('📋 Parâmetros a serem passados:', { 
      chatId: chat.id, 
      contact: chat.contact,
      needContext: chat.needContext 
    });
    
    if (!chat.id || !chat.contact) {
      console.error('❌ Parâmetros inválidos para navegação:', chat);
      Alert.alert('Erro', 'Não foi possível abrir a conversa. Dados inválidos.');
      return;
    }
    
    try {
      console.log('🚀 Navegando para ChatScreen...');
      navigation.navigate('Chat', { 
        chatId: chat.id, 
        contact: chat.contact,
        needContext: chat.needContext 
      });
      console.log('✅ Navegação chamada com sucesso');
    } catch (error) {
      console.error('❌ Erro na navegação:', error);
      Alert.alert('Erro', 'Não foi possível abrir a conversa.');
    }
  };

  const handleSearchChange = (text) => {
    console.log('🔍 Busca alterada:', text);
    setSearchQuery(text);
  };

  const getFilteredChats = () => {
    const filtered = !searchQuery.trim() ? chats : chats.filter(chat => {
      const contactName = chat.contact?.name || '';
      const lastMessage = chat.lastMessage?.text || '';
      const needContextTitle = chat.needContext?.title || '';
      
      return (
        contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        needContextTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    
    console.log('📊 Chats filtrados:', filtered.length, 'de', chats.length);
    return filtered;
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critica': return colors.error;
      case 'alta': return colors.warning;
      case 'media': return colors.success;
      case 'baixa': return colors.gray500;
      default: return colors.gray500;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const now = new Date();
      const messageDate = new Date(timestamp);
      const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return messageDate.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffDays === 1) {
        return 'Ontem';
      } else if (diffDays < 7) {
        return `${diffDays} dias`;
      } else {
        return messageDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit'
        });
      }
    } catch (error) {
      console.error('❌ Erro ao formatar timestamp:', error);
      return '';
    }
  };

  const getLastMessageTimestamp = (chat) => {
    return chat.updatedAt || chat.lastMessage?.created_at || chat.created_at;
  };

  // ... (resto do código permanece igual - renderSearchBar, renderChatItem, etc.)

  const renderSearchBar = () => (
    <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
      <View style={styles.searchInputContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar conversas..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderChatItem = (chat) => {
    const contactName = chat.contact?.name || 'Contato';
    const contactAvatar = chat.contact?.avatar || `https://via.placeholder.com/50x50/666/white?text=${contactName.charAt(0)}`;
    const lastMessage = chat.lastMessage?.text || 'Nenhuma mensagem ainda';
    const isOnline = chat.contact?.isOnline || false;
    const needContextTitle = chat.needContext?.title || '';
    const urgency = chat.needContext?.urgency || 'media';
    const unreadCount = chat.unreadCount || 0;
    const isLastMessageFromUser = chat.lastMessage?.senderId === user.id;

    return (
      <TouchableOpacity
        key={chat.id}
        style={[styles.chatItem, isDesktop && styles.chatItemDesktop]}
        onPress={() => handleChatPress(chat)}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: contactAvatar }} 
            style={styles.avatar}
            onError={() => console.log('❌ Erro ao carregar avatar')}
          />
          {isOnline && <View style={styles.onlineIndicator} />}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.contactName} numberOfLines={1}>
              {contactName}
            </Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(getLastMessageTimestamp(chat))}
            </Text>
          </View>

          {needContextTitle ? (
            <View style={styles.needContextContainer}>
              <View style={[
                styles.urgencyDot,
                { backgroundColor: getUrgencyColor(urgency) }
              ]} />
              <Text style={styles.needContextText} numberOfLines={1}>
                {needContextTitle}
              </Text>
            </View>
          ) : null}

          <Text 
            style={[
              styles.lastMessage,
              unreadCount > 0 && !isLastMessageFromUser && styles.unreadMessage
            ]} 
            numberOfLines={2}
          >
            {isLastMessageFromUser ? 'Você: ' : ''}
            {lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery.trim() ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery.trim() 
          ? 'Tente ajustar os termos da busca'
          : 'Suas conversas sobre doações aparecerão aqui'
        }
      </Text>
      {!searchQuery.trim() && (
        <TouchableOpacity 
          style={styles.startChatButton}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.startChatButtonText}>Iniciar primeira conversa</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⚠️</Text>
      <Text style={styles.emptyTitle}>Erro ao carregar conversas</Text>
      <Text style={styles.emptyDescription}>
        {error || 'Não foi possível carregar suas conversas'}
      </Text>
      <TouchableOpacity 
        style={styles.startChatButton}
        onPress={loadChats}
      >
        <Text style={styles.startChatButtonText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );

  const renderChatList = () => {
    const filteredChats = getFilteredChats();
    
    console.log('📱 Renderizando lista de chats:', {
      loading,
      error,
      chatsCount: chats.length,
      filteredCount: filteredChats.length,
      refreshing
    });

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando conversas...</Text>
        </View>
      );
    }

    if (error) {
      return renderErrorState();
    }

    if (filteredChats.length === 0) {
      return renderEmptyState();
    }

    return (
      <ScrollView 
        style={styles.chatList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {filteredChats.map(renderChatItem)}
      </ScrollView>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Mensagens</Text>
        {socketConnected && (
          <View style={styles.connectionStatus}>
            <View style={styles.connectionDot} />
            <Text style={styles.connectionText}>Conectado</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={styles.headerButtonText}>✏️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMobileLayout = () => (
    <View style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
      {renderChatList()}
    </View>
  );

  const renderDesktopLayout = () => (
    <View style={styles.desktopContainer}>
      <View style={styles.desktopSidebar}>
        {renderHeader()}
        {renderSearchBar()}
        {renderChatList()}
      </View>
      
      <View style={styles.desktopChatArea}>
        <View style={styles.desktopPlaceholder}>
          <Text style={styles.placeholderIcon}>💬</Text>
          <Text style={styles.placeholderTitle}>Selecione uma conversa</Text>
          <Text style={styles.placeholderDescription}>
            Escolha uma conversa da lista ao lado para começar a trocar mensagens
          </Text>
        </View>
      </View>
    </View>
  );

  console.log('🎨 Renderizando ChatListScreen...');
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
  },

  // Desktop Layout
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  desktopSidebar: {
    width: 400,
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginRight: spacing.lg,
    maxWidth: '90%', // Responsivo
  },
  desktopChatArea: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 300, // Mínimo para responsividade
  },
  desktopPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  placeholderTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  placeholderDescription: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerDesktop: {
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.xs,
  },
  connectionText: {
    fontSize: fontSizes.xs,
    color: colors.success,
    fontWeight: fontWeights.medium,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: fontSizes.lg,
    color: colors.white,
  },

  // Busca
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  searchContainerDesktop: {
    paddingHorizontal: spacing.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    fontSize: fontSizes.md,
    marginRight: spacing.sm,
    color: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: fontSizes.xs,
    color: colors.white,
  },

  // Lista de chats
  chatList: {
    flex: 1,
    backgroundColor: colors.white,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    alignItems: 'flex-start',
    minHeight: 80,
  },
  chatItemDesktop: {
    paddingVertical: spacing.md,
    minHeight: 70,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gray300,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  unreadCount: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },

  // Informações do chat
  chatInfo: {
    flex: 1,
    minWidth: 0, // Importante para responsividade
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  contactName: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  needContextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
    flexShrink: 0,
  },
  needContextText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  lastMessage: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  unreadMessage: {
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
  },

  // Estados vazios
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  startChatButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
  },
  startChatButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});

export default ChatListScreen;