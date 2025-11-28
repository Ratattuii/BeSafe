// screens/EditNeedScreen.jsx
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
  FlatList,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EditNeedScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { needId } = route.params;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    unit: '',
    urgency: 'media',
    goal_quantity: '',
    goal_value: '',
    pix_key: '',
    location: '',
    status: 'ativa'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Estados para o modal customizado
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info'); // 'info', 'success', 'error'

  // Opções de categorias
  const categories = [
    { id: 'alimentos', label: 'Alimentos', icon: '🥫', description: 'Comida e bebidas' },
    { id: 'roupas', label: 'Roupas', icon: '👕', description: 'Vestuário e calçados' },
    { id: 'medicamentos', label: 'Medicamentos', icon: '💊', description: 'Remédios e suprimentos médicos' },
    { id: 'agua', label: 'Água', icon: '💧', description: 'Água potável' },
    { id: 'brinquedos', label: 'Brinquedos', icon: '🧸', description: 'Jogos e brinquedos' },
    { id: 'eletronicos', label: 'Eletrônicos', icon: '📱', description: 'Equipamentos eletrônicos' },
    { id: 'moveis', label: 'Móveis', icon: '🪑', description: 'Móveis e decoração' },
    { id: 'livros', label: 'Livros', icon: '📚', description: 'Livros e materiais educativos' },
    { id: 'higiene', label: 'Higiene', icon: '🧴', description: 'Produtos de higiene pessoal' },
    { id: 'outros', label: 'Outros', icon: '📦', description: 'Outras doações' },
  ];

  const urgencyOptions = [
    { id: 'alta', label: 'Alta' },
    { id: 'media', label: 'Média' },
    { id: 'baixa', label: 'Baixa' },
  ];

  const statusOptions = [
    { id: 'ativa', label: 'Ativa' },
    { id: 'inativa', label: 'Inativa' },
    { id: 'concluida', label: 'Concluída' },
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

  // Carregar dados da necessidade
  useEffect(() => {
    loadNeedData();
  }, [needId]);
  
  const loadNeedData = async () => {
    try {
      setLoading(true);
      
      let needData = null;

      try {
        const response = await api.get(`/needs/${needId}`);

        if (response.success && response.data && response.data.need) {
          needData = response.data.need;
        } else if (response.success && response.data) {
          needData = response.data;
        } else if (response.id) {
          needData = response;
        } else {
          throw new Error('Resposta da API inválida, tentando fallback');
        }
        
      } catch (error) {
        const fallbackResponse = await api.get(`/institutions/${user.id}/needs`);
        
        if (fallbackResponse.success && fallbackResponse.data?.needs) {
          const need = fallbackResponse.data.needs.find(n => n.id === parseInt(needId));
          if (need) {
            needData = need;
          } else {
            throw new Error('Necessidade não encontrada no fallback');
          }
        } else {
          throw new Error(fallbackResponse.message || 'Falha ao carregar dados do fallback');
        }
      }

      if (needData && needData.id) {
        setFormData({
          title: needData.title || '',
          description: needData.description || '',
          category: needData.category || '',
          unit: needData.unit || '',
          urgency: needData.urgency || 'media',
          goal_quantity: (needData.goal_quantity || needData.quantity)?.toString() || '',
          goal_value: needData.goal_value?.toString() || '',
          pix_key: needData.pix_key || '',
          location: needData.location || '',
          status: needData.status || 'ativa'
        });
      } else {
        throw new Error('Não foi possível encontrar os dados da necessidade');
      }

    } catch (error) {
      showCustomAlert('Erro', error.message || 'Não foi possível carregar os dados da necessidade.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.category) {
      newErrors.category = 'Selecione uma categoria';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unidade de medida é obrigatória (Ex: kg, un)';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Localização é obrigatória';
    }

    const quantityValue = parseFloat(formData.goal_quantity);
    if (!formData.goal_quantity.trim() || isNaN(quantityValue) || quantityValue <= 0) {
      newErrors.goal_quantity = 'Meta de quantidade inválida ou ausente.';
    }

    setErrors(newErrors);
    
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      return newErrors[errorKeys[0]]; 
    }
    return null;
  };

  const handleSave = async () => {
    if (!user || user.role !== 'institution') {
      showCustomAlert('Erro', 'Você deve ser uma instituição logada para editar necessidades.', 'error');
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
        category: formData.category,
        type: formData.category,
        urgency: formData.urgency,
        quantity: parseFloat(formData.goal_quantity),
        unit: formData.unit,
        location: formData.location,
        status: formData.status,
        goal_value: formData.goal_value ? parseFloat(formData.goal_value) : null,
        pix_key: formData.pix_key || null
      };
  
      const response = await api.updateNeed(needId, updateData);

      if (response.success) {
        showCustomAlert('Sucesso', 'Necessidade atualizada com sucesso!', 'success');
      } else {
        showCustomAlert('Erro', response.message || 'Não foi possível atualizar a necessidade.', 'error');
      }
      
    } catch (error) {
      showCustomAlert('Erro', 'Não foi possível atualizar a necessidade. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
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
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation?.goBack?.()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        Editar Necessidade
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

  const renderUrgencySelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Nível de Urgência *</Text>
      <View style={styles.urgencyList}>
        {urgencyOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.urgencyOption,
              formData.urgency === option.id && styles.urgencyOptionSelected,
            ]}
            onPress={() => updateFormData('urgency', option.id)}
          >
            <Text style={[
              styles.urgencyLabel,
              formData.urgency === option.id && styles.urgencyLabelSelected
            ]}>
              {option.label}
            </Text>
            {formData.urgency === option.id && (
              <Text style={styles.selectedIndicator}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStatusSelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Status da Necessidade</Text>
      <View style={styles.statusList}>
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.statusOption,
              formData.status === option.id && styles.statusOptionSelected,
            ]}
            onPress={() => updateFormData('status', option.id)}
          >
            <Text style={[
              styles.statusLabel,
              formData.status === option.id && styles.statusLabelSelected
            ]}>
              {option.label}
            </Text>
            {formData.status === option.id && (
              <Text style={styles.selectedIndicator}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderContent = () => (
    <View style={styles.formContainer}>
      {renderFormField(
        'Título da Necessidade',
        formData.title,
        (value) => updateFormData('title', value),
        'Ex: Pedido de 20kg de alimentos não perecíveis',
        false,
        errors.title
      )}
      
      {renderFormField(
        'Descrição Detalhada',
        formData.description,
        (value) => updateFormData('description', value),
        'Explique a urgência e para quem se destina a ajuda...',
        true,
        errors.description
      )}

      {renderCategorySelector()}

      {renderUrgencySelector()}

      {renderFormField(
        'Localização',
        formData.location,
        (value) => updateFormData('location', value),
        'Ex: São Paulo, SP - Centro',
        false,
        errors.location
      )}

      {/* Quantidade e Unidade */}
      <View style={styles.quantityContainer}>
        {renderFormField(
          'Meta de Quantidade',
          formData.goal_quantity,
          (value) => updateFormData('goal_quantity', value),
          '20',
          false,
          errors.goal_quantity,
          'numeric'
        )}
        <View style={styles.unitField}>
          {renderFormField(
            'Unidade (Ex: kg, un)',
            formData.unit,
            (value) => updateFormData('unit', value),
            'kg',
            false,
            errors.unit
          )}
        </View>
      </View>

      {renderStatusSelector()}
      
      <View style={styles.optionalSection}>
        <Text style={styles.optionalTitle}>Informações Opcionais (Doação Financeira)</Text>
        {renderFormField(
            'Valor Total (PIX)',
            formData.goal_value,
            (value) => updateFormData('goal_value', value),
            'R$ 500.00',
            false,
            null,
            'numeric'
        )}
        {renderFormField(
            'Chave PIX',
            formData.pix_key,
            (value) => updateFormData('pix_key', value),
            'Ex: email@instituicao.com',
        )}
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={[styles.actionsContainer, isDesktop && styles.actionsContainerDesktop]}>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.cancelButton, isDesktop && styles.cancelButtonDesktop]}
          onPress={() => navigation?.goBack?.()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            isDesktop && styles.saveButtonDesktop,
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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando necessidade...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {renderHeader()}
      
      <FlatList
        data={[1]}
        keyExtractor={() => 'edit-need-content'}
        renderItem={() => (
          <>
            {renderContent()}
            {renderActions()}
          </>
        )}
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      />

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

// --- ESTILOS ATUALIZADOS COM MODAL ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  headerDesktop: {
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Formulário
  formContainer: {
    padding: 20,
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 4,
  },

  // Quantidade e Unidade
  quantityContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  unitField: {
    flex: 0.4,
  },

  // Seletor de categoria
  categoriesContainer: {
    paddingVertical: 8,
  },
  optionCard: {
    width: 100,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    minHeight: 80,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: colors.primary,
  },

  // Seletor de urgência
  urgencyList: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    minHeight: 50,
  },
  urgencyOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  urgencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  urgencyLabelSelected: {
    color: colors.primary,
  },

  // Seletor de status
  statusList: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    minHeight: 50,
  },
  statusOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusLabelSelected: {
    color: colors.primary,
  },

  selectedIndicator: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },

  // Seção Opcional
  optionalSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    marginTop: 20,
    paddingTop: 20,
  },
  optionalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 16,
  },

  // Botões de ação
  actionsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    backgroundColor: colors.white,
    gap: 16,
  },
  actionsContainerDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButtonDesktop: {
    flex: 0,
    minWidth: 120,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  saveButtonDesktop: {
    flex: 0,
    minWidth: 200,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
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

export default EditNeedScreen;