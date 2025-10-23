import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const AdminDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      if (response.success) {
        setStats(response.data);
      } else {
        Alert.alert('Erro', 'Erro ao carregar estatísticas');
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      Alert.alert('Erro', 'Erro de conexão');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const StatCard = ({ title, value, subtitle, color = '#FF1434' }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#F2F2F2" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando estatísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#F2F2F2" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Painel Administrativo</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          accessible={true}
          accessibilityLabel="Atualizar estatísticas"
          accessibilityRole="button"
        >
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Estatísticas de Usuários */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Usuários</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Total" 
              value={stats?.users?.total_users || 0}
              color="#2196F3"
            />
            <StatCard 
              title="Doadores" 
              value={stats?.users?.total_donors || 0}
              color="#4CAF50"
            />
            <StatCard 
              title="Instituições" 
              value={stats?.users?.total_institutions || 0}
              color="#FF9800"
            />
            <StatCard 
              title="Verificadas" 
              value={stats?.users?.verified_users || 0}
              subtitle={`de ${stats?.users?.total_institutions || 0}`}
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Estatísticas de Necessidades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Necessidades</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Total" 
              value={stats?.needs?.total_needs || 0}
              color="#2196F3"
            />
            <StatCard 
              title="Ativas" 
              value={stats?.needs?.active_needs || 0}
              color="#4CAF50"
            />
            <StatCard 
              title="Concluídas" 
              value={stats?.needs?.completed_needs || 0}
              color="#8BC34A"
            />
            <StatCard 
              title="Críticas" 
              value={stats?.needs?.critical_needs || 0}
              color="#F44336"
            />
          </View>
        </View>

        {/* Estatísticas de Doações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎁 Doações</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Total" 
              value={stats?.donations?.total_donations || 0}
              color="#2196F3"
            />
            <StatCard 
              title="Pendentes" 
              value={stats?.donations?.pending_donations || 0}
              color="#FF9800"
            />
            <StatCard 
              title="Confirmadas" 
              value={stats?.donations?.confirmed_donations || 0}
              color="#FFC107"
            />
            <StatCard 
              title="Entregues" 
              value={stats?.donations?.delivered_donations || 0}
              color="#4CAF50"
            />
          </View>
        </View>

        {/* Estatísticas de Avaliações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Avaliações</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Total" 
              value={stats?.reviews?.total_reviews || 0}
              color="#2196F3"
            />
            <StatCard 
              title="Média" 
              value={stats?.reviews?.average_rating || '0.0'}
              color="#FFD700"
            />
            <StatCard 
              title="5 Estrelas" 
              value={stats?.reviews?.five_star_reviews || 0}
              color="#FFD700"
            />
            <StatCard 
              title="Positivas" 
              value={stats?.reviews?.positive_reviews || 0}
              subtitle="4+ estrelas"
              color="#4CAF50"
            />
          </View>
        </View>

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminUsers')}
              accessible={true}
              accessibilityLabel="Gerenciar usuários"
              accessibilityRole="button"
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>Usuários</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminDonations')}
              accessible={true}
              accessibilityLabel="Gerenciar doações"
              accessibilityRole="button"
            >
              <Text style={styles.actionIcon}>🎁</Text>
              <Text style={styles.actionText}>Doações</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  'Relatório',
                  'Deseja baixar o relatório de doações?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Baixar', onPress: () => {
                      // TODO: Implementar download do relatório
                      Alert.alert('Info', 'Funcionalidade em desenvolvimento');
                    }}
                  ]
                );
              }}
              accessible={true}
              accessibilityLabel="Gerar relatório"
              accessibilityRole="button"
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Relatórios</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                Alert.alert('Info', 'Funcionalidade em desenvolvimento');
              }}
              accessible={true}
              accessibilityLabel="Configurações do sistema"
              accessibilityRole="button"
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>Configurações</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informações do Sistema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Informações do Sistema</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Bem-vindo ao painel administrativo do BeSafe!
            </Text>
            <Text style={styles.infoText}>
              Aqui você pode gerenciar usuários, doações e acompanhar as estatísticas do sistema.
            </Text>
            <Text style={styles.infoText}>
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </Text>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 18,
  },

  content: {
    flex: 1,
    padding: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
  },

  // Seções
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },

  // Cards de Estatísticas
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },

  // Ações Rápidas
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },

  // Informações
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default AdminDashboard;
