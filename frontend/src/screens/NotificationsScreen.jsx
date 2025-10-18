import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../styles/globalStyles';
import useWebScroll from '../utils/useWebScroll';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('todas'); // todas, nao_lidas, lidas
  
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Tipos de notificação
  const notificationTypes = {
    new_need: {
      icon: '🆘',
      color: colors.urgent,
      title: 'Nova necessidade',
    },
    new_message: {
      icon: '💬',
      color: colors.info,
      title: 'Nova mensagem',
    },
    donation_received: {
      icon: '🎁',
      color: colors.success,
      title: 'Doação recebida',
    },
    need_updated: {
      icon: '📝',
      color: colors.warning,
      title: 'Necessidade atualizada',
    },
    new_follower: {
      icon: '👥',
      color: colors.primary,
      title: 'Novo seguidor',
    },
    need_fulfilled: {
      icon: '✅',
      color: colors.success,
      title: 'Necessidade atendida',
    },
  };

  // Dados mockados de notificações
  const mockNotifications = [
    {
      id: 1,
      type: 'new_need',
      title: 'Nova necessidade urgente',
      message: 'Hospital São Lucas postou uma necessidade crítica: "Medicamentos para UTI"',
      timestamp: '2023-10-01T10:30:00Z',
      isRead: false,
      avatar: 'https://via.placeholder.com/40x40/4CAF50/white?text=HS',
      actionData: {
        needId: 123,
        institutionId: 456,
      }
    },
    {
      id: 2,
      type: 'new_message',
      title: 'Mensagem de Cruz Vermelha',
      message: 'Obrigado pela doação! Os medicamentos chegaram em perfeitas condições.',
      timestamp: '2023-10-01T09:15:00Z',
      isRead: false,
      avatar: 'https://via.placeholder.com/40x40/FF1434/white?text=CV',
      actionData: {
        chatId: 789,
      }
    },
    {
      id: 3,
      type: 'donation_received',
      title: 'Doação confirmada',
      message: 'Sua doação de "Alimentos não perecíveis" foi confirmada pelo Abrigo Esperança',
      timestamp: '2023-09-30T16:45:00Z',
      isRead: true,
      avatar: 'https://via.placeholder.com/40x40/9C27B0/white?text=AE',
      actionData: {
        donationId: 321,
      }
    },
    {
      id: 4,
      type: 'need_updated',
      title: 'Necessidade atualizada',
      message: 'Lar dos Idosos atualizou a necessidade "Roupas de inverno" - 80% do objetivo atingido',
      timestamp: '2023-09-30T14:20:00Z',
      isRead: true,
      avatar: 'https://via.placeholder.com/40x40/2196F3/white?text=LI',
      actionData: {
        needId: 654,
      }
    },
    {
      id: 5,
      type: 'new_follower',
      title: 'Novo seguidor',
      message: 'João Silva começou a seguir suas doações',
      timestamp: '2023-09-29T11:10:00Z',
      isRead: true,
      avatar: 'https://via.placeholder.com/40x40/FF9800/white?text=JS',
      actionData: {
        userId: 987,
      }
    },
    {
      id: 6,
      type: 'need_fulfilled',
      title: 'Objetivo alcançado!',
      message: 'A necessidade "Água potável" que você ajudou foi 100% atendida',
      timestamp: '2023-09-28T08:30:00Z',
      isRead: true,
      avatar: 'https://via.placeholder.com/40x40/4A90E2/white?text=CV',
      actionData: {
        needId: 111,
      }
    },
  ];

  const filters = [
    { id: 'todas', label: 'Todas' },
    { id: 'nao_lidas', label: 'Não lidas' },
    { id: 'lidas', label: 'Lidas' },
  ];

  // Habilitar scroll do mouse no web
  useWebScroll('notifications-scroll');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    
    // TODO: Implementar carregamento real
    // GET /notifications
    
    // Simula carregamento
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setNotifications(mockNotifications);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    // TODO: Implementar marcação como lida
    // PUT /notifications/${notificationId}/read
    
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const markAllAsRead = async () => {
    // TODO: Implementar marcação em massa
    // PUT /notifications/mark-all-read
    
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const handleNotificationPress = (notification) => {
    // Marcar como lida
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navegar baseado no tipo
    switch (notification.type) {
      case 'new_need':
      case 'need_updated':
      case 'need_fulfilled':
        // TODO: Navegar para detalhes da necessidade
        console.log('Ver necessidade:', notification.actionData.needId);
        break;
      case 'new_message':
        // TODO: Navegar para chat
        console.log('Abrir chat:', notification.actionData.chatId);
        break;
      case 'donation_received':
        // TODO: Navegar para detalhes da doação
        console.log('Ver doação:', notification.actionData.donationId);
        break;
      case 'new_follower':
        // TODO: Navegar para perfil do usuário
        console.log('Ver perfil:', notification.actionData.userId);
        break;
      default:
        console.log('Ação não definida para tipo:', notification.type);
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'nao_lidas':
        return notifications.filter(notif => !notif.isRead);
      case 'lidas':
        return notifications.filter(notif => notif.isRead);
      default:
        return notifications;
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.isRead).length;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
      </View>
      {getUnreadCount() > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={markAllAsRead}
          accessible={true}
          accessibilityLabel="Marcar todas como lidas"
          accessibilityRole="button"
        >
          <Text style={styles.markAllButtonText}>Marcar todas como lidas</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={[styles.filtersContainer, isDesktop && styles.filtersContainerDesktop]}>
      {filters.map((filterOption) => (
        <TouchableOpacity
          key={filterOption.id}
          style={[
            styles.filterButton,
            filter === filterOption.id && styles.filterButtonActive
          ]}
          onPress={() => setFilter(filterOption.id)}
          accessible={true}
          accessibilityLabel={`Filtrar por ${filterOption.label}`}
          accessibilityRole="radio"
          accessibilityState={{ selected: filter === filterOption.id }}
        >
          <Text style={[
            styles.filterButtonText,
            filter === filterOption.id && styles.filterButtonTextActive
          ]}>
            {filterOption.label}
            {filterOption.id === 'nao_lidas' && getUnreadCount() > 0 && (
              ` (${getUnreadCount()})`
            )}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderNotificationItem = (notification) => {
    const typeConfig = notificationTypes[notification.type];

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          !notification.isRead && styles.unreadNotification,
          isDesktop && styles.notificationItemDesktop,
        ]}
        onPress={() => handleNotificationPress(notification)}
        accessible={true}
        accessibilityLabel={`${notification.title}: ${notification.message}`}
        accessibilityHint={notification.isRead ? 'Lida' : 'Não lida'}
        accessibilityRole="button"
      >
        {/* Indicador não lida */}
        {!notification.isRead && <View style={styles.unreadIndicator} />}

        {/* Avatar e ícone do tipo */}
        <View style={styles.avatarContainer}>
          <Image source={{ uri: notification.avatar }} style={styles.avatar} />
          <View style={[styles.typeIcon, { backgroundColor: typeConfig.color }]}>
            <Text style={styles.typeIconText}>{typeConfig.icon}</Text>
          </View>
        </View>

        {/* Conteúdo da notificação */}
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[
              styles.notificationTitle,
              !notification.isRead && styles.unreadTitle
            ]} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimestamp(notification.timestamp)}
            </Text>
          </View>

          <Text style={[
            styles.notificationMessage,
            !notification.isRead && styles.unreadMessage
          ]} numberOfLines={2}>
            {notification.message}
          </Text>

          {/* Tipo da notificação */}
          <Text style={styles.notificationType}>
            {typeConfig.title}
          </Text>
        </View>

        {/* Botão de ação */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleNotificationPress(notification)}
          accessible={true}
          accessibilityLabel="Ver detalhes"
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>Ver</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderNotificationsList = () => {
    const filteredNotifications = getFilteredNotifications();

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando notificações...</Text>
        </View>
      );
    }

    if (filteredNotifications.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>
            {filter === 'nao_lidas' ? 'Nenhuma notificação não lida' : 
             filter === 'lidas' ? 'Nenhuma notificação lida' : 
             'Nenhuma notificação'}
          </Text>
          <Text style={styles.emptyDescription}>
            {filter === 'todas' 
              ? 'Suas notificações aparecerão aqui'
              : 'Tente selecionar outro filtro'
            }
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        nativeID="notifications-scroll"
        style={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {filteredNotifications.map(renderNotificationItem)}
      </ScrollView>
    );
  };

  const renderMobileLayout = () => (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilters()}
      {renderNotificationsList()}
    </View>
  );

  const renderDesktopLayout = () => (
    <View style={styles.desktopContainer}>
      <View style={styles.desktopContent}>
        {renderHeader()}
        {renderFilters()}
        {renderNotificationsList()}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  desktopContent: {
    width: 700,
    maxWidth: '90%',
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    maxHeight: '90vh',
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
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 8,
  },
  backIcon: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  markAllButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Filtros
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.white,
    gap: 8,
  },
  filtersContainerDesktop: {
    paddingHorizontal: 24,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },

  // Lista de notificações
  notificationsList: {
    flex: 1,
    backgroundColor: colors.white,
  },
  webNotificationsList: {
    flex: 1,
    backgroundColor: colors.white,
    overflow: 'auto',
    maxHeight: '100%',
    padding: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    position: 'relative',
    minHeight: 80,
  },
  notificationItemDesktop: {
    paddingHorizontal: 24,
  },
  unreadNotification: {
    backgroundColor: colors.primaryLight,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  // Avatar e ícone
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
  },
  typeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  typeIconText: {
    fontSize: 8,
  },

  // Conteúdo
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  unreadMessage: {
    color: colors.textPrimary,
  },
  notificationType: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // Botão de ação
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    minHeight: 28,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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

export default NotificationsScreen;
