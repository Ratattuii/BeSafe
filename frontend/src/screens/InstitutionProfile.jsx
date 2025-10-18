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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../styles/globalStyles';
import NeedCard from '../components/NeedCard';
import DonationCard from '../components/DonationCard';

const InstitutionProfile = ({ route, navigation }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  
  // Detecta se é desktop
  const isDesktop = width > 900;

  // Dados mockados da instituição - virão do backend via GET /institutions/:id
  const [institution, setInstitution] = useState({
    id: 1,
    name: 'Cruz Vermelha Brasileira',
    handle: '@cruzvermelha',
    description: 'A Cruz Vermelha Brasileira é uma instituição humanitária que atua em situações de emergência e desastres, oferecendo apoio e assistência às comunidades afetadas. Fundada em 1908, a...',
    logo: 'https://via.placeholder.com/120x120/FF1434/white?text=+',
    followers: 12500,
    isVerified: true,
    location: 'Brasil',
  });

  // Necessidades atuais - virão do backend via GET /institutions/:id/needs
  const [currentNeeds, setCurrentNeeds] = useState([
    {
      id: 1,
      title: 'Água Potável',
      quantity: '10.000 litros',
      progress: 60,
      image: 'https://via.placeholder.com/60x60/4A90E2/white?text=💧',
      category: 'agua',
      urgency: 'alta',
    },
    {
      id: 2,
      title: 'Alimentos Não Perecíveis',
      quantity: '5.000 kg',
      progress: 30,
      image: 'https://via.placeholder.com/60x60/4CAF50/white?text=🥫',
      category: 'alimentos',
      urgency: 'urgente',
    },
    {
      id: 3,
      title: 'Roupas de Inverno',
      quantity: '2.000 peças',
      progress: 80,
      image: 'https://via.placeholder.com/60x60/FF9800/white?text=👕',
      category: 'roupas',
      urgency: 'media',
    },
  ]);

  // Histórico de doações - virão do backend via GET /institutions/:id/donations
  const [donationHistory, setDonationHistory] = useState([
    {
      id: 1,
      title: 'Doação de Alimentos',
      date: '01/09/2023',
      description: 'Recebido em 01/09/2023',
      image: 'https://via.placeholder.com/60x60/4CAF50/white?text=🥫',
      amount: '500 kg',
    },
    {
      id: 2,
      title: 'Doação de Roupas',
      date: '15/08/2023',
      description: 'Recebido em 15/08/2023',
      image: 'https://via.placeholder.com/60x60/2196F3/white?text=👕',
      amount: '200 peças',
    },
    {
      id: 3,
      title: 'Doação de Medicamentos',
      date: '30/07/2023',
      description: 'Recebido em 30/07/2023',
      image: 'https://via.placeholder.com/60x60/9C27B0/white?text=💊',
      amount: '100 unidades',
    },
  ]);

  const handleFollow = () => {
    setLoading(true);
    // TODO: Implementar POST /institutions/:id/follow ou DELETE /institutions/:id/follow
    setTimeout(() => {
      setIsFollowing(!isFollowing);
      setLoading(false);
    }, 500);
  };

  const handleAddRequest = () => {
    // TODO: Navegar para tela de criar necessidade
    console.log('Adicionar pedido para:', institution.name);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'agua': return '💧';
      case 'alimentos': return '🥫';
      case 'roupas': return '👕';
      case 'medicamentos': return '💊';
      default: return '📦';
    }
  };

  const renderInstitutionHeader = () => (
    <View style={[styles.headerContainer, isDesktop && styles.headerContainerDesktop]}>
      {/* Logo e informações básicas */}
      <View style={styles.logoSection}>
        <Image
          source={{ uri: institution.logo }}
          style={styles.institutionLogo}
        />
        <View style={styles.institutionInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.institutionName}>{institution.name}</Text>
            {institution.isVerified && (
              <Text style={styles.verifiedBadge}>✓</Text>
            )}
          </View>
          <Text style={styles.institutionHandle}>{institution.handle}</Text>
          <Text style={styles.followersCount}>
            {institution.followers.toLocaleString()} seguidores
          </Text>
        </View>
      </View>

      {/* Descrição */}
      <Text style={styles.institutionDescription}>
        {institution.description}
      </Text>

      {/* Botão seguir */}
      <TouchableOpacity
        style={[styles.followButton, isFollowing && styles.followButtonActive]}
        onPress={handleFollow}
        disabled={loading}
      >
        <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
          {loading ? 'Carregando...' : isFollowing ? 'Seguindo' : 'Seguir'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentNeeds = () => (
    <View style={[styles.sectionContainer, isDesktop && styles.sectionContainerDesktop]}>
      <Text style={styles.sectionTitle}>Necessidades Atuais</Text>
      <View style={styles.needsList}>
        {currentNeeds.map((need) => (
          <TouchableOpacity key={need.id} style={styles.needItem}>
            <Image source={{ uri: need.image }} style={styles.needImage} />
            <View style={styles.needInfo}>
              <Text style={styles.needTitle}>{need.title}</Text>
              <Text style={styles.needQuantity}>{need.quantity}</Text>
              
              {/* Barra de progresso */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${need.progress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{need.progress}%</Text>
              </View>
            </View>
            <Text style={styles.categoryIcon}>
              {getCategoryIcon(need.category)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Botão adicionar pedido */}
      <TouchableOpacity style={styles.addRequestButton} onPress={handleAddRequest}>
        <Text style={styles.addRequestButtonText}>+ Adicionar Pedido</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDonationHistory = () => (
    <View style={[styles.sectionContainer, isDesktop && styles.sectionContainerDesktop]}>
      <Text style={styles.sectionTitle}>Histórico de Doações</Text>
      <View style={styles.donationsList}>
        {donationHistory.map((donation) => (
          <DonationCard key={donation.id} donation={donation} />
        ))}
      </View>
    </View>
  );

  const renderDesktopLayout = () => (
    <View style={styles.desktopContainer}>
      {/* Coluna esquerda - Info da instituição */}
      <View style={styles.desktopLeftColumn}>
        {renderInstitutionHeader()}
      </View>
      
      {/* Coluna direita - Necessidades e histórico */}
      <View style={styles.desktopRightColumn}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderCurrentNeeds()}
          {renderDonationHistory()}
        </ScrollView>
      </View>
    </View>
  );

  const renderMobileLayout = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderInstitutionHeader()}
      {renderCurrentNeeds()}
      {renderDonationHistory()}
    </ScrollView>
  );

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
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    gap: 40,
    paddingHorizontal: 20,
  },
  desktopLeftColumn: {
    width: 400,
    maxWidth: '40%',
  },
  desktopRightColumn: {
    width: 500,
    maxWidth: '55%',
  },

  // Header da Instituição
  headerContainer: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerContainerDesktop: {
    position: 'sticky',
    top: 20,
    marginBottom: 0,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  institutionLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: colors.primary,
  },
  institutionInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  institutionName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: colors.primary,
    color: colors.white,
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },
  institutionHandle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  followersCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  institutionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  followButtonActive: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  followButtonTextActive: {
    color: colors.primary,
  },

  // Seções
  sectionContainer: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionContainerDesktop: {
    marginHorizontal: 0,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },

  // Necessidades Atuais
  needsList: {
    gap: 16,
  },
  needItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.tertiary,
    borderRadius: 12,
    gap: 12,
  },
  needImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.secondary,
  },
  needInfo: {
    flex: 1,
  },
  needTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  needQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 30,
  },
  categoryIcon: {
    fontSize: 20,
    marginLeft: 8,
  },

  // Botão adicionar pedido
  addRequestButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  addRequestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  // Lista de doações
  donationsList: {
    gap: 12,
  },
});

export default InstitutionProfile;
