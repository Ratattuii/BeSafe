import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { Colors } from '../AppNavigator'

const SearchScreen = () => {
    const navigation = useNavigation()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('all')
    const [searchResults, setSearchResults] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    // Dados mockados para demonstração
    const mockData = {
        institutions: [
            {
                id: 1,
                name: 'Lar São Vicente',
                description: 'Lar para idosos em situação de vulnerabilidade',
                type: 'institution',
                needs: ['Cestas básicas', 'Medicamentos', 'Fraldas geriátricas'],
                urgency: 'alta',
                location: 'São Paulo, SP'
            },
            {
                id: 2,
                name: 'Casa da Esperança',
                description: 'Abrigo para crianças e adolescentes',
                type: 'institution',
                needs: ['Roupas infantis', 'Materiais escolares', 'Brinquedos'],
                urgency: 'media',
                location: 'Rio de Janeiro, RJ'
            }
        ],
        needs: [
            {
                id: 1,
                item: 'Cestas Básicas',
                institution: 'Lar São Vicente',
                quantity: '100 unidades',
                urgency: 'urgente',
                description: 'Cestas básicas para alimentar 50 famílias por 2 semanas',
                type: 'need'
            },
            {
                id: 2,
                item: 'Roupas de Inverno',
                institution: 'Casa da Esperança',
                quantity: '200 peças',
                urgency: 'alta',
                description: 'Roupas de inverno para crianças de 2 a 16 anos',
                type: 'need'
            }
        ],
        donations: [
            {
                id: 1,
                item: 'Medicamentos para Diabetes',
                donor: 'João Silva',
                quantity: '50 caixas',
                status: 'disponivel',
                type: 'donation'
            }
        ]
    }

    const filters = [
        { key: 'all', label: 'Tudo', icon: 'grid-outline' },
        { key: 'institutions', label: 'Instituições', icon: 'home-outline' },
        { key: 'needs', label: 'Necessidades', icon: 'help-circle-outline' },
        { key: 'donations', label: 'Doações', icon: 'heart-outline' }
    ]

    useEffect(() => {
        if (searchQuery.trim()) {
            handleSearch()
        } else {
            setSearchResults([])
        }
    }, [searchQuery, activeFilter])

    const handleSearch = () => {
        setIsLoading(true)
        
        // Simular busca
        setTimeout(() => {
            let results = []
            
            if (activeFilter === 'all' || activeFilter === 'institutions') {
                const filteredInstitutions = mockData.institutions.filter(institution =>
                    institution.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    institution.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                results = [...results, ...filteredInstitutions]
            }
            
            if (activeFilter === 'all' || activeFilter === 'needs') {
                const filteredNeeds = mockData.needs.filter(need =>
                    need.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    need.institution.toLowerCase().includes(searchQuery.toLowerCase())
                )
                results = [...results, ...filteredNeeds]
            }
            
            if (activeFilter === 'all' || activeFilter === 'donations') {
                const filteredDonations = mockData.donations.filter(donation =>
                    donation.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    donation.donor.toLowerCase().includes(searchQuery.toLowerCase())
                )
                results = [...results, ...filteredDonations]
            }
            
            setSearchResults(results)
            setIsLoading(false)
        }, 500)
    }

    const getUrgencyColor = (urgency) => {
        switch (urgency?.toLowerCase()) {
            case 'urgente':
                return Colors.error
            case 'alta':
                return Colors.warning
            case 'media':
                return Colors.primary
            case 'baixa':
                return Colors.success
            default:
                return Colors.textSecondary
        }
    }

    const handleItemPress = (item) => {
        if (item.type === 'institution') {
            navigation.navigate('InstitutionProfile', { institutionId: item.id })
        } else if (item.type === 'need') {
            Alert.alert(
                'Necessidade',
                `${item.item} - ${item.institution}\n\n${item.description}`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Quero Ajudar', onPress: () => navigation.navigate('Donations') }
                ]
            )
        } else if (item.type === 'donation') {
            Alert.alert(
                'Doação Disponível',
                `${item.item}\nDoador: ${item.donor}\nQuantidade: ${item.quantity}`,
                [
                    { text: 'Fechar', style: 'cancel' },
                    { text: 'Contatar', onPress: () => navigation.navigate('Messages') }
                ]
            )
        }
    }

    const renderSearchResult = ({ item }) => (
        <TouchableOpacity style={styles.resultCard} onPress={() => handleItemPress(item)}>
            <View style={styles.resultHeader}>
                <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>
                        {item.name || item.item}
                    </Text>
                    <Text style={styles.resultSubtitle}>
                        {item.type === 'institution' && item.description}
                        {item.type === 'need' && `${item.institution} • ${item.quantity}`}
                        {item.type === 'donation' && `Por: ${item.donor} • ${item.quantity}`}
                    </Text>
                </View>
                
                <View style={styles.resultMeta}>
                    <Ionicons 
                        name={
                            item.type === 'institution' ? 'home' :
                            item.type === 'need' ? 'help-circle' : 'heart'
                        } 
                        size={20} 
                        color={Colors.primary} 
                    />
                    {item.urgency && (
                        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
                            <Text style={styles.urgencyText}>{item.urgency}</Text>
                        </View>
                    )}
                </View>
            </View>
            
            {item.type === 'need' && (
                <Text style={styles.resultDescription} numberOfLines={2}>
                    {item.description}
                </Text>
            )}
            
            {item.type === 'institution' && item.needs && (
                <View style={styles.needsList}>
                    <Text style={styles.needsTitle}>Principais necessidades:</Text>
                    <View style={styles.needsTags}>
                        {item.needs.slice(0, 3).map((need, index) => (
                            <View key={index} style={styles.needTag}>
                                <Text style={styles.needTagText}>{need}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
            
            {item.location && (
                <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.locationText}>{item.location}</Text>
                </View>
            )}
        </TouchableOpacity>
    )

    const renderFilter = (filter) => (
        <TouchableOpacity
            key={filter.key}
            style={[
                styles.filterButton,
                activeFilter === filter.key && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter(filter.key)}
        >
            <Ionicons 
                name={filter.icon} 
                size={20} 
                color={activeFilter === filter.key ? Colors.card : Colors.primary} 
            />
            <Text style={[
                styles.filterButtonText,
                activeFilter === filter.key && styles.filterButtonTextActive
            ]}>
                {filter.label}
            </Text>
        </TouchableOpacity>
    )

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Buscar</Text>
                <Text style={styles.headerSubtitle}>Encontre instituições e necessidades</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar instituições, necessidades..."
                    placeholderTextColor={Colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filters */}
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
            >
                {filters.map(renderFilter)}
            </ScrollView>

            {/* Results */}
            <View style={styles.resultsContainer}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Buscando...</Text>
                    </View>
                ) : searchQuery.trim() === '' ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search-outline" size={64} color={Colors.textSecondary} />
                        <Text style={styles.emptyTitle}>Comece a buscar</Text>
                        <Text style={styles.emptyDescription}>
                            Digite algo para encontrar instituições,{'\n'}necessidades ou doações disponíveis
                        </Text>
                    </View>
                ) : searchResults.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="sad-outline" size={64} color={Colors.textSecondary} />
                        <Text style={styles.emptyTitle}>Nenhum resultado</Text>
                        <Text style={styles.emptyDescription}>
                            Tente buscar com outros termos{'\n'}ou verifique os filtros selecionados
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={searchResults}
                        renderItem={renderSearchResult}
                        keyExtractor={(item) => `${item.type}-${item.id}`}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.resultsList}
                    />
                )}
            </View>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        marginHorizontal: 20,
        marginTop: -10,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        height: 50,
        marginLeft: 10,
        fontSize: 16,
        color: Colors.text,
    },
    filtersContainer: {
        marginBottom: 15,
    },
    filtersContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    filterButtonActive: {
        backgroundColor: Colors.primary,
    },
    filterButtonText: {
        marginLeft: 5,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    filterButtonTextActive: {
        color: Colors.card,
    },
    resultsContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
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
    },
    resultsList: {
        paddingHorizontal: 20,
    },
    resultCard: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    resultInfo: {
        flex: 1,
        marginRight: 10,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    resultSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    resultMeta: {
        alignItems: 'center',
        gap: 8,
    },
    urgencyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    urgencyText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.card,
    },
    resultDescription: {
        fontSize: 14,
        color: Colors.text,
        marginTop: 5,
        lineHeight: 20,
    },
    needsList: {
        marginTop: 10,
    },
    needsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    needsTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    needTag: {
        backgroundColor: Colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    needTagText: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '500',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    locationText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
})

export default SearchScreen 