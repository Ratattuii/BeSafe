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