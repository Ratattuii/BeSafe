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

const DonorProfileScreen = ({ route }) => {
  const navigation = useNavigation(); 
  const { user, logout } = useAuth(); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState('ativas'); // 'ativas', 'historico'
  
  const [activeDonations, setActiveDonations] = useState([]); // Nossas "Ofertas"
  const [donationHistory, setDonationHistory] = useState([]); // Nossas "Doações" (respostas)

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
      console.log('--- DEBUG: Buscando dados do perfil do doador... ---');
      
      const [offersResponse, historyResponse] = await Promise.all([
        api.getMyDonationOffers(),
        api.getUserDonations({ status: 'entregue' }) 
      ]);

      console.log('API /api/offers/my-offers respondeu:', JSON.stringify(offersResponse, null, 2));
      console.log('API /api/donations/me respondeu:', JSON.stringify(historyResponse, null, 2));

      if (offersResponse.success && offersResponse.data.offers) {
        const availableOffers = offersResponse.data.offers.filter(
          (offer) => offer.status === 'available'
        );
        setActiveDonations(availableOffers);
        console.log(`--- DEBUG: ${availableOffers.length} ofertas ativas carregadas. ---`);
      } else {
        console.error('Erro ao buscar ofertas ativas:', offersResponse.message);
      }

      if (historyResponse.success && historyResponse.data.donations) {
        setDonationHistory(historyResponse.data.donations);
        console.log(`--- DEBUG: ${historyResponse.data.donations.length} itens de histórico carregados. ---`);
      } else {
        console.error('Erro ao buscar histórico:', historyResponse.message);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do perfil do doador:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]); 

  useFocusEffect(
    useCallback(() => {
      if (!isInitialLoad.current) {
        loadProfileData(); 
      }
    }, [loadProfileData])
  );
  
  useEffect(() => {
    isInitialLoad.current = true; 
    loadProfileData();
  }, [loadProfileData]);


  const handleRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };
  
  const handleEditProfile = () => {
    Alert.alert('Aviso', 'Tela de edição de perfil ainda não implementada.');
  };
  
  const handleSettings = () => {
    Alert.alert('Aviso', 'Tela de configurações ainda não implementada.');
  };
  
  const handleAddDonation = () => {
    navigation.navigate('PostDonation');
  };

  // --- FUNÇÕES DE AÇÃO DOS CARDS ---
  const handleEditOffer = (offer) => {
    // Navega para a tela de PostDonation, passando a oferta para edição
    navigation.navigate('PostDonation', { offerToEdit: offer });
  };
  
  const handleViewOfferDetails = (offer) => {
    Alert.alert(
      offer.title,
      `Descrição: ${offer.description}\n` +
      `Quantidade: ${offer.quantity}\n` +
      `Condição: ${offer.conditions}\n` +
      `Local: ${offer.location || 'Não informado'}\n` +
      `Disponível: ${offer.availability}`
    );
  };
  
  const handleViewDonationDetails = (donation) => {
     Alert.alert(
       `Doação para "${donation.need_title}"`,
       `Instituição: ${donation.institution_name}\n` +
       `Quantidade: ${donation.quantity} ${donation.unit}\n` +
       `Status: ${donation.status}\n` +
       `Entregue em: ${new Date(donation.delivered_at).toLocaleDateString('pt-BR')}`
     );
  };
  
  const handleReviewDonation = (donation) => {
    Alert.alert('Aviso', `Tela de avaliação para a doação ID: ${donation.id} (A implementar)`);
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
      <Text style={styles.headerTitle}>Meu Perfil de Doador</Text>
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

    return (
      <View style={[styles.profileInfo, isDesktop && styles.profileInfoDesktop]}>
        <Image 
          source={{ uri: user.avatar || `https://via.placeholder.com/120x120/FFDDAA/888888?text=${user.name?.charAt(0) || 'U'}` }} 
          style={styles.avatar} 
        />
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileLocation}>📍 {user.address || 'Localização não definida'}</Text>
        <Text style={styles.profileDescription}>
          {user.description || 'Doador comprometido em ajudar o próximo. Junte-se a mim!'}
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{donationHistory.length}</Text>
            <Text style={styles.statLabel}>Doações Concluídas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeDonations.length}</Text>
            <Text style={styles.statLabel}>Doações Ativas</Text>
          </View>
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

  const renderTabs = () => (
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

  // Componente de "Lista Vazia"
  const EmptyListMessage = ({ icon, title, description }) => (
    <View style={styles.emptyContainer}>
      <Ionicons name={icon} size={48} color={colors.gray300} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );

  // Aba 1: Doações Ativas (Ofertas)
  const renderActiveDonations = () => (
    <FlatList
      data={activeDonations}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <DonationOfferCard
          offer={item}
          onDetails={() => handleViewOfferDetails(item)}
          onEdit={() => handleEditOffer(item)}
        />
      )}
      ListEmptyComponent={
        <EmptyListMessage
          icon="cube-outline"
          title="Nenhuma doação ativa"
          description="Itens que você publicar para doação aparecerão aqui."
        />
      }
      contentContainerStyle={styles.listPadding}
    />
  );

  // Aba 2: Histórico (Doações a posts)
  const renderDonationHistory = () => (
    <FlatList
      data={donationHistory}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <DonationCard
          donation={item} 
          onPress={() => handleViewDonationDetails(item)}
          onReview={() => handleReviewDonation(item)}
        />
      )}
      ListEmptyComponent={
        <EmptyListMessage
          icon="archive-outline"
          title="Nenhum histórico"
          description="Doações que você fizer e forem entregues aparecerão aqui."
        />
      }
      contentContainerStyle={styles.listPadding}
    />
  );

  const renderTabContent = () => {
    return activeTab === 'ativas' ? renderActiveDonations() : renderDonationHistory();
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
      {renderProfileInfo()}
      {renderTabs()}
      {renderTabContent()}
    </ScrollView>
  );

  const renderDesktopLayout = () => (
    <View style={styles.desktopContainer}>
      <View style={styles.desktopLeftColumn}>
        {renderProfileInfo()}
      </View>
      <View style={styles.desktopRightColumn}>
        {renderTabs()}
        {renderTabContent()}
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
          onPress={handleAddDonation}
          accessible={true}
          accessibilityLabel="Publicar nova doação"
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

  // Desktop Layout
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    paddingHorizontal: 20,
    paddingTop: 20, // Espaço abaixo do header
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
    marginBottom: 20, // Espaço para sombra
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
    // Estilo do header no desktop, se for diferente
    // (atualmente é o mesmo)
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

  // Informações do Perfil
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

  // Abas
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
  
  // Listas
  listPadding: {
    padding: 16,
  },
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
    color: colors.gray300,
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

  // Botão flutuante (FAB)
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

export default DonorProfileScreen;