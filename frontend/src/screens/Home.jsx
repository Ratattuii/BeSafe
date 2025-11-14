import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import useWebScroll from '../utils/useWebScroll';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');
const isDesktop = width > 768;

const Home = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Obter dados do usuário logado e função de logout
  const { user, logout } = useAuth();
  
  // Estados para dropdowns
  const [showUrgencyFilter, setShowUrgencyFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [selectedUrgency, setSelectedUrgency] = useState('Todos');
  const [selectedType, setSelectedType] = useState('Todos');
  
  // Opções dos filtros
  const urgencyOptions = ['Todos', 'Urgente', 'Alta', 'Média', 'Baixa'];
  const typeOptions = ['Todos', 'Alimentos', 'Roupas', 'Medicamentos', 'Móveis', 'Outros'];

  // Estados para dados reais
  const [feedData, setFeedData] = useState([]);
  const [followedInstitutions, setFollowedInstitutions] = useState([]);
  const [needStats, setNeedStats] = useState({}); // { needId: { likes, comments, shares, userLiked } }
  const [commentsModal, setCommentsModal] = useState({ visible: false, needId: null, comments: [] });
  const [commentText, setCommentText] = useState('');
  

  // Scroll será habilitado via CSS puro

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carrega necessidades e instituições seguidas em paralelo
      const [needsResponse, followedResponse] = await Promise.all([
        api.getNeeds({ limit: 20 }),
        api.getFollowedInstitutions()
      ]);
      
      if (needsResponse.success) {
        const needs = needsResponse.data.needs || [];
        setFeedData(needs);
        
        // Carrega estatísticas para cada necessidade (com tratamento de erro individual)
        const statsMap = {};
        for (const need of needs) {
          try {
            const statsResponse = await api.getNeedStats(need.id);
            if (statsResponse.success && statsResponse.data) {
              statsMap[need.id] = statsResponse.data;
            } else {
              statsMap[need.id] = { likes: 0, comments: 0, shares: 0, userLiked: false };
            }
          } catch (err) {
            console.error(`Erro ao carregar stats da necessidade ${need.id}:`, err);
            statsMap[need.id] = { likes: 0, comments: 0, shares: 0, userLiked: false };
          }
        }
        setNeedStats(statsMap);
      }
      
      if (followedResponse.success) {
        setFollowedInstitutions(followedResponse.data.institutions || []);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critica': return '#FF1744';
      case 'alta': return '#FF9800';
      case 'media': return '#FFC107';
      case 'baixa': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Funções de navegação
  const handleProfilePress = () => {
    navigation.navigate('DonorProfile');
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log('🚪 Logout realizado - voltando para Splash');
      // Não precisa navegar, o AuthContext vai automaticamente mostrar AuthNavigator
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const handleNotificationsPress = () => {
    // Navega para a tab de Notificações
    navigation.getParent()?.navigate('Notifications');
  };

  const handleSearchPress = () => {
    // Navega para a tab de Busca
    navigation.getParent()?.navigate('Search');
  };

  const handleNavigation = (screen) => {
    switch (screen) {
      case 'Início':
        // Já estamos na Home
        break;
      case 'Doações':
        navigation.navigate('PostDonation');
        break;
      case 'Instituições':
        navigation.navigate('InstitutionList');
        break;
      case 'Sobre':
        // Tela Sobre não existe ainda, remover ou criar
        console.log('Tela Sobre ainda não implementada');
        break;
      default:
        break;
    }
  };

  // Funções dos filtros
  const handleUrgencySelect = async (urgency) => {
    setSelectedUrgency(urgency);
    setShowUrgencyFilter(false);
    await applyFilters(urgency, selectedType);
  };

  const handleTypeSelect = async (type) => {
    setSelectedType(type);
    setShowTypeFilter(false);
    await applyFilters(selectedUrgency, type);
  };

  const applyFilters = async (urgency, type) => {
    try {
      setLoading(true);
      
      const filters = {};
      
      // Mapeia opções para valores da API
      if (urgency !== 'Todos') {
        const urgencyMap = {
          'Urgente': 'critica',
          'Alta': 'alta',
          'Média': 'media',
          'Baixa': 'baixa'
        };
        filters.urgency = urgencyMap[urgency];
      }
      
      if (type !== 'Todos') {
        const typeMap = {
          'Alimentos': 'alimentos',
          'Roupas': 'roupas',
          'Medicamentos': 'medicamentos',
          'Móveis': 'materiais',
          'Outros': 'outros'
        };
        filters.category = typeMap[type];
      }
      
      const response = await api.getNeeds({ ...filters, limit: 20 });
      
      if (response.success) {
        setFeedData(response.data.needs || []);
      }
      
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      Alert.alert('Erro', 'Erro ao aplicar filtros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationPress = () => {
    // TODO: Implementar seleção de localização
    console.log('Filtro de localização pressionado');
  };

  // Funções dos botões do feed
  const handleLikePress = async (postId) => {
    try {
      console.log('Curtindo post:', postId);
      const response = await api.toggleNeedLike(postId);
      console.log('Resposta do like:', response);
      
      if (response.success && response.data) {
        // Atualiza estatísticas localmente
        setNeedStats(prev => ({
          ...prev,
          [postId]: {
            ...(prev[postId] || { likes: 0, comments: 0, shares: 0, userLiked: false }),
            likes: response.data.likesCount || 0,
            userLiked: response.data.liked || false
          }
        }));
      } else {
        console.error('Resposta de like não teve sucesso:', response);
        Alert.alert('Erro', response.message || 'Não foi possível curtir. Verifique se você está logado.');
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
      Alert.alert('Erro', 'Não foi possível curtir. Verifique sua conexão e tente novamente.');
    }
  };

  const handleCommentPress = async (postId) => {
    try {
      console.log('Carregando comentários do post:', postId);
      // Carrega comentários
      const response = await api.getNeedComments(postId);
      console.log('Resposta dos comentários:', response);
      
      if (response.success) {
        setCommentsModal({
          visible: true,
          needId: postId,
          comments: response.data.comments || []
        });
      } else {
        console.error('Erro ao carregar comentários:', response);
        // Ainda abre o modal mesmo se não conseguir carregar
        setCommentsModal({
          visible: true,
          needId: postId,
          comments: []
        });
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      // Ainda abre o modal mesmo com erro
      setCommentsModal({
        visible: true,
        needId: postId,
        comments: []
      });
    }
  };

  const handleSharePress = async (postId) => {
    try {
      console.log('Compartilhando post:', postId);
      const response = await api.shareNeed(postId);
      console.log('Resposta do share:', response);
      
      if (response.success && response.data) {
        // Atualiza estatísticas localmente
        setNeedStats(prev => ({
          ...prev,
          [postId]: {
            ...(prev[postId] || { likes: 0, comments: 0, shares: 0, userLiked: false }),
            shares: response.data.sharesCount || ((prev[postId]?.shares || 0) + 1)
          }
        }));
        Alert.alert('Sucesso', 'Post compartilhado!');
      } else {
        console.error('Resposta de share não teve sucesso:', response);
        Alert.alert('Erro', response.message || 'Não foi possível compartilhar. Verifique se você está logado.');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar. Verifique sua conexão e tente novamente.');
    }
  };

  const handleAddComment = async (needId, text) => {
    if (!text.trim()) return;
    
    try {
      const response = await api.addNeedComment(needId, text);
      if (response.success) {
        setCommentText('');
        // Recarrega comentários
        const commentsResponse = await api.getNeedComments(needId);
        if (commentsResponse.success) {
          setCommentsModal(prev => ({
            ...prev,
            comments: commentsResponse.data.comments || []
          }));
          // Atualiza contador de comentários
          setNeedStats(prev => ({
            ...prev,
            [needId]: {
              ...prev[needId],
              comments: (prev[needId]?.comments || 0) + 1
            }
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      Alert.alert('Erro', 'Não foi possível adicionar comentário.');
    }
  };

  const handleDonatePress = (need) => {
    console.log('Doar para:', need.institution_name, 'Need:', need.id);
    navigation.navigate('PostDonation', { 
      needId: need.id,
      institutionId: need.institution_id, 
      institutionName: need.institution_name,
      needTitle: need.title
    });
  };

  const handleInstitutionPress = (need) => {
    console.log('Ver perfil da instituição:', need.institution_name);
    navigation.navigate('InstitutionProfile', { 
      institutionId: need.institution_id,
      institutionName: need.institution_name 
    });
  };

  const handleSidebarInstitutionPress = (institution) => {
    console.log('Ver instituição seguida:', institution.name);
    navigation.navigate('InstitutionProfile', { 
      institutionId: institution.id,
      institutionName: institution.name 
    });
  };

  const handleSeeAllInstitutions = () => {
    console.log('Ver todas as instituições');
    navigation.navigate('InstitutionList');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>BeSafe</Text>
        {user && (
          <Text style={styles.userWelcome}>
            Olá, {user.name}! ({user.role === 'donor' ? 'Doador' : 'Instituição'})
          </Text>
        )}
      </View>
      
      <View style={styles.centerContent}>
        <View style={styles.nav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation('Início')}>
            <Text style={[styles.navText, styles.activeNavText]}>Início</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation('Doações')}>
            <Text style={styles.navText}>Doações</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation('Instituições')}>
            <Text style={styles.navText}>Instituições</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation('Sobre')}>
            <Text style={styles.navText}>Sobre</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
          <Text style={styles.searchPlaceholder}>🔍 Buscar necessidades ou instituições...</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconButton} onPress={handleNotificationsPress}>
          <Text style={styles.icon}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
          <Text style={styles.icon}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity 
        style={styles.filterButton} 
        onPress={() => setShowUrgencyFilter(true)}
      >
        <Text style={styles.filterText}>
          {selectedUrgency === 'Todos' ? 'Urgência' : selectedUrgency} ▼
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setShowTypeFilter(true)}
      >
        <Text style={styles.filterText}>
          {selectedType === 'Todos' ? 'Tipo de Item' : selectedType} ▼
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton} onPress={handleLocationPress}>
        <Text style={styles.filterText}>📍 Localização</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFeedCard = (item) => (
    <View key={item.id} style={styles.feedCard}>
      <TouchableOpacity 
        style={styles.feedHeader}
        onPress={() => handleInstitutionPress(item)}
      >
        <View style={styles.institutionInfo}>
          <View style={styles.institutionAvatar}>
            <Text style={styles.avatarText}>{item.institution_name.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.institutionName}>{item.institution_name}</Text>
            <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {item.image && (
        <Image source={{ uri: item.image }} style={styles.feedImage} />
      )}

      <View style={styles.feedContent}>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
          <Text style={styles.urgencyText}>{item.urgency}</Text>
        </View>
        
        <Text style={styles.feedTitle}>{item.title}</Text>
        <Text style={styles.feedDescription}>{item.description}</Text>
        
        {item.quantity_needed && (
          <Text style={styles.quantityText}>
            Quantidade necessária: {item.quantity_needed} {item.unit || 'unidades'}
          </Text>
        )}
        
        <View style={styles.feedActions}>
          <View style={styles.socialStats}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleLikePress(item.id)}
            >
              <Text style={styles.socialIcon}>
                {needStats[item.id]?.userLiked ? '❤️' : '🤍'}
              </Text>
              <Text style={styles.socialCount}>
                {needStats[item.id]?.likes || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleCommentPress(item.id)}
            >
              <Text style={styles.socialIcon}>💬</Text>
              <Text style={styles.socialCount}>
                {needStats[item.id]?.comments || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSharePress(item.id)}
            >
              <Text style={styles.socialIcon}>📤</Text>
              <Text style={styles.socialCount}>
                {needStats[item.id]?.shares || 0}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.donateButton}
            onPress={() => handleDonatePress(item)}
          >
            <Text style={styles.donateButtonText}>Doar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>Instituições Seguidas</Text>
        <TouchableOpacity onPress={handleSeeAllInstitutions}>
          <Text style={styles.seeAllText}>Ver todas</Text>
        </TouchableOpacity>
      </View>
      
      {followedInstitutions.map((institution) => (
        <TouchableOpacity 
          key={institution.id} 
          style={styles.institutionItem}
          onPress={() => handleSidebarInstitutionPress(institution)}
        >
          <View style={styles.institutionIcon}>
            <View style={[styles.urgencyDot, { backgroundColor: '#4CAF50' }]} />
          </View>
          <View style={styles.institutionDetails}>
            <Text style={styles.institutionItemName}>{institution.name}</Text>
            <Text style={[styles.institutionUrgency, { color: '#4CAF50' }]}>
              {institution.active_needs_count || 0} necessidades ativas
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1434" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      
      {renderHeader()}
      {renderFilters()}
      
      <View style={styles.mainContent}>
        <View style={styles.feedContainer}>
          <ScrollView
            style={[styles.scrollView, { className: 'main-scroll' }]}
            contentContainerStyle={styles.feedScrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF1434']} />
            }
          >
            {feedData.map(renderFeedCard)}
          </ScrollView>
        </View>
        
        {isDesktop && renderSidebar()}
      </View>
      
      {/* Modal de filtro de urgência */}
      <Modal
        visible={showUrgencyFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUrgencyFilter(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowUrgencyFilter(false)}
        >
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>Filtrar por Urgência</Text>
            {urgencyOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownItem,
                  selectedUrgency === option && styles.selectedDropdownItem
                ]}
                onPress={() => handleUrgencySelect(option)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedUrgency === option && styles.selectedDropdownItemText
                ]}>
                  {option}
                </Text>
                {selectedUrgency === option && <Text style={styles.checkIcon}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de filtro de tipo */}
      <Modal
        visible={showTypeFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTypeFilter(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowTypeFilter(false)}
        >
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>Filtrar por Tipo</Text>
            {typeOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownItem,
                  selectedType === option && styles.selectedDropdownItem
                ]}
                onPress={() => handleTypeSelect(option)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedType === option && styles.selectedDropdownItemText
                ]}>
                  {option}
                </Text>
                {selectedType === option && <Text style={styles.checkIcon}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de comentários */}
      <Modal
        visible={commentsModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCommentsModal({ visible: false, needId: null, comments: [] })}
      >
        <View style={styles.commentsModalOverlay}>
          <View style={styles.commentsModalContainer}>
            <View style={styles.commentsModalHeader}>
              <Text style={styles.commentsModalTitle}>Comentários</Text>
              <TouchableOpacity
                onPress={() => setCommentsModal({ visible: false, needId: null, comments: [] })}
              >
                <Text style={styles.commentsModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.commentsList}>
              {commentsModal.comments.length === 0 ? (
                <Text style={styles.noCommentsText}>Nenhum comentário ainda. Seja o primeiro!</Text>
              ) : (
                commentsModal.comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Image 
                      source={{ uri: comment.user_avatar || 'https://via.placeholder.com/40' }} 
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUserName}>{comment.user_name || 'Usuário'}</Text>
                      <Text style={styles.commentText}>{comment.comment}</Text>
                      <Text style={styles.commentDate}>
                        {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Adicione um comentário..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={() => {
                  if (commentText.trim() && commentsModal.needId) {
                    handleAddComment(commentsModal.needId, commentText);
                  }
                }}
              />
              <TouchableOpacity
                style={[styles.commentSendButton, !commentText.trim() && styles.commentSendButtonDisabled]}
                onPress={() => {
                  if (commentText.trim() && commentsModal.needId) {
                    handleAddComment(commentsModal.needId, commentText);
                  }
                }}
                disabled={!commentText.trim()}
              >
                <Text style={styles.commentSendButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 50,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    width: 120,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  navItem: {
    marginHorizontal: 16,
  },
  navText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    justifyContent: 'flex-end',
  },
  searchContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 400,
    maxWidth: 500,
  },
  searchPlaceholder: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  icon: {
    fontSize: 18,
  },
  logoutButton: {
    backgroundColor: '#FF1434',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  feedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  webScrollView: {
    flex: 1,
  },
  feedScrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100, // Mais espaço no final para garantir que último post apareça completo
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  feedHeader: {
    padding: 16,
  },
  institutionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  institutionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF1434',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  institutionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  feedImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  feedContent: {
    padding: 16,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  feedDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 8,
  },
  quantityText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  feedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialStats: {
    flexDirection: 'row',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  socialIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  socialCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  donateButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sidebar: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    padding: 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  institutionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  institutionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  institutionDetails: {
    flex: 1,
  },
  institutionItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  institutionUrgency: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Estilos para navegação ativa
  activeNavText: {
    color: '#FF1434',
    fontWeight: '600',
  },
  
  // Estilos para modais de dropdown
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    maxWidth: 300,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedDropdownItem: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FF1434',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedDropdownItemText: {
    color: '#FF1434',
    fontWeight: '600',
  },
  checkIcon: {
    fontSize: 16,
    color: '#FF1434',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF1434',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal de comentários
  commentsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  commentsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  commentsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  commentsModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  commentsModalClose: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  commentsList: {
    flex: 1,
    padding: 20,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 40,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentInputContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  commentSendButton: {
    backgroundColor: '#FF1434',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  commentSendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  commentSendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Home;