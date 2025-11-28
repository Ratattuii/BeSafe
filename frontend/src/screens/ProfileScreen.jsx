// screens/ProfileScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FlatList, 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; 
import { colors, globalStyles } from '../styles/globalStyles';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons'; 

import DonationCard from '../components/DonationCard';
import DonationOfferCard from '../components/DonationOfferCard'; 
import NeedCard from '../components/NeedCard';

const ProfileScreen = ({ route }) => {
  const navigation = useNavigation(); 
  const { user, logout } = useAuth(); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const isInstitution = user?.role === 'institution';
  
  // Estados para doador
  const [activeTab, setActiveTab] = useState(isInstitution ? 'necessidades' : 'ativas');
  const [activeDonations, setActiveDonations] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  
  // Estados para instituição
  const [activeNeeds, setActiveNeeds] = useState([]);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const isInitialLoad = useRef(true);

  const loadProfileData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    if (isInitialLoad.current) {
      setLoading(true);
      isInitialLoad.current = false;
    }
    
    try {
      console.log('--- DEBUG: Buscando dados do perfil... ---');
      
      if (isInstitution) {
        // Carregar necessidades da instituição
        const needsResponse = await api.get(`/institutions/${user.id}/needs`);
        console.log('DEBUG: Resposta completa das necessidades:', needsResponse);
        
        if (needsResponse.success && needsResponse.data?.needs) {
          const allNeeds = needsResponse.data.needs;
          
          // Filtrar necessidades ativas
          const activeNeedsList = allNeeds.filter(
            (need) => need.status === 'ativa' || need.status === 'pendente' || !need.status
          );
          
          console.log('DEBUG: Necessidades ativas:', activeNeedsList.length);
          setActiveNeeds(activeNeedsList);
        } else {
          console.log('DEBUG: Nenhuma necessidade encontrada ou erro na resposta');
          setActiveNeeds([]);
        }
      } else {
        // Carregar dados do doador - DADOS REAIS DA API
        console.log('🔄 Buscando dados reais do doador...');
        
        const offersResponse = await api.getMyDonationOffers();
        console.log('📦 Resposta completa das ofertas:', offersResponse);

        // Processar ofertas ativas (status 'available' ou 'disponivel')
        if (offersResponse.success && offersResponse.data?.offers) {
          const availableOffers = offersResponse.data.offers.filter(
            (offer) => offer.status === 'available' || offer.status === 'disponivel'
          );
          console.log('✅ Ofertas ativas encontradas:', availableOffers.length);
          setActiveDonations(availableOffers);

          // HISTÓRICO: Ofertas finalizadas (status 'donated', 'entregue', 'concluido')
          const completedOffers = offersResponse.data.offers.filter(
            (offer) => offer.status === 'donated' || offer.status === 'entregue' || offer.status === 'concluido' || offer.status === 'doado'
          );
          console.log('✅ Ofertas concluídas no histórico:', completedOffers.length);
          console.log('📊 Detalhes das ofertas concluídas:', completedOffers);
          setDonationHistory(completedOffers);
        } else {
          console.log('❌ Nenhuma oferta encontrada');
          setActiveDonations([]);
          setDonationHistory([]);
        }
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados do perfil:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isInstitution]); 

  useFocusEffect(
    useCallback(() => {
      if (!isInitialLoad.current) {
        console.log('🔄 Recarregando dados do perfil...');
        loadProfileData(); 
      }
    }, [loadProfileData])
  );
  
  useEffect(() => {
    isInitialLoad.current = true; 
    loadProfileData();
  }, [loadProfileData]);

  const handleRefresh = () => {
    console.log('🔄 Atualizando dados...');
    setRefreshing(true);
    loadProfileData();
  };
  
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };
  
  const handleSettings = () => {
    Alert.alert('Aviso', 'Tela de configurações ainda não implementada.');
  };
  
  const handleAddContent = () => {
    if (isInstitution) {
      navigation.navigate('PostNeed');
    } else {
      navigation.navigate('PostDonation');
    }
  };

  const handleViewDonorProfile = (offer) => {
    console.log('DEBUG: Tentando ver perfil do doador:', offer);
    
    if (!offer || (!offer.donor_id && !offer.user_id)) {
      Alert.alert('Informação', 'Dados do doador não disponíveis.');
      return;
    }

    const donorId = offer.donor_id || offer.user_id;
    const donorName = offer.donor_name || 'Doador';
    
    navigation.navigate('UserProfile', { 
      userId: donorId,
      userName: donorName
    });
  };

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
          text: 'Ver Perfil do Doador', 
          onPress: () => handleViewDonorProfile(offer),
          style: 'default'
        },
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  const handleEditOffer = (offer) => {
    navigation.navigate('EditDonationOffer', { offerId: offer.id });
  };

  const handleViewNeedDetails = (need) => {
    navigation.navigate('NeedDetails', { needId: need.id });
  };

  const handleEditNeed = (need) => {
    navigation.navigate('EditNeedScreen', { needId: need.id });
  };

  const handleFinalizeNeed = async (need) => {
    console.log('🟡 Finalizando necessidade ID:', need.id);
    
    try {
      await api.finalizeNeed(need.id);
      setActiveNeeds(prevNeeds => prevNeeds.filter(n => n.id !== need.id));
      console.log('✅ Necessidade finalizada e removida da lista');
    } catch (error) {
      console.error('❌ Erro:', error);
      Alert.alert('Erro', 'Não foi possível finalizar a necessidade');
    }
  };  

  const handleViewDonationDetails = (donation) => {
    // Para donation_offers, usamos os detalhes da própria oferta
    Alert.alert(
      donation.title || 'Doação sem título',
      `📋 Descrição: ${donation.description || 'Sem descrição disponível'}\n\n` +
      `📦 Quantidade: ${donation.quantity || 'Não especificada'}\n` +
      `🏷️ Categoria: ${donation.category || 'Geral'}\n` +
      `🔧 Condição: ${donation.conditions || 'Não especificada'}\n` +
      `📍 Localização: ${donation.location || 'Não informada'}\n` +
      `📅 Finalizada em: ${donation.updated_at ? new Date(donation.updated_at).toLocaleDateString('pt-BR') : 'Data não disponível'}`,
      [{ text: 'OK', style: 'cancel' }]
    );
  };
  
  const handleReviewDonation = (donationItem) => {
    console.log('DEBUG: Navegando para ReviewDonation com:', donationItem);
    
    if (!donationItem) {
      Alert.alert('Erro', 'Dados da doação não disponíveis.');
      return;
    }
  
    navigation.navigate('ReviewDonation', { 
      donation: donationItem 
    });
  };

  const handleFinalizeOffer = async (offer) => {
    console.log('🟡 Finalizando oferta ID:', offer.id);
    
    try {
      await api.finalizeDonationOffer(offer.id);
      // Remove da lista ativa e adiciona ao histórico
      setActiveDonations(prevOffers => prevOffers.filter(o => o.id !== offer.id));
      // Recarrega os dados para atualizar o histórico
      loadProfileData();
      console.log('✅ Oferta finalizada e movida para o histórico');
    } catch (error) {
      console.error('❌ Erro:', error);
      Alert.alert('Erro', 'Não foi possível finalizar a oferta');
    }
  };

  // ----- COMPONENTES DE RENDERIZAÇÃO -----

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
        {isInstitution ? 'Meu Perfil Institucional' : 'Meu Perfil de Doador'}
      </Text>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={handleSettings}
        accessible={true}
        accessibilityLabel="Configurações"
        accessibilityRole="button"
      >
        <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  const renderProfileInfo = () => {
    if (!user) return null;

    const stats = isInstitution ? {
      active: activeNeeds.length,
      followers: user.followers_count || 0,
      donations: user.donations_received || 0
    } : {
      completed: donationHistory.length,
      active: activeDonations.length
    };

    return (
      <View style={[styles.profileInfo, isDesktop && styles.profileInfoDesktop]}>
        <Image 
          source={{ uri: user.avatar || `https://via.placeholder.com/120x120/FFDDAA/888888?text=${user.name?.charAt(0) || 'U'}` }} 
          style={styles.avatar} 
        />
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileLocation}>📍 {user.address || 'Localização não definida'}</Text>
        <Text style={styles.profileDescription}>
          {user.description || 
            (isInstitution 
              ? 'Instituição comprometida em fazer a diferença na comunidade.' 
              : 'Doador comprometido em ajudar o próximo. Junte-se a mim!'
            )
          }
        </Text>
        
        <View style={styles.statsContainer}>
          {isInstitution ? (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.active}</Text>
                <Text style={styles.statLabel}>Necessidades Ativas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followers}</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.donations}</Text>
                <Text style={styles.statLabel}>Doações Recebidas</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Doações Concluídas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.active}</Text>
                <Text style={styles.statLabel}>Doações Ativas</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTabs = () => {
    if (isInstitution) {
      return (
        <View style={[styles.tabsContainer, isDesktop && styles.tabsContainerDesktop]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'necessidades' && styles.activeTab]}
            onPress={() => setActiveTab('necessidades')}
          >
            <Text style={[styles.tabText, activeTab === 'necessidades' && styles.activeTabText]}>
              Necessidades Ativas ({activeNeeds.length})
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={[styles.tabsContainer, isDesktop && styles.tabsContainerDesktop]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ativas' && styles.activeTab]}
            onPress={() => setActiveTab('ativas')}
          >
            <Text style={[styles.tabText, activeTab === 'ativas' && styles.activeTabText]}>
              Doações Ativas ({activeDonations.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'historico' && styles.activeTab]}
            onPress={() => setActiveTab('historico')}
          >
            <Text style={[styles.tabText, activeTab === 'historico' && styles.activeTabText]}>
              Histórico ({donationHistory.length})
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Componente de "Lista Vazia"
  const EmptyListMessage = ({ icon, title, description }) => (
    <View style={styles.emptyContainer}>
      <Ionicons name={icon} size={48} color={colors.gray300} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );

  // Conteúdo das abas
  const renderTabContent = () => {
    if (isInstitution) {
      return (
        <FlatList
          data={activeNeeds}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <NeedCard
              need={item}
              onDetails={() => handleViewNeedDetails(item)}
              onEdit={() => handleEditNeed(item)}
              onFinalize={handleFinalizeNeed}
              isInstitutionView={true}
              isClickable={false}
            />
          )}
          ListEmptyComponent={
            <EmptyListMessage
              icon="alert-circle-outline"
              title="Nenhuma necessidade ativa"
              description="Necessidades que você publicar aparecerão aqui."
            />
          }
          contentContainerStyle={activeNeeds.length === 0 ? styles.emptyListContent : styles.listContent}
          showsVerticalScrollIndicator={true}
          style={styles.flatList}
        />
      );
    } else {
      if (activeTab === 'ativas') {
        return (
          <FlatList
            data={activeDonations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <DonationOfferCard
                offer={item}
                onEdit={() => handleEditOffer(item)}
                onFinalize={handleFinalizeOffer}
                onViewDonorProfile={handleViewDonorProfile}
                isInstitutionView={false}
              />
            )}
            ListEmptyComponent={
              <EmptyListMessage
                icon="cube-outline"
                title="Nenhuma doação ativa"
                description="Itens que você publicar para doação aparecerão aqui."
              />
            }
            contentContainerStyle={activeDonations.length === 0 ? styles.emptyListContent : styles.listContent}
            showsVerticalScrollIndicator={true}
            style={styles.flatList}
          />
        );
      } else {
        // ABA HISTÓRICO - Ofertas finalizadas (donation_offers com status donated)
        return (
          <FlatList
            data={donationHistory}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <DonationCard
                donation={item} 
                onPress={() => handleViewDonationDetails(item)}
                onReview={() => handleReviewDonation(item)}
                isReviewed={item.is_reviewed}
              />
            )}
            ListEmptyComponent={
              <EmptyListMessage
                icon="archive-outline"
                title="Nenhuma doação concluída"
                description="Ofertas que você finalizar aparecerão aqui."
              />
            }
            contentContainerStyle={donationHistory.length === 0 ? styles.emptyListContent : styles.listContent}
            showsVerticalScrollIndicator={true}
            style={styles.flatList}
          />
        );
      }
    }
  };

  // LAYOUT MOBILE
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
      contentContainerStyle={styles.scrollContent}
    >
      {renderProfileInfo()}
      {renderTabs()}
      <View style={styles.tabContent}>
        {renderTabContent()}
      </View>
    </ScrollView>
  );

  // LAYOUT DESKTOP
  const renderDesktopLayout = () => (
    <View style={styles.desktopContainer}>
      <View style={styles.desktopLeftColumn}>
        {renderProfileInfo()}
      </View>
      <View style={styles.desktopRightColumn}>
        {renderTabs()}
        <View style={styles.desktopTabContent}>
          {renderTabContent()}
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!user) {
     return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Usuário não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {renderHeader()}
      {isDesktop ? renderDesktopLayout() : renderMobileLayout()}
      
      {!isDesktop && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={handleAddContent}
          accessible={true}
          accessibilityLabel={isInstitution ? "Publicar nova necessidade" : "Publicar nova doação"}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}
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
  scrollContent: {
    flexGrow: 1,
  },
  tabContent: {
    minHeight: 400,
  },
  desktopTabContent: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 300,
  },
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
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
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
    alignItems: 'center',
    padding: 20,
  },
  profileInfoDesktop: {
    margin: 0,
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary,
    borderWidth: 4,
    borderColor: colors.white,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  profileDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
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
    borderRadius: 0,
    padding: 8,
    shadow: 'none',
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default ProfileScreen;