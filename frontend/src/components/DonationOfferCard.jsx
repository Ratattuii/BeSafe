// components/DonationOfferCard.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';

const DonationOfferCard = ({ offer, onDetails, onEdit, onViewDonorProfile }) => {

  const getStatusStyle = (status) => {
    switch (status) {
      case 'available':
      case 'disponivel':
        return {
          container: styles.statusAvailable,
          text: styles.statusTextAvailable,
          label: 'Disponível',
        };
      case 'accepted':
      case 'aceita':
        return {
          container: styles.statusAccepted,
          text: styles.statusTextAccepted,
          label: 'Aceita',
        };
      case 'rejected':
      case 'rejeitada':
        return {
          container: styles.statusRejected,
          text: styles.statusTextRejected,
          label: 'Rejeitada',
        };
      case 'completed':
      case 'concluida':
        return {
          container: styles.statusCompleted,
          text: styles.statusTextCompleted,
          label: 'Concluída',
        };
      default:
        return {
          container: styles.statusDefault,
          text: styles.statusTextDefault,
          label: status || 'Disponível',
        };
    }
  };

  const statusStyle = getStatusStyle(offer.status);

  // Função para lidar com aceitação de oferta
  const handleAccept = () => {
    Alert.alert(
      'Aceitar Oferta',
      `Você deseja aceitar a oferta "${offer.title}" e iniciar um chat com o doador?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceitar e Conversar', onPress: onEdit }
      ]
    );
  };

  // Função para lidar com clique no botão do doador
  const handleDonorPress = () => {
    console.log('DEBUG: Botão do doador pressionado');
    if (onViewDonorProfile) {
      onViewDonorProfile(offer);
    } else {
      console.warn('DEBUG: onViewDonorProfile não está definido');
      Alert.alert('Info', 'Função de visualizar perfil não disponível');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, statusStyle.container]}>
          <Text style={[styles.statusText, statusStyle.text]}>{statusStyle.label}</Text>
        </View>
        <Text style={styles.date}>
          {offer.created_at ? `Publicado em ${new Date(offer.created_at).toLocaleDateString('pt-BR')}` : 'Data não disponível'}
        </Text>
      </View>

      <View style={styles.content}>
        <Image 
          source={{ 
            uri: offer.image || offer.photo_url || 'https://via.placeholder.com/60x60/4A90E2/FFFFFF?text=Doação'
          }} 
          style={styles.donationImage} 
        />
        <View style={styles.info}>
          <Text style={styles.title}>{offer.title || 'Oferta sem título'}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {offer.description || 'Sem descrição disponível'}
          </Text>
          
          {/* Botão para ver perfil do doador */}
          <TouchableOpacity 
            style={styles.donorButton}
            onPress={handleDonorPress}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={14} color={colors.primary} />
            <Text style={styles.donorButtonText}>
              👤 {offer.donor_name || 'Doador Anônimo'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
          </TouchableOpacity>
          
          <Text style={styles.quantity}>
            {offer.quantity || 1} unidade(s) • {offer.category || 'Geral'} • {offer.conditions || 'Boa condição'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {/* ❌ BOTÃO "VER DETALHES" REMOVIDO */}
        
        {(offer.status === 'available' || offer.status === 'disponivel') && (
          <TouchableOpacity style={styles.buttonPrimary} onPress={handleAccept}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.white} />
            <Text style={styles.buttonPrimaryText}>Aceitar e Conversar</Text>
          </TouchableOpacity>
        )}
        
        {(offer.status === 'accepted' || offer.status === 'aceita') && (
          <TouchableOpacity style={styles.buttonSecondary} onPress={onDetails}>
            <Ionicons name="chatbubble" size={16} color={colors.white} />
            <Text style={styles.buttonSecondaryText}>Continuar Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.gray100,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusAvailable: {
    backgroundColor: colors.successLight,
  },
  statusTextAvailable: {
    color: colors.successDark,
  },
  statusAccepted: {
    backgroundColor: colors.primaryLight,
  },
  statusTextAccepted: {
    color: colors.primaryDark,
  },
  statusRejected: {
    backgroundColor: colors.errorLight,
  },
  statusTextRejected: {
    color: colors.errorDark,
  },
  statusCompleted: {
    backgroundColor: colors.gray200,
  },
  statusTextCompleted: {
    color: colors.textSecondary,
  },
  statusDefault: {
    backgroundColor: colors.gray200,
  },
  statusTextDefault: {
    color: colors.textSecondary,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  donationImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  donorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 4,
  },
  donorButtonText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    marginRight: 4,
    fontWeight: '500',
  },
  quantity: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  // ❌ ESTILOS DO BOTÃO "VER DETALHES" REMOVIDOS
  buttonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  buttonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    backgroundColor: colors.success,
  },
  buttonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});

export default DonationOfferCard;