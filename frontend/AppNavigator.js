// ==============================================
// APPNAVIGATOR - BESAFE APP
// Sistema de navegação para o app de doações
// ==============================================

import React, { useContext } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// Contexto de autenticação (criar depois)
// import AuthContext from './context/AuthContext'

// Telas principais do BeSafe
import SplashScreen from './screens/SplashScreen'
import HomeScreen from './screens/HomeScreen'
import SearchScreen from './screens/SearchScreen'
import PostRequestScreen from './screens/PostRequestScreen'
import OfferDonationScreen from './screens/OfferDonationScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import MessagesScreen from './screens/MessagesScreen'
import ChatDetailScreen from './screens/ChatDetailScreen'

// Telas de perfil
import DonorProfileScreen from './screens/DonorProfileScreen'
import DonorProfileOwnerScreen from './screens/DonorProfileOwnerScreen'
import InstitutionProfileScreen from './screens/InstitutionProfileScreen'
import InstitutionProfileAdminScreen from './screens/InstitutionProfileAdminScreen'

// Telas de autenticação
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Configuração das cores do BeSafe
const Colors = {
    primary: '#2E8B57',      // Verde principal
    secondary: '#32CD32',     // Verde claro
    accent: '#FF6B6B',        // Vermelho para urgência
    background: '#F8F9FA',    // Fundo
    card: '#FFFFFF',          // Cards
    text: '#2C3E50',          // Texto principal
    textSecondary: '#7F8C8D', // Texto secundário
    border: '#E1E8ED',        // Bordas
    success: '#27AE60',       // Sucesso
    warning: '#F39C12',       // Aviso
    error: '#E74C3C',         // Erro
}

// ==============================================
// NAVEGAÇÃO POR ABAS - USUÁRIO LOGADO
// ==============================================
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline'
                            break
                        case 'Search':
                            iconName = focused ? 'search' : 'search-outline'
                            break
                        case 'Donations':
                            iconName = focused ? 'heart' : 'heart-outline'
                            break
                        case 'Messages':
                            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
                            break
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline'
                            break
                        default:
                            iconName = 'ellipse'
                    }

                    return <Ionicons name={iconName} size={size} color={color} />
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: Colors.card,
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                    height: 65,
                    paddingBottom: 10,
                    paddingTop: 10,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                },
                headerShown: false,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginTop: 2,
                }
            })}
        >
            <Tab.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{
                    tabBarLabel: 'Início',
                }}
            />
            <Tab.Screen 
                name="Search" 
                component={SearchScreen} 
                options={{
                    tabBarLabel: 'Buscar',
                }}
            />
            <Tab.Screen 
                name="Donations" 
                component={OfferDonationScreen} 
                options={{
                    tabBarLabel: 'Doações',
                }}
            />
            <Tab.Screen 
                name="Messages" 
                component={MessagesScreen} 
                options={{
                    tabBarLabel: 'Mensagens',
                }}
            />
            <Tab.Screen 
                name="Profile" 
                component={DonorProfileOwnerScreen} 
                options={{
                    tabBarLabel: 'Perfil',
                }}
            />
        </Tab.Navigator>
    )
}

// ==============================================
// NAVEGAÇÃO DE AUTENTICAÇÃO
// ==============================================
const AuthNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    )
}

// ==============================================
// NAVEGADOR PRINCIPAL DO APP
// ==============================================
const AppNavigator = () => {
    // Simular estado de autenticação (substituir por AuthContext depois)
    const [userToken, setUserToken] = React.useState(null)
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        // Simular carregamento inicial
        setTimeout(() => {
            setIsLoading(false)
        }, 2000)
    }, [])

    // Tela de carregamento
    if (isLoading) {
        return <SplashScreen />
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                {userToken ? (
                    // ===== USUÁRIO AUTENTICADO =====
                    <>
                        {/* Navegação principal com abas */}
                        <Stack.Screen 
                            name="MainTabs" 
                            component={MainTabNavigator} 
                        />
                        
                        {/* Telas de detalhes */}
                        <Stack.Screen 
                            name="ChatDetail" 
                            component={ChatDetailScreen}
                            options={{
                                headerShown: true,
                                title: 'Chat',
                                headerBackTitle: 'Voltar',
                                headerStyle: {
                                    backgroundColor: Colors.primary,
                                },
                                headerTintColor: Colors.card,
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                },
                            }}
                        />
                        
                        <Stack.Screen 
                            name="PostRequest" 
                            component={PostRequestScreen}
                            options={{
                                headerShown: true,
                                title: 'Nova Solicitação',
                                headerBackTitle: 'Voltar',
                                headerStyle: {
                                    backgroundColor: Colors.primary,
                                },
                                headerTintColor: Colors.card,
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                },
                            }}
                        />
                        
                        <Stack.Screen 
                            name="Notifications" 
                            component={NotificationsScreen}
                            options={{
                                headerShown: true,
                                title: 'Notificações',
                                headerBackTitle: 'Voltar',
                                headerStyle: {
                                    backgroundColor: Colors.primary,
                                },
                                headerTintColor: Colors.card,
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                },
                            }}
                        />
                        
                        {/* Telas de perfil */}
                        <Stack.Screen 
                            name="DonorProfile" 
                            component={DonorProfileScreen}
                            options={{
                                headerShown: true,
                                title: 'Perfil do Doador',
                                headerBackTitle: 'Voltar',
                                headerStyle: {
                                    backgroundColor: Colors.primary,
                                },
                                headerTintColor: Colors.card,
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                },
                            }}
                        />
                        
                        <Stack.Screen 
                            name="InstitutionProfile" 
                            component={InstitutionProfileScreen}
                            options={{
                                headerShown: true,
                                title: 'Perfil da Instituição',
                                headerBackTitle: 'Voltar',
                                headerStyle: {
                                    backgroundColor: Colors.primary,
                                },
                                headerTintColor: Colors.card,
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                },
                            }}
                        />
                        
                        <Stack.Screen 
                            name="InstitutionProfileAdmin" 
                            component={InstitutionProfileAdminScreen}
                            options={{
                                headerShown: true,
                                title: 'Administrar Instituição',
                                headerBackTitle: 'Voltar',
                                headerStyle: {
                                    backgroundColor: Colors.primary,
                                },
                                headerTintColor: Colors.card,
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                },
                            }}
                        />
                    </>
                ) : (
                    // ===== USUÁRIO NÃO AUTENTICADO =====
                    <>
                        <Stack.Screen 
                            name="Splash" 
                            component={SplashScreen}
                        />
                        <Stack.Screen 
                            name="Auth" 
                            component={AuthNavigator}
                            options={{
                                animationTypeForReplace: 'pop',
                            }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    )
}

// ==============================================
// ESTILOS
// ==============================================
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
})

export default AppNavigator
export { Colors } 