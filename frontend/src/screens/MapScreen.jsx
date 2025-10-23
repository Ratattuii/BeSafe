import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { showError } from '../utils/alerts';
import { colors, spacing, fontSizes, fontWeights, borderRadius, shadows } from '../styles/globalStyles';

const MapScreen = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: -23.5505, // São Paulo
    longitude: -46.6333,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const response = await api.get('/map/zones');
      if (response.success) {
        setZones(response.data.zones);
      } else {
        showError(response.message || 'Erro ao carregar zonas do mapa.');
      }
    } catch (error) {
      console.error('Erro ao buscar zonas:', error);
      showError('Erro de conexão ao carregar mapa.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchZones();
  };

  const getMarkerColor = (type, severity) => {
    if (type === 'abrigo') return '#4CAF50'; // Verde para abrigos
    if (type === 'risco') {
      switch (severity) {
        case 'critica': return '#F44336'; // Vermelho
        case 'alta': return '#FF9800'; // Laranja
        case 'media': return '#FFC107'; // Amarelo
        case 'baixa': return '#8BC34A'; // Verde claro
        default: return '#757575'; // Cinza
      }
    }
    return '#757575';
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'critica': return 'Crítica';
      case 'alta': return 'Alta';
      case 'media': return 'Média';
      case 'baixa': return 'Baixa';
      default: return 'Desconhecida';
    }
  };

  const handleMarkerPress = (zone) => {
    Alert.alert(
      `${zone.type === 'risco' ? 'Zona de Risco' : 'Abrigo'}`,
      `${zone.description || 'Sem descrição'}\n\nSeveridade: ${getSeverityText(zone.severity)}\nRaio: ${zone.radius}m`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando mapa...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapa de Risco</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        accessible={true}
        accessibilityLabel="Mapa interativo mostrando zonas de risco e abrigos"
      >
        {zones.map((zone) => (
          <React.Fragment key={zone.id}>
            {/* Marcador */}
            <Marker
              coordinate={{
                latitude: parseFloat(zone.latitude),
                longitude: parseFloat(zone.longitude),
              }}
              onPress={() => handleMarkerPress(zone)}
              accessible={true}
              accessibilityLabel={`${zone.type === 'risco' ? 'Zona de risco' : 'Abrigo'} - ${getSeverityText(zone.severity)}`}
              accessibilityHint="Toque para ver detalhes"
            >
              <View style={[styles.marker, { backgroundColor: getMarkerColor(zone.type, zone.severity) }]}>
                <Text style={styles.markerText}>
                  {zone.type === 'risco' ? '⚠' : '🏠'}
                </Text>
              </View>
            </Marker>

            {/* Círculo para zonas de risco */}
            {zone.type === 'risco' && (
              <Circle
                center={{
                  latitude: parseFloat(zone.latitude),
                  longitude: parseFloat(zone.longitude),
                }}
                radius={zone.radius}
                strokeColor={getMarkerColor(zone.type, zone.severity)}
                fillColor={`${getMarkerColor(zone.type, zone.severity)}20`}
                strokeWidth={2}
              />
            )}
          </React.Fragment>
        ))}
      </MapView>

      {/* Legenda */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legenda:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>Risco Crítico</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Risco Alto</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFC107' }]} />
            <Text style={styles.legendText}>Risco Médio</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Abrigo</Text>
          </View>
        </View>
      </View>

      {/* Estatísticas */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {zones.filter(z => z.type === 'risco').length} zonas de risco • {zones.filter(z => z.type === 'abrigo').length} abrigos
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: fontSizes.xl,
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  refreshButtonText: {
    fontSize: fontSizes.lg,
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.small,
  },
  markerText: {
    fontSize: fontSizes.lg,
    color: colors.white,
  },
  legend: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  legendTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    width: '48%',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  stats: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    alignItems: 'center',
  },
  statsText: {
    fontSize: fontSizes.sm,
    color: colors.white,
    fontWeight: fontWeights.semibold,
  },
});

export default MapScreen;
