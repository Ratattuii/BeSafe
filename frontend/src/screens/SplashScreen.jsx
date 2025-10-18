import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const SplashScreen = ({ navigation }) => {
  
  const handleDonorPress = () => {
    // Navegar para cadastro como doador
    if (navigation) {
      navigation.navigate('Register', { userType: 'donor' });
    } else {
      console.log('🤝 Usuário selecionou: Sou doador');
    }
  };

  const handleRecipientPress = () => {
    // Navegar para cadastro como instituição
    if (navigation) {
      navigation.navigate('Register', { userType: 'institution' });
    } else {
      console.log('📦 Usuário selecionou: Sou receptor');
    }
  };

  const handleCreateAccountPress = () => {
    // Navegar para tela de criação de conta
    if (navigation) {
      navigation.navigate('Register');
    } else {
      console.log('📝 Navegar para: Criar conta');
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerLogo}>❤️ BeSafe</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.headerLink}
          onPress={handleCreateAccountPress}
        >
          <Text style={styles.headerLinkText}>Criar Conta</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerLink}
          onPress={handleLoginPress}
        >
          <Text style={styles.headerLinkText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMainContent = () => (
    <View style={styles.mainContent}>
      {/* Ícone Principal */}
      <View style={styles.iconContainer}>
        <Text style={styles.heartIcon}>❤️</Text>
      </View>

      {/* Título */}
      <Text style={styles.title}>BeSafe</Text>

      {/* Subtítulo */}
      <Text style={styles.subtitle}>Conectando Doadores e Receptores</Text>

      {/* Descrição */}
      <Text style={styles.description}>
        Junte-se à nossa comunidade para ajudar a fazer a diferença{'\n'}
        doando e recebendo itens essenciais.
      </Text>

      {/* Botões de Ação */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleDonorPress}
          accessible={true}
          accessibilityLabel="Sou doador"
          accessibilityHint="Clique se você quer doar itens"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Sou doador</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleRecipientPress}
          accessible={true}
          accessibilityLabel="Sou receptor"
          accessibilityHint="Clique se você precisa receber doações"
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Sou receptor</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {renderHeader()}
      {renderMainContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 24,
  },
  headerLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerLinkText: {
    fontSize: 16,
    color: '#757575',
    fontWeight: '500',
  },

  // Conteúdo Principal
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },

  // Ícone
  iconContainer: {
    marginBottom: 32,
  },
  heartIcon: {
    fontSize: 80,
    textAlign: 'center',
  },

  // Textos
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: '#212121',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    maxWidth: 500,
  },

  // Botões
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF1434',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#FF1434',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF1434',
    paddingHorizontal: 32,
    paddingVertical: 14, // Slightly less to account for border
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF1434',
  },
});

export default SplashScreen;