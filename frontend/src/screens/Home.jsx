import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import HomeDonor from './HomeDonor'; // Importa a Home para Doador
import HomeInstitution from './HomeInstitution'; // Importa a Home para Instituição
import { colors } from '../styles/globalStyles';

const Home = () => {
    // Assumindo que o AuthContext expõe 'user' e 'loading'
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando Home...</Text>
            </View>
        );
    }
    
    // Renderiza a Home correta baseada na role
    if (user?.role === 'institution') {
        return <HomeInstitution />;
    }
    
    // Default para 'donor' ou qualquer outro tipo
    return <HomeDonor />;
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
});

export default Home;