import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../styles/globalStyles';
import NeedCard from '../components/NeedCard';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedUrgency, setSelectedUrgency] = useState('todos');
  const [selectedLocation, setSelectedLocation] = useState('todos');
  const [sortBy, setSortBy] = useState('recentes');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Opções de filtros
  const categories = [
    { id: 'todos', label: 'Todos', icon: '📦' },
    { id: 'alimentos', label: 'Alimentos', icon: '🥫' },
    { id: 'roupas', label: 'Roupas', icon: '👕' },
    { id: 'medicamentos', label: 'Medicamentos', icon: '💊' },
    { id: 'agua', label: 'Água', icon: '💧' },
    { id: 'abrigo', label: 'Abrigo', icon: '🏠' },
  ];

  const urgencyLevels = [
    { id: 'todos', label: 'Todas' },
    { id: 'critica', label: 'Crítica' },
    { id: 'alta', label: 'Alta' },
    { id: 'media', label: 'Média' },
    { id: 'baixa', label: 'Baixa' },
  ];

  const locations = [
    { id: 'todos', label: 'Todas as regiões' },
    { id: 'atual', label: 'Próximo a mim' },
    { id: 'sp', label: 'São Paulo' },
    { id: 'rj', label: 'Rio de Janeiro' },
    { id: 'mg', label: 'Minas Gerais' },
  ];

  const sortOptions = [
    { id: 'recentes', label: 'Mais recentes' },
    { id: 'proximidade', label: 'Proximidade' },
    { id: 'urgencia', label: 'Urgência' },
    { id: 'relevancia', label: 'Relevância' },
  ];

  // Dados mockados de resultados
  const mockResults = [
    {
      id: 1,
      institution: {
        name: 'Hospital Municipal',
        logo: 'https://via.placeholder.com/40x40/4A90E2/white?text=HM',
        isActive: true,
      },
      title: 'Medicamentos urgentes para UTI',
      description: 'Precisamos de medicamentos para pacientes em estado crítico na UTI.',
      image: 'https://via.placeholder.com/350x200/9C27B0/white?text=Medicamentos',
      timestamp: '2023-10-01 10:30',
      urgency: 'critica',
      category: 'medicamentos',
      location: 'São Paulo, SP',
      stats: { likes: 89, comments: 23, shares: 12 },
    },
    {
      id: 2,
      institution: {
        name: 'Abrigo Esperança',
        logo: 'https://via.placeholder.com/40x40/4CAF50/white?text=AE',
        isActive: true,
      },
      title: 'Alimentos para 200 famílias',
      description: 'Alimentos não perecíveis para famílias em situação de vulnerabilidade.',
      image: 'https://via.placeholder.com/350x200/4CAF50/white?text=Alimentos',
      timestamp: '2023-10-01 14:20',
      urgency: 'alta',
      category: 'alimentos',
      location: 'Rio de Janeiro, RJ',
      stats: { likes: 156, comments: 45, shares: 28 },
    },
  ];

  useEffect(() => {
    if (hasSearched) {
      performSearch();
    }
  }, [selectedCategory, selectedUrgency, selectedLocation, sortBy]);

  const performSearch = async () => {
    setLoading(true);
    
    // TODO: Implementar busca real
    // GET /search?q=${searchQuery}&category=${selectedCategory}&urgency=${selectedUrgency}&location=${selectedLocation}&sort=${sortBy}
    
    // Simula busca
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Filtra resultados mockados baseado nos filtros
    let filteredResults = mockResults;
    
    if (selectedCategory !== 'todos') {
      filteredResults = filteredResults.filter(item => item.category === selectedCategory);
    }
    
    if (selectedUrgency !== 'todos') {
      filteredResults = filteredResults.filter(item => item.urgency === selectedUrgency);
    }
    
    if (searchQuery.trim()) {
      filteredResults = filteredResults.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.institution.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setResults(filteredResults);
    setLoading(false);
  };

  const handleSearch = () => {
    setHasSearched(true);
    performSearch();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('todos');
    setSelectedUrgency('todos');
    setSelectedLocation('todos');
    setSortBy('recentes');
    setResults([]);
    setHasSearched(false);
  };

  const handleBackPress = () => {
    navigation?.goBack?.();
  };

  const renderHeader = () => (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
        accessible={true}
        accessibilityLabel="Voltar"
        accessibilityRole="button"
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Buscar</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderSearchBar = () => (
    <View style={[styles.searchBarContainer, isDesktop && styles.searchBarContainerDesktop]}>
      <TextInput
        style={[styles.searchInput, isDesktop && styles.searchInputDesktop]}
        placeholder="Buscar necessidades, instituições..."
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        accessible={true}
        accessibilityLabel="Campo de busca"
        accessibilityHint="Digite para buscar necessidades ou instituições"
      />
      <TouchableOpacity
        style={[styles.searchButton, isDesktop && styles.searchButtonDesktop]}
        onPress={handleSearch}
        accessible={true}
        accessibilityLabel="Botão de buscar"
        accessibilityRole="button"
      >
        <Text style={styles.searchButtonText}>🔍</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilterChips = (options, selected, onSelect, title) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChips}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterChip,
              selected === option.id && styles.filterChipActive
            ]}
            onPress={() => onSelect(option.id)}
            accessible={true}
            accessibilityLabel={`Filtro ${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: selected === option.id }}
          >
            {option.icon && (
              <Text style={styles.filterChipIcon}>{option.icon}</Text>
            )}
            <Text style={[
              styles.filterChipText,
              selected === option.id && styles.filterChipTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFilters = () => (
    <View style={[styles.filtersContainer, isDesktop && styles.filtersContainerDesktop]}>
      {renderFilterChips(categories, selectedCategory, setSelectedCategory, 'Categoria')}
      {renderFilterChips(urgencyLevels, selectedUrgency, setSelectedUrgency, 'Urgência')}
      {renderFilterChips(locations, selectedLocation, setSelectedLocation, 'Localização')}
      
      {/* Ordenação */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Ordenar por</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterChip,
                sortBy === option.id && styles.filterChipActive
              ]}
              onPress={() => setSortBy(option.id)}
              accessible={true}
              accessibilityLabel={`Ordenar por ${option.label}`}
              accessibilityRole="button"
            >
              <Text style={[
                styles.filterChipText,
                sortBy === option.id && styles.filterChipTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Botão limpar filtros */}
      {hasSearched && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={handleClearFilters}
          accessible={true}
          accessibilityLabel="Limpar todos os filtros"
          accessibilityRole="button"
        >
          <Text style={styles.clearFiltersText}>Limpar filtros</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderResults = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Busque por necessidades</Text>
          <Text style={styles.emptyDescription}>
            Use os filtros acima para encontrar exatamente o que procura
          </Text>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>😔</Text>
          <Text style={styles.emptyTitle}>Nenhum resultado encontrado</Text>
          <Text style={styles.emptyDescription}>
            Tente ajustar seus filtros ou buscar por outros termos
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsCount}>
          {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.resultsList}>
          {results.map((need) => (
            <NeedCard
              key={need.id}
              need={need}
              onPress={() => {
                // TODO: Navegar para detalhes da necessidade
                console.log('Ver detalhes:', need.title);
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderDesktopLayout = () => (
    <View style={styles.container}>
      {renderHeader()}
      <View style={styles.desktopContainer}>
        {/* Sidebar com filtros */}
        <View style={styles.desktopSidebar}>
          <Text style={styles.sidebarTitle}>Filtros de Busca</Text>
          {renderSearchBar()}
          <ScrollView showsVerticalScrollIndicator={false}>
            {renderFilters()}
          </ScrollView>
        </View>
        
        {/* Área principal com resultados */}
        <View style={styles.desktopMainContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {renderResults()}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  const renderMobileLayout = () => (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {renderSearchBar()}
        {renderFilters()}
        {renderResults()}
      </ScrollView>
    </View>
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
    gap: 30,
    paddingHorizontal: 20,
  },
  desktopSidebar: {
    width: 350,
    maxWidth: '30%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    height: 'fit-content',
    maxHeight: 'calc(100vh - 40px)',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  desktopMainContent: {
    width: 600,
    maxWidth: '65%',
  },

  // Barra de busca
  searchBarContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 25,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBarContainerDesktop: {
    marginHorizontal: 0,
    marginVertical: 0,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 12,
    paddingRight: 12,
  },
  searchInputDesktop: {
    fontSize: 14,
    paddingVertical: 10,
  },
  searchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
  },
  searchButtonDesktop: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  searchButtonText: {
    fontSize: 18,
    color: colors.white,
  },

  // Filtros
  filtersContainer: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  filtersContainerDesktop: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    minHeight: 44, // Acessibilidade
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipIcon: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  clearFiltersButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Estados
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
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
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Resultados
  resultsContainer: {
    paddingHorizontal: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resultsList: {
    gap: 16,
  },
});

export default SearchScreen;
