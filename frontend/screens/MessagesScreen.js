import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { Colors } from '../AppNavigator'

const MessagesScreen = () => {
    const navigation = useNavigation()
    const [conversations, setConversations] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Dados mockados para demonstração
    const mockConversations = [
        {
            id: 1,
            participantName: 'Lar São Vicente',
            participantType: 'institution',
            lastMessage: 'Obrigado pela doação de cestas básicas! Foram entregues às famílias necessitadas.',
            lastMessageTime: '14:30',
            unreadCount: 0,
            isOnline: true,
            avatar: null
        },
        {
            id: 2,
            participantName: 'Maria Santos',
            participantType: 'donor',
            lastMessage: 'Olá! Gostaria de saber mais detalhes sobre a doação de roupas.',
            lastMessageTime: '12:15',
            unreadCount: 2,
            isOnline: false,
            avatar: null
        },
        {
            id: 3,
            participantName: 'Casa da Esperança',
            participantType: 'institution',
            lastMessage: 'Boa tarde! Precisamos urgentemente de materiais escolares.',
            lastMessageTime: 'Ontem',
            unreadCount: 1,
            isOnline: true,
            avatar: null
        },
        {
            id: 4,
            participantName: 'João Silva',
            participantType: 'donor',
            lastMessage: 'Posso ajudar com medicamentos. Quando posso entregar?',
            lastMessageTime: 'Ontem',
            unreadCount: 0,
            isOnline: false,
            avatar: null
        },
        {
            id: 5,
            participantName: 'Instituto Vida Nova',
            participantType: 'institution',
            lastMessage: 'Recebemos a doação de brinquedos. As crianças ficaram muito felizes!',
            lastMessageTime: '2 dias',
            unreadCount: 0,
            isOnline: false,
            avatar: null
        }
    ]

    useEffect(() => {
        loadConversations()
    }, [])

    const loadConversations = () => {
        setIsLoading(true)
        
        // Simular carregamento de conversas
        setTimeout(() => {
            setConversations(mockConversations)
            setIsLoading(false)
        }, 1000)
    }

    const handleConversationPress = (conversation) => {
        navigation.navigate('ChatDetail', {
            conversationId: conversation.id,
            participantName: conversation.participantName,
            participantType: conversation.participantType,
            isOnline: conversation.isOnline
        })
    }

    const handleLongPress = (conversation) => {
        Alert.alert(
            'Opções',
            `Conversa com ${conversation.participantName}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Marcar como lida', onPress: () => markAsRead(conversation.id) },
                { text: 'Arquivar', onPress: () => archiveConversation(conversation.id) },
                { text: 'Excluir', style: 'destructive', onPress: () => deleteConversation(conversation.id) }
            ]
        )
    }

    const markAsRead = (conversationId) => {
        setConversations(prev => 
            prev.map(conv => 
                conv.id === conversationId 
                    ? { ...conv, unreadCount: 0 }
                    : conv
            )
        )
    }

    const archiveConversation = (conversationId) => {
        Alert.alert('Sucesso', 'Conversa arquivada com sucesso!')
    }

    const deleteConversation = (conversationId) => {
        Alert.alert(
            'Confirmar',
            'Tem certeza que deseja excluir esta conversa?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Excluir', 
                    style: 'destructive', 
                    onPress: () => {
                        setConversations(prev => prev.filter(conv => conv.id !== conversationId))
                        Alert.alert('Sucesso', 'Conversa excluída!')
                    }
                }
            ]
        )
    }

    const formatTime = (time) => {
        // Se for hoje, mostra só a hora
        if (time.includes(':')) {
            return time
        }
        return time
    }

    const getParticipantIcon = (type) => {
        return type === 'institution' ? 'home' : 'person'
    }

    const renderConversationItem = ({ item }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => handleConversationPress(item)}
            onLongPress={() => handleLongPress(item)}
        >
            <View style={styles.avatarContainer}>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                    <View style={[
                        styles.avatarPlaceholder,
                        { backgroundColor: item.participantType === 'institution' ? Colors.secondary : Colors.primary }
                    ]}>
                        <Ionicons 
                            name={getParticipantIcon(item.participantType)} 
                            size={24} 
                            color={Colors.card} 
                        />
                    </View>
                )}
                {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={[
                        styles.participantName,
                        item.unreadCount > 0 && styles.unreadText
                    ]}>
                        {item.participantName}
                    </Text>
                    <View style={styles.timeContainer}>
                        <Text style={[
                            styles.messageTime,
                            item.unreadCount > 0 && styles.unreadTime
                        ]}>
                            {formatTime(item.lastMessageTime)}
                        </Text>
                        {item.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadCount}>
                                    {item.unreadCount > 9 ? '9+' : item.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.messageContainer}>
                    <Text 
                        style={[
                            styles.lastMessage,
                            item.unreadCount > 0 && styles.unreadMessage
                        ]}
                        numberOfLines={2}
                    >
                        {item.lastMessage}
                    </Text>
                    
                    <View style={styles.participantTypeContainer}>
                        <Ionicons 
                            name={item.participantType === 'institution' ? 'home-outline' : 'person-outline'} 
                            size={12} 
                            color={Colors.textSecondary} 
                        />
                        <Text style={styles.participantTypeText}>
                            {item.participantType === 'institution' ? 'Instituição' : 'Doador'}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
            <Text style={styles.emptyDescription}>
                Quando você começar a interagir com{'\n'}instituições e doadores, suas{'\n'}conversas aparecerão aqui.
            </Text>
            <TouchableOpacity 
                style={styles.startChatButton}
                onPress={() => navigation.navigate('Search')}
            >
                <Ionicons name="search-outline" size={20} color={Colors.card} />
                <Text style={styles.startChatButtonText}>Buscar Instituições</Text>
            </TouchableOpacity>
        </View>
    )

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mensagens</Text>
                    <Text style={styles.headerSubtitle}>Suas conversas</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Carregando conversas...</Text>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mensagens</Text>
                <Text style={styles.headerSubtitle}>
                    {conversations.length > 0 
                        ? `${conversations.length} conversa${conversations.length !== 1 ? 's' : ''}`
                        : 'Suas conversas'
                    }
                </Text>
            </View>

            {/* Conversations List */}
            {conversations.length === 0 ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversationItem}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.conversationsList}
                    showsVerticalScrollIndicator={false}
                    onRefresh={loadConversations}
                    refreshing={isLoading}
                />
            )}

            {/* New Message Button */}
            {conversations.length > 0 && (
                <TouchableOpacity 
                    style={styles.newMessageButton}
                    onPress={() => navigation.navigate('Search')}
                >
                    <Ionicons name="add" size={24} color={Colors.card} />
                </TouchableOpacity>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: Colors.primary,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.card,
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.card,
        opacity: 0.9,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    conversationsList: {
        flex: 1,
    },
    conversationItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: Colors.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.card,
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    participantName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        flex: 1,
    },
    unreadText: {
        fontWeight: 'bold',
    },
    timeContainer: {
        alignItems: 'flex-end',
        gap: 4,
    },
    messageTime: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    unreadTime: {
        color: Colors.primary,
        fontWeight: '600',
    },
    unreadBadge: {
        backgroundColor: Colors.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadCount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.card,
    },
    messageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    lastMessage: {
        fontSize: 14,
        color: Colors.textSecondary,
        flex: 1,
        lineHeight: 18,
    },
    unreadMessage: {
        color: Colors.text,
        fontWeight: '500',
    },
    participantTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        gap: 4,
    },
    participantTypeText: {
        fontSize: 10,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 20,
        marginBottom: 10,
    },
    emptyDescription: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    startChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
    },
    startChatButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.card,
    },
    newMessageButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
})

export default MessagesScreen 