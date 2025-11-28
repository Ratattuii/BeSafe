// components/DonationOfferCard.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const DonationOfferCard = ({ 
  offer, 
  onAccept, // Para instituição (Home)
  onEdit,   // Para doador (Perfil)
  onFinalize,
  onViewDonorProfile,
  isInstitutionView = false
}) => {
  const navigation = useNavigation();

  if (!offer) {
    return (
      <View style={styles.container}>
        <Text>Oferta não disponível</Text>
      </View>
    );
  }

  const handleAcceptPress = () => {
    if (onAccept) {
      onAccept(offer);
    }
  };

  const handleEditPress = () => {
    if (onEdit) {
      onEdit(offer);
    }
  };

  const handleFinalizePress = () => {
    if (onFinalize) {
      onFinalize(offer);
    }
  };

  // Navegar para perfil público do doador
  const handleDonorProfilePress = () => {
    console.log('DEBUG: Navegando para perfil do doador:', {
      donor_id: offer.donor_id,
      donor_name: offer.donor_name
    });

    if (!offer.donor_id && !offer.user_id) {
      console.log('DEBUG: IDs do doador não disponíveis');
      return;
    }

    const donorId = offer.donor_id || offer.user_id;
    const donorName = offer.donor_name || 'Doador';

    // Navegar para o perfil público do doador
    navigation.navigate('PublicDonorProfile', { 
      userId: donorId,
      userName: donorName
    });
  };

  const offerTitle = offer.title || 'Oferta sem título';
  const offerDescription = offer.description || 'Sem descrição disponível';
  const offerQuantity = offer.quantity || 'Não especificada';
  const offerCategory = offer.category || 'Geral';
  const offerConditions = offer.conditions || 'Não especificada';
  const offerLocation = offer.location || 'Não informada';
  const donorName = offer.donor_name || 'Anônimo';
  const donorAvatar = offer.donor_avatar || `https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=${donorName.charAt(0)}`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'reserved': return '#FF9800';
      case 'completed': return '#757575';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'reserved': return 'Reservada';
      case 'completed': return 'Concluída';
      default: return 'Indisponível';
    }
  };

  const statusColor = getStatusColor(offer.status);
  const statusText = getStatusText(offer.status);

  const shouldShowFinalizeButton = !isInstitutionView && 
  offer.status === 'available' && 
  onFinalize && 
  typeof onFinalize === 'function';

  console.log('🔍 [DONATION OFFER CARD] Condições do botão Finalizar:', {
  isInstitutionView,
  offerStatus: offer.status,
  hasOnFinalize: !!onFinalize,
  onFinalizeType: typeof onFinalize,
  shouldShowFinalizeButton
  });

  return (
    <View style={styles.container}>
      {/* Cabeçalho - Doador */}
      <TouchableOpacity 
        style={styles.header}
        onPress={handleDonorProfilePress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`Ver perfil de ${donorName}`}
        accessibilityRole="button"
      >
        <Image 
          source={{ uri: donorAvatar }} 
          style={styles.donorAvatar}
          defaultSource={{ uri: 'https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=${donorName.charAt(0)}' }}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.donorName}>{donorName}</Text>
          <Text style={styles.offerDate}>
            {offer.created_at ? new Date(offer.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
          </Text>
          <Text style={styles.profileHint}>👤 Toque para ver perfil</Text>
        </View>
        
        {/* Badge de Status */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </TouchableOpacity>

      {/* Conteúdo da Oferta */}
      <View style={styles.content}>
        <Text style={styles.offerTitle}>{offerTitle}</Text>
        <Text style={styles.offerDescription}>{offerDescription}</Text>
        
        <View style={styles.details}>
          <Text style={styles.detailText}>
            📦 Quantidade: {offerQuantity}
          </Text>
          <Text style={styles.detailText}>
            🏷️ Categoria: {offerCategory}
          </Text>
          <Text style={styles.detailText}>
            🔧 Condição: {offerConditions}
          </Text>
          <Text style={styles.detailText}>
            📍 Localização: {offerLocation}
          </Text>
        </View>
      </View>

      {/* Ações - CONDICIONAL baseada no tipo de usuário */}
      <View style={styles.actions}>
        {isInstitutionView ? (
          // VISÃO DA INSTITUIÇÃO (Home) - APENAS Aceitar e Conversar
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={handleAcceptPress}
          >
            <Text style={styles.acceptButtonText}>Aceitar e Conversar</Text>
          </TouchableOpacity>
        ) : (
          // VISÃO DO DOADOR (Perfil) - Editar e Finalizar
          <View style={styles.donorActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditPress}
            >
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
            
            {shouldShowFinalizeButton && (
              <TouchableOpacity 
                style={styles.finalizeButton}
                onPress={handleFinalizePress}
              >
                <Text style={styles.finalizeButtonText}>Finalizar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFBFC',
  },
  donorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F6F8F9',
  },
  headerInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  offerDate: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  profileHint: {
    fontSize: 10,
    color: '#FF1434',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  donorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#FF1434',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FF1434',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  finalizeButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  finalizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DonationOfferCard;