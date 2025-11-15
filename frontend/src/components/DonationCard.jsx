import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';

// Card para a aba "Histórico" (baseado na imagem d072e7.png)
// O componente agora aceita o prop 'isReviewed'
const DonationCard = ({ donation, onPress, onReview, isReviewed }) => {

  const getStatusStyle = (status) => {
    switch (status) {
      case 'entregue':
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
      default:
        return {
          container: styles.statusDefault,
          text: styles.statusTextDefault,
          label: status,
          icon: 'alert-circle-outline'
        };
    }
  };

  const statusStyle = getStatusStyle(donation.status);
  const deliveredDate = donation.delivered_at || donation.created_at;

  return (
    <View style={styles.card}>
      {/* Cabeçalho do Card */}
      <View style={styles.header}>
        <View style={[styles.statusBadge, statusStyle.container]}>
          <Ionicons name={statusStyle.icon} size={14} color={statusStyle.text.color} />
          <Text style={[styles.statusText, statusStyle.text]}>{statusStyle.label}</Text>
        </View>
        <Text style={styles.date}>
          {new Date(deliveredDate).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      {/* Conteúdo principal */}
      <TouchableOpacity style={styles.content} onPress={onPress}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{donation.need_title}</Text>
          <Text style={styles.institution} numberOfLines={1}>
            para {donation.institution_name}
          </Text>
          <Text style={styles.quantity} numberOfLines={1}>
            Você doou: {donation.quantity} {donation.unit}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Footer (Apenas se a doação foi entregue) */}
      {donation.status === 'entregue' && (
        <View style={styles.footer}>
          {isReviewed ? (
            <Text style={styles.reviewedText}>
              <Ionicons name="checkmark-circle" size={16} color={colors.successDark} /> Avaliação Concluída
            </Text>
          ) : (
            <TouchableOpacity style={styles.reviewButton} onPress={onReview}>
              <Text style={styles.reviewButtonText}>Avaliar Doação</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.gray100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusDelivered: { backgroundColor: colors.successLight },
  statusTextDelivered: { color: colors.successDark },
  statusPending: { backgroundColor: colors.warningLight },
  statusTextPending: { color: colors.warningDark },
  statusConfirmed: { backgroundColor: colors.infoLight },
  statusTextConfirmed: { color: colors.infoDark },
  statusDefault: { backgroundColor: colors.gray200 },
  statusTextDefault: { color: colors.textSecondary },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  institution: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quantity: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    padding: 12,
    alignItems: 'center',
  },
  reviewButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  // 👇 NOVO ESTILO 👇
  reviewedText: {
    color: colors.successDark,
    fontWeight: '600',
    fontSize: 14,
    paddingVertical: 8,
  }

});

export default DonationCard;