<<<<<<< HEAD
// ==============================================
// APP PRINCIPAL - BESAFE
// Usando apenas React Native nativo, sem navegação
// ==============================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';

// Componente principal da aplicação
function AppContent() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E8B57" />
                <Text style={styles.loadingText}>Carregando BeSafe...</Text>
            </View>
        );
    }

    return isAuthenticated ? (
        <HomeScreen onLogout={() => {}} />
    ) : (
        <LoginScreen onLoginSuccess={() => {}} />
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
            <StatusBar style="auto" />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
});
=======
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Platform, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { setupGlobalErrorHandling } from './src/utils/errorHandler';

// Navigators
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';

// Comentário removido - imports não utilizados foram limpos

// Styles
import { colors } from './src/styles/globalStyles';

// CSS para Web
if (Platform.OS === 'web') {
  require('./src/styles/web.css');
  
  // Forçar scroll via JavaScript puro - versão mais seletiva
  setTimeout(() => {
    let mainScrollFound = false;
    
    // Adicionar listener global de wheel
    document.addEventListener('wheel', (e) => {
      // Ser mais seletivo - apenas divs que realmente precisam de scroll
      const scrollables = document.querySelectorAll('div[style*="flex"], div[class*="scroll"]');
      
      scrollables.forEach(div => {
        const hasOverflow = div.scrollHeight > div.clientHeight;
        const isVisible = div.offsetParent !== null;
        
        if (hasOverflow && isVisible && !mainScrollFound) {
          div.style.overflowY = 'auto';
          div.scrollTop += e.deltaY * 0.5;
          e.preventDefault();
          mainScrollFound = true; // Apenas o primeiro elemento scrollável
        }
      });
      
      // Reset para próximo evento
      setTimeout(() => { mainScrollFound = false; }, 10);
    }, { passive: false });
    
    console.log('Scroll global seletivo ativado!');
  }, 1000);
}

// Componente para gerenciar navegação baseada no estado de autenticação
const AppNavigator = () => {
  const { user, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  // LÓGICA NORMAL DE AUTENTICAÇÃO RESTAURADA
  
  // Se usuário está logado, mostrar app principal
  if (user) {
    return <MainNavigator />;
  }

  // Se não está logado, mostrar telas de autenticação (começando com Splash)
  return <AuthNavigator />;
};

// Componente principal do App
export default function App() {
  console.log('🚀 App.js principal carregado - FLUXO COMPLETO DE NAVEGAÇÃO');
  
  useEffect(() => {
    // Configurar tratamento global de erros na inicialização
    setupGlobalErrorHandling();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer
          theme={{
            dark: false,
            colors: {
              primary: colors.primary,
              background: colors.background,
              card: colors.white,
              text: colors.textPrimary,
              border: colors.secondary,
              notification: colors.primary,
            },
          }}
        >
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
>>>>>>> 3880e63 (Initial commit - BeSafe Platform)
