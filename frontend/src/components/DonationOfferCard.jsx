import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';

const DonationOfferCard = ({ offer, onDetails, onEdit }) => {

  const getStatusStyle = (status) => {
    switch (status) {
      case 'available':
        return {
          container: styles.statusAvailable,
          text: styles.statusTextAvailable,
          label: 'Disponível',
        };
      case 'donated':
        return {
          container: styles.statusDonated,
          text: styles.statusTextDonated,
          label: 'Doado',
        };
      default:
        return {
          container: styles.statusDefault,
          text: styles.statusTextDefault,
          label: status,
        };
    }
  };

  const statusStyle = getStatusStyle(offer.status);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, statusStyle.container]}>
          <Text style={[styles.statusText, statusStyle.text]}>{statusStyle.label}</Text>
        </View>
        <Text style={styles.date}>
          Publicado em {new Date(offer.created_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Usando um ícone genérico, já que a 'donation_offers' não tem imagem ainda */}
        <Image 
          source={{ uri: 'https://via.placeholder.com/60x60/FFDDAA/888888?text=Item' }} 
          style={styles.donationImage} 
        />
        <View style={styles.info}>
          <Text style={styles.title}>{offer.title}</Text>
          <Text style={styles.quantity} numberOfLines={1}>
            {offer.quantity} | {offer.category} | {offer.conditions}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.buttonOutline} onPress={onDetails}>
          <Ionicons name="eye-outline" size={16} color={colors.primary} />
          <Text style={styles.buttonOutlineText}>Ver Detalhes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonOutline} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.buttonOutlineText}>Editar</Text>
        </TouchableOpacity>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  statusDonated: {
    backgroundColor: colors.gray200,
  },
  statusTextDonated: {
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
    alignItems: 'center',
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
  quantity: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  buttonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  buttonOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default DonationOfferCard;