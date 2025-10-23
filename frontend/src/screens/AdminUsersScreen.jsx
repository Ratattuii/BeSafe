import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const AdminUsersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    verified: '',
    active: '',
    search: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (reset = false) => {
    try {
      if (reset) {
        setUsers([]);
      }
      
      const queryParams = new URLSearchParams();
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.verified) queryParams.append('verified', filters.verified);
      if (filters.active) queryParams.append('active', filters.active);
      queryParams.append('limit', '50');
      queryParams.append('offset', reset ? '0' : users.length.toString());

      const response = await api.get(`/admin/users?${queryParams}`);
      if (response.success) {
        if (reset) {
          setUsers(response.data.users);
        } else {
          setUsers(prev => [...prev, ...response.data.users]);
        }
      } else {
        Alert.alert('Erro', 'Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      Alert.alert('Erro', 'Erro de conexão');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers(true);
  };

  const handleVerifyUser = async (userId, verified) => {
    try {
      const response = await api.put(`/admin/users/${userId}/verify`, { verified });
      if (response.success) {
        Alert.alert('Sucesso', `Usuário ${verified ? 'verificado' : 'desverificado'} com sucesso`);
        loadUsers(true);
      } else {
        Alert.alert('Erro', response.message || 'Erro ao verificar usuário');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      Alert.alert('Erro', 'Erro de conexão');
    }
  };

  const handleSuspendUser = async (userId, suspended) => {
    try {
      const response = await api.put(`/admin/users/${userId}/suspend`, { suspended });
      if (response.success) {
        Alert.alert('Sucesso', `Usuário ${suspended ? 'suspenso' : 'reativado'} com sucesso`);
        loadUsers(true);
      } else {
        Alert.alert('Erro', response.message || 'Erro ao suspender usuário');
      }
    } catch (error) {
      console.error('Erro ao suspender usuário:', error);
      Alert.alert('Erro', 'Erro de conexão');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'donor': return '👤';
      case 'institution': return '🏥';
      case 'admin': return '👑';
      default: return '❓';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'donor': return '#4CAF50';
      case 'institution': return '#FF9800';
      case 'admin': return '#9C27B0';
      default: return '#757575';
    }
  };

  const UserCard = ({ user: userData }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
          <View style={styles.userMeta}>
            <Text style={[styles.userRole, { color: getRoleColor(userData.role) }]}>
              {getRoleIcon(userData.role)} {userData.role}
            </Text>
            {userData.is_verified && (
              <Text style={styles.verifiedBadge}>✓ Verificado</Text>
            )}
            {!userData.is_active && (
              <Text style={styles.suspendedBadge}>⚠️ Suspenso</Text>
            )}
          </View>
        </View>
        <View style={styles.userStats}>
          <Text style={styles.statText}>Doações: {userData.total_donations || 0}</Text>
          <Text style={styles.statText}>Necessidades: {userData.total_needs || 0}</Text>
          {userData.average_rating && (
            <Text style={styles.statText}>Avaliação: {userData.average_rating}</Text>
          )}
        </View>
      </View>

      <View style={styles.userActions}>
        {userData.role === 'institution' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              userData.is_verified ? styles.actionButtonSecondary : styles.actionButtonPrimary
            ]}
            onPress={() => handleVerifyUser(userData.id, !userData.is_verified)}
            accessible={true}
            accessibilityLabel={userData.is_verified ? "Desverificar instituição" : "Verificar instituição"}
            accessibilityRole="button"
          >
            <Text style={[
              styles.actionButtonText,
              userData.is_verified ? styles.actionButtonTextSecondary : styles.actionButtonTextPrimary
            ]}>
              {userData.is_verified ? 'Desverificar' : 'Verificar'}
            </Text>
          </TouchableOpacity>
        )}
        
        {userData.role !== 'admin' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              userData.is_active ? styles.actionButtonDanger : styles.actionButtonSuccess
            ]}
            onPress={() => handleSuspendUser(userData.id, userData.is_active)}
            accessible={true}
            accessibilityLabel={userData.is_active ? "Suspender usuário" : "Reativar usuário"}
            accessibilityRole="button"
          >
            <Text style={[
              styles.actionButtonText,
              userData.is_active ? styles.actionButtonTextDanger : styles.actionButtonTextSuccess
            ]}>
              {userData.is_active ? 'Suspender' : 'Reativar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const filteredUsers = users.filter(userData => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return userData.name.toLowerCase().includes(searchLower) || 
             userData.email.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#F2F2F2" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gerenciar Usuários</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          value={filters.search}
          onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
          placeholder="Buscar usuários..."
          placeholderTextColor="#9E9E9E"
          accessible={true}
          accessibilityLabel="Campo de busca"
          accessibilityHint="Digite o nome ou email do usuário"
        />
        
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filters.role === '' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, role: '' }))}
            accessible={true}
            accessibilityLabel="Todos os tipos"
            accessibilityRole="button"
          >
            <Text style={[styles.filterButtonText, filters.role === '' && styles.filterButtonTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filters.role === 'donor' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, role: 'donor' }))}
            accessible={true}
            accessibilityLabel="Filtrar doadores"
            accessibilityRole="button"
          >
            <Text style={[styles.filterButtonText, filters.role === 'donor' && styles.filterButtonTextActive]}>
              Doadores
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filters.role === 'institution' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, role: 'institution' }))}
            accessible={true}
            accessibilityLabel="Filtrar instituições"
            accessibilityRole="button"
          >
            <Text style={[styles.filterButtonText, filters.role === 'institution' && styles.filterButtonTextActive]}>
              Instituições
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de Usuários */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <UserCard user={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={() => loadUsers(false)}
        onEndReachedThreshold={0.1}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FF1434',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  placeholder: {
    width: 40,
  },

  // Filtros
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 2,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF1434',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  // Lista
  listContainer: {
    padding: 20,
  },

  // Card do Usuário
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 8,
  },
  suspendedBadge: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  userStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },

  // Ações
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  actionButtonSecondary: {
    backgroundColor: '#FF9800',
  },
  actionButtonDanger: {
    backgroundColor: '#F44336',
  },
  actionButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    color: '#FFFFFF',
  },
  actionButtonTextSecondary: {
    color: '#FFFFFF',
  },
  actionButtonTextDanger: {
    color: '#FFFFFF',
  },
  actionButtonTextSuccess: {
    color: '#FFFFFF',
  },
});

export default AdminUsersScreen;
