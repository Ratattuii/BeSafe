import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      // TODO: Para produção, restaurar a lógica de persistência
      await AsyncStorage.multiRemove(['@BeSafe:token', '@BeSafe:user']);
      
      // Lógica original (comentada para desenvolvimento):
      // const storedToken = await AsyncStorage.getItem('@BeSafe:token');
      // const storedUser = await AsyncStorage.getItem('@BeSafe:user');
      // 
      // if (storedToken && storedUser) {
      //   api.setToken(storedToken);
      //   setToken(storedToken);
      //   setUser(JSON.parse(storedUser));
      // }
    } catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Para desenvolvimento, simular login
      console.log('🔐 Simulando login com:', { email, password });
      
      // Validação simples para desenvolvimento
      if (!email.trim() || !password.trim()) {
        throw new Error('Email e senha são obrigatórios');
      }
      
      if (password.length < 3) {
        throw new Error('Senha deve ter pelo menos 3 caracteres');
      }
      
      // TODO: Implementar login real
      // const response = await api.login(email, password);
      
      // Simular resposta de sucesso baseada no email
      const isDonor = !email.includes('instituicao') && !email.includes('org');
      const mockUser = {
        id: Date.now(),
        name: isDonor ? 'João Silva' : 'Cruz Vermelha SP',
        email: email,
        role: isDonor ? 'donor' : 'institution',
        avatar: `https://via.placeholder.com/80x80/FF6B6B/FFFFFF?text=${isDonor ? 'JS' : 'CV'}`,
        location: 'São Paulo, SP',
        ...(isDonor ? {
          username: '@joaosilva',
          description: 'Doador ativo desde 2020'
        } : {
          website: 'www.cruzvermelha.org.br',
          phone: '(11) 3456-7890',
          category: 'Saúde e Emergência',
          verified: true
        })
      };
      
      const mockToken = 'mock-token-' + Date.now();
      
      await AsyncStorage.setItem('@BeSafe:token', mockToken);
      await AsyncStorage.setItem('@BeSafe:user', JSON.stringify(mockUser));
      
      api.setToken(mockToken);
      setToken(mockToken);
      setUser(mockUser);
      
      console.log('✅ Login simulado com sucesso:', mockUser);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      // Para desenvolvimento, simular sucesso
      console.log('Simulando registro com dados:', userData);
      
      // TODO: Implementar registro real
      // const response = await api.register(userData);
      
      // Simular resposta de sucesso
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: Date.now(),
            name: userData.name,
            email: userData.email,
            role: userData.role || 'donor'
          },
          token: 'mock-token-' + Date.now()
        }
      };
      
      return mockResponse;
    } catch (error) {
      console.error('Erro ao fazer registro:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar conta'
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['@BeSafe:token', '@BeSafe:user']);
      api.clearToken();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      await AsyncStorage.setItem('@BeSafe:user', JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const isAuthenticated = () => !!(token && user);
  const getUserRole = () => user?.role || null;

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    getUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

