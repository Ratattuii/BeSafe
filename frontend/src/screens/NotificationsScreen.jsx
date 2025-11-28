import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../styles/globalStyles';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('todas');
  
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { user } = useAuth();

  // DEBUG: Log inicial do componente
  console.log('🔍 [NOTIFICATIONS SCREEN] ===== COMPONENTE INICIADO =====');
  console.log('🔍 [NOTIFICATIONS SCREEN] User:', user ? `ID: ${user.id}, Role: ${user.role}` : 'Nenhum usuário');
  console.log('🔍 [NOTIFICATIONS SCREEN] Estado inicial - loading:', loading, 'notifications:', notifications.length);

  // Tipos de notificação
  const notificationTypes = {
    donation: {
      icon: '🎁',
      color: colors.success,
      title: 'Doação recebida'
    },
    message: {
      icon: '💬',
      color: colors.info,
      title: 'Nova mensagem'
    },
    follow: {
      icon: '👥',
      color: colors.primary,
      title: 'Novo seguidor'
    },
    need_update: {
      icon: '📝',
      color: colors.warning,
      title: 'Atualização de necessidade'
    },
    system: {
      icon: '🔔',
      color: colors.secondary,
      title: 'Notificação do sistema'
    }
  };

  const filters = [
    { id: 'todas', label: 'Todas' },
    { id: 'nao_lidas', label: 'Não lidas' },
    { id: 'lidas', label: 'Lidas' },
  ];

  // Função para obter avatar padrão
  const getDefaultAvatar = (notification) => {
    const initials = notification.related_user_name 
      ? notification.related_user_name.charAt(0).toUpperCase()
      : 'U';
    
    return `https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=${initials}`;
  };

  // Função para obter dados de ação
  const getActionData = (notification) => {
    switch (notification.type) {
      case 'donation':
        return { donationId: notification.related_id };
      case 'message':
        return { userId: notification.related_id };
      case 'follow':
        return { userId: notification.related_id };
      case 'need_update':
        return { needId: notification.related_id };
      default:
        return {};
    }
  };

  // Formatar notificações da API
  const formatNotifications = (apiNotifications) => {
    console.log('🔍 [NOTIFICATIONS SCREEN] Formatando notificações da API...');
    
    if (!apiNotifications) {
      console.log('❌ [NOTIFICATIONS SCREEN] apiNotifications é undefined/null');
      return [];
    }
    
    if (!Array.isArray(apiNotifications)) {
      console.log('❌ [NOTIFICATIONS SCREEN] apiNotifications não é array:', typeof apiNotifications);
      return [];
    }
    
    console.log(`🔍 [NOTIFICATIONS SCREEN] Recebidas ${apiNotifications.length} notificações da API`);
    
    const formatted = apiNotifications.map(notification => {
      console.log('🔍 [NOTIFICATIONS SCREEN] Processando notificação:', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        is_read: notification.is_read
      });
      
      return {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.created_at,
        isRead: notification.is_read,
        readAt: notification.read_at,
        avatar: notification.related_user_avatar || getDefaultAvatar(notification),
        actionData: getActionData(notification),
        relatedUserId: notification.related_id,
        relatedUserName: notification.related_user_name
      };
    });
    
    console.log('🔍 [NOTIFICATIONS SCREEN] Notificações formatadas:', formatted.length);
    return formatted;
  };

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    console.log('🔍 [NOTIFICATIONS SCREEN] ===== INICIANDO CARREGAMENTO =====');
    console.log('🔍 [NOTIFICATIONS SCREEN] User no loadNotifications:', user ? `ID: ${user.id}` : 'Nenhum usuário');
    
    try {
      setError(null);
      setLoading(true);
      
      console.log('🔍 [NOTIFICATIONS SCREEN] Fazendo requisição para API...');
      const response = await api.getNotifications();
      
      console.log('🔍 [NOTIFICATIONS SCREEN] Resposta da API:', {
        success: response?.success,
        message: response?.message,
        dataExists: !!response?.data,
        notificationsCount: response?.data?.notifications?.length
      });
      
      if (response && response.success) {
        console.log('✅ [NOTIFICATIONS SCREEN] API retornou sucesso');
        console.log(`📨 [NOTIFICATIONS SCREEN] ${response.data.notifications?.length} notificações recebidas`);
        
        const formattedNotifications = formatNotifications(response.data.notifications);
        
        console.log('🔍 [NOTIFICATIONS SCREEN] Definindo estado com notificações...');
        setNotifications(formattedNotifications);
        
        // DEBUG: Log detalhado das notificações
        if (formattedNotifications.length > 0) {
          console.log('📋 [NOTIFICATIONS SCREEN] DETALHES DAS NOTIFICAÇÕES:');
          formattedNotifications.forEach((notif, index) => {
            console.log(`   ${index + 1}. ${notif.title} (${notif.type}) - ${notif.isRead ? 'LIDA' : 'NÃO LIDA'}`);
          });
        } else {
          console.log('ℹ️ [NOTIFICATIONS SCREEN] Nenhuma notificação para exibir');
        }
        
      } else {
        console.log('❌ [NOTIFICATIONS SCREEN] API retornou erro:', response?.message);
        throw new Error(response?.message || 'Erro ao carregar notificações');
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS SCREEN] Erro no carregamento:', {
        message: error.message,
        stack: error.stack
      });
      setError(error.message);
      setNotifications([]);
    } finally {
      console.log('🔍 [NOTIFICATIONS SCREEN] Finalizando carregamento, loading: false');
      setLoading(false);
    }
  }, []);

  // Carregar notificações iniciais
  useEffect(() => {
    console.log('🔍 [NOTIFICATIONS SCREEN] useEffect executado');
    console.log('🔍 [NOTIFICATIONS SCREEN] User no useEffect:', user ? `ID: ${user.id}` : 'Nenhum usuário');
    
    if (user) {
      console.log('🔍 [NOTIFICATIONS SCREEN] Usuário autenticado, carregando notificações...');
      loadNotifications();
    } else {
      console.log('🔍 [NOTIFICATIONS SCREEN] Nenhum usuário, pulando carregamento');
      setLoading(false);
    }
  }, [user, loadNotifications]);

  // DEBUG: Log quando o estado muda
  useEffect(() => {
    console.log('🔍 [NOTIFICATIONS SCREEN] Estado atualizado - notifications:', notifications.length, 'loading:', loading, 'error:', error);
  }, [notifications, loading, error]);

  const handleRefresh = async () => {
    console.log('🔍 [NOTIFICATIONS SCREEN] ===== INICIANDO REFRESH =====');
    setRefreshing(true);
    try {
      await loadNotifications();
    } catch (error) {
      console.error('❌ [NOTIFICATIONS SCREEN] Erro no refresh:', error);
      Alert.alert('Erro', 'Não foi possível atualizar as notificações');
    } finally {
      console.log('🔍 [NOTIFICATIONS SCREEN] Finalizando refresh');
      setRefreshing(false);
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notificationId) => {
    console.log('🔍 [NOTIFICATIONS SCREEN] Marcando notificação como lida:', notificationId);
    try {
      const response = await api.markNotificationAsRead(notificationId);
      
      if (response.success) {
        console.log('✅ [NOTIFICATIONS SCREEN] Notificação marcada como lida com sucesso');
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
      } else {
        console.log('❌ [NOTIFICATIONS SCREEN] Erro na API ao marcar como lida:', response.message);
        throw new Error(response.message || 'Erro ao marcar como lida');
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS SCREEN] Erro ao marcar notificação como lida:', error);
      Alert.alert('Erro', 'Não foi possível marcar a notificação como lida');
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    console.log('🔍 [NOTIFICATIONS SCREEN] Marcando TODAS as notificações como lidas');
    try {
      const response = await api.markAllNotificationsAsRead();
      
      if (response.success) {
        console.log('✅ [NOTIFICATIONS SCREEN] Todas as notificações marcadas como lidas');
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        Alert.alert('Sucesso', 'Todas as notificações foram marcadas como lidas');
      } else {
        console.log('❌ [NOTIFICATIONS SCREEN] Erro na API ao marcar todas:', response.message);
        throw new Error(response.message || 'Erro ao marcar todas como lidas');
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS SCREEN] Erro ao marcar todas as notificações como lidas:', error);
      Alert.alert('Erro', 'Não foi possível marcar todas as notificações como lidas');
    }
  };

  const handleNotificationPress = async (notification) => {
    console.log('🔍 [NOTIFICATIONS SCREEN] Clicou na notificação:', {
      id: notification.id,
      title: notification.title,
      type: notification.type,
      isRead: notification.isRead
    });

    // Marcar como lida se não estiver lida
    if (!notification.isRead) {
      console.log('🔍 [NOTIFICATIONS SCREEN] Notificação não lida, marcando como lida...');
      await markAsRead(notification.id);
    }

    // Navegação simplificada para evitar erros
    console.log('🔍 [NOTIFICATIONS SCREEN] Navegando para tela baseada no tipo:', notification.type);
    switch (notification.type) {
      case 'donation':
        navigation.navigate('MyDonations');
        break;
      case 'message':
        navigation.navigate('Conversations');
        break;
      case 'follow':
        if (user?.role === 'institution') {
          navigation.navigate('Donors');
        } else {
          navigation.navigate('Institutions');
        }
        break;
      case 'need_update':
        navigation.navigate('Needs');
        break;
      default:
        Alert.alert(notification.title, notification.message);
    }
  };

  const getFilteredNotifications = () => {
    const filtered = filter === 'nao_lidas' 
      ? notifications.filter(notif => !notif.isRead)
      : filter === 'lidas' 
      ? notifications.filter(notif => notif.isRead)
      : notifications;

    console.log('🔍 [NOTIFICATIONS SCREEN] Filtro aplicado:', {
      filter,
      total: notifications.length,
      filtered: filtered.length,
      naoLidas: notifications.filter(notif => !notif.isRead).length,
      lidas: notifications.filter(notif => notif.isRead).length
    });

    return filtered;
  };

  const getUnreadCount = () => {
    const count = notifications.filter(notif => !notif.isRead).length;
    console.log('🔍 [NOTIFICATIONS SCREEN] Contagem de não lidas:', count);
    return count;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Data não disponível';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now - date;
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) {
        return 'Agora há pouco';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}min atrás`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h atrás`;
      } else if (diffInDays === 1) {
        return 'Ontem';
      } else if (diffInDays < 7) {
        return `${diffInDays}d atrás`;
      } else {
        return date.toLocaleDateString('pt-BR');
      }
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getNotificationConfig = (type) => {
    return notificationTypes[type] || {
      icon: '🔔',
      color: colors.primary,
      title: 'Notificação'
    };
  };

  const renderHeader = () => (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            console.log('🔍 [NOTIFICATIONS SCREEN] Voltando...');
            navigation.goBack();
          }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        {getUnreadCount() > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{getUnreadCount()}</Text>
          </View>
        )}
      </View>
      {getUnreadCount() > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={() => {
            console.log('🔍 [NOTIFICATIONS SCREEN] Clicou em "Marcar todas como lidas"');
            markAllAsRead();
          }}
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
          onPress={() => {
            console.log('🔍 [NOTIFICATIONS SCREEN] Alterando filtro para:', filterOption.id);
            setFilter(filterOption.id);
          }}
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
    const typeConfig = getNotificationConfig(notification.type);

    console.log('🔍 [NOTIFICATIONS SCREEN] Renderizando item:', {
      id: notification.id,
      title: notification.title,
      type: notification.type
    });

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          !notification.isRead && styles.unreadNotification,
          isDesktop && styles.notificationItemDesktop,
        ]}
        onPress={() => handleNotificationPress(notification)}
      >
        {!notification.isRead && <View style={styles.unreadIndicator} />}

        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: notification.avatar }} 
            style={styles.avatar}
            onError={() => console.log('❌ [NOTIFICATIONS SCREEN] Erro ao carregar avatar da notificação:', notification.id)}
          />
          <View style={[styles.typeIcon, { backgroundColor: typeConfig.color }]}>
            <Text style={styles.typeIconText}>{typeConfig.icon}</Text>
          </View>
        </View>

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

          <Text style={styles.notificationType}>
            {typeConfig.title}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleNotificationPress(notification)}
        >
          <Text style={styles.actionButtonText}>Ver</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderNotificationsList = () => {
    const filteredNotifications = getFilteredNotifications();

    console.log('🔍 [NOTIFICATIONS SCREEN] Renderizando lista - estado:', {
      loading,
      refreshing,
      error,
      filteredCount: filteredNotifications.length,
      totalCount: notifications.length
    });

    if (loading && !refreshing) {
      console.log('🔍 [NOTIFICATIONS SCREEN] Mostrando loading...');
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando notificações...</Text>
        </View>
      );
    }

    if (error && !refreshing) {
      console.log('🔍 [NOTIFICATIONS SCREEN] Mostrando erro:', error);
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Erro ao carregar</Text>
          <Text style={styles.emptyDescription}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredNotifications.length === 0) {
      console.log('🔍 [NOTIFICATIONS SCREEN] Mostrando estado vazio com filtro:', filter);
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
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Recarregar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    console.log('🔍 [NOTIFICATIONS SCREEN] Renderizando lista com', filteredNotifications.length, 'notificações');
    return (
      <ScrollView 
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

  console.log('🔍 [NOTIFICATIONS SCREEN] ===== RENDERIZANDO COMPONENTE =====');
  console.log('🔍 [NOTIFICATIONS SCREEN] Estado final - notifications:', notifications.length, 'loading:', loading, 'error:', error);

  if (isDesktop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.desktopContainer}>
          <View style={styles.desktopContent}>
            {renderHeader()}
            {renderFilters()}
            {renderNotificationsList()}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {renderHeader()}
        {renderFilters()}
        {renderNotificationsList()}
      </View>
    </SafeAreaView>
  );
};

// ESTILOS (mantenha os mesmos)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  container: {
    flex: 1,
  },
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
    maxHeight: '90%',
  },
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
  badge: {
    backgroundColor: colors.urgent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
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
  notificationsList: {
    flex: 1,
    backgroundColor: colors.white,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  notificationItemDesktop: {
    paddingHorizontal: 24,
  },
  unreadNotification: {
    backgroundColor: colors.primaryLight + '20',
  },
  unreadIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 10,
  },
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
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
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
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotificationsScreen;