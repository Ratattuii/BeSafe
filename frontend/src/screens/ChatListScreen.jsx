import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../styles/globalStyles';

const ChatListScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Dados mockados de chats
  const mockChats = [
    {
      id: 1,
      contact: {
        name: 'Cruz Vermelha Brasileira',
        avatar: 'https://via.placeholder.com/50x50/FF1434/white?text=CV',
        type: 'institution',
        isOnline: true,
      },
      lastMessage: {
        text: 'Obrigado pela doação! Os medicamentos chegaram em perfeitas condições.',
        timestamp: '10:30',
        senderId: 1,
        isRead: true,
      },
      unreadCount: 0,
      needContext: {
        title: 'Medicamentos para UTI',
        urgency: 'critica',
      }
    },
    {
      id: 2,
      contact: {
        name: 'Hospital São Lucas',
        avatar: 'https://via.placeholder.com/50x50/4CAF50/white?text=HS',
        type: 'institution',
        isOnline: false,
      },
      lastMessage: {
        text: 'Ainda precisamos de mais 200kg de alimentos. Vocês podem ajudar?',
        timestamp: 'Ontem',
        senderId: 2,
        isRead: false,
      },
      unreadCount: 3,
      needContext: {
        title: 'Alimentos para famílias',
        urgency: 'alta',
      }
    },
    {
      id: 3,
      contact: {
        name: 'João Silva',
        avatar: 'https://via.placeholder.com/50x50/2196F3/white?text=JS',
        type: 'donor',
        isOnline: true,
      },
      lastMessage: {
        text: 'Vou entregar as roupas amanhã às 14h. Confirma o endereço?',
        timestamp: 'Ontem',
        senderId: 0, // usuário atual
        isRead: true,
      },
      unreadCount: 0,
      needContext: {
        title: 'Roupas de inverno',
        urgency: 'media',
      }
    },
    {
      id: 4,
      contact: {
        name: 'Abrigo Esperança',
        avatar: 'https://via.placeholder.com/50x50/9C27B0/white?text=AE',
        type: 'institution',
        isOnline: false,
      },
      lastMessage: {
        text: 'As crianças ficaram muito felizes com os brinquedos! 😊',
        timestamp: '2 dias',
        senderId: 4,
        isRead: true,
      },
      unreadCount: 1,
      needContext: {
        title: 'Brinquedos para crianças',
        urgency: 'baixa',
      }
    },
    {
      id: 5,
      contact: {
        name: 'Maria Santos',
        avatar: 'https://via.placeholder.com/50x50/FF9800/white?text=MS',
        type: 'donor',
        isOnline: true,
      },
      lastMessage: {
        text: 'Podemos combinar a entrega para hoje?',
        timestamp: '3 dias',
        senderId: 5,
        isRead: false,
      },
      unreadCount: 2,
      needContext: {
        title: 'Material de limpeza',
        urgency: 'media',
      }
    },
  ];

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setLoading(true);
    
    // TODO: Implementar carregamento real
    // GET /chats - lista de conversas do usuário
    
    // Simula carregamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setChats(mockChats);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat) => {
    // TODO: Navegar para tela de chat
    // navigation.navigate('Chat', { chatId: chat.id, contact: chat.contact });
    console.log('Abrir chat:', chat.contact.name);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    // TODO: Implementar busca em tempo real
  };

  const getFilteredChats = () => {
    if (!searchQuery.trim()) return chats;
    
    return chats.filter(chat => 
      chat.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.needContext.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
          accessible={true}
          accessibilityLabel="Buscar conversas"
          accessibilityHint="Digite para procurar por conversas ou mensagens"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
            accessible={true}
            accessibilityLabel="Limpar busca"
            accessibilityRole="button"
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderChatItem = (chat) => (
    <TouchableOpacity
      key={chat.id}
      style={[styles.chatItem, isDesktop && styles.chatItemDesktop]}
      onPress={() => handleChatPress(chat)}
      accessible={true}
      accessibilityLabel={`Conversa com ${chat.contact.name}`}
      accessibilityHint={`Última mensagem: ${chat.lastMessage.text}`}
      accessibilityRole="button"
    >
      {/* Avatar e status online */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: chat.contact.avatar }} style={styles.avatar} />
        {chat.contact.isOnline && <View style={styles.onlineIndicator} />}
        {chat.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* Informações da conversa */}
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.contactName} numberOfLines={1}>
            {chat.contact.name}
          </Text>
          <Text style={styles.timestamp}>
            {chat.lastMessage.timestamp}
          </Text>
        </View>

        {/* Contexto da necessidade */}
        <View style={styles.needContextContainer}>
          <View style={[
            styles.urgencyDot,
            { backgroundColor: getUrgencyColor(chat.needContext.urgency) }
          ]} />
          <Text style={styles.needContextText} numberOfLines={1}>
            {chat.needContext.title}
          </Text>
        </View>

        {/* Última mensagem */}
        <Text 
          style={[
            styles.lastMessage,
            !chat.lastMessage.isRead && chat.lastMessage.senderId !== 0 && styles.unreadMessage
          ]} 
          numberOfLines={2}
        >
          {chat.lastMessage.senderId === 0 ? 'Você: ' : ''}
          {chat.lastMessage.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
      <Text style={styles.emptyDescription}>
        {searchQuery.trim() 
          ? 'Nenhuma conversa encontrada com esse termo'
          : 'Suas conversas sobre doações aparecerão aqui'
        }
      </Text>
    </View>
  );

  const renderChatList = () => {
    const filteredChats = getFilteredChats();

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando conversas...</Text>
        </View>
      );
    }

    if (filteredChats.length === 0) {
      return renderEmptyState();
    }

    return (
      <ScrollView 
        style={styles.chatList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isDesktop ? undefined : {
            refreshing: refreshing,
            onRefresh: handleRefresh,
            tintColor: colors.primary,
          }
        }
      >
        {filteredChats.map(renderChatItem)}
      </ScrollView>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <Text style={styles.headerTitle}>Mensagens</Text>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => {
          // TODO: Abrir menu ou nova conversa
          console.log('Nova conversa');
        }}
        accessible={true}
        accessibilityLabel="Nova conversa"
        accessibilityRole="button"
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
      
      {/* Área principal para mostrar chat selecionado */}
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
    justifyContent: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  desktopSidebar: {
    width: 400,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginRight: 20,
  },
  desktopChatArea: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  desktopPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  placeholderDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  headerDesktop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
    fontSize: 18,
    color: colors.white,
  },

  // Busca
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  searchContainerDesktop: {
    paddingHorizontal: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 4,
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
    fontSize: 12,
    color: colors.white,
  },

  // Lista de chats
  chatList: {
    flex: 1,
    backgroundColor: colors.white,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    alignItems: 'flex-start',
    minHeight: 80,
  },
  chatItemDesktop: {
    paddingVertical: 12,
    minHeight: 70,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.secondary,
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
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },

  // Informações do chat
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  needContextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  needContextText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  unreadMessage: {
    color: colors.textPrimary,
    fontWeight: '500',
  },

  // Estados vazios
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});

export default ChatListScreen;
