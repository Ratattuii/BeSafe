import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
// Não precisamos mais do Toast, mas se ele estiver importado no seu ambiente, 
// a lógica abaixo irá ignorá-lo e usar o Alert.

const ReviewDonationScreen = ({ route, navigation }) => {
  const { donation } = route.params;
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Erro', 'Por favor, selecione uma nota');
      return;
    }

    setLoading(true);
    try {
      const reviewData = {
        donation_id: donation.id,
        reviewed_id: donation.institution_id,
        rating: rating,
        comment: comment.trim(),
        review_type: 'donor_to_institution'
      };

      const response = await api.post('/reviews', reviewData);
      
      // 🟢 MUDANÇA: REVERTENDO PARA ALERT.ALERT (Com navegação goBack)
      if (response.success) {
        Alert.alert(
          'Sucesso', 
          'Avaliação enviada com sucesso!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Lógica de erro para conflito (409) ou falha de API
        Alert.alert('Erro', response.message || 'Erro ao enviar avaliação');
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      // Lógica de erro de conexão
      Alert.alert('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            accessible={true}
            accessibilityLabel={`Avaliar com ${star} estrela${star > 1 ? 's' : ''}`}
            accessibilityRole="button"
          >
            <Text style={[
              styles.star,
              star <= rating ? styles.starFilled : styles.starEmpty
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#F2F2F2" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avaliar Doação</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações da Doação */}
        <View style={styles.donationCard}>
          <Text style={styles.donationTitle}>Doação realizada</Text>
          <Text style={styles.donationItem}>{donation.need_title}</Text>
          <Text style={styles.donationQuantity}>
            {donation.quantity} {donation.unit}
          </Text>
          <Text style={styles.donationDate}>
            Entregue em: {new Date(donation.delivered_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        {/* Avaliação */}
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Como foi sua experiência?</Text>
          <Text style={styles.reviewSubtitle}>
            Avalie a instituição {donation.institution_name}
          </Text>

          {/* Estrelas */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Nota:</Text>
            {renderStars()}
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {rating} estrela{rating > 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Comentário */}
          <View style={styles.commentContainer}>
            <Text style={styles.commentLabel}>Comentário (opcional)</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Conte como foi sua experiência..."
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessible={true}
              accessibilityLabel="Campo de comentário"
              accessibilityHint="Digite um comentário sobre sua experiência"
            />
          </View>
        </View>

        {/* Botão Enviar */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (rating === 0 || loading) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || loading}
          accessible={true}
          accessibilityLabel={loading ? "Enviando avaliação" : "Enviar avaliação"}
          accessibilityRole="button"
          accessibilityState={{ busy: loading }}
        >
          <Text style={[
            styles.submitButtonText,
            (rating === 0 || loading) && styles.submitButtonTextDisabled
          ]}>
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FF1434',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  placeholder: {
    width: 40,
  },

  content: {
    flex: 1,
    padding: 20,
  },

  // Card da Doação
  donationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  donationItem: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  donationQuantity: {
    fontSize: 16,
    color: '#FF1434',
    fontWeight: '600',
    marginBottom: 8,
  },
  donationDate: {
    fontSize: 14,
    color: '#757575',
  },

  // Card da Avaliação
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  reviewSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 24,
  },

  // Rating
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starButton: {
    padding: 8,
  },
  star: {
    fontSize: 32,
    color: '#E0E0E0',
  },
  starFilled: {
    color: '#FFD700',
  },
  starEmpty: {
    color: '#E0E0E0',
  },
  ratingText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '600',
  },

  // Comentário
  commentContainer: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Botão Enviar
  submitButton: {
    backgroundColor: '#FF1434',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButtonTextDisabled: {
    color: '#757575',
  },
});

export default ReviewDonationScreen;