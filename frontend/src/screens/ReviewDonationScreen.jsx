// screens/ReviewDonationScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ReviewDonationScreen = () => {
  const route = useRoute();
  const { donation } = route.params || {};
  const navigation = useNavigation();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para o modal customizado
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info'); // 'info', 'success', 'error'

  const safeDonation = donation || {};
  const needTitle = safeDonation.need_title || safeDonation.title || 'Doação não especificada';
  const quantity = safeDonation.quantity || 'N/A';
  const unit = safeDonation.unit || 'unidades';
  const institutionName = safeDonation.institution_name || 'Instituição não especificada';
  const deliveredAt = safeDonation.delivered_at || safeDonation.updated_at || new Date().toISOString();
  const donationId = safeDonation.id;
  const institutionId = safeDonation.institution_id || safeDonation.accepted_by || 1;

  // Função para mostrar modal
  const showCustomAlert = (title, message, type = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  // Função para fechar modal e opcionalmente navegar
  const closeModal = (shouldNavigateBack = false) => {
    setShowModal(false);
    if (shouldNavigateBack) {
      navigation.goBack();
    }
  };

  React.useEffect(() => {
    if (!donation) {
      showCustomAlert('Erro', 'Dados da doação não encontrados.', 'error');
    }
  }, [donation, navigation]);

  const handleSubmit = async () => {
    if (rating === 0) {
      showCustomAlert('Atenção', 'Por favor, selecione uma nota', 'info');
      return;
    }

    if (!donationId) {
      showCustomAlert('Erro', 'ID da doação não encontrado.', 'error');
      return;
    }

    if (!institutionId) {
      showCustomAlert('Erro', 'ID da instituição não encontrado.', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const reviewData = {
        donation_id: donationId,
        reviewed_id: institutionId,
        rating: rating,
        comment: comment.trim(),
        review_type: 'donor_to_institution'
      };

      const response = await api.post('/reviews', reviewData);

      if (response.success) {
        showCustomAlert('Sucesso!', 'Avaliação enviada com sucesso!', 'success');
      } else {
        showCustomAlert('Erro', response.message || 'Erro ao enviar avaliação', 'error');
      }

    } catch (error) {
      showCustomAlert('Erro', 'Erro de conexão. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStarPress = (star) => {
    setRating(star);
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
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

  const getModalStyles = () => {
    switch (modalType) {
      case 'success':
        return {
          headerColor: '#4CAF50',
          buttonColor: '#4CAF50'
        };
      case 'error':
        return {
          headerColor: '#F44336',
          buttonColor: '#F44336'
        };
      default:
        return {
          headerColor: '#2196F3',
          buttonColor: '#2196F3'
        };
    }
  };

  const modalStyles = getModalStyles();

  if (!donation) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#F2F2F2" />
        
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avaliar Doação</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Dados não encontrados</Text>
          <Text style={styles.errorDescription}>
            Não foi possível carregar as informações da doação.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.donationItem}>{needTitle}</Text>
          <Text style={styles.donationQuantity}>
            {quantity} {unit}
          </Text>
          <Text style={styles.donationDate}>
            Entregue em: {new Date(deliveredAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        {/* Avaliação */}
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Como foi sua experiência?</Text>
          <Text style={styles.reviewSubtitle}>
            Avalie a instituição {institutionName}
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
          accessibilityState={{ disabled: rating === 0 || loading, busy: loading }}
        >
          <Text style={[
            styles.submitButtonText,
            (rating === 0 || loading) && styles.submitButtonTextDisabled
          ]}>
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Customizado */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: modalStyles.headerColor }]}>
              <Text style={styles.modalHeaderText}>{modalTitle}</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: modalStyles.buttonColor }]}
                onPress={() => closeModal(modalType === 'success')}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF1434',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
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
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalMessage: {
    fontSize: 16,
    color: '#212121',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewDonationScreen;