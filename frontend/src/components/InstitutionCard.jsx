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

const InstitutionCard = ({ institution, onDonate, onFollow }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;

  const getUrgencyColor = (urgency) => {
    switch (urgency.toLowerCase()) {
      case 'urgente':
        return colors.urgent;
      case 'alta':
        return colors.warning;
      case 'média':
      case 'media':
        return colors.success;
      default:
        return colors.gray500;
    }
  };

  const handleDonate = () => {
    onDonate?.(institution);
  };

  const handleCardPress = () => {
    // TODO: Navegar para detalhes da instituição
    console.log('Abrir detalhes da instituição:', institution.name);
  };

  return (
    <TouchableOpacity
      style={[styles.card, isDesktop && styles.cardDesktop]}
      onPress={handleCardPress}
      activeOpacity={0.95}
    >
      <View style={styles.cardContent}>
        {/* Logo da instituição */}
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: institution.logo }}
            style={styles.logo}
            defaultSource={{ uri: 'https://via.placeholder.com/60x60/cccccc/white?text=?' }}
          />
        </View>

        {/* Informações da instituição */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {institution.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {institution.description}
          </Text>
          
          {/* Tag de urgência */}
          <View style={[
            styles.urgencyTag,
            { backgroundColor: getUrgencyColor(institution.urgency) }
          ]}>
            <Text style={styles.urgencyText}>
              {institution.urgency}
            </Text>
          </View>
        </View>

        {/* Botão de doar */}
        <TouchableOpacity
          style={styles.donateButton}
          onPress={handleDonate}
        >
          <Text style={styles.donateButtonText}>Doar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.tertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  cardDesktop: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Logo
  logoContainer: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },

  // Informações
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },

  // Tag de urgência
  urgencyTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },

  // Botão de doar
  donateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  donateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
});

export default InstitutionCard;
