import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword, validateRequired, validatePasswordConfirmation, runValidations } from '../utils/validation';
import { showError } from '../utils/alerts';

const RegisterScreen = ({ navigation, route }) => {
  const { register } = useAuth();
  const [userType, setUserType] = useState(route?.params?.userType || 'donor'); // 'donor' ou 'institution'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Campos para Doador
  const [donorData, setDonorData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Campos para Instituição
  const [institutionData, setInstitutionData] = useState({
    institutionName: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    institutionType: '',
    activityArea: '',
    description: '',
    website: '',
    password: '',
    confirmPassword: '',
  });

  const institutionTypes = [
    'ONG',
    'Hospital',
    'Abrigo',
    'Creche',
    'Asilo',
    'Centro Comunitário',
    'Igreja',
    'Escola',
    'Outro',
  ];

  const activityAreas = [
    'Saúde',
    'Assistência Social',
    'Educação',
    'Meio Ambiente',
    'Cultura',
    'Esporte',
    'Direitos Humanos',
    'Animais',
    'Outro',
  ];

  const validateDonorForm = () => {
    const { fullName, email, password, confirmPassword } = donorData;

    const validationError = runValidations(
      validateRequired(fullName, 'Nome completo'),
      validateEmail(email),
      validatePassword(password),
      validatePasswordConfirmation(password, confirmPassword)
    );

    if (validationError) {
      showError(validationError);
      return false;
    }

    return true;
  };

  const validateInstitutionForm = () => {
    const { institutionName, cnpj, email, phone, address, institutionType, activityArea, password, confirmPassword } = institutionData;

    const validationError = runValidations(
      validateRequired(institutionName, 'Nome da instituição'),
      validateRequired(cnpj, 'CNPJ'),
      validateEmail(email),
      validateRequired(phone, 'Telefone'),
      validateRequired(address, 'Endereço'),
      validateRequired(institutionType, 'Tipo de instituição'),
      validateRequired(activityArea, 'Área de atuação'),
      validatePassword(password),
      validatePasswordConfirmation(password, confirmPassword)
    );

    if (validationError) {
      showError(validationError);
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    const isValid = userType === 'donor' ? validateDonorForm() : validateInstitutionForm();
    if (!isValid) return;

    setLoading(true);

    try {
      // Prepara dados para cadastro
      const formData = userType === 'donor' ? donorData : institutionData;
      
      const userData = {
        name: userType === 'donor' ? formData.fullName : formData.institutionName,
        email: formData.email,
        password: formData.password,
        role: userType,
        // Dados específicos da instituição
        ...(userType === 'institution' && {
          cnpj: formData.cnpj,
          phone: formData.phone,
          address: formData.address,
          institutionType: formData.institutionType,
          activityArea: formData.activityArea,
          description: formData.description,
          website: formData.website,
        })
      };

      // Chama API de cadastro
      const result = await register(userData);

      if (result.success) {
        // Usa alert simples para funcionar no web
        alert('Conta criada com sucesso! Você será redirecionado para o login.');
        
        // Redireciona para tela de login
        navigation.navigate('Login');
      } else {
        showError(result.error || 'Erro ao criar conta');
      }

    } catch (error) {
      showError('Erro de conexão. Verifique sua internet.');
      console.error('Erro no cadastro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPress = () => {
    // Navegar para tela de login
    if (navigation) {
      navigation.navigate('Login');
    } else {
      console.log('🔐 Navegar para: Login');
    }
  };

  const handleBackPress = () => {
    navigation?.navigate('Splash');
  };

  const renderUserTypeSelector = () => (
    <View style={styles.userTypeSelector}>
      <TouchableOpacity
        style={[styles.typeTab, userType === 'donor' && styles.typeTabActive]}
        onPress={() => setUserType('donor')}
      >
        <Text style={[styles.typeTabText, userType === 'donor' && styles.typeTabTextActive]}>
          Sou Doador
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.typeTab, userType === 'institution' && styles.typeTabActive]}
        onPress={() => setUserType('institution')}
      >
        <Text style={[styles.typeTabText, userType === 'institution' && styles.typeTabTextActive]}>
          Sou Instituição
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPasswordInput = (label, value, onChangeText, showPassword, toggleShow, placeholder) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9E9E9E"
          secureTextEntry={!showPassword}
          accessible={true}
          accessibilityLabel={label}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={toggleShow}
          accessible={true}
          accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          <Text style={styles.passwordToggleIcon}>
            {showPassword ? '🙈' : '👁️'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDropdown = (label, value, options, onSelect, placeholder) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => {
          // TODO: Implementar dropdown real
          Alert.alert('Selecionar', `Opções: ${options.join(', ')}`);
        }}
      >
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDonorForm = () => (
    <View style={styles.form}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Nome completo</Text>
        <TextInput
          style={styles.input}
          value={donorData.fullName}
          onChangeText={(text) => setDonorData({...donorData, fullName: text})}
          placeholder="Ponha seu nome completo"
          placeholderTextColor="#9E9E9E"
          accessible={true}
          accessibilityLabel="Nome completo"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={donorData.email}
          onChangeText={(text) => setDonorData({...donorData, email: text})}
          placeholder="Digite seu e-mail"
          placeholderTextColor="#9E9E9E"
          keyboardType="email-address"
          autoCapitalize="none"
          accessible={true}
          accessibilityLabel="Email"
        />
      </View>

      {renderPasswordInput(
        'Senha',
        donorData.password,
        (text) => setDonorData({...donorData, password: text}),
        showPassword,
        () => setShowPassword(!showPassword),
        'Digite sua senha'
      )}

      {renderPasswordInput(
        'Confirme sua senha',
        donorData.confirmPassword,
        (text) => setDonorData({...donorData, confirmPassword: text}),
        showConfirmPassword,
        () => setShowConfirmPassword(!showConfirmPassword),
        'Digite sua senha novamente'
      )}
    </View>
  );

  const renderInstitutionForm = () => (
    <View style={styles.form}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Nome da instituição</Text>
        <TextInput
          style={styles.input}
          value={institutionData.institutionName}
          onChangeText={(text) => setInstitutionData({...institutionData, institutionName: text})}
          placeholder="Nome da sua instituição"
          placeholderTextColor="#9E9E9E"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>CNPJ</Text>
        <TextInput
          style={styles.input}
          value={institutionData.cnpj}
          onChangeText={(text) => setInstitutionData({...institutionData, cnpj: text})}
          placeholder="00.000.000/0000-00"
          placeholderTextColor="#9E9E9E"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={institutionData.email}
          onChangeText={(text) => setInstitutionData({...institutionData, email: text})}
          placeholder="Digite o e-mail da instituição"
          placeholderTextColor="#9E9E9E"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Telefone</Text>
        <TextInput
          style={styles.input}
          value={institutionData.phone}
          onChangeText={(text) => setInstitutionData({...institutionData, phone: text})}
          placeholder="(00) 00000-0000"
          placeholderTextColor="#9E9E9E"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Endereço completo</Text>
        <TextInput
          style={styles.input}
          value={institutionData.address}
          onChangeText={(text) => setInstitutionData({...institutionData, address: text})}
          placeholder="Rua, número, bairro, cidade, CEP"
          placeholderTextColor="#9E9E9E"
          multiline
        />
      </View>

      {renderDropdown(
        'Tipo de instituição',
        institutionData.institutionType,
        institutionTypes,
        (value) => setInstitutionData({...institutionData, institutionType: value}),
        'Selecione o tipo'
      )}

      {renderDropdown(
        'Área de atuação',
        institutionData.activityArea,
        activityAreas,
        (value) => setInstitutionData({...institutionData, activityArea: value}),
        'Selecione a área'
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Descrição da instituição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={institutionData.description}
          onChangeText={(text) => setInstitutionData({...institutionData, description: text})}
          placeholder="Descreva brevemente a missão e atividades da instituição"
          placeholderTextColor="#9E9E9E"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Site/Redes sociais (opcional)</Text>
        <TextInput
          style={styles.input}
          value={institutionData.website}
          onChangeText={(text) => setInstitutionData({...institutionData, website: text})}
          placeholder="www.exemplo.com ou @instagram"
          placeholderTextColor="#9E9E9E"
          autoCapitalize="none"
        />
      </View>

      {renderPasswordInput(
        'Senha',
        institutionData.password,
        (text) => setInstitutionData({...institutionData, password: text}),
        showPassword,
        () => setShowPassword(!showPassword),
        'Digite sua senha'
      )}

      {renderPasswordInput(
        'Confirme sua senha',
        institutionData.confirmPassword,
        (text) => setInstitutionData({...institutionData, confirmPassword: text}),
        showConfirmPassword,
        () => setShowConfirmPassword(!showConfirmPassword),
        'Digite sua senha novamente'
      )}
    </View>
  );

  const renderRegisterCard = () => (
    <View style={styles.card}>
      {/* Header do Card */}
      <View style={styles.cardHeader}>
        <View style={styles.logoContainer}>
          <Text style={styles.heartIcon}>❤️</Text>
          <Text style={styles.logoText}>BeSafe</Text>
        </View>
        <Text style={styles.title}>Criar nova conta</Text>
        <Text style={styles.subtitle}>Preencha os dados para se cadastrar</Text>
      </View>

      {/* Seletor de Tipo */}
      {renderUserTypeSelector()}

      {/* Formulário */}
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {userType === 'donor' ? renderDonorForm() : renderInstitutionForm()}

        {/* Botão Criar conta */}
        <TouchableOpacity
          style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          accessible={true}
          accessibilityLabel={loading ? "Criando conta" : "Criar conta"}
          accessibilityRole="button"
          accessibilityState={{ busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.registerButtonText}>Criar conta</Text>
          )}
        </TouchableOpacity>

        {/* Link Login */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Já tem uma conta? </Text>
          <TouchableOpacity
            onPress={handleLoginPress}
            accessible={true}
            accessibilityLabel="Fazer login"
            accessibilityRole="button"
          >
            <Text style={styles.loginLink}>Fazer login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#F2F2F2" />
      {/* Botão de voltar */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
          accessible={true}
          accessibilityLabel="Voltar para tela inicial"
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {renderRegisterCard()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  
  // Header com botão de voltar
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    fontSize: 20,
    color: '#FF1434',
    fontWeight: 'bold',
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Header do Card
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },

  // Seletor de Tipo
  userTypeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F6F8F9',
    borderRadius: 8,
    padding: 4,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeTabActive: {
    backgroundColor: '#FF1434',
  },
  typeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  typeTabTextActive: {
    color: '#FFFFFF',
  },

  // Formulário
  formContainer: {
    flex: 1,
    maxHeight: 400,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    outlineStyle: 'none',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Password Input
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
    minHeight: 48,
    outlineStyle: 'none',
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  passwordToggleIcon: {
    fontSize: 18,
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: '#212121',
  },
  dropdownPlaceholder: {
    color: '#9E9E9E',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#757575',
  },

  // Botão Register
  registerButton: {
    backgroundColor: '#FF1434',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  registerButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Link Login
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 14,
    color: '#757575',
  },
  loginLink: {
    fontSize: 14,
    color: '#FF1434',
    fontWeight: '600',
  },
});

export default RegisterScreen;