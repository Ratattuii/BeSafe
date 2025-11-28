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
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../styles/globalStyles';
import NeedCard from '../components/NeedCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const InstitutionProfileScreen = ({ route, navigation }) => {
  const [institution, setInstitution] = useState(null);
  const [currentNeeds, setCurrentNeeds] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('necessidades');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Estados para o modal de doação
  const [donationModalVisible, setDonationModalVisible] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { user } = useAuth();
  const institutionId = route?.params?.institutionId || 'current';
  const isOwnProfile = institutionId === 'current';
  const viewerType = isOwnProfile ? 'receptor' : 'doador';

  // Dados da instituição (mistura dados reais com mockados)
  const getUserInstitutionData = () => {
    if (isOwnProfile && user && user.role === 'institution') {
      return {
        id: user.id || 1,
        name: user.name || 'Minha Instituição',
        description: user.description || 'Organização humanitária dedicada a ajudar comunidades em situação de vulnerabilidade.',
        logo: user.avatar || `https://via.placeholder.com/120x120/FF1434/white?text=${user.name?.charAt(0) || 'I'}`,
        coverImage: user.coverImage || 'https://via.placeholder.com/400x200/FF1434/white?text=Instituição',
        location: user.location || 'Brasil',
        website: user.website || 'www.instituicao.org.br',
        phone: user.phone || '(11) 0000-0000',
        email: user.email || 'contato@instituicao.org.br',
        founded: user.founded || '2020',
        category: user.category || 'Assistência Social',
        verified: user.verified || false,
        stats: {
          followers: user.stats?.followers || 0,
          needsPosted: user.stats?.needsPosted || 0,
          donationsReceived: user.stats?.donationsReceived || 0,
          peopleHelped: user.stats?.peopleHelped || 0,
        },
        socialMedia: user.socialMedia || {
          instagram: '@instituicao',
          facebook: 'Instituição',
          twitter: '@instituicao',
        }
      };
    }
    
    return mockInstitution;
  };

  // Dados mockados da instituição (fallback)
  const mockInstitution = {
    id: 1,
    name: 'Cruz Vermelha Brasileira',
    description: 'Organização humanitária que atua em situações de emergência e desastres, oferecendo socorro e apoio às comunidades mais vulneráveis.',
    logo: 'https://via.placeholder.com/120x120/FF1434/white?text=CVB',
    coverImage: 'https://via.placeholder.com/400x200/FF1434/white?text=Cruz+Vermelha',
    location: 'São Paulo, SP',
    website: 'www.cruzvermelha.org.br',
    phone: '(11) 3456-7890',
    email: 'contato@cruzvermelha.org.br',
    founded: '1908',
    category: 'Saúde e Emergência',
    verified: true,
    stats: {
      followers: 15420,
      needsPosted: 127,
      donationsReceived: 892,
      peopleHelped: 12500,
    },
    socialMedia: {
      instagram: '@cruzvermelhabr',
      facebook: 'Cruz Vermelha Brasileira',
      twitter: '@cruzvermelhabr',
    }
  };

  // Necessidades atuais mockadas
  const mockCurrentNeeds = [
    {
      id: 1,
      title: 'Medicamentos para UTI',
      description: 'Precisamos urgentemente de medicamentos para pacientes em estado crítico.',
      image: 'https://via.placeholder.com/350x200/9C27B0/white?text=Medicamentos',
      urgency: 'critica',
      category: 'medicamentos',
      targetQuantity: '500 unidades',
      currentQuantity: '120 unidades',
      progress: 24,
      daysLeft: 2,
      timestamp: '2023-10-01T10:30:00Z',
      stats: { likes: 89, comments: 23, shares: 12 },
    },
    {
      id: 2,
      title: 'Alimentos para famílias',
      description: 'Cestas básicas para 200 famílias em situação de vulnerabilidade.',
      image: 'https://via.placeholder.com/350x200/4CAF50/white?text=Alimentos',
      urgency: 'alta',
      category: 'alimentos',
      targetQuantity: '200 cestas',
      currentQuantity: '150 cestas',
      progress: 75,
      daysLeft: 7,
      timestamp: '2023-09-30T14:20:00Z',
      stats: { likes: 156, comments: 45, shares: 28 },
    },
  ];

  // Histórico de doações recebidas
  const mockDonationHistory = [
    {
      id: 1,
      title: 'Roupas de inverno',
      donorName: 'João Silva',
      donorAvatar: 'https://via.placeholder.com/40x40/2196F3/white?text=JS',
      quantity: '50 peças',
      receivedDate: '2023-09-28T10:00:00Z',
      status: 'entregue',
      image: 'https://via.placeholder.com/60x60/FF9800/white?text=Roupas',
    },
    {
      id: 2,
      title: 'Material de limpeza',
      donorName: 'Maria Santos',
      donorAvatar: 'https://via.placeholder.com/40x40/4CAF50/white?text=MS',
      quantity: '100 itens',
      receivedDate: '2023-09-25T15:30:00Z',
      status: 'entregue',
      image: 'https://via.placeholder.com/60x60/9C27B0/white?text=Limpeza',
    },
    {
      id: 3,
      title: 'Medicamentos básicos',
      donorName: 'Farmácia Popular',
      donorAvatar: 'https://via.placeholder.com/40x40/FF1434/white?text=FP',
      quantity: '200 unidades',
      receivedDate: '2023-09-20T09:15:00Z',
      status: 'entregue',
      image: 'https://via.placeholder.com/60x60/2196F3/white?text=Remédios',
    },
  ];

  const tabs = [
    { id: 'necessidades', label: 'Necessidades Atuais', count: mockCurrentNeeds.length },
    { id: 'historico', label: 'Doações Recebidas', count: mockDonationHistory.length },
  ];

  useEffect(() => {
    loadInstitutionData();
  }, [institutionId]);

  const loadInstitutionData = async () => {
    setLoading(true);
    
    try {
      if (isOwnProfile && user && user.role === 'institution') {
        const institutionData = getUserInstitutionData();
        setInstitution(institutionData);
        
        const needsResponse = await api.getInstitutionNeeds(user.id || 1);
        if (needsResponse.success && needsResponse.data.needs) {
          setCurrentNeeds(needsResponse.data.needs);
        } else {
          setCurrentNeeds(mockCurrentNeeds);
        }
        
        setDonationHistory(mockDonationHistory);
        setIsFollowing(false);
      } else if (institutionId && institutionId !== 'current') {
        console.log('Buscando dados da instituição ID:', institutionId);
        const institutionResponse = await api.getInstitution(institutionId);
        console.log('Resposta da API getInstitution:', institutionResponse);
        
        if (institutionResponse.success && institutionResponse.data && institutionResponse.data.institution) {
          const instData = institutionResponse.data.institution;
          console.log('Dados da instituição recebidos:', instData);
          
          setInstitution({
            id: instData.id,
            name: instData.name,
            description: instData.description || 'Instituição sem descrição.',
            logo: instData.avatar || `https://via.placeholder.com/120x120/FF1434/white?text=${instData.name?.charAt(0) || 'I'}`,
            coverImage: instData.coverImage || 'https://via.placeholder.com/400x200/FF1434/white?text=Instituição',
            location: instData.address || instData.location || 'Brasil',
            website: instData.website || '',
            phone: instData.phone || '',
            email: instData.email || '',
            founded: instData.founded || '',
            category: instData.activity_area || instData.institution_type || 'Assistência Social',
            verified: instData.is_verified || false,
            stats: {
              followers: instData.followers_count || instData.total_followers || 0,
              needsPosted: instData.active_needs || instData.total_needs || 0,
              donationsReceived: instData.donations_count || 0,
              peopleHelped: instData.people_helped || 0,
            },
            socialMedia: {
              instagram: instData.social_instagram || '',
              facebook: instData.social_facebook || '',
              twitter: instData.social_twitter || '',
            }
          });
          
          const needsResponse = await api.getInstitutionNeeds(institutionId);
          if (needsResponse.success && needsResponse.data && needsResponse.data.needs) {
            setCurrentNeeds(needsResponse.data.needs);
          } else {
            setCurrentNeeds([]);
          }
          
          try {
            const followedResponse = await api.getFollowedInstitutions();
            if (followedResponse.success && followedResponse.data && followedResponse.data.institutions) {
              const isFollowingInst = followedResponse.data.institutions.some(
                inst => inst.id === parseInt(institutionId)
              );
              setIsFollowing(isFollowingInst);
            }
          } catch (err) {
            console.error('Erro ao verificar se segue:', err);
            setIsFollowing(false);
          }
          
          setDonationHistory(mockDonationHistory);
        } else {
          console.error('Instituição não encontrada ou resposta inválida:', institutionResponse);
          Alert.alert(
            'Erro', 
            `Não foi possível carregar os dados da instituição. ${institutionResponse.message || ''}`,
            [{ text: 'OK', onPress: () => navigation?.goBack?.() }]
          );
          setInstitution(null);
          setCurrentNeeds([]);
          setDonationHistory([]);
          setIsFollowing(false);
        }
      } else {
        const institutionData = getUserInstitutionData();
        setInstitution(institutionData);
        setCurrentNeeds(mockCurrentNeeds);
        setDonationHistory(mockDonationHistory);
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da instituição:', error);
      const institutionData = getUserInstitutionData();
      setInstitution(institutionData);
      setCurrentNeeds(mockCurrentNeeds);
      setDonationHistory(mockDonationHistory);
      setIsFollowing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInstitutionData();
    setRefreshing(false);
  };

  const handleFollow = async () => {
    if (!user || !user.id) {
      Alert.alert('Erro', 'Você precisa estar logado para seguir instituições.');
      return;
    }

    if (!institution || !institution.id) {
      Alert.alert('Erro', 'Instituição não encontrada.');
      return;
    }

    try {
      let response;
      
      if (isFollowing) {
        // Deixar de seguir
        response = await api.unfollowInstitution(institution.id);
      } else {
        // Seguir
        response = await api.followInstitution(institution.id);
      }

      if (response.success) {
        setIsFollowing(!isFollowing);
        
        // Atualizar contador de seguidores localmente
        setInstitution(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            followers: isFollowing ? prev.stats.followers - 1 : prev.stats.followers + 1
          }
        }));

        Alert.alert(
          'Sucesso',
          isFollowing ? 'Você deixou de seguir esta instituição.' : 'Agora você está seguindo esta instituição!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível processar a ação.');
      }
    } catch (error) {
      console.error('Erro ao seguir/deseguir instituição:', error);
      Alert.alert('Erro', 'Não foi possível processar a ação. Tente novamente.');
    }
  };

  // Função para abrir o modal de doação
  const openDonationModal = (need = null) => {
    setSelectedNeed(need);
    setDonationAmount('');
    setDonationMessage('');
    setDonationModalVisible(true);
  };

  // Função para fechar o modal de doação
  const closeDonationModal = () => {
    setDonationModalVisible(false);
    setSelectedNeed(null);
  };

  // Função para salvar a doação no banco de dados
  const saveDonationToDatabase = async (donationData) => {
    try {
      console.log('Salvando doação:', donationData);
      
      // SEMPRE usar um need_id válido
      let needId = donationData.need_id;
      
      // Se não tem need_id específico, usar a primeira necessidade ativa
      if (!needId) {
        if (currentNeeds.length > 0) {
          needId = currentNeeds[0].id;
          console.log('Usando primeira necessidade ativa:', needId);
        } else {
          // Se não há necessidades ativas, não podemos fazer a doação
          return { 
            success: false, 
            error: 'Esta instituição não possui necessidades ativas no momento. Entre em contato para mais informações.' 
          };
        }
      }
      
      // Payload único com need_id válido
      const donationPayload = {
        donor_id: donationData.donor_id,
        institution_id: donationData.institution_id,
        need_id: needId,
        amount: donationData.amount,
        donation_type: 'monetary',
        quantity: donationData.amount, // Usar o valor como quantidade
        unit: "reais",
        notes: donationData.message || `Doação monetária para ${selectedNeed ? selectedNeed.title : institution?.name}`,
        status: 'pendente',
      };

      console.log('Payload da doação:', donationPayload);
      
      // Fazer uma única tentativa
      const response = await api.createDonation(donationPayload);
      
      if (response.success) {
        console.log('Doação salva com sucesso:', response.data);
        return { success: true, data: response.data };
      } else {
        console.error('Erro ao salvar doação:', response.message);
        return { success: false, error: response.message };
      }
      
    } catch (error) {
      console.error('Erro na requisição de doação:', error);
      return { success: false, error: error.message };
    }
  };

  // Função para processar a doação (SIMPLIFICADA)
  const handleProcessDonation = async () => {
    if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido para a doação.');
      return;
    }

    if (!user || !user.id) {
      Alert.alert('Erro', 'Você precisa estar logado para fazer uma doação.');
      return;
    }

    if (!institution || !institution.id) {
      Alert.alert('Erro', 'Instituição não encontrada.');
      return;
    }

    // Verificar se há necessidades ativas para doações gerais
    if (!selectedNeed && currentNeeds.length === 0) {
      Alert.alert(
        'Sem Necessidades Ativas',
        'Esta instituição não possui necessidades ativas no momento. Entre em contato para saber como ajudar.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsDonating(true);
    
    try {
      // Preparar dados básicos da doação
      const donationData = {
        donor_id: user.id,
        institution_id: institution.id,
        need_id: selectedNeed ? selectedNeed.id : null, // Será substituído se for null
        amount: parseFloat(donationAmount),
        message: donationMessage || null,
      };

      console.log('Processando doação:', donationData);

      // Salvar no banco
      const saveResult = await saveDonationToDatabase(donationData);

      if (saveResult.success) {
        Alert.alert(
          'Doação Realizada! 🎉',
          `Sua doação de R$ ${parseFloat(donationAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ${selectedNeed ? selectedNeed.title : institution.name} foi registrada com sucesso!`,
          [
            {
              text: 'OK',
              onPress: () => {
                closeDonationModal();
                loadInstitutionData(); // Atualizar dados
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Erro na Doação',
          saveResult.error,
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Erro ao processar doação:', error);
      Alert.alert(
        'Erro', 
        `Ocorreu um erro inesperado: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsDonating(false);
    }
  };

  const handleAddNeed = () => {
    navigation?.navigate?.('PostNeed');
    console.log('Adicionar nova necessidade');
  };

  const handleChat = () => {
    if (!institution || !institution.id) {
        Alert.alert('Erro', 'Dados da instituição incompletos.');
        return;
    }
    
    const contactData = {
        id: institution.id,
        name: institution.name || 'Instituição',
        avatar: institution.logo || null,
        type: 'institution',
    };

    console.log('Abrir chat com', contactData.name);
    navigation.navigate('Chat', { contact: contactData });
  };

  const handleNeedPress = (need) => {
    // Abrir modal de doação quando clicar no card
    openDonationModal(need);
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Modal de Doação
  const renderDonationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={donationModalVisible}
      onRequestClose={closeDonationModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedNeed ? `Doar para: ${selectedNeed.title}` : 'Fazer Doação'}
            </Text>
            <TouchableOpacity onPress={closeDonationModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {selectedNeed && (
              <View style={styles.needInfo}>
                <Image source={{ uri: selectedNeed.image }} style={styles.needImage} />
                <View style={styles.needDetails}>
                  <Text style={styles.needTitle}>{selectedNeed.title}</Text>
                  <Text style={styles.needDescription} numberOfLines={2}>
                    {selectedNeed.description}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Valor da Doação (R$)</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Ex: 50.00"
                keyboardType="decimal-pad"
                value={donationAmount}
                onChangeText={setDonationAmount}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mensagem (opcional)</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Deixe uma mensagem de apoio..."
                multiline
                numberOfLines={3}
                value={donationMessage}
                onChangeText={setDonationMessage}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.quickAmounts}>
              <Text style={styles.quickAmountsLabel}>Valores rápidos:</Text>
              <View style={styles.quickAmountButtons}>
                {[10, 25, 50, 100].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmountButton}
                    onPress={() => setDonationAmount(amount.toString())}
                  >
                    <Text style={styles.quickAmountText}>R$ {amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Informações da doação */}
            <View style={styles.donationInfo}>
              <Text style={styles.donationInfoTitle}>Resumo da Doação:</Text>
              <View style={styles.donationDetails}>
                <Text style={styles.donationDetail}>
                  <Text style={styles.detailLabel}>Instituição: </Text>
                  {institution?.name}
                </Text>
                {selectedNeed && (
                  <Text style={styles.donationDetail}>
                    <Text style={styles.detailLabel}>Necessidade: </Text>
                    {selectedNeed.title}
                  </Text>
                )}
                <Text style={styles.donationDetail}>
                  <Text style={styles.detailLabel}>Valor: </Text>
                  R$ {donationAmount || '0.00'}
                </Text>
                <Text style={styles.donationDetail}>
                  <Text style={styles.detailLabel}>Doador: </Text>
                  {user?.name || 'Usuário'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, isDonating && styles.disabledButton]}
              onPress={closeDonationModal}
              disabled={isDonating}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.confirmButton, isDonating && styles.disabledButton]}
              onPress={handleProcessDonation}
              disabled={isDonating}
            >
              {isDonating ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Confirmar Doação
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation?.goBack?.()}
        accessible={true}
        accessibilityLabel="Voltar"
        accessibilityRole="button"
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        {isOwnProfile ? 'Meu Perfil' : 'Perfil da Instituição'} 
        {isOwnProfile && user && user.role === 'institution' ? ' ✅' : ' ⚠️'}
      </Text>

      {!isOwnProfile && (
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {
            console.log('Compartilhar perfil');
          }}
          accessible={true}
          accessibilityLabel="Compartilhar perfil"
          accessibilityRole="button"
        >
          <Text style={styles.shareButtonText}>⤴</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderInstitutionInfo = () => {
    if (!institution) return null;

    return (
      <View style={[styles.institutionInfo, isDesktop && styles.institutionInfoDesktop]}>
        <Image source={{ uri: institution.coverImage }} style={styles.coverImage} />
        
        <View style={styles.mainInfo}>
          <View style={styles.logoContainer}>
            <Image source={{ uri: institution.logo }} style={styles.logo} />
            {institution.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>

          <View style={styles.institutionDetails}>
            <Text style={styles.institutionName}>{institution.name}</Text>
            <Text style={styles.institutionCategory}>{institution.category}</Text>
            <Text style={styles.institutionLocation}>📍 {institution.location}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{formatNumber(institution.stats.followers)}</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{formatNumber(institution.stats.donationsReceived)}</Text>
                <Text style={styles.statLabel}>Doações</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{formatNumber(institution.stats.peopleHelped)}</Text>
                <Text style={styles.statLabel}>Pessoas ajudadas</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.institutionDescription}>{institution.description}</Text>

        <View style={styles.actionButtons}>
          {viewerType === 'doador' ? (
            <>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton
                ]}
                onPress={handleFollow}
                accessible={true}
                accessibilityLabel={isFollowing ? "Deixar de seguir" : "Seguir instituição"}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText
                ]}>
                  {isFollowing ? '✓ Seguindo' : '+ Seguir'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.donateButton}
                onPress={() => openDonationModal()} // Doação geral para a instituição
                accessible={true}
                accessibilityLabel="Fazer doação"
                accessibilityRole="button"
              >
                <Text style={styles.donateButtonText}>💝 Doar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chatButton}
                onPress={handleChat}
                accessible={true}
                accessibilityLabel="Enviar mensagem"
                accessibilityRole="button"
              >
                <Text style={styles.chatButtonText}>💬</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.addNeedButton}
              onPress={handleAddNeed}
              accessible={true}
              accessibilityLabel="Adicionar nova necessidade"
              accessibilityRole="button"
            >
              <Text style={styles.addNeedButtonText}>+ Adicionar Pedido</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={[styles.tabsContainer, isDesktop && styles.tabsContainerDesktop]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab
          ]}
          onPress={() => setActiveTab(tab.id)}
          accessible={true}
          accessibilityLabel={`Aba ${tab.label}`}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === tab.id }}
        >
          <Text style={[
            styles.tabText,
            activeTab === tab.id && styles.activeTabText
          ]}>
            {tab.label} ({tab.count})
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCurrentNeeds = () => (
    <View style={styles.needsList}>
      {currentNeeds.map((need) => (
        <TouchableOpacity
          key={need.id}
          style={styles.needItemContainer}
          onPress={() => handleNeedPress(need)}
          activeOpacity={0.7}
        >
          <NeedCard
            need={{
              ...need,
              institution: {
                name: institution.name,
                logo: institution.logo,
                isActive: true,
              }
            }}
            onPress={() => handleNeedPress(need)}
          />
          
          {isOwnProfile && (
            <View style={styles.needProgress}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  {need.currentQuantity} de {need.targetQuantity}
                </Text>
                <Text style={styles.progressPercentage}>
                  {need.progress}% completo
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { width: `${need.progress}%` }
                ]} />
              </View>
              <Text style={styles.daysLeft}>
                {need.daysLeft} dias restantes
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDonationHistory = () => (
    <View style={styles.donationsList}>
      {donationHistory.map((donation) => (
        <View key={donation.id} style={styles.donationItem}>
          <Image source={{ uri: donation.image }} style={styles.donationImage} />
          
          <View style={styles.donationInfo}>
            <Text style={styles.donationTitle}>{donation.title}</Text>
            <Text style={styles.donationQuantity}>{donation.quantity}</Text>
            
            <View style={styles.donorInfo}>
              <Image source={{ uri: donation.donorAvatar }} style={styles.donorAvatar} />
              <Text style={styles.donorName}>de {donation.donorName}</Text>
            </View>
            
            <Text style={styles.donationDate}>
              Recebido em {new Date(donation.receivedDate).toLocaleDateString('pt-BR')}
            </Text>
          </View>

          <View style={[styles.statusBadge, styles.statusDelivered]}>
            <Text style={styles.statusText}>✓ Entregue</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTabContent = () => {
    if (activeTab === 'necessidades') {
      return currentNeeds.length > 0 ? renderCurrentNeeds() : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>Nenhuma necessidade ativa</Text>
          <Text style={styles.emptyDescription}>
            {isOwnProfile 
              ? 'Adicione uma nova necessidade para começar a receber doações'
              : 'Esta instituição não possui necessidades ativas no momento'
            }
          </Text>
        </View>
      );
    }

    return donationHistory.length > 0 ? renderDonationHistory() : (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎁</Text>
        <Text style={styles.emptyTitle}>Nenhuma doação recebida</Text>
        <Text style={styles.emptyDescription}>
          O histórico de doações aparecerá aqui
        </Text>
      </View>
    );
  };

  const renderMobileLayout = () => (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {renderHeader()}
      {renderInstitutionInfo()}
      {renderTabs()}
      {renderTabContent()}
    </ScrollView>
  );

  const renderDesktopLayout = () => (
    <View style={styles.desktopContainer}>
      {renderHeader()}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.desktopContent}>
          <View style={styles.desktopLeftColumn}>
            {renderInstitutionInfo()}
          </View>
          <View style={styles.desktopRightColumn}>
            {renderTabs()}
            {renderTabContent()}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {isDesktop ? renderDesktopLayout() : renderMobileLayout()}
      {renderDonationModal()}
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
    paddingTop: 20,
  },
  desktopContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    paddingHorizontal: 20,
  },
  desktopLeftColumn: {
    width: 380,
    minWidth: 320,
    maxWidth: 420,
  },
  desktopRightColumn: {
    flex: 1,
    maxWidth: 800,
    minWidth: 500,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  headerDesktop: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    borderBottomWidth: 0,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },

  // Informações da instituição
  institutionInfo: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  institutionInfoDesktop: {
    margin: 0,
    marginBottom: 20,
  },
  coverImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.secondary,
  },
  mainInfo: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-start',
  },
  logoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondary,
    borderWidth: 4,
    borderColor: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  verifiedIcon: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  institutionDetails: {
    flex: 1,
  },
  institutionName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  institutionCategory: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  institutionLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  institutionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Botões de ação
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  followButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: colors.primary,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  followingButtonText: {
    color: colors.white,
  },
  donateButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  donateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 16,
  },
  addNeedButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  addNeedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabsContainerDesktop: {
    margin: 0,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
    fontWeight: '600',
  },

  // Lista de necessidades
  needsList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  needItemContainer: {
    marginBottom: 8,
  },
  needProgress: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.secondary,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  daysLeft: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Lista de doações
  donationsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  donationItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  donationImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    marginRight: 12,
  },
  donationInfo: {
    flex: 1,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  donationQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  donorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  donorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: colors.secondary,
  },
  donorName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  donationDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDelivered: {
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },

  // Estados vazios
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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

  // Modal de Doação
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  needInfo: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  needImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.secondary,
  },
  needDetails: {
    flex: 1,
    marginLeft: 12,
  },
  needTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  needDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
  },
  quickAmounts: {
    marginTop: 10,
  },
  quickAmountsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  donationInfo: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  donationInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  donationDetails: {
    gap: 8,
  },
  donationDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  detailLabel: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default InstitutionProfileScreen;