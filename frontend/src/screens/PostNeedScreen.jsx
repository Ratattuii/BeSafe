import React, { useState } from 'react';
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
import { colors } from '../styles/globalStyles';

const PostNeedScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    category: '',
    urgency: '',
    location: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Opções de categorias
  const categories = [
    { id: 'alimentos', label: 'Alimentos', icon: '🥫', description: 'Comida e bebidas' },
    { id: 'roupas', label: 'Roupas', icon: '👕', description: 'Vestuário e calçados' },
    { id: 'medicamentos', label: 'Medicamentos', icon: '💊', description: 'Remédios e suprimentos médicos' },
    { id: 'agua', label: 'Água', icon: '💧', description: 'Água potável' },
    { id: 'abrigo', label: 'Abrigo', icon: '🏠', description: 'Moradia temporária' },
    { id: 'outros', label: 'Outros', icon: '📦', description: 'Outras necessidades' },
  ];

  // Níveis de urgência
  const urgencyLevels = [
    { 
      id: 'critica', 
      label: 'Crítica', 
      color: colors.urgent,
      description: 'Situação de emergência - necessário imediatamente'
    },
    { 
      id: 'alta', 
      label: 'Alta', 
      color: colors.warning,
      description: 'Muito importante - necessário em poucos dias'
    },
    { 
      id: 'media', 
      label: 'Média', 
      color: colors.success,
      description: 'Importante - necessário em algumas semanas'
    },
    { 
      id: 'baixa', 
      label: 'Baixa', 
      color: colors.gray500,
      description: 'Quando possível - sem prazo específico'
    },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Título deve ter pelo menos 10 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Descrição deve ter pelo menos 20 caracteres';
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantidade é obrigatória';
    }

    if (!formData.category) {
      newErrors.category = 'Selecione uma categoria';
    }

    if (!formData.urgency) {
      newErrors.urgency = 'Selecione o nível de urgência';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erro', 'Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implementar envio real
      // POST /needs
      // Body: { title, description, quantity, category, urgency, location, images }
      
      // Simula envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Sucesso!', 
        'Seu pedido foi publicado e já está disponível para doadores.',
        [
          {
            text: 'OK',
            onPress: () => {
              // TODO: Navegar de volta ou para lista de pedidos
              navigation?.goBack?.();
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível publicar o pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    const { showImagePickerOptions } = await import('../utils/ImagePicker');
    
    showImagePickerOptions(
      (selectedImage) => {
        if (selectedImage) {
          setImages(prev => [...prev, selectedImage]);
          console.log('Imagem selecionada:', selectedImage.uri);
        }
      },
      {
        aspect: [4, 3],
        quality: 0.8,
      }
    );
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Remove erro quando campo é corrigido
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
        accessible={true}
        accessibilityLabel="Voltar"
        accessibilityRole="button"
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Postar Pedido</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderFormField = (label, value, onChangeText, placeholder, multiline = false, error = null) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          error && styles.textInputError,
          isDesktop && styles.textInputDesktop,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        accessible={true}
        accessibilityLabel={label}
        accessibilityHint={placeholder}
      />
      {error && (
        <Text style={styles.errorText} accessible={true} accessibilityRole="alert">
          {error}
        </Text>
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
              isDesktop && styles.optionCardDesktop,
            ]}
            onPress={() => updateFormData('category', category.id)}
            accessible={true}
            accessibilityLabel={`Categoria ${category.label}`}
            accessibilityHint={category.description}
            accessibilityRole="radio"
            accessibilityState={{ selected: formData.category === category.id }}
          >
            <Text style={styles.optionIcon}>{category.icon}</Text>
            <Text style={[
              styles.optionLabel,
              formData.category === category.id && styles.optionLabelSelected
            ]}>
              {category.label}
            </Text>
            <Text style={styles.optionDescription}>{category.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.category && (
        <Text style={styles.errorText} accessible={true} accessibilityRole="alert">
          {errors.category}
        </Text>
      )}
    </View>
  );

  const renderUrgencySelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Nível de Urgência *</Text>
      <View style={styles.urgencyList}>
        {urgencyLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.urgencyOption,
              formData.urgency === level.id && styles.urgencyOptionSelected,
            ]}
            onPress={() => updateFormData('urgency', level.id)}
            accessible={true}
            accessibilityLabel={`Urgência ${level.label}`}
            accessibilityHint={level.description}
            accessibilityRole="radio"
            accessibilityState={{ selected: formData.urgency === level.id }}
          >
            <View style={styles.urgencyInfo}>
              <View style={styles.urgencyHeader}>
                <View style={[styles.urgencyIndicator, { backgroundColor: level.color }]} />
                <Text style={[
                  styles.urgencyLabel,
                  formData.urgency === level.id && styles.urgencyLabelSelected
                ]}>
                  {level.label}
                </Text>
              </View>
              <Text style={styles.urgencyDescription}>{level.description}</Text>
            </View>
            {formData.urgency === level.id && (
              <Text style={styles.selectedIndicator}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {errors.urgency && (
        <Text style={styles.errorText} accessible={true} accessibilityRole="alert">
          {errors.urgency}
        </Text>
      )}
    </View>
  );

  const renderImageUploader = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Imagens (Opcional)</Text>
      <TouchableOpacity
        style={[styles.imageUploader, isDesktop && styles.imageUploaderDesktop]}
        onPress={handleImagePicker}
        accessible={true}
        accessibilityLabel="Adicionar imagens"
        accessibilityHint="Toque para adicionar fotos que ilustrem a necessidade"
        accessibilityRole="button"
      >
        <Text style={styles.imageUploaderIcon}>📷</Text>
        <Text style={styles.imageUploaderText}>Adicionar Fotos</Text>
        <Text style={styles.imageUploaderHint}>
          Mostre o que é necessário para facilitar doações
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSubmitButtons = () => (
    <View style={[styles.submitContainer, isDesktop && styles.submitContainerDesktop]}>
      <TouchableOpacity
        style={[styles.cancelButton, isDesktop && styles.cancelButtonDesktop]}
        onPress={() => navigation?.goBack?.()}
        disabled={loading}
        accessible={true}
        accessibilityLabel="Cancelar publicação"
        accessibilityRole="button"
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
        accessible={true}
        accessibilityLabel={loading ? "Publicando pedido" : "Publicar pedido"}
        accessibilityRole="button"
        accessibilityState={{ busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Publicar Pedido</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderMobileLayout = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderHeader()}
      <View style={styles.formContainer}>
        {renderFormField(
          'Título *',
          formData.title,
          (value) => updateFormData('title', value),
          'Ex: Alimentos para 100 famílias',
          false,
          errors.title
        )}

        {renderFormField(
          'Descrição *',
          formData.description,
          (value) => updateFormData('description', value),
          'Descreva detalhadamente o que é necessário e por quê...',
          true,
          errors.description
        )}

        {renderFormField(
          'Quantidade *',
          formData.quantity,
          (value) => updateFormData('quantity', value),
          'Ex: 500kg, 100 unidades, 50 famílias...',
          false,
          errors.quantity
        )}

        {renderCategorySelector()}
        {renderUrgencySelector()}

        {renderFormField(
          'Localização (Opcional)',
          formData.location,
          (value) => updateFormData('location', value),
          'Ex: São Paulo, SP - Centro'
        )}

        {renderImageUploader()}
        {renderSubmitButtons()}
      </View>
    </ScrollView>
  );

  const renderDesktopLayout = () => (
    <View style={styles.desktopContainer}>
      <View style={styles.desktopContent}>
        {renderHeader()}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.desktopFormContainer}>
            <View style={styles.desktopFormLeft}>
              {renderFormField(
                'Título *',
                formData.title,
                (value) => updateFormData('title', value),
                'Ex: Alimentos para 100 famílias',
                false,
                errors.title
              )}

              {renderFormField(
                'Descrição *',
                formData.description,
                (value) => updateFormData('description', value),
                'Descreva detalhadamente o que é necessário e por quê...',
                true,
                errors.description
              )}

              {renderFormField(
                'Quantidade *',
                formData.quantity,
                (value) => updateFormData('quantity', value),
                'Ex: 500kg, 100 unidades, 50 famílias...',
                false,
                errors.quantity
              )}

              {renderFormField(
                'Localização (Opcional)',
                formData.location,
                (value) => updateFormData('location', value),
                'Ex: São Paulo, SP - Centro'
              )}
            </View>

            <View style={styles.desktopFormRight}>
              {renderCategorySelector()}
              {renderUrgencySelector()}
              {renderImageUploader()}
            </View>
          </View>
          {renderSubmitButtons()}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {isDesktop ? renderDesktopLayout() : renderMobileLayout()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  container: {
    flex: 1,
  },

  // Desktop Layout
  desktopContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  desktopContent: {
    width: 900,
    maxWidth: '90%',
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  desktopFormContainer: {
    flexDirection: 'row',
    gap: 40,
    padding: 32,
  },
  desktopFormLeft: {
    flex: 1,
  },
  desktopFormRight: {
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
  headerDesktop: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderBottomWidth: 2,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    marginBottom: 24,
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
  textInputDesktop: {
    paddingVertical: 14,
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

  // Seletor de categoria
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  optionCardDesktop: {
    minWidth: 140,
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
    marginBottom: 4,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Seletor de urgência
  urgencyList: {
    gap: 12,
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
  },
  urgencyOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  urgencyInfo: {
    flex: 1,
  },
  urgencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgencyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  urgencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  urgencyLabelSelected: {
    color: colors.primary,
  },
  urgencyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 24,
  },
  selectedIndicator: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },

  // Upload de imagem
  imageUploader: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    minHeight: 120,
  },
  imageUploaderDesktop: {
    minHeight: 140,
  },
  imageUploaderIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  imageUploaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  imageUploaderHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Botões de submit
  submitContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
  submitContainerDesktop: {
    paddingHorizontal: 32,
    paddingBottom: 32,
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
    paddingVertical: 18,
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
  submitButtonDesktop: {
    paddingVertical: 18,
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
