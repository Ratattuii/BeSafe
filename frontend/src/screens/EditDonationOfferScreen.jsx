// screens/EditDonationOfferScreen.jsx
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
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EditDonationOfferScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { offerId } = route.params;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    category: '',
    conditions: '',
    location: '',
    availability: '',
    expiryDate: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  // Estados para o modal customizado
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info'); // 'info', 'success', 'error'

  // Opções de categorias
  const categories = [
    { id: 'alimentos', label: 'Alimentos', icon: '🥫' },
    { id: 'roupas', label: 'Roupas', icon: '👕' },
    { id: 'medicamentos', label: 'Medicamentos', icon: '💊' },
    { id: 'higiene', label: 'Higiene', icon: '🧴' },
    { id: 'material-escolar', label: 'Material Escolar', icon: '📚' },
    { id: 'moveis', label: 'Móveis', icon: '🪑' },
    { id: 'eletronicos', label: 'Eletrônicos', icon: '📱' },
    { id: 'outros', label: 'Outros', icon: '📦' },
  ];

  // Condições dos itens
  const conditions = [
    { id: 'novo', label: 'Novo' },
    { id: 'seminovo', label: 'Seminovo' },
    { id: 'usado_bom', label: 'Usado - Bom' },
    { id: 'usado_regular', label: 'Usado - Regular' },
  ];

  // Disponibilidade
  const availabilityOptions = [
    { id: 'imediata', label: 'Imediata' },
    { id: 'esta_semana', label: 'Esta semana' },
    { id: 'proximo_mes', label: 'Próximo mês' },
    { id: 'combinar', label: 'A combinar' },
  ];

  // Função para mostrar modal
  const showCustomAlert = (title, message, type = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  // Função para fechar modal e opcionalmente navegar
  const closeModal = (shouldNavigateBack = false) => {
    setShowModal(false);
    if (shouldNavigateBack) {
      navigation.goBack();
    }
  };

  const getModalStyles = () => {
    switch (modalType) {
      case 'success':
        return {
          headerColor: '#4CAF50',
          buttonColor: '#4CAF50'
        };
      case 'error':
        return {
          headerColor: '#F44336',
          buttonColor: '#F44336'
        };
      default:
        return {
          headerColor: '#2196F3',
          buttonColor: '#2196F3'
        };
    }
  };

  // Carregar dados da oferta
  useEffect(() => {
    loadOfferData();
  }, [offerId]);

  const loadOfferData = async () => {
    try {
      setLoading(true);
      
      // Buscar TODAS as ofertas e filtrar manualmente
      const allOffersResponse = await api.getDonationOffers();

      if (allOffersResponse.success && allOffersResponse.data?.offers) {
        // Encontrar a oferta específica pelo ID
        const offer = allOffersResponse.data.offers.find(o => o.id === parseInt(offerId));
        
        if (offer) {
          setFormData({
            title: offer.title || '',
            description: offer.description || '',
            quantity: offer.quantity || '',
            category: offer.category || '',
            conditions: offer.conditions || '',
            location: offer.location || '',
            availability: offer.availability || '',
            expiryDate: offer.expiry_date || '',
          });
        } else {
          throw new Error('Oferta não encontrada');
        }
      } else {
        throw new Error(allOffersResponse.message || 'Não foi possível carregar as ofertas.');
      }
    } catch (error) {
      showCustomAlert('Erro', error.message || 'Não foi possível carregar os dados da oferta.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOfferData();
    setRefreshing(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantidade é obrigatória';
    }

    if (!formData.category) {
      newErrors.category = 'Selecione uma categoria';
    }

    if (!formData.conditions) {
      newErrors.conditions = 'Selecione a condição do item';
    }

    if (!formData.availability) {
      newErrors.availability = 'Selecione a disponibilidade';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Localização é obrigatória';
    }

    setErrors(newErrors);
    
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      return newErrors[errorKeys[0]]; 
    }
    return null;
  };

  const handleSave = async () => {
    if (!user || user.role !== 'donor') {
      showCustomAlert('Erro', 'Você deve ser um doador logado para editar ofertas.', 'error');
      return;
    }
  
    const validationError = validateForm();
    if (validationError) {
      showCustomAlert('Erro no Formulário', validationError, 'error'); 
      return;
    }
    
    setSaving(true);
    
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        category: formData.category,
        conditions: formData.conditions,
        location: formData.location,
        availability: formData.availability,
        expiry_date: formData.expiryDate,
      };

      let response;
      
      try {
        response = await api.put(`/offers/${offerId}`, updateData);
      } catch (error) {
        response = await api.updateDonationOffer(offerId, updateData);
      }

      if (response.success) {
        showCustomAlert('Sucesso', 'Oferta atualizada com sucesso!', 'success');
      } else {
        showCustomAlert('Erro', response.message || 'Não foi possível atualizar a oferta.', 'error');
      }
    } catch (error) {
      showCustomAlert('Erro', 'Não foi possível atualizar a oferta. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      
      let response;
      try {
        response = await api.delete(`/offers/${offerId}`);
      } catch (error) {
        response = await api.deleteDonationOffer(offerId);
      }
      
      if (response.success) {
        showCustomAlert('Sucesso', 'Oferta excluída com sucesso!', 'success');
      } else {
        showCustomAlert('Erro', response.message || 'Não foi possível excluir a oferta.', 'error');
      }
    } catch (error) {
      showCustomAlert('Erro', 'Não foi possível excluir a oferta. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta oferta? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: handleDelete
        }
      ]
    );
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation?.goBack?.()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        Editar Oferta de Doação
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderFormField = (label, value, onChangeText, placeholder, multiline = false, error = null, keyboardType = 'default') => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label} *</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          error && styles.textInputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Categoria *</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.optionCard,
              formData.category === category.id && styles.optionCardSelected,
            ]}
            onPress={() => updateFormData('category', category.id)}
          >
            <Text style={styles.optionIcon}>{category.icon}</Text>
            <Text style={[
              styles.optionLabel,
              formData.category === category.id && styles.optionLabelSelected
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors.category && (
        <Text style={styles.errorText}>{errors.category}</Text>
      )}
    </View>
  );

  const renderConditionSelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Condição do Item *</Text>
      <View style={styles.conditionList}>
        {conditions.map((condition) => (
          <TouchableOpacity
            key={condition.id}
            style={[
              styles.conditionOption,
              formData.conditions === condition.id && styles.conditionOptionSelected,
            ]}
            onPress={() => updateFormData('conditions', condition.id)}
          >
            <Text style={[
              styles.conditionLabel,
              formData.conditions === condition.id && styles.conditionLabelSelected
            ]}>
              {condition.label}
            </Text>
            {formData.conditions === condition.id && (
              <Text style={styles.selectedIndicator}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {errors.conditions && (
        <Text style={styles.errorText}>{errors.conditions}</Text>
      )}
    </View>
  );

  const renderAvailabilitySelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Disponibilidade *</Text>
      <View style={styles.availabilityList}>
        {availabilityOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.availabilityOption,
              formData.availability === option.id && styles.availabilityOptionSelected,
            ]}
            onPress={() => updateFormData('availability', option.id)}
          >
            <Text style={[
              styles.availabilityLabel,
              formData.availability === option.id && styles.availabilityLabelSelected
            ]}>
              {option.label}
            </Text>
            {formData.availability === option.id && (
              <Text style={styles.selectedIndicator}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {errors.availability && (
        <Text style={styles.errorText}>{errors.availability}</Text>
      )}
    </View>
  );

  const renderContent = () => (
    <View style={styles.formContent}>
      {renderFormField(
        'Título da Oferta',
        formData.title,
        (value) => updateFormData('title', value),
        'Ex: Roupas de inverno para doação',
        false,
        errors.title
      )}
      
      {renderFormField(
        'Descrição Detalhada',
        formData.description,
        (value) => updateFormData('description', value),
        'Descreva os itens que você está oferecendo...',
        true,
        errors.description
      )}

      {renderFormField(
        'Quantidade',
        formData.quantity,
        (value) => updateFormData('quantity', value),
        'Ex: 20 peças, 5kg, 10 unidades',
        false,
        errors.quantity
      )}

      {renderCategorySelector()}

      {renderConditionSelector()}

      {renderFormField(
        'Localização',
        formData.location,
        (value) => updateFormData('location', value),
        'Ex: São Paulo, SP - Centro',
        false,
        errors.location
      )}

      {renderAvailabilitySelector()}

      {/* Data de Validade (apenas para alimentos) */}
      {formData.category === 'alimentos' && (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Data de Validade *</Text>
          <TextInput
            style={[
              styles.textInput,
              errors.expiryDate && styles.textInputError,
            ]}
            value={formData.expiryDate}
            onChangeText={(value) => updateFormData('expiryDate', value)}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.expiryDate && (
            <Text style={styles.errorText}>{errors.expiryDate}</Text>
          )}
        </View>
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={confirmDelete}
        disabled={saving}
      >
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        <Text style={styles.deleteButtonText}>Excluir Oferta</Text>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation?.goBack?.()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
  
        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              Salvar Alterações
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const modalStyles = getModalStyles();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando oferta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {renderHeader()}
      
      <View style={styles.mainContent}>
        <View style={styles.feedContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[colors.primary]} 
              />
            }
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.contentCard}>
              {renderContent()}
              {renderActions()}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Modal Customizado */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: modalStyles.headerColor }]}>
              <Text style={styles.modalHeaderText}>{modalTitle}</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: modalStyles.buttonColor }]}
                onPress={() => closeModal(modalType === 'success')}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ESTILOS ATUALIZADOS COM MODAL
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 44,
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formContent: {
    padding: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  optionCard: {
    width: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    minHeight: 80,
  },
  optionCardSelected: {
    borderColor: '#FF1434',
    backgroundColor: '#FEF2F2',
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: '#FF1434',
  },
  conditionList: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    minHeight: 50,
  },
  conditionOptionSelected: {
    borderColor: '#FF1434',
    backgroundColor: '#FEF2F2',
  },
  conditionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  conditionLabelSelected: {
    color: '#FF1434',
  },
  availabilityList: {
    flexDirection: 'row',
    gap: 12,
  },
  availabilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    minHeight: 50,
  },
  availabilityOptionSelected: {
    borderColor: '#FF1434',
    backgroundColor: '#FEF2F2',
  },
  availabilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  availabilityLabelSelected: {
    color: '#FF1434',
  },
  selectedIndicator: {
    fontSize: 18,
    color: '#FF1434',
    fontWeight: 'bold',
  },
  actionsContainer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#FF1434',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalMessage: {
    fontSize: 16,
    color: '#212121',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditDonationOfferScreen;