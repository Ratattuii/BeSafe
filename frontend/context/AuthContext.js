// ==============================================
// AUTH CONTEXT - BESAFE APP
// Gerenciamento de autenticação usando React Context
// ==============================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Criar o contexto
const AuthContext = createContext({});

// Provider do contexto
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Verificar se há dados salvos ao inicializar
    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const savedUser = await AsyncStorage.getItem('user');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userData) => {
        try {
            // Salvar dados do usuário
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
            return true;
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            // Remover dados salvos
            await AsyncStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
            return true;
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            return false;
        }
    };

    const updateUser = async (newUserData) => {
        try {
            const updatedUser = { ...user, ...newUserData };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return true;
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            return false;
        }
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook para usar o contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};

export default AuthContext; 