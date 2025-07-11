import React, { useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { Colors } from '../AppNavigator'

const RegisterScreen = () => {
    const navigation = useNavigation()
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmSenha: '',
        tipo: 'doador',
        bio: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const validateForm = () => {
        const { nome, email, senha, confirmSenha } = formData

        if (!nome.trim()) {
            Alert.alert('Erro', 'Nome é obrigatório')
            return false
        }

        if (!email.trim()) {
            Alert.alert('Erro', 'Email é obrigatório')
            return false
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            Alert.alert('Erro', 'Email inválido')
            return false
        }

        if (!senha) {
            Alert.alert('Erro', 'Senha é obrigatória')
            return false
        }

        if (senha.length < 6) {
            Alert.alert('Erro', 'Senha deve ter pelo menos 6 caracteres')
            return false
        }

        if (senha !== confirmSenha) {
            Alert.alert('Erro', 'Senhas não coincidem')
            return false
        }

        return true
    }

    const handleRegister = async () => {
        if (!validateForm()) return

        setIsLoading(true)

        try {
            // Simular registro - aqui você conectaria com a API
            console.log('Dados de registro:', formData)
            
            setTimeout(() => {
                setIsLoading(false)
                Alert.alert(
                    'Sucesso', 
                    'Conta criada com sucesso!',
                    [
                        { text: 'OK', onPress: () => navigation.navigate('Login') }
                    ]
                )
            }, 2000)

        } catch (error) {
            setIsLoading(false)
            Alert.alert('Erro', 'Erro ao criar conta. Tente novamente.')
            console.error('Erro no registro:', error)
        }
    }

    const handleLogin = () => {
        navigation.navigate('Login')
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.logo}>BeSafe</Text>
                    <Text style={styles.subtitle}>Crie sua conta</Text>
                </View>

                <View style={styles.form}>
                    {/* Nome */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome completo"
                            placeholderTextColor={Colors.textSecondary}
                            value={formData.nome}
                            onChangeText={(text) => handleInputChange('nome', text)}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={Colors.textSecondary}
                            value={formData.email}
                            onChangeText={(text) => handleInputChange('email', text)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    </View>

                    {/* Tipo de usuário */}
                    <Text style={styles.sectionTitle}>Tipo de conta:</Text>
                    <View style={styles.typeContainer}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                formData.tipo === 'doador' && styles.typeButtonActive
                            ]}
                            onPress={() => handleInputChange('tipo', 'doador')}
                        >
                            <Ionicons 
                                name="heart-outline" 
                                size={24} 
                                color={formData.tipo === 'doador' ? Colors.card : Colors.primary} 
                            />
                            <Text style={[
                                styles.typeButtonText,
                                formData.tipo === 'doador' && styles.typeButtonTextActive
                            ]}>
                                Doador
                            </Text>
                            <Text style={[
                                styles.typeButtonDescription,
                                formData.tipo === 'doador' && styles.typeButtonDescriptionActive
                            ]}>
                                Quero ajudar doando
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                formData.tipo === 'receptor' && styles.typeButtonActive
                            ]}
                            onPress={() => handleInputChange('tipo', 'receptor')}
                        >
                            <Ionicons 
                                name="home-outline" 
                                size={24} 
                                color={formData.tipo === 'receptor' ? Colors.card : Colors.primary} 
                            />
                            <Text style={[
                                styles.typeButtonText,
                                formData.tipo === 'receptor' && styles.typeButtonTextActive
                            ]}>
                                Instituição
                            </Text>
                            <Text style={[
                                styles.typeButtonDescription,
                                formData.tipo === 'receptor' && styles.typeButtonDescriptionActive
                            ]}>
                                Represento uma ONG
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bio */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Conte um pouco sobre você (opcional)"
                            placeholderTextColor={Colors.textSecondary}
                            value={formData.bio}
                            onChangeText={(text) => handleInputChange('bio', text)}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Senha */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                        <TextInput
                            style={styles.input}
                            placeholder="Senha (mínimo 6 caracteres)"
                            placeholderTextColor={Colors.textSecondary}
                            value={formData.senha}
                            onChangeText={(text) => handleInputChange('senha', text)}
                            secureTextEntry={!showPassword}
                            autoComplete="new-password"
                        />
                        <TouchableOpacity 
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons 
                                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                size={20} 
                                color={Colors.textSecondary} 
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Confirmar Senha */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirmar senha"
                            placeholderTextColor={Colors.textSecondary}
                            value={formData.confirmSenha}
                            onChangeText={(text) => handleInputChange('confirmSenha', text)}
                            secureTextEntry={!showConfirmPassword}
                            autoComplete="new-password"
                        />
                        <TouchableOpacity 
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons 
                                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                                size={20} 
                                color={Colors.textSecondary} 
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Botão de Registro */}
                    <TouchableOpacity 
                        style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        <Text style={styles.registerButtonText}>
                            {isLoading ? 'Criando conta...' : 'Criar conta'}
                        </Text>
                    </TouchableOpacity>

                    {/* Termos */}
                    <Text style={styles.termsText}>
                        Ao criar uma conta, você concorda com nossos{'\n'}
                        <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
                        <Text style={styles.termsLink}>Política de Privacidade</Text>
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Já tem uma conta?</Text>
                    <TouchableOpacity onPress={handleLogin}>
                        <Text style={styles.loginText}>Faça login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        alignItems: 'center',
    },
    logo: {
        fontSize: 42,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    form: {
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    input: {
        flex: 1,
        height: 50,
        marginLeft: 10,
        fontSize: 16,
        color: Colors.text,
    },
    textArea: {
        height: 80,
        paddingTop: 15,
    },
    eyeIcon: {
        padding: 5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
        marginTop: 5,
    },
    typeContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    typeButton: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    typeButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    typeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 8,
        marginBottom: 4,
    },
    typeButtonTextActive: {
        color: Colors.card,
    },
    typeButtonDescription: {
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    typeButtonDescriptionActive: {
        color: Colors.card,
        opacity: 0.9,
    },
    registerButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
    registerButtonDisabled: {
        backgroundColor: Colors.textSecondary,
        opacity: 0.6,
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.card,
    },
    termsText: {
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
    },
    termsLink: {
        color: Colors.primary,
        fontWeight: '600',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginRight: 5,
    },
    loginText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: 'bold',
    },
})

export default RegisterScreen 