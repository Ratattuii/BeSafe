import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, globalStyles } from '../styles/globalStyles';

// Componente para exibir um card de instituição na lista

const InstitutionCard = ({ institution, onPress }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // --- CORREÇÃO AQUI ---
  // Esta função agora é segura e lida com 'urgency' sendo null ou undefined
  const getUrgencyColor = (urgency) => {
    // Se 'urgency' for null, undefined, ou uma string vazia, retorna uma cor padrão
    if (!urgency) {
      return colors.gray300; // Cor para "sem necessidades" ou "urgência baixa"
    }
    
    // Agora é seguro chamar toLowerCase()
    switch (urgency.toLowerCase()) {
      case 'critica':
        return colors.urgent;
      case 'alta':
        return colors.warning;
      case 'media':
        return colors.success;
      default:
        return colors.gray400; // Cor padrão para 'baixa' ou outros
    }
  };
  // --- FIM DA CORREÇÃO ---

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num || 0;
  };

  const activeNeeds = institution.active_needs_count || 0;

  return (
    <TouchableOpacity
      style={[styles.card, isMobile && styles.cardMobile]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Imagem de Capa */}
      <Image
        source={{ uri: institution.cover_image || 'https://via.placeholder.com/300x100/E0E0E0/BDBDBD?text=Capa' }}
        style={styles.coverImage}
      />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: institution.avatar || 'https://via.placeholder.com/80x80/CCCCCC/FFFFFF?text=Logo' }}
          style={styles.logo}
        />
        {institution.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>
        )}
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{institution.name}</Text>
        <Text style={styles.category}>{institution.institution_type || 'Instituição'}</Text>
        
        {/* Informações de Necessidade */}
        <View style={styles.needsInfo}>
          <View style={[styles.urgencyDot, { 
            // Esta chamada agora é segura
            backgroundColor: getUrgencyColor(institution.highest_urgency) 
          }]} />
          <Text style={styles.needsText}>
            {activeNeeds > 0 
              ? `${activeNeeds} necessidade${activeNeeds > 1 ? 's' : ''} ativa${activeNeeds > 1 ? 's' : ''}`
              : 'Nenhuma necessidade ativa'
            }
          </Text>
        </View>
        
        {/* Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>{formatNumber(institution.followers_count)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText} numberOfLines={1}>
              {institution.address ? institution.address.split(',')[1] || institution.address : 'Não informado'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardMobile: {
    // Estilos específicos para mobile, se houver
  },
  coverImage: {
    width: '100%',
    height: 100,
    backgroundColor: colors.gray100,
  },
  logoContainer: {
    marginTop: -40,
    marginLeft: 16,
    position: 'relative',
    width: 80,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: colors.gray200,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 2,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  needsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  urgencyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  needsText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 1, // Para o texto de localização não quebrar o layout
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});

export default InstitutionCard;