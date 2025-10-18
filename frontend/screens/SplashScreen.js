import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { Colors } from '../AppNavigator'

const SplashScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.logo}>BeSafe</Text>
                <Text style={styles.tagline}>Conectando pessoas através da solidariedade</Text>
                
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.secondary} />
                    <Text style={styles.loadingText}>Carregando...</Text>
                </View>
            </View>
            
            <Text style={styles.footer}>Versão 1.0.0</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2E8B57',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    tagline: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.9,
        textAlign: 'center',
        marginBottom: 50,
    },
    loadingContainer: {
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#FFFFFF',
        marginTop: 15,
        opacity: 0.8,
    },
    footer: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.6,
        marginBottom: 30,
    },
})

export default SplashScreen 