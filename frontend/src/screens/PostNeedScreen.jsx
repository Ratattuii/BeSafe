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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // Necessário para obter user.id

// ===================================================================
// TELA PRINCIPAL (Controlador)
// ===================================================================

const PostNeedScreen = ({ route, navigation }) => {
  const { user } = useAuth(); // Obtém o usuário logado
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    unit: '',
    urgency: 'medium',
    goal_quantity: '',
    goal_value: '',
    pix_key: '',
    location: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { needToEdit } = route.params || {};
  const isEditMode = !!needToEdit;

  // --- useEffect para carregar dados de edição ---
  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: needToEdit.title || '',
        description: needToEdit.description || '',
        category: needToEdit.category || '',
        unit: needToEdit.unit || '',
        urgency: needToEdit.urgency || 'medium',
        goal_quantity: String(needToEdit.goal_quantity || ''),
        goal_value: String(needToEdit.goal_value || ''),
        pix_key: needToEdit.pix_key || '',
      });
    }
  }, [isEditMode, needToEdit]);


  // Opções de categorias
  const categories = [
    { id: 'alimentos', label: 'Alimentos', icon: '🥫' },
    { id: 'roupas', label: 'Roupas', icon: '👕' },
    { id: 'medicamentos', label: 'Medicamentos', icon: '💊' },
    // ... adicione mais categorias
    { id: 'outros', label: 'Outros', icon: '📦' },
  ];

  const urgencyOptions = [
    { id: 'alta', label: 'Alta' },
    { id: 'media', label: 'Média' },
    { id: 'baixa', label: 'Baixa' },
  ];

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

  const handleSubmit = async () => {
    if (!user || user.role !== 'institution') {
      Alert.alert('Erro', 'Você deve ser uma instituição logada para postar.');
      return;
    }
  
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Erro no Formulário', validationError); 
      return;
    }
    
    setLoading(true);
    
    try {
      const needData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.category,
        urgency: formData.urgency,
        quantity: parseFloat(formData.goal_quantity),
        unit: formData.unit,
        location: formData.location,
      };
  
      console.log('📤 Enviando dados para API:', needData);
  
      const response = await api.post('/needs', needData);
  
      console.log('✅ Resposta da API:', response);
  
      if (response.success) {
        console.log('🎉 Necessidade criada com sucesso! Redirecionando...');
        
        setTimeout(() => {
          navigation.goBack();
        }, 500);
        
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível criar a necessidade.');
      }
      
    } catch (error) {
      console.error('❌ Erro completo:', error);
      
      if (error.message && error.message.includes('HTTP')) {
        Alert.alert('Erro do Servidor', error.message);
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor.');
      } else {
        Alert.alert('Erro', error.message || 'Ocorreu um erro inesperado.');
      }
    } finally {
      setLoading(false);
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
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {isEditMode ? 'Editar Necessidade' : 'Publicar Pedido de Doação'}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderFormField = (label, value, onChangeText, placeholder, multiline = false, error = null) => (
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
        keyboardType={(label === 'Meta de Quantidade' || label === 'Valor Total (PIX)') ? 'numeric' : 'default'}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Categoria *</Text>
      <View style={styles.optionsGrid}>
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
      </View>
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


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {renderHeader()}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
              errors.goal_quantity
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
          
          <View style={styles.optionalSection}>
            <Text style={styles.optionalTitle}>Informações Opcionais (Doação Financeira)</Text>
            {renderFormField(
                'Valor Total (PIX)',
                formData.goal_value,
                (value) => updateFormData('goal_value', value),
                'R$ 500.00',
            )}
            {renderFormField(
                'Chave PIX',
                formData.pix_key,
                (value) => updateFormData('pix_key', value),
                'Ex: email@instituicao.com',
            )}
          </View>
        </View>

        <View style={[styles.submitContainer, isDesktop && styles.submitContainerDesktop]}>
          <TouchableOpacity
            style={[styles.cancelButton, isDesktop && styles.cancelButtonDesktop]}
            onPress={() => navigation?.goBack?.()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isDesktop && styles.submitButtonDesktop,
              loading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Salvar Alterações' : 'Publicar Pedido'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sucesso!</Text>
            <Text style={styles.modalMessage}>Necessidade publicada com sucesso!</Text>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.modalSubtext}>Redirecionando...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// --- ESTILOS ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  container: {
    flex: 1,
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
  backButtonText: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 44, 
  },

  // Formulário
  formContainer: {
    padding: 20,
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
    gap: 20,
    marginBottom: 20,
  },
  unitField: {
    flex: 0.4,
  },

  // Seletor de categoria
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '30%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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


  // Botões de submit
  submitContainer: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    backgroundColor: colors.white,
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
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default PostNeedScreen;