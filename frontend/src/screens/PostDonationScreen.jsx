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

const PostDonationScreen = ({ route, navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    category: '',
    condition: '',
    location: '',
    availability: '',
    expiryDate: '',
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
    { id: 'brinquedos', label: 'Brinquedos', icon: '🧸', description: 'Jogos e brinquedos' },
    { id: 'eletronicos', label: 'Eletrônicos', icon: '📱', description: 'Equipamentos eletrônicos' },
    { id: 'moveis', label: 'Móveis', icon: '🪑', description: 'Móveis e decoração' },
    { id: 'livros', label: 'Livros', icon: '📚', description: 'Livros e materiais educativos' },
    { id: 'higiene', label: 'Higiene', icon: '🧴', description: 'Produtos de higiene pessoal' },
    { id: 'outros', label: 'Outros', icon: '📦', description: 'Outras doações' },
  ];

  // Condições dos itens
  const conditions = [
    { id: 'novo', label: 'Novo', description: 'Item nunca foi usado' },
    { id: 'seminovo', label: 'Seminovo', description: 'Usado poucas vezes, em ótimo estado' },
    { id: 'usado_bom', label: 'Usado - Bom', description: 'Usado, mas em bom estado' },
    { id: 'usado_regular', label: 'Usado - Regular', description: 'Usado, com sinais de desgaste' },
  ];

  // Disponibilidade
  const availabilityOptions = [
    { id: 'imediata', label: 'Imediata', description: 'Disponível para retirada hoje' },
    { id: 'esta_semana', label: 'Esta semana', description: 'Disponível nos próximos 7 dias' },
    { id: 'proximo_mes', label: 'Próximo mês', description: 'Disponível nos próximos 30 dias' },
    { id: 'combinar', label: 'A combinar', description: 'Disponibilidade flexível' },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Título deve ter pelo menos 5 caracteres';
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

    if (!formData.condition) {
      newErrors.condition = 'Selecione a condição do item';
    }

    if (!formData.availability) {
      newErrors.availability = 'Selecione a disponibilidade';
    }

    // Validação especial para alimentos
    if (formData.category === 'alimentos' && !formData.expiryDate.trim()) {
      newErrors.expiryDate = 'Data de validade é obrigatória para alimentos';
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
      // POST /donations
      // Body: { title, description, quantity, category, condition, location, availability, expiryDate, images }
      
      // Simula envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Sucesso!', 
        'Sua doação foi publicada e já está disponível para instituições.',
        [
          {
            text: 'OK',
            onPress: () => {
              // TODO: Navegar de volta ou para lista de doações
              navigation?.goBack?.();
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível publicar a doação. Tente novamente.');
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
      <Text style={styles.headerTitle}>Oferecer Doação</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderFormField = (label, value, onChangeText, placeholder, multiline = false, error = null, optional = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label} {!optional && '*'}
      </Text>
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

  const renderConditionSelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Condição do Item *</Text>
      <View style={styles.conditionList}>
        {conditions.map((condition) => (
          <TouchableOpacity
            key={condition.id}
            style={[
              styles.conditionOption,
              formData.condition === condition.id && styles.conditionOptionSelected,
            ]}
            onPress={() => updateFormData('condition', condition.id)}
            accessible={true}
            accessibilityLabel={`Condição ${condition.label}`}
            accessibilityHint={condition.description}
            accessibilityRole="radio"
            accessibilityState={{ selected: formData.condition === condition.id }}
          >
            <View style={styles.conditionInfo}>
              <Text style={[
                styles.conditionLabel,
                formData.condition === condition.id && styles.conditionLabelSelected
              ]}>
                {condition.label}
              </Text>
              <Text style={styles.conditionDescription}>{condition.description}</Text>
            </View>
            {formData.condition === condition.id && (
              <Text style={styles.selectedIndicator}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {errors.condition && (
        <Text style={styles.errorText} accessible={true} accessibilityRole="alert">
          {errors.condition}
        </Text>
      )}
    </View>
  );

  const renderAvailabilitySelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Disponibilidade *</Text>
      <View style={styles.availabilityList}>
        {availabilityOptions.map((availability) => (
          <TouchableOpacity
            key={availability.id}
            style={[
              styles.availabilityOption,
              formData.availability === availability.id && styles.availabilityOptionSelected,
            ]}
            onPress={() => updateFormData('availability', availability.id)}
            accessible={true}
            accessibilityLabel={`Disponibilidade ${availability.label}`}
            accessibilityHint={availability.description}
            accessibilityRole="radio"
            accessibilityState={{ selected: formData.availability === availability.id }}
          >
            <View style={styles.availabilityInfo}>
              <Text style={[
                styles.availabilityLabel,
                formData.availability === availability.id && styles.availabilityLabelSelected
              ]}>
                {availability.label}
              </Text>
              <Text style={styles.availabilityDescription}>{availability.description}</Text>
            </View>
            {formData.availability === availability.id && (
              <Text style={styles.selectedIndicator}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {errors.availability && (
        <Text style={styles.errorText} accessible={true} accessibilityRole="alert">
          {errors.availability}
        </Text>
      )}
    </View>
  );

  const renderImageUploader = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Fotos dos Itens (Recomendado)</Text>
      <TouchableOpacity
        style={[styles.imageUploader, isDesktop && styles.imageUploaderDesktop]}
        onPress={handleImagePicker}
        accessible={true}
        accessibilityLabel="Adicionar fotos dos itens"
        accessibilityHint="Toque para adicionar fotos que mostrem os itens a serem doados"
        accessibilityRole="button"
      >
        <Text style={styles.imageUploaderIcon}>📷</Text>
        <Text style={styles.imageUploaderText}>Adicionar Fotos</Text>
        <Text style={styles.imageUploaderHint}>
          Mostre os itens para que as instituições vejam o que está sendo oferecido
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
        accessibilityLabel={loading ? "Publicando doação" : "Publicar doação"}
        accessibilityRole="button"
        accessibilityState={{ busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Publicar Doação</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderMobileLayout = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderHeader()}
      <View style={styles.formContainer}>
        {renderFormField(
          'Título',
          formData.title,
          (value) => updateFormData('title', value),
          'Ex: Roupas de inverno para doação',
          false,
          errors.title
        )}

        {renderFormField(
          'Descrição',
          formData.description,
          (value) => updateFormData('description', value),
          'Descreva os itens que você está oferecendo, estado, tamanhos, quantidades...',
          true,
          errors.description
        )}

        {renderFormField(
          'Quantidade',
          formData.quantity,
          (value) => updateFormData('quantity', value),
          'Ex: 20 peças, 5kg, 10 unidades...',
          false,
          errors.quantity
        )}

        {renderCategorySelector()}
        {renderConditionSelector()}

        {formData.category === 'alimentos' && renderFormField(
          'Data de Validade',
          formData.expiryDate,
          (value) => updateFormData('expiryDate', value),
          'DD/MM/AAAA',
          false,
          errors.expiryDate
        )}

        {renderFormField(
          'Localização',
          formData.location,
          (value) => updateFormData('location', value),
          'Ex: São Paulo, SP - Vila Madalena',
          false,
          null,
          true
        )}

        {renderAvailabilitySelector()}
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
                'Título',
                formData.title,
                (value) => updateFormData('title', value),
                'Ex: Roupas de inverno para doação',
                false,
                errors.title
              )}

              {renderFormField(
                'Descrição',
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
                'Ex: 20 peças, 5kg, 10 unidades...',
                false,
                errors.quantity
              )}

              {formData.category === 'alimentos' && renderFormField(
                'Data de Validade',
                formData.expiryDate,
                (value) => updateFormData('expiryDate', value),
                'DD/MM/AAAA',
                false,
                errors.expiryDate
              )}

              {renderFormField(
                'Localização',
                formData.location,
                (value) => updateFormData('location', value),
                'Ex: São Paulo, SP - Vila Madalena',
                false,
                null,
                true
              )}
            </View>

            <View style={styles.desktopFormRight}>
              {renderCategorySelector()}
              {renderConditionSelector()}
              {renderAvailabilitySelector()}
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
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 80,
  },
  optionCardDesktop: {
    width: '31%',
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

  // Seletor de condição
  conditionList: {
    gap: 12,
  },
  conditionOption: {
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
  conditionOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  conditionInfo: {
    flex: 1,
  },
  conditionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  conditionLabelSelected: {
    color: colors.primary,
  },
  conditionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Seletor de disponibilidade
  availabilityList: {
    gap: 12,
  },
  availabilityOption: {
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
  availabilityOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  availabilityLabelSelected: {
    color: colors.primary,
  },
  availabilityDescription: {
    fontSize: 14,
    color: colors.textSecondary,
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

export default PostDonationScreen;
