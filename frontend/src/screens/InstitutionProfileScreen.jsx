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
  const [activeTab, setActiveTab] = useState('necessidades'); // necessidades, historico
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Obter dados reais do usuário logado
  const { user } = useAuth();

  // Determinar se é o próprio perfil (receptor) ou perfil externo (doador)
  const institutionId = route?.params?.institutionId || 'current';
  const isOwnProfile = institutionId === 'current';
  const viewerType = isOwnProfile ? 'receptor' : 'doador';

  // Dados da instituição (mistura dados reais com mockados)
  const getUserInstitutionData = () => {
    if (isOwnProfile && user && user.role === 'institution') {
      // Se é o próprio perfil E o usuário é uma instituição, usa dados reais
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
    
    // Dados mockados para perfil externo ou quando usuário não é instituição
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
        // Se é o próprio perfil e o usuário é uma instituição, usa dados reais
        const institutionData = getUserInstitutionData();
        setInstitution(institutionData);
        
        // Buscar necessidades reais
        const needsResponse = await api.getInstitutionNeeds(user.id || 1);
        if (needsResponse.success && needsResponse.data.needs) {
          setCurrentNeeds(needsResponse.data.needs);
        } else {
          setCurrentNeeds(mockCurrentNeeds);
        }
        
        setDonationHistory(mockDonationHistory);
        setIsFollowing(false);
      } else if (institutionId && institutionId !== 'current') {
        // Buscar dados reais da instituição pelo ID
        console.log('Buscando dados da instituição ID:', institutionId);
        const institutionResponse = await api.getInstitution(institutionId);
        console.log('Resposta da API getInstitution:', institutionResponse);
        
        if (institutionResponse.success && institutionResponse.data && institutionResponse.data.institution) {
          const instData = institutionResponse.data.institution;
          console.log('Dados da instituição recebidos:', instData);
          
          // Mapear dados da API para o formato esperado
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
          
          // Buscar necessidades da instituição
          const needsResponse = await api.getInstitutionNeeds(institutionId);
          if (needsResponse.success && needsResponse.data && needsResponse.data.needs) {
            setCurrentNeeds(needsResponse.data.needs);
          } else {
            setCurrentNeeds([]);
          }
          
          // Verificar se já segue
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
          // Se não encontrou, mostrar erro ao invés de usar dados mockados
          console.error('Instituição não encontrada ou resposta inválida:', institutionResponse);
          Alert.alert(
            'Erro', 
            `Não foi possível carregar os dados da instituição. ${institutionResponse.message || ''}`,
            [{ text: 'OK', onPress: () => navigation?.goBack?.() }]
          );
          // Não definir dados mockados - deixar null para mostrar erro
          setInstitution(null);
          setCurrentNeeds([]);
          setDonationHistory([]);
          setIsFollowing(false);
        }
      } else {
        // Fallback para dados mockados
        const institutionData = getUserInstitutionData();
        setInstitution(institutionData);
        setCurrentNeeds(mockCurrentNeeds);
        setDonationHistory(mockDonationHistory);
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da instituição:', error);
      // Em caso de erro, usar dados mockados como fallback
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
    // TODO: Implementar seguir/desseguir
    // POST /institutions/${institutionId}/follow
    // DELETE /institutions/${institutionId}/follow
    
    setIsFollowing(!isFollowing);
    console.log(isFollowing ? 'Deixar de seguir' : 'Seguir', institution.name);
  };

  const handleDonate = () => {
    // TODO: Navegar para tela de doação
    navigation?.navigate?.('PostDonation', { institutionId });
    console.log('Doar para', institution.name);
  };

  const handleAddNeed = () => {
    // TODO: Navegar para criar necessidade
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
        avatar: institution.avatar || null,
        type: 'institution',
    };

    console.log('Abrir chat com', contactData.name);
    navigation.navigate('Chat', { contact: contactData });
};

  const handleNeedPress = (need) => {
    // TODO: Navegar para detalhes da necessidade
    console.log('Ver necessidade:', need.title);
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

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
            // TODO: Compartilhar perfil
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
        {/* Imagem de capa */}
        <Image source={{ uri: institution.coverImage }} style={styles.coverImage} />
        
        {/* Logo e informações principais */}
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
            
            {/* Estatísticas */}
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

        {/* Descrição */}
        <Text style={styles.institutionDescription}>{institution.description}</Text>

        {/* Botões de ação */}
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
                onPress={handleDonate}
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
        <View key={need.id} style={styles.needItemContainer}>
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
          
          {/* Barra de progresso para necessidades */}
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
        </View>
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
});

export default InstitutionProfileScreen;