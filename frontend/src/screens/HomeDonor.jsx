import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 

// Imports essenciais
import { colors, globalStyles } from '../styles/globalStyles'; 
import PostCard from '../components/PostCard'; 
import DonationOfferCard from '../components/DonationOfferCard'; 
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');
const isDesktop = width > 768;

const HomeDonor = () => { // Nome do componente alterado
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, logout } = useAuth();
  
  // Variável hardcoded para o contexto Doador
  const isInstitution = false; 

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
  const [needStats, setNeedStats] = useState({});
  const [commentsModal, setCommentsModal] = useState({ visible: false, needId: null, comments: [] });
  const [commentText, setCommentText] = useState('');
  

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let needsResponse = { success: false, data: {} };
      let followedResponse = { success: false, data: {} };
      
      // LÓGICA DOADOR: Buscar NECESSIDADES (Needs) e Instituições Seguidas
      [needsResponse, followedResponse] = await Promise.all([
          api.getNeeds({ limit: 20 }),
          api.getFollowedInstitutions()
      ]);
      setFeedData(needsResponse.data.needs || []);

      // Processamento de dados
      if (needsResponse.success) {
        const needs = needsResponse.data.needs || [];
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
            statsMap[need.id] = { likes: 0, comments: 0, shares: 0, userLiked: false };
          }
        }
        setNeedStats(statsMap);
      }

      if (followedResponse.success) {
        setFollowedInstitutions(followedResponse.data.institutions || []);
      }
      
    } catch (error) {
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
  	}
  }, [user]); 

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      navigation.getParent()?.navigate('Profile');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const handleNotificationsPress = () => {
    navigation.getParent()?.navigate('Notifications');
  };

  const handleSearchPress = () => {
    navigation.getParent()?.navigate('Search');
  };

  const handleNavigation = (screen) => {
    switch (screen) {
      case 'Doações':
        navigation.navigate('PostDonation');
        break;
      case 'Instituições':
        navigation.navigate('InstitutionList');
        break;
      default:
        break;
    }
  };

  // Funções dos filtros (Aplicáveis a Doador/Needs)
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
      Alert.alert('Erro', 'Erro ao aplicar filtros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationPress = () => {
    console.log('Filtro de localização pressionado');
  };

  // Funções dos botões do feed (DOADOR)
  const handleLikePress = async (postId) => {
    try {
      const response = await api.toggleNeedLike(postId);
      
      if (response.success && response.data) {
        setNeedStats(prev => ({
          ...prev,
          [postId]: {
            ...(prev[postId] || { likes: 0, comments: 0, shares: 0, userLiked: false }),
            likes: response.data.likesCount || 0,
            userLiked: response.data.liked || false
          }
        }));
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível curtir. Verifique se você está logado.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível curtir. Verifique sua conexão e tente novamente.');
    }
  };

  const handleCommentPress = async (postId) => {
    try {
      const response = await api.getNeedComments(postId);
      
      if (response.success) {
        setCommentsModal({
          visible: true,
          needId: postId,
          comments: response.data.comments || []
        });
      } else {
        setCommentsModal({
          visible: true,
          needId: postId,
          comments: []
        });
      }
    } catch (error) {
      setCommentsModal({
        visible: true,
        needId: postId,
        comments: []
      });
    }
  };

  const handleSharePress = async (postId) => {
    try {
      const response = await api.shareNeed(postId);
      
      if (response.success && response.data) {
        setNeedStats(prev => ({
          ...prev,
          [postId]: {
            ...(prev[postId] || { likes: 0, comments: 0, shares: 0, userLiked: false }),
            shares: response.data.sharesCount || ((prev[postId]?.shares || 0) + 1)
          }
        }));
        Alert.alert('Sucesso', 'Post compartilhado!');
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível compartilhar. Verifique se você está logado.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar. Verifique sua conexão e tente novamente.');
    }
  };

  const handleAddComment = async (needId, text) => {
    if (!text.trim()) return;
    
    try {
      const response = await api.addNeedComment(needId, text);
      if (response.success) {
        setCommentText('');
        const commentsResponse = await api.getNeedComments(needId);
        if (commentsResponse.success) {
          setCommentsModal(prev => ({
            ...prev,
            comments: commentsResponse.data.comments || []
          }));
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
      Alert.alert('Erro', 'Não foi possível adicionar comentário.');
    }
  };

  const handleDonatePress = (need) => {
    navigation.navigate('PostDonation', { 
      needId: need.id,
      institutionId: need.institution_id, 
      institutionName: need.institution_name,
      needTitle: need.title
    });
  };

  const handleInstitutionPress = (item) => {
    // Doador clica em uma necessidade, navegamos para o perfil público da instituição
    navigation.navigate('InstitutionProfile', { institutionId: item.institution_id });
  };

  const handleSidebarInstitutionPress = (institution) => {
    navigation.navigate('InstitutionProfile', { 
      institutionId: institution.id,
      institutionName: institution.name 
    });
  };

  const handleSeeAllInstitutions = () => {
    navigation.navigate('InstitutionList');
  };

  // Renderiza o cartão (apenas PostCard para Doador)
  const renderFeedCard = ({ item }) => {
    const stats = needStats[item.id] || { likes: 0, comments: 0, shares: 0, userLiked: false };
    
    return (
        <PostCard 
            key={item.id}
            post={item}
            stats={stats}
            getUrgencyColor={getUrgencyColor}
            formatDate={formatDate}
            onInstitutionPress={() => handleInstitutionPress(item)}
            onLikePress={() => handleLikePress(item.id)}
            onCommentPress={() => handleCommentPress(item.id)}
            onSharePress={() => handleSharePress(item.id)}
            onDonatePress={() => handleDonatePress(item)}
        />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>BeSafe</Text>
        {user && (
          <Text style={styles.userWelcome}>
            Olá, {user.name}! (Doador)
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      
      {renderHeader()}
      {renderFilters()}
      
      <View style={styles.mainContent}>
        <View style={styles.feedContainer}>
          <FlatList
            data={feedData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFeedCard}
            ListEmptyComponent={(
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>Nenhuma Necessidade disponível.</Text>
                </View>
            )}
            contentContainerStyle={styles.feedScrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
          />
        </View>
        
        {isDesktop && renderSidebar()}
      </View>
      
      {/* Modais omitidos para brevidade, mas devem ser incluídos aqui */}

      {/* FAB Button */}
      <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate('PostDonation')}
          accessible={true}
          accessibilityLabel="Publicar nova doação"
          accessibilityRole="button"
      >
          <Text style={{color: '#fff', fontSize: 28}}>+</Text>
      </TouchableOpacity>

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
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: 120,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userWelcome: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
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
  activeNavText: {
    color: '#FF1434',
    fontWeight: '600',
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
  feedScrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF1434',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default HomeDonor;