import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import RatingStars from './RatingStars';

const ReviewCard = ({ 
  review, 
  showDonationInfo = false,
  onPress = null,
  compact = false 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getReviewTypeLabel = (type) => {
    switch (type) {
      case 'donor_to_institution':
        return 'Doador → Instituição';
      case 'institution_to_donor':
        return 'Instituição → Doador';
      case 'delivery_quality':
        return 'Qualidade da Entrega';
      default:
        return 'Avaliação';
    }
  };

  const CardContent = () => (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
          <Text style={styles.reviewType}>{getReviewTypeLabel(review.review_type)}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <RatingStars 
            rating={review.rating} 
            size="small" 
            interactive={false}
            showValue={true}
          />
        </View>
      </View>

      {/* Comentário */}
      {review.comment && (
        <Text style={[styles.comment, compact && styles.compactComment]}>
          {review.comment}
        </Text>
      )}

      {/* Informações da Doação */}
      {showDonationInfo && review.need_title && (
        <View style={styles.donationInfo}>
          <Text style={styles.donationLabel}>Doação:</Text>
          <Text style={styles.donationTitle}>{review.need_title}</Text>
          <Text style={styles.donationQuantity}>
            {review.donation_quantity} {review.donation_unit}
          </Text>
        </View>
      )}

      {/* Data */}
      <Text style={styles.date}>
        {formatDate(review.created_at)}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={() => onPress(review)}
        accessible={true}
        accessibilityLabel={`Avaliação de ${review.reviewer_name} com ${review.rating} estrelas`}
        accessibilityRole="button"
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactContainer: {
    padding: 12,
    marginBottom: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  reviewType: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },

  // Comentário
  comment: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 12,
  },
  compactComment: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },

  // Informações da Doação
  donationInfo: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  donationLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
    marginBottom: 4,
  },
  donationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  donationQuantity: {
    fontSize: 12,
    color: '#FF1434',
    fontWeight: '500',
  },

  // Data
  date: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'right',
  },
});

export default ReviewCard;
