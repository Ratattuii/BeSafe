import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import useWebScroll from '../utils/useWebScroll';
import { useAuth } from '../contexts/AuthContext';

const DonorProfileScreen = ({ navigation }) => {
  // Habilitar scroll do mouse no web
  useWebScroll('profile-scroll');

  // Obter dados reais do usuário logado
  const { user } = useAuth();

  // Dados do perfil do doador (mistura dados reais com fallbacks)
  const donorData = {
    name: user?.name || "Usuário Anônimo",
    username: user?.username || `@${user?.name?.toLowerCase().replace(/\s+/g, '') || 'usuario'}`,
    description: user?.description || "Doador ativo, apaixonado por ajudar causas humanitárias e apoiar comunidades em situação de vulnerabilidade.",
    location: user?.location || "Brasil",
    email: user?.email || "usuario@email.com",
    avatar: user?.avatar || `https://via.placeholder.com/80x80/FF6B6B/FFFFFF?text=${user?.name?.charAt(0) || 'U'}`
  };

  // Mock data para doações realizadas
  const donationsHistory = [
    {
      id: 1,
      type: "Doação de Alimentos",
      institution: "Cruz Vermelha Brasileira",
      date: "01/09/2023",
      image: "https://via.placeholder.com/200x120/4ECDC4/FFFFFF?text=Alimentos",
      status: "Entregue"
    },
    {
      id: 2,
      type: "Doação de Roupas",
      institution: "Casa de Apoio Santa Maria",
      date: "15/08/2023",
      image: "https://via.placeholder.com/200x120/45B7D1/FFFFFF?text=Roupas",
      status: "Entregue"
    },
    {
      id: 3,
      type: "Doação de Medicamentos",
      institution: "Hospital das Clínicas",
      date: "30/07/2023",
      image: "https://via.placeholder.com/200x120/96CEB4/FFFFFF?text=Medicamentos",
      status: "Entregue"
    }
  ];

  // Mock data para doações em andamento
  const activeDonations = [
    {
      id: 1,
      type: "Cestas Básicas",
      institution: "Instituto Beneficente",
      quantity: "15 cestas",
      image: "https://via.placeholder.com/300x180/FFA07A/FFFFFF?text=Cestas",
      status: "Em preparação"
    },
    {
      id: 2,
      type: "Roupas de Inverno",
      institution: "Abrigo Municipal",
      quantity: "50 peças",
      image: "https://via.placeholder.com/300x180/DDA0DD/FFFFFF?text=Roupas",
      status: "Aguardando retirada"
    }
  ];

  // Funções de navegação
  const handleInstitutionPress = (institutionName, institutionId = null) => {
    console.log('Navegar para perfil da instituição:', institutionName);
    navigation.navigate('InstitutionProfile', { 
      institutionId: institutionId,
      institutionName: institutionName 
    });
  };

  const handleNewDonation = () => {
    console.log('Nova doação');
    navigation.navigate('PostDonation');
  };

  const handleEditDonation = (donationId) => {
    console.log('Editar doação:', donationId);
    // TODO: Navegar para tela de edição
  };

  const handleCancelDonation = (donationId) => {
    console.log('Cancelar doação:', donationId);
    // TODO: Implementar cancelamento
  };

  const renderDonationHistoryCard = (donation) => (
    <View key={donation.id} style={styles.historyCard}>
      <Image source={{ uri: donation.image }} style={styles.historyCardImage} />
      <View style={styles.historyCardContent}>
        <View style={styles.historyCardHeader}>
          <Text style={styles.historyCardIcon}>🎁</Text>
          <Text style={styles.historyCardTitle}>{donation.type}</Text>
        </View>
        <TouchableOpacity onPress={() => handleInstitutionPress(donation.institution, donation.institutionId)}>
          <Text style={[styles.historyCardInstitution, styles.clickableInstitution]}>
            {donation.institution}
          </Text>
        </TouchableOpacity>
        <Text style={styles.historyCardDate}>Entregue em {donation.date}</Text>
      </View>
    </View>
  );

  const renderActiveDonationCard = (donation) => (
    <View key={donation.id} style={styles.activeCard}>
      <Image source={{ uri: donation.image }} style={styles.activeCardImage} />
      <View style={styles.activeCardContent}>
        <View style={styles.activeCardHeader}>
          <Text style={styles.activeCardIcon}>📦</Text>
          <Text style={styles.activeCardTitle}>{donation.type}</Text>
        </View>
        <Text style={styles.activeCardQuantity}>{donation.quantity}</Text>
        <TouchableOpacity onPress={() => handleInstitutionPress(donation.institution, donation.institutionId)}>
          <Text style={[styles.activeCardInstitution, styles.clickableInstitution]}>
            Para: {donation.institution}
          </Text>
        </TouchableOpacity>
        <View style={styles.activeCardActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditDonation(donation.id)}
          >
            <Text style={styles.editButtonText}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelDonation(donation.id)}
          >
            <Text style={styles.cancelButtonText}>✖️ Cancelar doação</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

    return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerIcon}>🎁</Text>
          <Text style={styles.headerTitle}>
            Meu Perfil de Doador {user ? '✅' : '⚠️'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleNewDonation}>
          <Text style={styles.addButtonText}>+ Nova Doação</Text>
        </TouchableOpacity>
      </View>

      {/* Status do usuário */}
      {user ? (
        <View style={styles.userStatusContainer}>
          <Text style={styles.userStatusText}>
            ✅ Dados carregados do usuário: {user.name}
          </Text>
        </View>
      ) : (
        <View style={styles.userStatusContainer}>
          <Text style={styles.userStatusTextWarning}>
            ⚠️ Usuário não logado - usando dados padrão
          </Text>
        </View>
      )}

      <ScrollView nativeID="profile-scroll" style={styles.scrollContent}>
        {/* Banner e Profile Info */}
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: "https://via.placeholder.com/1000x200/4ECDC4/FFFFFF?text=Banner+Doador" }} 
            style={styles.bannerImage} 
          />
          <View style={styles.profileInfo}>
            <Image source={{ uri: donorData.avatar }} style={styles.avatar} />
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{donorData.name}</Text>
              <Text style={styles.profileUsername}>{donorData.username}</Text>
              <Text style={styles.profileDescription}>{donorData.description}</Text>
              <View style={styles.profileContact}>
                <Text style={styles.contactItem}>📍 {donorData.location}</Text>
                <Text style={styles.contactItem}>✉️ {donorData.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Sections */}
        <View style={styles.contentContainer}>
          {/* Doações em Andamento */}
          <View style={styles.leftColumn}>
            <Text style={styles.sectionTitle}>Doações em Andamento</Text>
            {activeDonations.map(renderActiveDonationCard)}
          </View>

          {/* Histórico de Doações */}
          <View style={styles.rightColumn}>
            <Text style={styles.sectionTitle}>Histórico de Doações</Text>
            {donationsHistory.map(renderDonationHistoryCard)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webScrollContainer: {
    flex: 1,
    overflow: 'auto',
    maxHeight: '100%',
  },
  scrollContent: {
    flex: 1,
  },
  
  // Status do usuário
  userStatusContainer: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  userStatusText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
    textAlign: 'center',
  },
  userStatusTextWarning: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#FF4757',
    fontWeight: 'bold',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Profile Section Styles
  profileSection: {
    backgroundColor: '#FFFFFF',
  },
  bannerImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  profileInfo: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: -40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    marginRight: 20,
  },
  profileText: {
    flex: 1,
    paddingTop: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
  },
  profileDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  profileContact: {
    flexDirection: 'row',
    gap: 20,
  },
  contactItem: {
    fontSize: 14,
    color: '#888888',
  },

  // Content Container
  contentContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 30,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },

  // Active Donations Cards
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeCardImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  activeCardContent: {
    padding: 16,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeCardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  activeCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  activeCardQuantity: {
    fontSize: 14,
    color: '#FF4757',
    fontWeight: '600',
    marginBottom: 4,
  },
  activeCardInstitution: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  activeCardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  editButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cancelButtonText: {
    fontSize: 12,
    color: '#666666',
  },

  // History Cards
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyCardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  historyCardContent: {
    padding: 16,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCardIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  historyCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  historyCardInstitution: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  historyCardDate: {
    fontSize: 12,
    color: '#999999',
  },
  
  // Estilo para instituições clicáveis
  clickableInstitution: {
    color: '#FF4757',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});

export default DonorProfileScreen;