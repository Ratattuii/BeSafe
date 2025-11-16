import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';
import api from '../services/api';
import DonationOfferCard from '../components/DonationOfferCard';

const PublicDonorProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, userName } = route.params;
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userOffers, setUserOffers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      console.log('DEBUG: Carregando perfil do usuário ID:', userId);
      
      // Buscar dados do usuário
      const userResponse = await api.getUser(userId);
      
      if (userResponse.success) {
        setUser(userResponse.data.user);
        console.log('DEBUG: Dados do usuário carregados:', userResponse.data.user);
        
        // Buscar ofertas do usuário específico
        await loadUserOffers(userId);
      } else {
        console.error('Erro ao carregar perfil:', userResponse.message);
        Alert.alert('Erro', 'Não foi possível carregar o perfil do doador.');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Erro ao carregar o perfil do doador.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserOffers = async (donorId) => {
    try {
      console.log('DEBUG: Carregando ofertas do doador ID:', donorId);
      
      // Buscar TODAS as ofertas disponíveis
      const allOffersResponse = await api.getDonationOffers();
      
      if (allOffersResponse.success && allOffersResponse.data?.offers) {
        // Filtrar manualmente as ofertas deste usuário específico
        const userSpecificOffers = allOffersResponse.data.offers.filter(offer => {
          const offerUserId = offer.donor_id || offer.user_id;
          return offerUserId === donorId;
        });
        
        console.log('DEBUG: Ofertas após filtro:', userSpecificOffers.length, 'ofertas do usuário', donorId);
        console.log('DEBUG: IDs das ofertas:', userSpecificOffers.map(o => ({ id: o.id, donor_id: o.donor_id, user_id: o.user_id })));
        
        setUserOffers(userSpecificOffers);
      } else {
        console.error('Erro ao carregar ofertas:', allOffersResponse.message);
        setUserOffers([]);
      }
    } catch (error) {
      console.error('Erro ao carregar ofertas:', error);
      setUserOffers([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handleViewOfferDetails = (offer) => {
    Alert.alert(
      offer.title || 'Oferta sem título',
      `📋 Descrição: ${offer.description || 'Sem descrição disponível'}\n\n` +
      `📦 Quantidade: ${offer.quantity || 'Não especificada'}\n` +
      `🏷️ Categoria: ${offer.category || 'Geral'}\n` +
      `🔧 Condição: ${offer.conditions || 'Não especificada'}\n` +
      `📍 Localização: ${offer.location || 'Não informada'}\n` +
      `📅 Publicado em: ${offer.created_at ? new Date(offer.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}`,
      [
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  const handleAcceptOffer = (offer) => {
    Alert.alert(
      'Aceitar Oferta',
      `Você deseja aceitar a oferta "${offer.title}" e iniciar um chat com o doador?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Aceitar e Conversar', 
          onPress: () => {
            // Navegar para o chat
            navigation.navigate('Chat', { 
              userId: offer.donor_id || offer.user_id,
              userName: user?.name || 'Doador',
              offerId: offer.id,
              offerTitle: offer.title
            });
          }
        }
      ]
    );
  };

  // Função para o botão "VER PERFIL DO DOADOR" - desabilitada pois já estamos no perfil
  const handleViewDonorProfile = (offer) => {
    console.log('DEBUG: Já estamos no perfil do doador');
  };

  const renderOfferCard = ({ item }) => (
    <DonationOfferCard
      offer={item}
      onDetails={() => handleViewOfferDetails(item)}
      onEdit={() => handleAcceptOffer(item)}
      onViewDonorProfile={handleViewDonorProfile} // Desabilitado
    />
  );

  const renderEmptyOffers = () => (
    <View style={styles.emptyOffers}>
      <Ionicons name="cube-outline" size={48} color={colors.gray300} />
      <Text style={styles.emptyOffersTitle}>Nenhuma oferta publicada</Text>
      <Text style={styles.emptyOffersText}>
        Este doador ainda não publicou nenhuma oferta de doação.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>Perfil não encontrado</Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil do Doador</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: user.avatar || `https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=${user.name?.charAt(0) || 'U'}` }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userLocation}>📍 {user.address || 'Localização não informada'}</Text>
          <Text style={styles.userDescription}>
            {user.description || 'Doador comprometido em ajudar a comunidade.'}
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userOffers.length}</Text>
              <Text style={styles.statLabel}>Ofertas Publicadas</Text>
            </View>
          </View>
        </View>

        <View style={styles.offersSection}>
          <Text style={styles.sectionTitle}>
            Ofertas de Doação ({userOffers.length})
          </Text>
          
          {userOffers.length > 0 ? (
            <FlatList
              data={userOffers}
              scrollEnabled={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderOfferCard}
              contentContainerStyle={styles.offersList}
            />
          ) : (
            renderEmptyOffers()
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  backButtonLarge: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  userLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  userDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  offersSection: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  offersList: {
    paddingBottom: 0,
  },
  emptyOffers: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyOffersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyOffersText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PublicDonorProfileScreen;