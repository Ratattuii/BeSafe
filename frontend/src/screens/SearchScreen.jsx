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
  Alert,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../styles/globalStyles';
import NeedCard from '../components/NeedCard';
import api from '../services/api';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedUrgency, setSelectedUrgency] = useState('todos');
  const [selectedLocation, setSelectedLocation] = useState('todos');
  const [sortBy, setSortBy] = useState('recentes');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  
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

  useEffect(() => {
    if (hasSearched) {
      performSearch();
    }
  }, [selectedCategory, selectedUrgency, selectedLocation, sortBy]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepara filtros para a API
      const filters = {};
      
      if (selectedCategory !== 'todos') {
        const categoryMap = {
          'alimentos': 'alimentos',
          'roupas': 'roupas',
          'medicamentos': 'medicamentos',
          'agua': 'outros',
          'abrigo': 'outros'
        };
        filters.category = categoryMap[selectedCategory] || selectedCategory;
      }
      
      if (selectedUrgency !== 'todos') {
        const urgencyMap = {
          'critica': 'critica',
          'alta': 'alta',
          'media': 'media',
          'baixa': 'baixa'
        };
        filters.urgency = urgencyMap[selectedUrgency] || selectedUrgency;
      }
      
      // Mapeia ordenação
      const sortMap = {
        'recentes': 'recentes',
        'proximidade': 'proximidade',
        'urgencia': 'urgencia',
        'relevancia': 'relevancia'
      };
      filters.sort = sortMap[sortBy] || 'recentes';
      
      // Faz a busca na API
      const response = await api.searchNeeds(searchQuery.trim(), filters);
      
      if (response.success) {
        setResults(response.data.needs || []);
      } else {
        setError('Erro ao buscar necessidades');
        setResults([]);
      }
      
    } catch (error) {
      console.error('Erro na busca:', error);
      setError('Erro ao buscar necessidades. Tente novamente.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim() || selectedCategory !== 'todos' || selectedUrgency !== 'todos' || selectedLocation !== 'todos') {
      setHasSearched(true);
      performSearch();
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('todos');
    setSelectedUrgency('todos');
    setSelectedLocation('todos');
    setSortBy('recentes');
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  const handleBackPress = () => {
    navigation?.goBack?.();
  };

  const renderNeedItem = ({ item }) => (
    <NeedCard
      need={item}
      onPress={(need) => {
        // Navega para o perfil da instituição ou mostra detalhes
        navigation.navigate('InstitutionProfile', { 
          institutionId: need.institution_id,
          institutionName: need.institution_name 
        });
      }}
      onDetails={(need) => {
        // Mostra detalhes da necessidade
        Alert.alert(
          need.title,
          `Descrição: ${need.description}\n` +
          `Quantidade: ${need.quantity} ${need.unit}\n` +
          `Categoria: ${need.category}\n` +
          `Urgência: ${need.urgency}`
        );
      }}
      isClickable={true}
    />
  );

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

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Erro na busca</Text>
          <Text style={styles.emptyDescription}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
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
        
        {/* ✅ AGORA USANDO FlatList EM VEZ DE map */}
        <FlatList
          data={results}
          renderItem={renderNeedItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Desabilita scroll interno pois já está dentro de um ScrollView
        />
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
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
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
    paddingBottom: 20, // Para dar espaçamento no final
  },
});

export default SearchScreen;