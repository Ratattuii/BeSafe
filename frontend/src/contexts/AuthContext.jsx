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
      // Para desenvolvimento: limpar cache para sempre começar na splash
      if (__DEV__) {
        console.log('Modo desenvolvimento: limpando dados salvos');
        await AsyncStorage.multiRemove(['@BeSafe:token', '@BeSafe:user']);
        return;
      }
      
      // Produção: carregar dados salvos
      const storedToken = await AsyncStorage.getItem('@BeSafe:token');
      const storedUser = await AsyncStorage.getItem('@BeSafe:user');
      
      if (storedToken && storedUser) {
        api.setToken(storedToken);
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Tentando login real com:', { email });
      
      // Validação básica
      if (!email.trim() || !password.trim()) {
        throw new Error('Email e senha são obrigatórios');
      }
      
      // Usar backend real
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Salvar dados no AsyncStorage
        await AsyncStorage.setItem('@BeSafe:token', token);
        await AsyncStorage.setItem('@BeSafe:user', JSON.stringify(user));
        
        // Configurar API e estado
        api.setToken(token);
        setToken(token);
        setUser(user);
        
        console.log('✅ Login realizado com sucesso no banco:', user);
        return;
      }
      
      throw new Error('Resposta inválida do servidor');
      
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('🔐 Tentando registro real com dados:', userData);
      
      // Usar backend real
      const response = await api.register(userData);
      
      if (response.success && response.data) {
        console.log('✅ Registro realizado com sucesso no banco:', response.data);
        
        // NÃO salvar dados automaticamente - usuário deve fazer login
        return response;
      }
      
      return {
        success: false,
        error: 'Resposta inválida do servidor'
      };
      
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

