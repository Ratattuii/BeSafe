import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, globalStyles } from '../styles/globalStyles';
import InstitutionCard from '../components/InstitutionCard';
import api from '../services/api';

const InstitutionListScreen = () => {
  const navigation = useNavigation();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Ref para controlar a carga inicial
  const isInitialLoad = useRef(true);

  const fetchInstitutions = useCallback(async () => {
    // Só mostra o loading principal na carga inicial
    if (isInitialLoad.current) {
      setLoading(true);
    }
    
    try {
      const response = await api.getAllInstitutions();
      if (response.success && response.data.institutions) {
        setInstitutions(response.data.institutions);
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível carregar as instituições.');
      }
    } catch (error) {
      console.error('Erro ao buscar instituições:', error);
      Alert.alert('Erro de Rede', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isInitialLoad.current = false; // Marca que a carga inicial já passou
    }
  }, []);

  // Efeito para a Carga Inicial
  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInstitutions();
  };

  const handlePressInstitution = (institution) => {
    navigation.navigate('InstitutionProfile', {
      institutionId: institution.id,
      institutionName: institution.name
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={globalStyles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={globalStyles.headerTitle}>Instituições</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderItem = ({ item }) => (
    <InstitutionCard
      institution={item}
      onPress={() => handlePressInstitution(item)}
    />
  );

  const renderEmptyList = () => (
    !loading && (
      <View style={styles.emptyContainer}>
        <Ionicons name="business-outline" size={60} color={colors.gray300} />
        <Text style={styles.emptyText}>Nenhuma instituição encontrada</Text>
        <Text style={styles.emptySubtext}>
          Parece que ainda não há instituições cadastradas.
        </Text>
      </View>
    )
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar style="dark" />
      {renderHeader()}
      
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={institutions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    marginBottom: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default InstitutionListScreen;