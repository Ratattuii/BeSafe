import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// 1. Criação do Contexto
const AuthContext = createContext(null);

// 2. Provedor do Contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Efeito para carregar usuário do AsyncStorage na inicialização
  useEffect(() => {
    const loadUserFromStorage = async () => {
      setLoading(true);
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          console.log('[AuthContext] Usuário carregado do Storage:', parsedUser.email);
          setUser(parsedUser);
          api.setToken(storedToken);
        } else {
          console.log('[AuthContext] Nenhum usuário no Storage.');
        }
      } catch (e) {
        console.error('[AuthContext] Erro ao carregar usuário do Storage:', e);
        setError('Erro ao carregar sessão.');
        await logout();
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Função de Login
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Chama a API para autenticar
      console.log('[AuthContext] Tentando login com:', email);
      const response = await api.login(email, password);
      console.log('[AuthContext] Resposta da API:', response);

      // 2. Verifica se a resposta foi bem-sucedida e contém os dados
      if (response.success && response.data.user && response.data.token) {
        const { user: userData, token } = response.data;
        
        // 3. Atualiza o estado global
        setUser(userData);
        
        // 4. Configura o token na API
        api.setToken(token);
        
        // 5. Salva no AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('token', token);
        
        console.log(`[AuthContext] Login bem-sucedido para: ${userData.email}`);
        return response;
      } else {
        // Lança um erro se a API retornou success: false ou dados faltando
        throw new Error(response.message || 'E-mail ou senha inválidos.');
      }
    } catch (err) {
      console.error('[AuthContext] Erro no login:', err);
      setError(err.message || 'Não foi possível fazer login.');
      return { success: false, message: err.message || 'Erro de conexão.' };
    } finally {
      setLoading(false);
    }
  };

  // Função de Registro
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[AuthContext] Tentando registrar usuário:', userData.email);
      const response = await api.register(userData);
      console.log('[AuthContext] Resposta da API de registro:', response);

      if (response.success && response.data.user && response.data.token) {
        const { user: newUserData, token } = response.data;

        setUser(newUserData);
        api.setToken(token);
        await AsyncStorage.setItem('user', JSON.stringify(newUserData));
        await AsyncStorage.setItem('token', token);

        console.log(`[AuthContext] Registro bem-sucedido para: ${newUserData.email}`);
        return response;
      } else {
        throw new Error(response.message || 'Não foi possível completar o registro.');
      }
    } catch (err) {
      console.error('[AuthContext] Erro no registro:', err);
      setError(err.message || 'Não foi possível registrar.');
      return { success: false, message: err.message || 'Erro de conexão.' };
    } finally {
      setLoading(false);
    }
  };


  // Função de Logout
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[AuthContext] Fazendo logout...');
      setUser(null);
      
      api.clearToken();
      
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      
      console.log('[AuthContext] Logout completo.');
    } catch (e) {
      console.error('[AuthContext] Erro no logout:', e);
      setError('Erro ao sair da conta.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData, avatarFile = null) => {
    if (!user) {
      setError('Usuário não autenticado');
      return { success: false, message: 'Usuário não autenticado' };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.updateUser(user.id, userData, avatarFile);

      if (response.success && response.data.user) {
        const updatedUser = response.data.user;
        
        // Atualiza o estado local
        setUser(updatedUser);
        
        // Atualiza o AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        setLoading(false);
        console.log('[AuthContext] Perfil atualizado:', updatedUser);
        return response; // Retorna a resposta de sucesso
      } else {
        throw new Error(response.message || 'Erro ao atualizar perfil.');
      }
    } catch (err) {
      console.error('[AuthContext] Erro ao atualizar perfil:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  // 3. Monta o valor do Provedor
  const value = {
    user,
    login,
    logout,
    register,
    loading,
    error,
    setUser,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};