import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

// Contexts
import { AuthProvider } from './src/contexts/AuthContext';

// Telas para desenvolvimento
import Home from './src/screens/Home';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import SplashScreen from './src/screens/SplashScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import DonorProfileScreen from './src/screens/DonorProfileScreen';
import InstitutionProfileScreen from './src/screens/InstitutionProfileScreen';

// CSS para Web
if (Platform.OS === 'web') {
  require('./src/styles/web.css');
}

// Configuração de desenvolvimento
const DEV_CONFIG = {
  // Altere esta linha para testar diferentes telas:
  CURRENT_SCREEN: 'Login', // 'Home' | 'Login' | 'Register' | 'Splash' | 'ChatList' | 'DonorProfile' | 'InstitutionProfile'
  
  // Mock props para telas que precisam
  mockProps: {
    navigation: {
      navigate: (screen, params) => console.log('🧭 Navigate to:', screen, params),
      goBack: () => console.log('🔙 Go back'),
    },
    route: {
      params: {}
    }
  }
};

const ScreenComponents = {
  Home: Home,
  Login: LoginScreen,
  Register: RegisterScreen,
  Splash: (props) => {
    console.log('🎨 Renderizando SplashScreen com props:', props);
    return (
      <SplashScreen 
        {...props} 
        onLoadingComplete={() => console.log('✅ Splash completed')} 
      />
    );
  },
  ChatList: (props) => (
    <ChatListScreen 
      {...props} 
      navigation={DEV_CONFIG.mockProps.navigation}
    />
  ),
  DonorProfile: DonorProfileScreen,
  InstitutionProfile: InstitutionProfileScreen,
};

export default function DevApp() {
  const CurrentScreen = ScreenComponents[DEV_CONFIG.CURRENT_SCREEN];
  
  if (!CurrentScreen) {
    throw new Error(`Screen "${DEV_CONFIG.CURRENT_SCREEN}" not found. Available: ${Object.keys(ScreenComponents).join(', ')}`);
  }
  
  console.log(`🚀 Rendering screen: ${DEV_CONFIG.CURRENT_SCREEN}`);
  console.log('📱 Props sendo passadas:', DEV_CONFIG.mockProps);
  
  // Componente que detecta login e redireciona
  const AuthAwareApp = () => {
    const { user } = require('./src/contexts/AuthContext').useAuth();
    
    // Se usuário logou e estamos em tela de auth, redirecionar para Home
    if (user && (DEV_CONFIG.CURRENT_SCREEN === 'Login' || DEV_CONFIG.CURRENT_SCREEN === 'Register' || DEV_CONFIG.CURRENT_SCREEN === 'Splash')) {
      console.log('🔄 Usuário logado detectado, redirecionando para Home');
      const HomeScreen = ScreenComponents.Home;
      return <HomeScreen {...DEV_CONFIG.mockProps} />;
    }
    
    return <CurrentScreen {...DEV_CONFIG.mockProps} />;
  };
  
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthAwareApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
