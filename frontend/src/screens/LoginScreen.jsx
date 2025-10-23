import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword, runValidations } from '../utils/validation';
import { showError, showDevAlert } from '../utils/alerts';

const LoginScreen = ({ navigation }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('joao@teste.com'); // Email de teste
  const [password, setPassword] = useState('123456'); // Senha de teste
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validateForm = () => {
    const validationError = runValidations(
      validateEmail(email),
      validatePassword(password)
    );
    
    if (validationError) {
      showError(validationError);
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
      alert('Login realizado com sucesso! Bem-vindo ao BeSafe!');
    } catch (error) {
      showError('Erro de conexão. Verifique sua internet.');
      console.error('Erro no login:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      alert('Login com Google realizado com sucesso! Bem-vindo ao BeSafe!');
    } catch (error) {
      showError('Erro no login com Google. Tente novamente.');
      console.error('Erro no login Google:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    showDevAlert('Recuperação de Senha');
  };

  const handleCreateAccount = () => {
    navigation?.navigate('Register');
  };

  const handleBackPress = () => {
    navigation?.navigate('Splash');
  };

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
        <View style={styles.card}>
          {/* Header do Card */}
          <View style={styles.cardHeader}>
            <View style={styles.logoContainer}>
              <Text style={styles.heartIcon}>❤️</Text>
              <Text style={styles.logoText}>BeSafe</Text>
            </View>
            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>Entre com suas credenciais</Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            {/* Campo E-mail */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#9E9E9E"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessible={true}
                accessibilityLabel="Campo de email"
                accessibilityHint="Digite seu endereço de email"
              />
            </View>

            {/* Campo Senha */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Senha</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                placeholderTextColor="#9E9E9E"
                secureTextEntry
                accessible={true}
                accessibilityLabel="Campo de senha"
                accessibilityHint="Digite sua senha"
              />
            </View>

            {/* Checkbox Lembrar-me */}
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
              accessible={true}
              accessibilityLabel="Lembrar-me"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Lembrar-me</Text>
            </TouchableOpacity>

            {/* Botão Entrar com Google */}
            <TouchableOpacity
              style={[styles.googleButton, googleLoading && styles.googleButtonDisabled]}
              onPress={handleGoogleLogin}
              disabled={googleLoading || loading}
              accessible={true}
              accessibilityLabel={googleLoading ? "Fazendo login com Google" : "Entrar com Google"}
              accessibilityRole="button"
              accessibilityState={{ busy: googleLoading }}
            >
              {googleLoading ? (
                <ActivityIndicator color="#757575" size="small" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>🔍</Text>
                  <Text style={styles.googleButtonText}>Entrar com Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botão Entrar */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading || googleLoading}
              accessible={true}
              accessibilityLabel={loading ? "Fazendo login" : "Fazer login"}
              accessibilityRole="button"
              accessibilityState={{ busy: loading }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Link Esqueci minha senha */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              accessible={true}
              accessibilityLabel="Esqueci minha senha"
              accessibilityRole="button"
            >
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            {/* Link Criar conta */}
            <View style={styles.createAccountContainer}>
              <Text style={styles.createAccountText}>Não tem uma conta? </Text>
              <TouchableOpacity
                onPress={handleCreateAccount}
                accessible={true}
                accessibilityLabel="Criar conta"
                accessibilityRole="button"
              >
                <Text style={styles.createAccountLink}>Criar conta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingVertical: 40,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Header do Card
  cardHeader: {
    alignItems: 'center',
    marginBottom: 32,
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

  // Formulário
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
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
    paddingVertical: 14,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FFFFFF',
    minHeight: 50,
    outlineStyle: 'none',
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#FF1434',
    borderColor: '#FF1434',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#757575',
  },

  // Botão Google
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 52,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  googleButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#BDBDBD',
  },
  googleIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },

  // Divisor
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#757575',
  },

  // Botão Login
  loginButton: {
    backgroundColor: '#FF1434',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Links
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#757575',
  },
  createAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createAccountText: {
    fontSize: 14,
    color: '#757575',
  },
  createAccountLink: {
    fontSize: 14,
    color: '#FF1434',
    fontWeight: '600',
  },
});

export default LoginScreen;