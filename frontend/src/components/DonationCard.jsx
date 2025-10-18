import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../styles/globalStyles';

const DonationCard = ({ donation, onPress }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;

  const formatDate = (dateString) => {
    // Formata data para padrão brasileiro
    return dateString; // Por enquanto retorna como está
  };

  const handlePress = () => {
    onPress?.(donation);
    // TODO: Navegar para detalhes da doação ou expandir informações
  };

  return (
    <TouchableOpacity
      style={[styles.card, isDesktop && styles.cardDesktop]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Informações da doação */}
        <View style={styles.donationInfo}>
          <Text style={styles.donationTitle}>{donation.title}</Text>
          <Text style={styles.donationDescription}>
            {donation.description}
          </Text>
          {donation.amount && (
            <Text style={styles.donationAmount}>
              Quantidade: {donation.amount}
            </Text>
          )}
        </View>

        {/* Imagem da doação */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: donation.image }}
            style={styles.donationImage}
            defaultSource={{ uri: 'https://via.placeholder.com/60x60/cccccc/white?text=?' }}
          />
        </View>
      </View>

      {/* Data no canto inferior */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>
          Recebido em {formatDate(donation.date)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.tertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  cardDesktop: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  // Informações da doação
  donationInfo: {
    flex: 1,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  donationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  donationAmount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Imagem
  imageContainer: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  donationImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.secondary,
  },

  // Data
  dateContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default DonationCard;
