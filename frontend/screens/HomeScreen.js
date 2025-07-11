// ==============================================
// HOME SCREEN - BESAFE APP
// Tela principal usando apenas React Native nativo
// ==============================================

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getData } from '../services/api';

export default function HomeScreen({ onLogout }) {
    const { user, logout } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalDoacoes: 0,
        totalInstituicoes: 0,
        minhasDoacoes: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Tentar carregar dados da API
            const response = await getData('/stats');
            setStats(response);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            // Dados mock para teste
            setStats({
                totalDoacoes: 156,
                totalInstituicoes: 23,
                minhasDoacoes: user?.tipo === 'doador' ? 5 : 12
            });
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Sair',
            'Deseja realmente sair da sua conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await logout();
                        if (success && onLogout) {
                            onLogout();
                        }
                    }
                }
            ]
        );
    };

    const handleDonate = () => {
        Alert.alert('Doar', 'Funcionalidade de doação será implementada em breve!');
    };

    const handleSearch = () => {
        Alert.alert('Buscar', 'Funcionalidade de busca será implementada em breve!');
    };

    const handleMessages = () => {
        Alert.alert('Mensagens', 'Funcionalidade de mensagens será implementada em breve!');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá, {user?.nome || 'Usuário'}!</Text>
                    <Text style={styles.userType}>
                        {user?.tipo === 'doador' ? 'Doador' : 'Instituição'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Sair</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl 
                        refreshing={isRefreshing} 
                        onRefresh={handleRefresh}
                        colors={['#2E8B57']}
                    />
                }
            >
                {/* Estatísticas */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Estatísticas</Text>
                    
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.totalDoacoes}</Text>
                            <Text style={styles.statLabel}>Total de Doações</Text>
                        </View>
                        
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.totalInstituicoes}</Text>
                            <Text style={styles.statLabel}>Instituições</Text>
                        </View>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.minhasDoacoes}</Text>
                        <Text style={styles.statLabel}>
                            {user?.tipo === 'doador' ? 'Minhas Doações' : 'Doações Recebidas'}
                        </Text>
                    </View>
                </View>

                {/* Ações Rápidas */}
                <View style={styles.actionsContainer}>
                    <Text style={styles.sectionTitle}>Ações Rápidas</Text>
                    
                    <TouchableOpacity style={styles.actionButton} onPress={handleDonate}>
                        <Text style={styles.actionButtonText}>
                            {user?.tipo === 'doador' ? '💝 Fazer Doação' : '📋 Solicitar Doação'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleSearch}>
                        <Text style={styles.actionButtonText}>🔍 Buscar Instituições</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleMessages}>
                        <Text style={styles.actionButtonText}>💬 Ver Mensagens</Text>
                    </TouchableOpacity>
                </View>

                {/* Informações */}
                <View style={styles.infoContainer}>
                    <Text style={styles.sectionTitle}>Sobre o BeSafe</Text>
                    <Text style={styles.infoText}>
                        O BeSafe conecta doadores e instituições de forma segura e transparente.
                        Ajude a transformar vidas através da solidariedade!
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#2E8B57',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    userType: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    logoutText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    statsContainer: {
        marginBottom: 30,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E8B57',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    actionsContainer: {
        marginBottom: 30,
    },
    actionButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        fontWeight: '500',
    },
    infoContainer: {
        marginBottom: 30,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        textAlign: 'center',
    },
});