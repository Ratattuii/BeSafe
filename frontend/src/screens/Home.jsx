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
import { colors } from '../styles/globalStyles'; 
import PostCard from '../components/PostCard';
import DonationOfferCard from '../components/DonationOfferCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');
const isDesktop = width > 768;

const Home = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, logout } = useAuth();
  
  const isInstitution = user?.role === 'institution'; 

  // Estados para filtros (apenas doador)
  const [showUrgencyFilter, setShowUrgencyFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [selectedUrgency, setSelectedUrgency] = useState('Todos');
  const [selectedType, setSelectedType] = useState('Todos');
  
  const urgencyOptions = ['Todos', 'Urgente', 'Alta', 'Média', 'Baixa'];
  const typeOptions = ['Todos', 'Alimentos', 'Roupas', 'Medicamentos', 'Móveis', 'Outros'];

  // Estados para dados
  const [feedData, setFeedData] = useState([]);
  const [followedInstitutions, setFollowedInstitutions] = useState([]);
  const [needStats, setNeedStats] = useState({});
  const [commentsModal, setCommentsModal] = useState({ visible: false, needId: null, comments: [] });
  const [commentText, setCommentText] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      let followedResponse = { success: false, data: {} };
      
      if (isInstitution) {
        // Instituição: Buscar ofertas de doação
        response = await api.getDonationOffers();
        if (response.success) {
          setFeedData(response.data.offers || []);
        } else {
          setFeedData([]);
          setError(response.message || 'Erro ao carregar ofertas');
        }
      } else {
        // Doador: Buscar necessidades e instituições seguidas
        [response, followedResponse] = await Promise.all([
          api.getNeeds({ limit: 20 }),
          api.getFollowedInstitutions()
        ]);
        if (response.success) {
          setFeedData(response.data.needs || []);
        } else {
          setError(response.message || 'Erro ao carregar necessidades');
        }
      }

      // Estatísticas apenas para doador
      if (!isInstitution && response && response.success) {
        const needs = response.data.needs || [];
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

      if (!isInstitution && followedResponse.success) {
        setFollowedInstitutions(followedResponse.data.institutions || []);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Tente novamente.');
      setFeedData([]);
    } finally {
      setLoading(false);
    }
  }, [user, isInstitution]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 🔥 NOVA FUNÇÃO: Para instituições visualizarem detalhes da oferta
  const handleViewOfferDetails = (offer) => {
    Alert.alert(
      offer.title || 'Oferta sem título',
      `📋 Descrição: ${offer.description || 'Sem descrição disponível'}\n\n` +
      `📦 Quantidade: ${offer.quantity || 'Não especificada'}\n` +
      `🏷️ Categoria: ${offer.category || 'Geral'}\n` +
      `🔧 Condição: ${offer.conditions || 'Não especificada'}\n` +
      `👤 Doador: ${offer.donor_name || 'Anônimo'}\n` +
      `📍 Localização: ${offer.location || 'Não informada'}\n` +
      `📅 Publicado em: ${offer.created_at ? new Date(offer.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}`,
      [
        { 
          text: 'Iniciar Chat', 
          onPress: () => handleStartChat(offer),
          style: 'default'
        },
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  // 🔥 NOVA FUNÇÃO: Iniciar chat direto com o doador
  const handleStartChat = async (offer) => {
    try {
      // Primeiro aceita a oferta
      const acceptResponse = await api.acceptDonationOffer(offer.id);
      
      if (acceptResponse.success) {
        // Navega para o chat com o doador
        navigation.navigate('Chat', { 
          userId: offer.donor_id,
          userName: offer.donor_name || 'Doador',
          userAvatar: offer.donor_avatar,
          offerId: offer.id,
          offerTitle: offer.title
        });
        
        Alert.alert(
          'Chat Iniciado! 🎉',
          `Você aceitou a oferta "${offer.title}" e pode agora conversar diretamente com ${offer.donor_name || 'o doador'} para combinar os detalhes da doação.`,
          [{ text: 'Ótimo!', style: 'default' }]
        );
        
        // Recarrega os dados para atualizar o status
        loadData();
      } else {
        Alert.alert('Erro', acceptResponse.message || 'Não foi possível aceitar a oferta.');
      }
    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o chat com o doador.');
    }
  };

  // 🔥 FUNÇÃO: Aceitar oferta e iniciar chat
  const handleAcceptOffer = async (offer) => {
    Alert.alert(
      'Aceitar Oferta e Iniciar Chat',
      `Deseja aceitar a oferta "${offer.title}" e iniciar uma conversa direta com ${offer.donor_name || 'o doador'}?`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel' 
        },
        { 
          text: 'Aceitar e Conversar', 
          onPress: () => handleStartChat(offer)
        }
      ]
    );
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
    if (!timestamp) return 'Data não disponível';
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

  // Funções dos filtros (SÓ EXECUTAM SE FOR DOADOR)
  const handleUrgencySelect = async (urgency) => {
    if (isInstitution) return;
    setSelectedUrgency(urgency);
    setShowUrgencyFilter(false);
    await applyFilters(urgency, selectedType);
  };

  const handleTypeSelect = async (type) => {
    if (isInstitution) return;
    setSelectedType(type);
    setShowTypeFilter(false);
    await applyFilters(selectedUrgency, type);
  };

  const applyFilters = async (urgency, type) => {
    if (isInstitution) return;

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
        
        // Atualiza as estatísticas também
        const needs = response.data.needs || [];
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
      } else {
        setError(response.message || 'Erro ao aplicar filtros');
      }
      
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      setError('Erro ao aplicar filtros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Ações de Posts (só Doador utiliza Needs)
  const handleLikePress = async (postId) => {
    if (isInstitution) return;
    
    try {
      // Atualização otimista
      const previousStats = { ...needStats };
      const previousLikedState = needStats[postId]?.userLiked || false;
      const previousLikesCount = needStats[postId]?.likes || 0;
      
      // Atualiza o estado local imediatamente
      setNeedStats(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          likes: previousLikedState ? previousLikesCount - 1 : previousLikesCount + 1,
          userLiked: !previousLikedState
        }
      }));
      
      // Chama a API
      const response = await api.toggleNeedLike(postId);
      
      if (!response.success) {
        // Reverte se a API falhar
        setNeedStats(prev => ({
          ...prev,
          [postId]: previousStats[postId]
        }));
        Alert.alert('Erro', 'Não foi possível curtir o post.');
      }
      
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      Alert.alert('Erro', 'Não foi possível curtir o post.');
    }
  };

  const handleCommentPress = async (postId) => {
    if (isInstitution) return;
    
    try {
      // Busca os comentários atuais
      const commentsResponse = await api.getNeedComments(postId);
      
      if (commentsResponse.success) {
        setCommentsModal({
          visible: true,
          needId: postId,
          comments: commentsResponse.data.comments || []
        });
      } else {
        Alert.alert('Erro', 'Não foi possível carregar os comentários.');
      }
      
    } catch (error) {
      console.error('Erro ao abrir comentários:', error);
      Alert.alert('Erro', 'Não foi possível carregar os comentários.');
    }
  };

  const handleSharePress = async (postId) => {
    if (isInstitution) return;
    
    try {
      // Registra o compartilhamento na API
      const response = await api.shareNeed(postId);
      
      if (response.success) {
        // Atualiza o contador local
        setNeedStats(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            shares: (prev[postId]?.shares || 0) + 1
          }
        }));
        
        Alert.alert(
          'Compartilhado!',
          'Post compartilhado com sucesso!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível compartilhar o post.');
      }
      
    } catch (error) {
      console.error('Erro ao compartilhar post:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar o post.');
    }
  };

  const handleAddComment = async (needId, text) => {
    if (isInstitution) return;
    
    if (!text.trim()) {
      Alert.alert('Erro', 'Por favor, digite um comentário.');
      return;
    }
    
    try {
      // Adiciona o comentário localmente (otimista)
      const newComment = {
        id: Date.now(), // ID temporário
        user_name: user?.name || 'Você',
        user_avatar: user?.avatar,
        comment: text,
        created_at: new Date().toISOString(),
        is_own: true
      };
      
      setCommentsModal(prev => ({
        ...prev,
        comments: [newComment, ...prev.comments]
      }));
      
      setCommentText('');
      
      // Envia para a API
      const response = await api.addNeedComment(needId, text);
      
      if (!response.success) {
        // Remove o comentário local se a API falhar
        setCommentsModal(prev => ({
          ...prev,
          comments: prev.comments.filter(comment => comment.id !== newComment.id)
        }));
        Alert.alert('Erro', 'Não foi possível adicionar o comentário.');
      }
      
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o comentário.');
    }
  };

  const handleDonatePress = (need) => {
    if (isInstitution) {
        Alert.alert('Aviso', 'A instituição não pode doar para esta necessidade.');
        return;
    }
    navigation.navigate('PostDonation', { 
      needId: need.id,
      institutionId: need.institution_id, 
      institutionName: need.institution_name,
      needTitle: need.title
    });
  };

  const handleInstitutionPress = (item) => {
    if (isInstitution) {
        // Instituição clica em uma oferta, navegamos para o perfil público do doador
        navigation.navigate('DonorProfile', { userId: item.donor_id });
    } else {
        // Doador clica em uma necessidade, navegamos para o perfil público da instituição
        navigation.navigate('InstitutionProfile', { institutionId: item.institution_id });
    }
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

  // LÓGICA DO BOTÃO FAB
  const handlePost = () => {
    if (isInstitution) {
      navigation.navigate('PostNeed'); // Instituição: Postar Necessidade
    } else {
      navigation.navigate('PostDonation'); // Doador: Postar Doação
    }
  };

  const handleViewDonorProfile = (offer) => {
    console.log('DEBUG: Tentando ver perfil do doador no Home:', offer);
    
    if (!offer || (!offer.donor_id && !offer.user_id)) {
      Alert.alert('Informação', 'Dados do doador não disponíveis.');
      return;
    }
  
    const donorId = offer.donor_id || offer.user_id;
    const donorName = offer.donor_name || 'Doador';
    
    navigation.navigate('PublicDonorProfile', { 
      userId: donorId,
      userName: donorName
    });
  };

  const renderFeedCard = ({ item }) => {
    if (isInstitution) {
        // Instituição vê Ofertas de Doação (DonationOfferCard)
        return (
            <DonationOfferCard
                offer={item}
                onDetails={() => handleViewOfferDetails(item)} 
                onEdit={() => handleAcceptOffer(item)}
                onViewDonorProfile={handleViewDonorProfile}
            />
        );
    } else {
        // Doador vê Necessidades (PostCard)
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
    }
  };

  // Renderização do estado vazio
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {isInstitution ? "Carregando ofertas..." : "Carregando necessidades..."}
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Erro ao carregar</Text>
          <Text style={styles.emptyDescription}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>
          {isInstitution ? "📦" : "❤️"}
        </Text>
        <Text style={styles.emptyTitle}>
          {isInstitution ? "Nenhuma oferta disponível" : "Nenhuma necessidade disponível"}
        </Text>
        <Text style={styles.emptyDescription}>
          {isInstitution 
            ? "Não há ofertas de doação no momento. Verifique novamente mais tarde."
            : "Não há necessidades publicadas no momento. Verifique novamente mais tarde."}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>BeSafe</Text>
        {user && (
          <Text style={styles.userWelcome}>
            Olá, {user.name}! ({isInstitution ? 'Instituição' : 'Doador'})
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
        </View>
        
        <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
          <Text style={styles.searchPlaceholder}>🔍 Buscar {isInstitution ? 'doações ou doadores' : 'necessidades ou instituições'}...</Text>
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

  // LÓGICA DE RENDERING CONDICIONAL DOS FILTROS
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filterTitle}>
        {isInstitution ? "Feed de Ofertas Disponíveis" : "Filtros de Necessidades"}
      </Text>
      
      {!isInstitution && (
        <View style={{flexDirection: 'row'}}>
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
        </View>
      )}
    </View>
  );

  // Modal de Filtro de Urgência
  const renderUrgencyFilterModal = () => (
    <Modal
      visible={showUrgencyFilter}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowUrgencyFilter(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
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
              {selectedUrgency === option && (
                <Text style={styles.checkIcon}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Modal de Filtro de Tipo
  const renderTypeFilterModal = () => (
    <Modal
      visible={showTypeFilter}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowTypeFilter(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
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
              {selectedType === option && (
                <Text style={styles.checkIcon}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Modal de Comentários
  const renderCommentsModal = () => (
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

          <FlatList
            data={commentsModal.comments}
            keyExtractor={(item) => item.id.toString()}
            style={styles.commentsList}
            ListEmptyComponent={
              <Text style={styles.noCommentsText}>Nenhum comentário ainda. Seja o primeiro a comentar!</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Image 
                  source={{ uri: item.user_avatar || `https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=${item.user_name?.charAt(0) || 'U'}` }} 
                  style={styles.commentAvatar}
                />
                <View style={styles.commentContent}>
                  <Text style={styles.commentUserName}>{item.user_name}</Text>
                  <Text style={styles.commentText}>{item.comment}</Text>
                  <Text style={styles.commentDate}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              </View>
            )}
          />

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Digite seu comentário..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <TouchableOpacity
              style={[styles.commentSendButton, !commentText.trim() && styles.commentSendButtonDisabled]}
              onPress={() => handleAddComment(commentsModal.needId, commentText)}
              disabled={!commentText.trim()}
            >
              <Text style={styles.commentSendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
            keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
            renderItem={renderFeedCard}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={feedData.length === 0 ? styles.emptyFeedContent : styles.feedScrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
          />
        </View>
        
        {isDesktop && !isInstitution && renderSidebar()}
      </View>
      
      {/* Modais */}
      {renderUrgencyFilterModal()}
      {renderTypeFilterModal()}
      {renderCommentsModal()}

      {/* FAB Button */}
      <TouchableOpacity 
          style={styles.fab} 
          onPress={handlePost}
          accessible={true}
          accessibilityLabel={isInstitution ? "Publicar nova necessidade" : "Publicar nova doação"}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyFeedContent: {
    flexGrow: 1,
    justifyContent: 'center',
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

export default Home;