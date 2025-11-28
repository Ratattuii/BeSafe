// components/DonationCard.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';

// Card para a aba "Histórico"
const DonationCard = ({ donation, onPress, onReview, isReviewed }) => {

  const getStatusStyle = (status) => {
    switch (status) {
      case 'donated':
      case 'entregue':
      case 'concluido':
      case 'doado':
        return {
          container: styles.statusDelivered,
          text: styles.statusTextDelivered,
          label: 'Entregue',
          icon: 'checkmark-circle'
        };
      case 'pendente':
        return {
          container: styles.statusPending,
          text: styles.statusTextPending,
          label: 'Pendente',
          icon: 'time-outline'
        };
      case 'confirmada':
         return {
          container: styles.statusConfirmed,
          text: styles.statusTextConfirmed,
          label: 'Confirmada',
          icon: 'calendar-outline'
        };
      case 'available':
      case 'disponivel':
        return {
          container: styles.statusAvailable,
          text: styles.statusTextAvailable,
          label: 'Disponível',
          icon: 'cube-outline'
        };
      default:
        return {
          container: styles.statusDefault,
          text: styles.statusTextDefault,
          label: status,
          icon: 'alert-circle-outline'
        };
    }
  };

  // Função para obter ícone baseado na categoria
  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'alimentos': 'fast-food-outline',
      'roupas': 'shirt-outline',
      'brinquedos': 'game-controller-outline',
      'moveis': 'bed-outline',
      'eletronicos': 'hardware-chip-outline',
      'livros': 'book-outline',
      'higiene': 'sparkles-outline',
      'outros': 'cube-outline'
    };
    
    return categoryIcons[category?.toLowerCase()] || 'cube-outline';
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Verificar se é uma doação finalizada (para mostrar botão de avaliar)
  const isCompletedDonation = (status) => {
    return status === 'donated' || status === 'entregue' || status === 'concluido' || status === 'doado';
  };

  const statusStyle = getStatusStyle(donation.status);
  const deliveredDate = donation.updated_at || donation.created_at;
  const categoryIcon = getCategoryIcon(donation.category);
  const shouldShowReviewButton = isCompletedDonation(donation.status) && !isReviewed;

  return (
    <View style={styles.card}>
      {/* Cabeçalho do Card */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.categoryIcon}>
            <Ionicons name={categoryIcon} size={16} color={colors.primary} />
          </View>
          <View style={[styles.statusBadge, statusStyle.container]}>
            <Ionicons name={statusStyle.icon} size={12} color={statusStyle.text.color} />
            <Text style={[styles.statusText, statusStyle.text]}>{statusStyle.label}</Text>
          </View>
        </View>
        <Text style={styles.date}>
          {formatDate(deliveredDate)}
        </Text>
      </View>

      {/* Conteúdo principal */}
      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {donation.title || 'Doação sem título'}
          </Text>
          
          {donation.institution_name && (
            <Text style={styles.institution} numberOfLines={1}>
              para {donation.institution_name}
            </Text>
          )}
          
          <View style={styles.detailsRow}>
            {donation.quantity && (
              <View style={styles.detailItem}>
                <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>
                  {donation.quantity} {donation.unit || 'un'}
                </Text>
              </View>
            )}
            
            {donation.category && (
              <View style={styles.detailItem}>
                <Ionicons name="pricetag-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>{donation.category}</Text>
              </View>
            )}
          </View>

          {donation.description && (
            <Text style={styles.description} numberOfLines={2}>
              {donation.description}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Footer - Botão de Avaliar (apenas para doações finalizadas e não avaliadas) */}
      {shouldShowReviewButton ? (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.reviewButton} 
            onPress={onReview}
            activeOpacity={0.8}
          >
            <Ionicons name="star-outline" size={16} color={colors.white} />
            <Text style={styles.reviewButtonText}>Avaliar Doação</Text>
          </TouchableOpacity>
        </View>
      ) : isCompletedDonation(donation.status) && isReviewed ? (
        <View style={styles.footer}>
          <View style={styles.reviewedContainer}>
            <Ionicons name="checkmark-circle" size={18} color={colors.successDark} />
            <Text style={styles.reviewedText}>Avaliação Concluída</Text>
          </View>
        </View>
      ) : (
        // Footer informativo para outras situações
        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            {donation.status === 'pendente' && 'Aguardando confirmação da instituição'}
            {donation.status === 'confirmada' && 'Doação confirmada - Aguardando entrega'}
            {donation.status === 'available' && 'Doação disponível para instituições'}
            {donation.status === 'disponivel' && 'Doação disponível para instituições'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.gray50,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusDelivered: { backgroundColor: colors.successLight },
  statusTextDelivered: { color: colors.successDark },
  statusPending: { backgroundColor: colors.warningLight },
  statusTextPending: { color: colors.warningDark },
  statusConfirmed: { backgroundColor: colors.infoLight },
  statusTextConfirmed: { color: colors.infoDark },
  statusAvailable: { backgroundColor: colors.primaryLight },
  statusTextAvailable: { color: colors.primary },
  statusDefault: { backgroundColor: colors.gray200 },
  statusTextDefault: { color: colors.textSecondary },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    lineHeight: 20,
  },
  institution: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    padding: 12,
    alignItems: 'center',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  reviewButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  reviewedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewedText: {
    color: colors.successDark,
    fontWeight: '600',
    fontSize: 14,
  },
  footerNote: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  }
});

export default DonationCard;