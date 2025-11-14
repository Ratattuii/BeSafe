import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api'; // Importa seu serviço de API
import InstitutionCard from '../components/InstitutionCard'; // Reutiliza seu componente de card

const InstitutionListScreen = ({ navigation }) => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFollowedInstitutions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getFollowedInstitutions(); 
      setInstitutions(response.data);
    } catch (err) {
      console.error('Erro ao buscar instituições seguidas:', err);
      setError('Não foi possível carregar as instituições.');
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect recarrega os dados toda vez que a tela entra em foco
  useFocusEffect(
    useCallback(() => {
      fetchFollowedInstitutions();
    }, [])
  );

  const renderItem = ({ item }) => (
    <InstitutionCard
      institution={item}
      onPress={() => navigation.navigate('InstitutionProfile', { institutionId: item.id })}
    />
  );

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#000" />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Instituições que Você Segue</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {institutions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Você ainda não segue nenhuma instituição.</Text>
        </View>
      ) : (
        <FlatList
          data={institutions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'red',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  }
});

export default InstitutionListScreen;