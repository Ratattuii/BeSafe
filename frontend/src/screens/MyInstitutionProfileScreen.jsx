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

// Componentes Reutilizados:
import NeedCard from '../components/NeedCard'; 
import DonationCard from '../components/DonationCard'; 

const MyInstitutionProfileScreen = ({ route }) => {
  const navigation = useNavigation(); 
  const { user, logout } = useAuth(); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState('ativas'); // 'ativas', 'historico'
  
  // Para a Instituição:
  const [activeNeeds, setActiveNeeds] = useState([]); // Nossas "Necessidades" ativas (Posts)
  const [donationHistory, setDonationHistory] = useState([]); // "Doações Recebidas" (Histórico)

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const isInitialLoad = useRef(true);

  const loadProfileData = useCallback(async () => {
    if (!user || user.role !== 'institution') {
      setLoading(false);
      return;
    }
    
    if (isInitialLoad.current) {
      setLoading(true);
      isInitialLoad.current = false;
    }
    
    try {
      console.log('--- DEBUG: Buscando dados do perfil da instituição logada... ---');
      
      const [needsResponse, historyResponse] = await Promise.all([
        // 1. Busca Nossas Necessidades (Posts) - Apenas as ativas
        api.getNeeds({ institution_id: user.id, status: 'active' }),
        // 2. Busca Doações Recebidas (Histórico) - Todas as doações para esta instituição
        api.getDonations({ institution_id: user.id }) 
      ]);

      if (needsResponse.success && needsResponse.data.needs) {
        setActiveNeeds(needsResponse.data.needs);
      } else {
        console.error('Erro ao buscar necessidades ativas:', needsResponse.message);
      }

      if (historyResponse.success && historyResponse.data.donations) {
        // Filtra para mostrar apenas as entregues no contador de stats
        setDonationHistory(historyResponse.data.donations);
      } else {
        console.error('Erro ao buscar histórico de doações:', historyResponse.message);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do perfil da instituição:', error);
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
    loadProfileData();
  }, [loadProfileData]);


  const handleRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };
  
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };
  
  const handleSettings = () => {
    Alert.alert('Aviso', 'Tela de configurações ainda não implementada.');
  };
  
  const handleAddNeed = () => {
    navigation.navigate('PostNeed'); // Ação principal: Postar Necessidade
  };

  // --- FUNÇÕES DE AÇÃO DOS CARDS ---
  
  // Ação para editar uma necessidade (post)
  const handleEditNeed = (need) => {
    navigation.navigate('PostNeed', { needToEdit: need });
  };
  
  // Detalhes da Necessidade (clique no NeedCard)
  const handleViewNeedDetails = (need) => {
    Alert.alert(
      need.title,
      `Descrição: ${need.description}\n` +
      `Meta: ${need.goal_quantity} ${need.unit}\n` +
      `Urgência: ${need.urgency}`
    );
  };
  
  // Detalhes da Doação Recebida (clique no DonationCard)
  const handleViewDonationDetails = (donation) => {
     Alert.alert(
       `Doação de ${donation.donor_name || 'Doador'}`,
       `Item: ${donation.need_title}\n` +
       `Quantidade: ${donation.quantity} ${donation.unit}\n` +
       `Status: ${donation.status}\n` +
       `Notas do Doador: ${donation.notes || 'Nenhuma'}`
     );
  };
  
  // A Instituição avalia o Doador (só para status 'entregue')
  const handleReviewDonor = (donation) => {
    // Usamos ReviewDonationScreen, mas a tela precisa saber que o revisor é a instituição
    navigation.navigate('ReviewDonation', { 
        donation: donation,
        reviewTarget: 'donor' // Passa um target para que ReviewDonationScreen saiba quem avaliar
    }); 
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
      <Text style={styles.headerTitle}>Meu Perfil de Instituição</Text>
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
    const deliveredCount = donationHistory.filter(d => d.status === 'entregue').length;
    
    if (!user) return null;

    return (
      <View style={[styles.profileInfo, isDesktop && styles.profileInfoDesktop]}>
        <Image 
          source={{ uri: user.avatar || `https://via.placeholder.com/120x120/FF1434/888888?text=${user.name?.charAt(0) || 'I'}` }} 
          style={styles.avatar} 
        />
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileLocation}>📍 {user.address || 'Localização não definida'}</Text>
        <Text style={styles.profileDescription}>
          {user.description || 'Instituição dedicada a atender às necessidades da comunidade.'}
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{deliveredCount}</Text>
            <Text style={styles.statLabel}>Doações Recebidas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeNeeds.length}</Text>
            <Text style={styles.statLabel}>Necessidades Ativas</Text>
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
          Necessidades Ativas ({activeNeeds.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'historico' && styles.activeTab]}
        onPress={() => setActiveTab('historico')}
      >
        <Text style={[styles.tabText, activeTab === 'historico' && styles.activeTabText]}>
          Histórico de Doações ({donationHistory.length})
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

  // Aba 1: Necessidades Ativas (Posts da Instituição)
  const renderActiveNeeds = () => (
    <FlatList
      data={activeNeeds}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <NeedCard 
          need={item}
          onPress={() => handleViewNeedDetails(item)}
          // A Instituição pode editar seu próprio Need/Post
          onEdit={() => handleEditNeed(item)} 
        />
      )}
      ListEmptyComponent={
        <EmptyListMessage
          icon="bandage-outline"
          title="Nenhuma necessidade ativa"
          description="Publique um pedido de doação para receber ajuda."
        />
      }
      contentContainerStyle={styles.listPadding}
    />
  );

  // Aba 2: Histórico (Doações Recebidas)
  const renderDonationHistory = () => (
    <FlatList
      data={donationHistory}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <DonationCard 
          donation={item} 
          onPress={() => handleViewDonationDetails(item)}
          // A Instituição pode revisar o Doador aqui.
          onReview={() => handleReviewDonor(item)} 
          isReviewed={item.institution_reviewed} // Assumindo que o backend retorna um flag
        />
      )}
      ListEmptyComponent={
        <EmptyListMessage
          icon="archive-outline"
          title="Nenhuma doação recebida"
          description="Doações confirmadas por doadores aparecerão aqui."
        />
      }
      contentContainerStyle={styles.listPadding}
    />
  );

  const renderTabContent = () => {
    return activeTab === 'ativas' ? renderActiveNeeds() : renderDonationHistory();
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
  
  if (!user || user.role !== 'institution') {
     return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Acesso Negado. Este perfil só é visível para a instituição logada.</Text>
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
          onPress={handleAddNeed} // Altera a ação para Postar Necessidade
          accessible={true}
          accessibilityLabel="Publicar nova necessidade"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// ESTILOS SÃO REUTILIZADOS DO DONORPROFILESCREEN
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

export default MyInstitutionProfileScreen;