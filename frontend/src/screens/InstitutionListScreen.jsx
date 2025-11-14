import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
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
      <Text style={styles.title}>Instituições que Você Segue</Text>
      {institutions.length === 0 ? (
        <Text style={styles.emptyText}>Você ainda não segue nenhuma instituição.</Text>
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    margin: 16,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'red',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  }
});

export default InstitutionListScreen;