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
import DonationOfferCard from '../components/DonationOfferCard'; // Importado para uso
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');
const isDesktop = width > 768;

const HomeInstitution = () => { // Nome do componente alterado
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, logout } = useAuth();
  
  // Assumindo contexto Instituição
  const isInstitution = true; 

  // Estados para dados reais
  const [feedData, setFeedData] = useState([]);
  
  // Mantido para sintaxe
  const [commentsModal, setCommentsModal] = useState({ visible: false, needId: null, comments: [] });
  

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let offersResponse = { success: false, data: {} };
      
      // LÓGICA INSTITUIÇÃO: Buscar OFERTAS de Doação
      console.log('--- DEBUG: Buscando Ofertas de Doação (Home Instituição) ---');
      [offersResponse] = await Promise.all([
          api.getDonationOffers(),
      ]);
      setFeedData(offersResponse.data.offers || []);
      
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
  
  const handlePost = () => {
    // Instituição: Postar Necessidade
    navigation.navigate('PostNeed');
  };

  const handleViewPostDetails = (item) => {
    // Instituição clica em Oferta -> navega para o perfil do Doador ou abre detalhes
    Alert.alert(item.title, `Doador: ${item.donor_name}\nQuantidade: ${item.quantity}`);
  };

  const handleInstitutionPress = (item) => {
    // Instituição clica em uma oferta, navegamos para o perfil público do doador
    navigation.navigate('DonorProfile', { userId: item.donor_id });
  };

  // Renderiza o cartão (apenas DonationOfferCard para Instituição)
  const renderFeedCard = ({ item }) => {
    return (
        <DonationOfferCard
            offer={item}
            onDetails={() => handleViewPostDetails(item)} 
            onEdit={() => Alert.alert('Aviso', 'Funcionalidade de aceitar/rejeitar oferta (implementar)')}
        />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>BeSafe</Text>
        {user && (
          <Text style={styles.userWelcome}>
            Olá, {user.name}! (Instituição)
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
          <Text style={styles.searchPlaceholder}>🔍 Buscar doações ou doadores...</Text>
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

  // Filtros removidos para a Instituição
  const renderFilters = () => (
      <View style={styles.filtersContainer}>
        <Text style={styles.filterText}>Feed de Ofertas Disponíveis</Text>
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
                    <Text style={styles.errorText}>Nenhuma Oferta de Doação disponível.</Text>
                </View>
            )}
            contentContainerStyle={styles.feedScrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
          />
        </View>
        
        {/* Sidebar omitida para Instituição */}
      </View>
      
      {/* FAB Button */}
      <TouchableOpacity 
          style={styles.fab} 
          onPress={handlePost}
          accessible={true}
          accessibilityLabel="Publicar nova necessidade"
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

export default HomeInstitution;