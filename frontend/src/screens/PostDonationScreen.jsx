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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';
import api from '../services/api';

// ===================================================================
// COMPONENTE 1: Formulário Simples (para responder a um post)
// ===================================================================
const SimpleDonationForm = ({ route, onConfirm, loading }) => {
  const { institutionName, needTitle } = route.params || {};
  
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('unidades'); // Unidade padrão
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = () => {
    // Validação simples
    if (!quantity.trim() || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      setError('Por favor, insira uma quantidade válida.');
      return;
    }
    setError(null);
    
    // Prepara os dados para enviar de volta para a tela principal
    const simpleData = {
      quantity: parseInt(quantity),
      unit: unit || 'unidades', // Garante que não seja vazio
      notes: notes,
    };
    onConfirm(simpleData); // Chama o 'handleSubmit' principal
  };

  return (
    <>
      {/* Informações da Necessidade */}
      {needTitle && (
        <View style={styles.needInfoBox}>
          <Text style={styles.needInfoLabel}>Respondendo à necessidade:</Text>
          <Text style={styles.needInfoTitle}>{needTitle}</Text>
          <Text style={styles.needInfoInstitution}>para {institutionName}</Text>
        </View>
      )}

      {/* Campo Quantidade */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Quantidade *</Text>
        <View style={styles.quantityContainer}>
          <TextInput
            style={[styles.textInput, styles.quantityInput, error && styles.textInputError]}
            value={quantity}
            onChangeText={(text) => {
              setQuantity(text);
              if (error) setError(null);
            }}
            placeholder="Ex: 10"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            returnKeyType="done"
          />
          <TextInput
            style={[styles.textInput, styles.unitInput]}
            value={unit}
            onChangeText={setUnit}
            placeholder="Unidade"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="done"
          />
        </View>
        {error && (<Text style={styles.errorText}>{error}</Text>)}
      </View>

      {/* Campo Notas */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Notas (Opcional)</Text>
        <TextInput
          style={[styles.textInput, styles.textInputMultiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Ex: Roupas de inverno, tamanho M, bom estado. Validade do alimento..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Botão de Confirmação (reutiliza o estilo do 'submitButton') */}
      <TouchableOpacity
        style={[styles.submitButton, {flex: 1}, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Confirmar Doação</Text>
        )}
      </TouchableOpacity>
    </>
  );
};

// ===================================================================
// COMPONENTE 2: Formulário Complexo (o seu design original)
// ===================================================================
const ComplexDonationForm = ({ formData, updateFormData, errors, categories, conditions, availabilityOptions, isDesktop, onImagePick }) => {
  
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
              formData.conditions === category.id && styles.optionCardSelected,
              isDesktop && styles.optionCardDesktop,
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

  // --- CORREÇÃO: Usa 'conditions' ---
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
            <View style={styles.conditionInfo}>
              <Text style={[
                styles.conditionLabel,
                formData.conditions === condition.id && styles.conditionLabelSelected
              ]}>
                {condition.label}
              </Text>
              <Text style={styles.conditionDescription}>{condition.description}</Text>
            </View>
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
        {availabilityOptions.map((availability) => (
          <TouchableOpacity
            key={availability.id}
            style={[
              styles.availabilityOption,
              formData.availability === availability.id && styles.availabilityOptionSelected,
            ]}
            onPress={() => updateFormData('availability', availability.id)}
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
        <Text style={styles.errorText}>{errors.availability}</Text>
      )}
    </View>
  );

  const renderImageUploader = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Fotos dos Itens (Recomendado)</Text>
      <TouchableOpacity
        style={[styles.imageUploader, isDesktop && styles.imageUploaderDesktop]}
        onPress={onImagePick}
      >
        <Text style={styles.imageUploaderIcon}>📷</Text>
        <Text style={styles.imageUploaderText}>Adicionar Fotos</Text>
        <Text style={styles.imageUploaderHint}>
          Mostre os itens para que as instituições vejam o que está sendo oferecido
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
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
    </>
  );
};


// ===================================================================
// TELA PRINCIPAL (Controlador)
// ===================================================================
const PostDonationScreen = ({ route, navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    category: '',
    conditions: '', // --- CORREÇÃO: 'condition' -> 'conditions'
    location: '',
    availability: '',
    expiryDate: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { needId, institutionName, needTitle } = route.params || {};
  const isSpecificDonation = !!needId; // true se estamos vindo de um post

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

  // --- CORREÇÃO: Validação agora depende do contexto ---
  const validateForm = (isSimpleForm = false) => {
    const newErrors = {};

    // Validação complexa SÓ RODA se NÃO for o formulário simples
    if (!isSimpleForm) {
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
  
      if (!formData.category) {
        newErrors.category = 'Selecione uma categoria';
      }
  
      // --- CORREÇÃO: 'condition' -> 'conditions'
      if (!formData.conditions) {
        newErrors.conditions = 'Selecione a condição do item';
      }
  
      if (!formData.availability) {
        newErrors.availability = 'Selecione a disponibilidade';
      }
  
      if (formData.category === 'alimentos' && !formData.expiryDate.trim()) {
        newErrors.expiryDate = 'Data de validade é obrigatória para alimentos';
      }
    }
    
    // Validação de quantidade (para ambos os formulários, mas o simples já valida)
    if (!isSimpleForm) {
      if (!formData.quantity.trim()) {
        newErrors.quantity = 'Quantidade é obrigatória';
      } else {
        const quantityMatch = formData.quantity.match(/\d+/);
        const quantityValue = quantityMatch ? parseInt(quantityMatch[0]) : parseInt(formData.quantity);
        if (isNaN(quantityValue) || quantityValue <= 0) {
          newErrors.quantity = 'Quantidade inválida. Insira um número válido.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- CORREÇÃO: handleSubmit agora lida com os dois cenários ---
  const handleSubmit = async (simpleData = null) => {
    
    setLoading(true);
    let response;
    
    try {
      let donationData;
      let offerData;

      if (isSpecificDonation) {
        // --- Cenário 1: Respondendo a um Post (Formulário Simples) ---
        if (!simpleData) {
          setLoading(false);
          Alert.alert('Erro', 'Por favor, preencha a quantidade.');
          return;
        }
        
        donationData = {
          need_id: needId,
          quantity: simpleData.quantity,
          unit: simpleData.unit,
          notes: simpleData.notes,
          promised_delivery: null
        };

        console.log('Enviando doação (simples):', donationData);
        response = await api.createDonation(donationData); // Chama a rota antiga

      } else {
        // --- Cenário 2: Criando um Novo Item (Formulário Complexo) ---
        if (!validateForm(false)) { // false = não é simples
          Alert.alert('Erro', 'Por favor, corrija os erros no formulário');
          setLoading(false);
          return;
        }

        // Não precisamos mais do alerta de "need_id obrigatório"
        
        // --- CORREÇÃO: Monta o 'offerData' para a nova API ---
        offerData = {
          title: formData.title,
          description: formData.description,
          quantity: formData.quantity, // Manda a string "20 peças"
          category: formData.category,
          conditions: formData.conditions, // --- CORREÇÃO: 'condition' -> 'conditions'
          location: formData.location,
          availability: formData.availability,
          // (expiryDate não está na tabela 'donation_offers' que definimos, mas 'notes' está)
          // (Podemos adicionar a validade na descrição se quisermos)
        };

        console.log('Enviando oferta de doação (complexa):', offerData);
        // Chama a NOVA rota da API
        response = await api.createDonationOffer(offerData); 
      }

      // ----- Processamento da Resposta (Comum para ambos) -----
      console.log('Resposta da API:', response);
      
      if (response.success) {
        const details = response.data.donation || response.data.offer;
        
        Alert.alert(
          'Sucesso!', 
          `Sua oferta de ${details.quantity} ${details.unit || ''} foi registrada com sucesso!`,
          [{ text: 'OK', onPress: () => navigation?.goBack?.() }]
        );
      } else {
        const errorMessage = response.message || response.error || 'Não foi possível publicar. Tente novamente.';
        Alert.alert('Erro', errorMessage);
      }
      
    } catch (error) {
      console.error('Erro ao criar doação/oferta:', error);
      const errorMessage = error.message || 'Não foi possível publicar. Verifique sua conexão e tente novamente.';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
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
    } catch (e) {
      console.error("Erro ao importar ImagePicker:", e);
      Alert.alert("Erro", "Não foi possível abrir a galeria de imagens.");
    }
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
      <Text style={styles.headerTitle}>
        {isSpecificDonation ? 'Oferecer Doação' : 'Publicar Item para Doação'}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderSubmitButtons = () => (
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
        // O handleSubmit do form complexo (simpleData = null)
        onPress={() => handleSubmit(null)} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isSpecificDonation ? 'Confirmar Doação' : 'Publicar Doação'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // --- Renderização Principal Condicional ---
  const renderFormContent = () => {
    if (isSpecificDonation) {
      // --- MODO 1: Formulário Simples (Respondendo a um Post) ---
      return (
        <SimpleDonationForm 
          route={route} 
          onConfirm={handleSubmit} // Passa o 'handleSubmit' principal
          loading={loading} 
        />
      );
    }

    // --- MODO 2: Formulário Complexo (Publicando um Novo Item) ---
    return (
      <>
        <ComplexDonationForm
          formData={formData}
          updateFormData={updateFormData}
          errors={errors}
          categories={categories}
          conditions={conditions} // Passa a lista de 'conditions'
          availabilityOptions={availabilityOptions}
          isDesktop={isDesktop}
          onImagePick={handleImagePicker}
        />
        {renderSubmitButtons()}
      </>
    );
  };

  const renderMobileLayout = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {renderHeader()}
      <View style={styles.formContainer}>
        {renderFormContent()}
      </View>
    </ScrollView>
  );

  // --- CORREÇÃO: renderDesktopLayoutFixed para usar renderFormContent ---
  const renderDesktopLayoutFixed = () => (
    <View style={styles.desktopContainer}>
      <View style={styles.desktopContent}>
        {renderHeader()}
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {isSpecificDonation ? (
            // MODO 1: Desktop - Formulário Simples
            <View style={[styles.formContainer, styles.desktopFormContainerSimple]}>
              {renderFormContent()}
            </View>
          ) : (
            // MODO 2: Desktop - Formulário Complexo
            <>
              <View style={styles.desktopFormContainer}>
                <View style={styles.desktopFormLeft}>
                  {/* Reutiliza o renderFormField para os campos da esquerda */}
                  {renderFormField(
                    'Título', formData.title, (value) => updateFormData('title', value),
                    'Ex: Roupas de inverno para doação', false, errors.title
                  )}
                  {renderFormField(
                    'Descrição', formData.description, (value) => updateFormData('description', value),
                    'Descreva os itens que você está oferecendo...', true, errors.description
                  )}
                  {renderFormField(
                    'Quantidade', formData.quantity, (value) => updateFormData('quantity', value),
                    'Ex: 20 peças, 5kg, 10 unidades...', false, errors.quantity
                  )}
                  {formData.category === 'alimentos' && renderFormField(
                    'Data de Validade', formData.expiryDate, (value) => updateFormData('expiryDate', value),
                    'DD/MM/AAAA', false, errors.expiryDate
                  )}
                  {renderFormField(
                    'Localização', formData.location, (value) => updateFormData('location', value),
                    'Ex: São Paulo, SP - Vila Madalena', false, null, true
                  )}
                </View>

                <View style={styles.desktopFormRight}>
                  {/* Reutiliza os seletores para os campos da direita */}
                  {renderCategorySelector()}
                  {renderConditionSelector()}
                  {renderAvailabilitySelector()}
                  {renderImageUploader()}
                </View>
              </View>
              {renderSubmitButtons()}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );

  // --- CORREÇÃO: Funções que faltavam no escopo global ---
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
              isDesktop && styles.optionCardDesktop,
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
            <View style={styles.conditionInfo}>
              <Text style={[
                styles.conditionLabel,
                formData.conditions === condition.id && styles.conditionLabelSelected
              ]}>
                {condition.label}
              </Text>
              <Text style={styles.conditionDescription}>{condition.description}</Text>
            </View>
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
        {availabilityOptions.map((availability) => (
          <TouchableOpacity
            key={availability.id}
            style={[
              styles.availabilityOption,
              formData.availability === availability.id && styles.availabilityOptionSelected,
            ]}
            onPress={() => updateFormData('availability', availability.id)}
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
        <Text style={styles.errorText}>{errors.availability}</Text>
      )}
    </View>
  );

  const renderImageUploader = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Fotos dos Itens (Recomendado)</Text>
      <TouchableOpacity
        style={[styles.imageUploader, isDesktop && styles.imageUploaderDesktop]}
        onPress={handleImagePicker}
      >
        <Text style={styles.imageUploaderIcon}>📷</Text>
        <Text style={styles.imageUploaderText}>Adicionar Fotos</Text>
        <Text style={styles.imageUploaderHint}>
          Mostre os itens para que as instituições vejam o que está sendo oferecido
        </Text>
      </TouchableOpacity>
    </View>
  );
  // --- Fim das funções de renderização ---


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {isDesktop ? renderDesktopLayoutFixed() : renderMobileLayout()}
    </SafeAreaView>
  );
};

// --- ESTILOS ---
// (Adicionando os estilos que faltavam para o formulário simples)
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
    backgroundColor: colors.backgroundLight, // Fundo para desktop
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
  desktopFormContainerSimple: {
    padding: 32,
    maxWidth: 600, // Limita o form simples no desktop
    alignSelf: 'center', // Centraliza o form simples
    width: '100%',
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
    flex: 1, // Permite que o título cresça
    textAlign: 'center', // Centraliza o título
    marginHorizontal: 16, // Espaçamento
  },
  headerSpacer: {
    width: 44, // Mesmo tamanho do botão de voltar
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

  // --- Estilos do SimpleDonationForm ---
  needInfoBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  needInfoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  needInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  needInfoInstitution: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 0.5,
    minWidth: 100,
  },
  // --- Fim dos estilos SimpleDonationForm ---

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