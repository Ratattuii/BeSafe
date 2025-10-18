git rebase --abortimport React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import useWebScroll from '../utils/useWebScroll';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const isDesktop = width > 768;

const Home = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Obter dados do usuário logado e função de logout
  const { user, logout } = useAuth();
  
  // Estados para dropdowns
  const [showUrgencyFilter, setShowUrgencyFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [selectedUrgency, setSelectedUrgency] = useState('Todos');
  const [selectedType, setSelectedType] = useState('Todos');
  
  // Opções dos filtros
  const urgencyOptions = ['Todos', 'Urgente', 'Alta', 'Média', 'Baixa'];
  const typeOptions = ['Todos', 'Alimentos', 'Roupas', 'Medicamentos', 'Móveis', 'Outros'];

  // Dados mockados para o feed principal
  const [feedData] = useState([
    {
      id: 1,
      institution: 'Casa de Apoio São Vicente',
      timestamp: '2023-10-01 14:30',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=300&fit=crop',
      urgency: 'Urgente',
      description: 'A Casa de Apoio São Vicente está precisando urgentemente de alimentos não perecíveis. Qualquer ajuda é bem-vinda!',
      likes: 120,
      comments: 45,
      shares: 30
    },
    {
      id: 2,
      institution: 'Lar dos Idosos Esperança',
      timestamp: '2023-10-01 13:15',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=300&fit=crop',
      urgency: 'Alta',
      description: 'O Lar dos Idosos Esperança está necessitando de roupas de inverno para os residentes. Doe e ajude a aquecer o coração de alguém!',
      likes: 85,
      comments: 20,
      shares: 15
    },
    {
      id: 3,
      institution: 'Hospital das Clínicas',
      timestamp: '2023-10-01 12:00',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=500&h=300&fit=crop',
      urgency: 'Urgente',
      description: 'Precisamos urgentemente de medicamentos básicos e materiais de primeiros socorros. Ajude-nos a salvar vidas!',
      likes: 200,
      comments: 67,
      shares: 45
    },
    {
      id: 4,
      institution: 'Centro de Reabilitação Nova Vida',
      timestamp: '2023-10-01 11:30',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&h=300&fit=crop',
      urgency: 'Média',
      description: 'Estamos buscando equipamentos de fisioterapia e cadeiras de rodas para nossos pacientes. Cada doação faz a diferença!',
      likes: 95,
      comments: 28,
      shares: 18
    },
    {
      id: 5,
      institution: 'Abrigo Coração Solidário',
      timestamp: '2023-10-01 10:45',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&h=300&fit=crop',
      urgency: 'Alta',
      description: 'Precisamos de cobertores, roupas de cama e produtos de higiene pessoal para as famílias que acolhemos.',
      likes: 156,
      comments: 42,
      shares: 32
    }
  ]);

  // Dados mockados para instituições seguidas
  const [followedInstitutions] = useState([
    {
      id: 1,
      name: 'Cruz Vermelha Brasileira',
      urgency: 'Urgente',
      color: '#FF1744'
    },
    {
      id: 2,
      name: 'Médicos Sem Fronteiras',
      urgency: 'Alta',
      color: '#FF9800'
    },
    {
      id: 3,
      name: 'Banco de Alimentos',
      urgency: 'Média',
      color: '#FFC107'
    },
    {
      id: 4,
      name: 'Lar dos Idosos São José',
      urgency: 'Alta',
      color: '#FF9800'
    },
    {
      id: 5,
      name: 'Associação de Apoio à Criança',
      urgency: 'Média',
      color: '#FFC107'
    },
    {
      id: 6,
      name: 'Casa de Apoio à Mulher',
      urgency: 'Alta',
      color: '#FF9800'
    }
  ]);

  // Scroll será habilitado via CSS puro

  useEffect(() => {
    // Simula carregamento inicial
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Urgente': return '#FF1744';
      case 'Alta': return '#FF9800';
      case 'Média': return '#FFC107';
      case 'Baixa': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Funções de navegação
  const handleProfilePress = () => {
    navigation.navigate('DonorProfile'); // Assumindo que existe essa tela
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log('🚪 Logout realizado - voltando para Splash');
      // Não precisa navegar, o AuthContext vai automaticamente mostrar AuthNavigator
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const handleNotificationsPress = () => {
    navigation.navigate('Notifications'); // Assumindo que existe essa tela
  };

  const handleSearchPress = () => {
    navigation.navigate('Search'); // Assumindo que existe essa tela
  };

  const handleNavigation = (screen) => {
    switch (screen) {
      case 'Início':
        // Já estamos na Home
        break;
      case 'Doações':
        navigation.navigate('PostDonation');
        break;
      case 'Instituições':
        navigation.navigate('InstitutionList'); // Tela de lista de instituições
        break;
      case 'Sobre':
        navigation.navigate('About'); // Tela sobre
        break;
      default:
        break;
    }
  };

  // Funções dos filtros
  const handleUrgencySelect = (urgency) => {
    setSelectedUrgency(urgency);
    setShowUrgencyFilter(false);
    // TODO: Implementar filtragem real
    console.log('Filtro de urgência:', urgency);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setShowTypeFilter(false);
    // TODO: Implementar filtragem real
    console.log('Filtro de tipo:', type);
  };

  const handleLocationPress = () => {
    // TODO: Implementar seleção de localização
    console.log('Filtro de localização pressionado');
  };

  // Funções dos botões do feed
  const handleLikePress = (postId) => {
    console.log('Curtir post:', postId);
    // TODO: Implementar lógica de curtir
  };

  const handleCommentPress = (postId) => {
    console.log('Comentar post:', postId);
    // TODO: Navegar para tela de comentários
  };

  const handleSharePress = (postId) => {
    console.log('Compartilhar post:', postId);
    // TODO: Implementar compartilhamento
  };

  const handleDonatePress = (postId, institution) => {
    console.log('Doar para:', institution, 'Post:', postId);
    // TODO: Navegar para tela de doação específica
    navigation.navigate('PostDonation', { 
      institutionId: postId, 
      institutionName: institution 
    });
  };

  const handleInstitutionPress = (institutionName) => {
    console.log('Ver perfil da instituição:', institutionName);
    // TODO: Navegar para perfil da instituição
    navigation.navigate('InstitutionProfile', { 
      institutionName: institutionName 
    });
  };

  const handleSidebarInstitutionPress = (institution) => {
    console.log('Ver instituição seguida:', institution.name);
    navigation.navigate('InstitutionProfile', { 
      institutionName: institution.name 
    });
  };

  const handleSeeAllInstitutions = () => {
    console.log('Ver todas as instituições');
    navigation.navigate('InstitutionList');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>BeSafe</Text>
        {user && (
          <Text style={styles.userWelcome}>
            Olá, {user.name}! ({user.role === 'donor' ? 'Doador' : 'Instituição'})
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
          <Text style={styles.searchPlaceholder}>🔍 Buscar necessidades ou instituições...</Text>
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

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
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
      <TouchableOpacity style={styles.filterButton} onPress={handleLocationPress}>
        <Text style={styles.filterText}>📍 Localização</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFeedCard = (item) => (
    <View key={item.id} style={styles.feedCard}>
      <TouchableOpacity 
        style={styles.feedHeader}
        onPress={() => handleInstitutionPress(item.institution)}
      >
        <View style={styles.institutionInfo}>
          <View style={styles.institutionAvatar}>
            <Text style={styles.avatarText}>{item.institution.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.institutionName}>{item.institution}</Text>
            <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Image source={{ uri: item.image }} style={styles.feedImage} />

      <View style={styles.feedContent}>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
          <Text style={styles.urgencyText}>{item.urgency}</Text>
        </View>
        
        <Text style={styles.feedDescription}>{item.description}</Text>
        
        <View style={styles.feedActions}>
          <View style={styles.socialStats}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleLikePress(item.id)}
            >
              <Text style={styles.socialIcon}>❤️</Text>
              <Text style={styles.socialCount}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleCommentPress(item.id)}
            >
              <Text style={styles.socialIcon}>💬</Text>
              <Text style={styles.socialCount}>{item.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSharePress(item.id)}
            >
              <Text style={styles.socialIcon}>📤</Text>
              <Text style={styles.socialCount}>{item.shares}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.donateButton}
            onPress={() => handleDonatePress(item.id, item.institution)}
          >
            <Text style={styles.donateButtonText}>Doar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
            <View style={[styles.urgencyDot, { backgroundColor: institution.color }]} />
          </View>
          <View style={styles.institutionDetails}>
            <Text style={styles.institutionItemName}>{institution.name}</Text>
            <Text style={[styles.institutionUrgency, { color: institution.color }]}>
              {institution.urgency}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1434" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      
      {renderHeader()}
      {renderFilters()}
      
      <View style={styles.mainContent}>
        <View style={styles.feedContainer}>
          <ScrollView
            style={[styles.scrollView, { className: 'main-scroll' }]}
            contentContainerStyle={styles.feedScrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF1434']} />
            }
          >
            {feedData.map(renderFeedCard)}
          </ScrollView>
        </View>
        
        {isDesktop && renderSidebar()}
      </View>
      
      {/* Modal de filtro de urgência */}
      <Modal
        visible={showUrgencyFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUrgencyFilter(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
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
                {selectedUrgency === option && <Text style={styles.checkIcon}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de filtro de tipo */}
      <Modal
        visible={showTypeFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTypeFilter(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
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
                {selectedType === option && <Text style={styles.checkIcon}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    width: 120,
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
  scrollView: {
    flex: 1,
  },
  webScrollView: {
    flex: 1,
  },
  feedScrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100, // Mais espaço no final para garantir que último post apareça completo
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  feedHeader: {
    padding: 16,
  },
  institutionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  institutionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF1434',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  institutionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  feedImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  feedContent: {
    padding: 16,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  feedDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  feedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialStats: {
    flexDirection: 'row',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  socialIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  socialCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  donateButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  
  // Estilos para navegação ativa
  activeNavText: {
    color: '#FF1434',
    fontWeight: '600',
  },
  
  // Estilos para modais de dropdown
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
});

export default Home;