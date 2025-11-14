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

const NeedCard = ({ need, onPress }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;

  // --- CORREÇÃO AQUI ---
  // Define um objeto 'stats' padrão para evitar o crash
  // Se 'need.stats' não existir, ele usará este objeto com zeros.
  const stats = need.stats || { likes: 0, comments: 0, shares: 0 };
  // --- FIM DA CORREÇÃO ---

  const formatTimestamp = (timestamp) => {
    // Simples formatação de data/hora
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgente':
        return colors.urgent;
      case 'alta':
        return colors.warning;
      case 'media':
        return colors.success;
      default:
        return colors.gray500;
    }
  };

  const formatStats = (number) => {
    if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}k`;
    }
    // Garante que 'number' não seja nulo ou indefinido antes de 'toString'
    return (number || 0).toString();
  };

  return (
    <TouchableOpacity
      style={[styles.card, isDesktop && styles.cardDesktop]}
      onPress={onPress}
      activeOpacity={0.9}
      accessible={true}
      accessibilityLabel={`Necessidade: ${need.description}. Instituição: ${need.institution.name}. Urgência: ${need.urgency}`}
      accessibilityHint="Toque para ver detalhes da necessidade e como ajudar"
      accessibilityRole="button"
    >
      {/* Cabeçalho com info da instituição */}
      <View style={styles.header}>
        <View style={styles.institutionInfo}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: need.institution.logo }}
              style={styles.institutionLogo}
              defaultSource={{ uri: 'https://via.placeholder.com/40x40/cccccc/white?text=?' }}
              accessible={true}
              accessibilityLabel={`Logo da instituição ${need.institution.name}`}
            />
            {need.institution.isActive && <View style={styles.activeIndicator} />}
          </View>
          <View style={styles.institutionDetails}>
            <Text style={styles.institutionName} numberOfLines={1}>
              {need.institution.name}
            </Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(need.timestamp)}
            </Text>
          </View>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(need.urgency) }]}>
          <Text style={styles.urgencyText}>
            {need.urgency.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Descrição */}
      <Text style={styles.description} numberOfLines={3}>
        {need.description}
      </Text>

      {/* Imagem principal */}
      <Image
        source={{ uri: need.image }}
        style={[styles.needImage, isDesktop && styles.needImageDesktop]}
        defaultSource={{ uri: 'https://via.placeholder.com/350x200/cccccc/white?text=Carregando...' }}
        accessible={true}
        accessibilityLabel="Imagem da necessidade"
        accessibilityHint="Imagem relacionada à necessidade descrita"
      />

      {/* Footer com estatísticas */}
      <View style={styles.footer}>
        <View style={styles.stats}>
          <TouchableOpacity 
            style={styles.statButton}
            accessible={true}
            accessibilityLabel={`${formatStats(stats.likes)} curtidas`}
            accessibilityRole="button"
          >
            <Text style={styles.statIcon}>♥</Text>
            {/* CORREÇÃO AQUI: usa 'stats.likes' em vez de 'need.stats.likes' */}
            <Text style={styles.statText}>{formatStats(stats.likes)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statButton}
            accessible={true}
            accessibilityLabel={`${formatStats(stats.comments)} comentários`}
            accessibilityRole="button"
          >
            <Text style={styles.statIcon}>💬</Text>
            {/* CORREÇÃO AQUI: usa 'stats.comments' */}
            <Text style={styles.statText}>{formatStats(stats.comments)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statButton}
            accessible={true}
            accessibilityLabel={`${formatStats(stats.shares)} compartilhamentos`}
            accessibilityRole="button"
          >
            <Text style={styles.statIcon}>↗</Text>
            {/* CORREÇÃO AQUI: usa 'stats.shares' */}
            <Text style={styles.statText}>{formatStats(stats.shares)}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.actionButton}
          accessible={true}
          accessibilityLabel="Botão para ajudar com esta necessidade"
          accessibilityHint="Toque para oferecer ajuda ou fazer uma doação"
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>Ajudar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden', // Para a imagem ficar bonita
  },
  cardDesktop: {
    borderRadius: 16,
    marginBottom: 0,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  // Cabeçalho
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 16,
    paddingBottom: 12,
  },
  institutionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  institutionLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  institutionDetails: {
    flex: 1,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },

  // Descrição
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
  },

  // Imagem
  needImage: {
    width: '100%',
    height: 240,
    backgroundColor: colors.secondary,
    marginBottom: 0,
  },
  needImageDesktop: {
    height: 280,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
});

export default NeedCard;