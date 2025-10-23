import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { showError } from '../utils/alerts';
import { colors, spacing, fontSizes, fontWeights, borderRadius, shadows } from '../styles/globalStyles';

const AdminMapScreen = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated, getUserRole } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: -23.5505, // São Paulo
    longitude: -46.6333,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [zoneForm, setZoneForm] = useState({
    type: 'risco',
    severity: 'media',
    radius: 100,
    description: '',
  });

  useEffect(() => {
    if (isAuthenticated() && getUserRole() === 'admin') {
      fetchZones();
    } else {
      Alert.alert('Acesso Negado', 'Você não tem permissão para acessar esta área.');
      navigation.navigate('Home');
    }
  }, [user, isAuthenticated, getUserRole]);

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
    }
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setShowZoneForm(true);
  };

  const handleCreateZone = async () => {
    if (!selectedLocation) {
      showError('Selecione uma localização no mapa primeiro.');
      return;
    }

    if (!zoneForm.description.trim()) {
      showError('Descrição é obrigatória.');
      return;
    }

    try {
      const payload = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        radius: parseInt(zoneForm.radius),
        type: zoneForm.type,
        description: zoneForm.description.trim(),
        severity: zoneForm.severity,
      };

      const response = await api.post('/map/zones', payload);
      if (response.success) {
        Alert.alert('Sucesso', 'Zona criada com sucesso!');
        setShowZoneForm(false);
        setSelectedLocation(null);
        setZoneForm({
          type: 'risco',
          severity: 'media',
          radius: 100,
          description: '',
        });
        fetchZones(); // Recarrega as zonas
      } else {
        showError(response.message || 'Erro ao criar zona.');
      }
    } catch (error) {
      console.error('Erro ao criar zona:', error);
      showError('Erro de conexão ao criar zona.');
    }
  };

  const handleDeleteZone = async (zoneId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja realmente excluir esta zona?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/map/zones/${zoneId}`);
              if (response.success) {
                Alert.alert('Sucesso', 'Zona excluída com sucesso!');
                fetchZones(); // Recarrega as zonas
              } else {
                showError(response.message || 'Erro ao excluir zona.');
              }
            } catch (error) {
              console.error('Erro ao excluir zona:', error);
              showError('Erro de conexão ao excluir zona.');
            }
          },
        },
      ]
    );
  };

  const getMarkerColor = (type, severity) => {
    if (type === 'abrigo') return '#4CAF50';
    if (type === 'risco') {
      switch (severity) {
        case 'critica': return '#F44336';
        case 'alta': return '#FF9800';
        case 'media': return '#FFC107';
        case 'baixa': return '#8BC34A';
        default: return '#757575';
      }
    }
    return '#757575';
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando mapa administrativo...</Text>
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
        <Text style={styles.headerTitle}>Gerenciar Mapa</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mapa */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
        accessible={true}
        accessibilityLabel="Mapa administrativo para gerenciar zonas de risco e abrigos"
      >
        {zones.map((zone) => (
          <React.Fragment key={zone.id}>
            {/* Marcador */}
            <Marker
              coordinate={{
                latitude: parseFloat(zone.latitude),
                longitude: parseFloat(zone.longitude),
              }}
              onPress={() => handleDeleteZone(zone.id)}
              accessible={true}
              accessibilityLabel={`Zona ${zone.type} - ${zone.severity}`}
              accessibilityHint="Toque para excluir esta zona"
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

        {/* Marcador da localização selecionada */}
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            accessible={true}
            accessibilityLabel="Localização selecionada para nova zona"
          >
            <View style={styles.selectedMarker}>
              <Text style={styles.selectedMarkerText}>📍</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Instruções */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Toque no mapa para adicionar uma nova zona. Toque em uma zona existente para excluí-la.
        </Text>
      </View>

      {/* Modal do Formulário */}
      <Modal
        visible={showZoneForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowZoneForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Zona</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo:</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioButton, zoneForm.type === 'risco' && styles.radioButtonSelected]}
                  onPress={() => setZoneForm({ ...zoneForm, type: 'risco' })}
                >
                  <Text style={[styles.radioText, zoneForm.type === 'risco' && styles.radioTextSelected]}>
                    Risco
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, zoneForm.type === 'abrigo' && styles.radioButtonSelected]}
                  onPress={() => setZoneForm({ ...zoneForm, type: 'abrigo' })}
                >
                  <Text style={[styles.radioText, zoneForm.type === 'abrigo' && styles.radioTextSelected]}>
                    Abrigo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {zoneForm.type === 'risco' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Severidade:</Text>
                <View style={styles.severityGroup}>
                  {['baixa', 'media', 'alta', 'critica'].map((severity) => (
                    <TouchableOpacity
                      key={severity}
                      style={[styles.severityButton, zoneForm.severity === severity && styles.severityButtonSelected]}
                      onPress={() => setZoneForm({ ...zoneForm, severity })}
                    >
                      <Text style={[styles.severityText, zoneForm.severity === severity && styles.severityTextSelected]}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Raio (metros):</Text>
              <TextInput
                style={styles.input}
                value={zoneForm.radius.toString()}
                onChangeText={(text) => setZoneForm({ ...zoneForm, radius: parseInt(text) || 100 })}
                keyboardType="numeric"
                placeholder="100"
                accessible={true}
                accessibilityLabel="Raio da zona em metros"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Descrição:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={zoneForm.description}
                onChangeText={(text) => setZoneForm({ ...zoneForm, description: text })}
                placeholder="Descreva a zona..."
                multiline
                numberOfLines={3}
                accessible={true}
                accessibilityLabel="Descrição da zona"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowZoneForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateZone}
              >
                <Text style={styles.createButtonText}>Criar Zona</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  selectedMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  selectedMarkerText: {
    fontSize: fontSizes.md,
  },
  instructions: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  instructionsText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
    ...shadows.large,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  radioGroup: {
    flexDirection: 'row',
  },
  radioButton: {
    flex: 1,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    marginRight: spacing.xs,
    borderRadius: borderRadius.small,
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radioText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  radioTextSelected: {
    color: colors.white,
    fontWeight: fontWeights.semibold,
  },
  severityGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  severityButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.small,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  severityButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  severityText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  severityTextSelected: {
    color: colors.white,
    fontWeight: fontWeights.semibold,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.small,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.gray200,
  },
  createButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    fontWeight: fontWeights.semibold,
  },
  createButtonText: {
    fontSize: fontSizes.md,
    color: colors.white,
    fontWeight: fontWeights.semibold,
  },
});

export default AdminMapScreen;
