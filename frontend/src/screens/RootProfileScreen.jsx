import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import DonorProfileScreen from './DonorProfileScreen';
import MyInstitutionProfileScreen from './MyInstitutionProfileScreen';
import { colors } from '../styles/globalStyles';

const RootProfileScreen = () => {
    // Assumindo que o AuthContext expõe 'user' e 'loading'
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando perfil...</Text>
            </View>
        );
    }
    
    if (!user) {
        // Redirecionamento deve ser tratado pelo AppNavigator, mas mostramos um erro aqui.
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Nenhuma sessão ativa. Por favor, faça login.</Text>
            </View>
        );
    }

    // Renderiza a tela de perfil correta baseada na role
    if (user.role === 'institution') {
        // Se for instituição, carrega a lógica de perfil de instituição
        return <MyInstitutionProfileScreen />;
    }
    
    // Default para 'donor' ou qualquer outro tipo (perfil padrão)
    return <DonorProfileScreen />;
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
    },
    loadingText: {
        marginTop: 10,
        color: colors.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
    },
    errorText: {
        color: colors.error,
        fontSize: 16,
    }
});

export default RootProfileScreen;