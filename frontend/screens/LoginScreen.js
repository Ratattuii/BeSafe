// ==============================================
// LOGIN SCREEN - BESAFE APP
// Usando apenas React Native nativo
// ==============================================

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { postData } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email.trim() || !senha.trim()) {
            Alert.alert('Erro', 'Preencha email e senha');
            return;
        }

        setIsLoading(true);

        try {
            // Tentar fazer login na API
            const response = await postData('/login', {
                email: email.trim(),
                senha: senha
            });

            // Salvar dados do usuário
            const success = await login({
                id: response.id || 1,
                nome: response.nome || 'Usuário BeSafe',
                email: email.trim(),
                tipo: response.tipo || 'doador'
            });

            if (success) {
                Alert.alert('Sucesso', 'Login realizado com sucesso!');
                if (onLoginSuccess) {
                    onLoginSuccess();
                }
            } else {
                Alert.alert('Erro', 'Erro ao salvar dados do usuário');
            }

        } catch (error) {
            console.error('Erro no login:', error);
            
            // Login offline para teste (mock)
            const success = await login({
                id: 1,
                nome: 'Usuário Teste',
                email: email.trim(),
                tipo: 'doador'
            });

            if (success) {
                Alert.alert('Modo Offline', 'Login realizado em modo de teste');
                if (onLoginSuccess) {
                    onLoginSuccess();
                }
            } else {
                Alert.alert('Erro', 'Não foi possível fazer login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>BeSafe</Text>
                <Text style={styles.subtitle}>Sistema de Doações</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Email:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Digite seu email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <Text style={styles.label}>Senha:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                    autoCorrect={false}
                />

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>Entrar</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkButton}>
                    <Text style={styles.linkText}>Não tem conta? Cadastre-se</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    logo: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#2E8B57',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#2E8B57',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        backgroundColor: '#95a5a6',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 20,
    },
    linkText: {
        color: '#2E8B57',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
}); 