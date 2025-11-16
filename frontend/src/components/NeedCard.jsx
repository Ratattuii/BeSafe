import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const NeedCard = ({ 
  need, 
  onPress, 
  onEdit, 
  onDetails, 
  isInstitutionView = false,
  isCompleted = false,
  isClickable = true // Nova prop para controlar se o card é clicável
}) => {
  // Verificações de segurança
  if (!need) {
    return (
      <View style={styles.container}>
        <Text>Necessidade não disponível</Text>
      </View>
    );
  }

  const handleCardPress = () => {
    if (onPress && isClickable) {
      onPress(need);
    }
  };

  const handleEditPress = (e) => {
    e.stopPropagation(); // Previne que o evento chegue no card pai
    if (onEdit) {
      onEdit(need);
    }
  };

  const handleDetailsPress = (e) => {
    e.stopPropagation(); // Previne que o evento chegue no card pai
    if (onDetails) {
      onDetails(need);
    }
  };

  // Dados seguros com fallbacks
  const needTitle = need.title || 'Necessidade sem título';
  const needDescription = need.description || 'Sem descrição disponível';
  const needUrgency = need.urgency || 'media';
  const needCategory = need.category || 'outros';
  const needQuantity = need.quantity || 1;
  const needUnit = need.unit || 'unidade';
  const institutionName = need.institution_name || 'Instituição';
  const institutionAvatar = need.institution_avatar || `https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=${institutionName.charAt(0)}`;

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critica': return '#FF1744';
      case 'alta': return '#FF9800';
      case 'media': return '#FFC107';
      case 'baixa': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const urgencyColor = getUrgencyColor(needUrgency);

  // Conteúdo do card
  const CardContent = () => (
    <>
      {/* Cabeçalho - Instituição */}
      <View style={styles.header}>
        <Image 
          source={{ uri: institutionAvatar }} 
          style={styles.institutionAvatar}
          defaultSource={{ uri: 'https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=I' }}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.institutionName}>{institutionName}</Text>
          <Text style={styles.needDate}>
            {need.created_at ? new Date(need.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
          </Text>
        </View>
        
        {/* Badge de Urgência */}
        <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
          <Text style={styles.urgencyText}>
            {needUrgency === 'critica' ? 'Urgente' : 
             needUrgency === 'alta' ? 'Alta' : 
             needUrgency === 'media' ? 'Média' : 'Baixa'}
          </Text>
        </View>
      </View>

      {/* Conteúdo da Necessidade */}
      <View style={styles.content}>
        <Text style={styles.needTitle}>{needTitle}</Text>
        <Text style={styles.needDescription}>{needDescription}</Text>
        
        <View style={styles.details}>
          <Text style={styles.detailText}>
            Quantidade: {needQuantity} {needUnit}
          </Text>
          <Text style={styles.detailText}>
            Categoria: {needCategory}
          </Text>
        </View>
      </View>

      {/* Ações */}
      <View style={styles.actions}>
        {isInstitutionView ? (
          // Ações para instituição (editar, detalhes)
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.detailsButton]}
              onPress={handleDetailsPress}
            >
              <Text style={styles.detailsButtonText}>Detalhes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEditPress}
            >
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Ações para doador (doar)
          <TouchableOpacity 
            style={styles.donateButton}
            onPress={handleDetailsPress} // Usa handleDetailsPress para evitar conflito
          >
            <Text style={styles.donateButtonText}>Doar</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  // Renderização condicional baseada na prop isClickable
  if (isClickable) {
    return (
      <TouchableOpacity 
        style={styles.container}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <CardContent />
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
  },
  institutionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F6F8F9',
  },
  headerInfo: {
    flex: 1,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  needDate: {
    fontSize: 12,
    color: '#757575',
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  needTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  needDescription: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editButton: {
    backgroundColor: '#FF1434',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  donateButton: {
    backgroundColor: '#FF1434',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  donateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default NeedCard;