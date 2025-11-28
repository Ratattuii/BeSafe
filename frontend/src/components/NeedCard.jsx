// components/NeedCard.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';

const NeedCard = ({ 
  need, 
  onPress, 
  onEdit, 
  onChat,
  onFinalize,
  isInstitutionView = false,
  isCompleted = false,
  isClickable = true
}) => {

  console.log('🎯 [NEEDCARD DEBUG] Props recebidas:', {
    needId: need?.id,
    onFinalize,
    onFinalizeType: typeof onFinalize,
    onFinalizeExists: !!onFinalize,
    isInstitutionView,
    allProps: { onPress, onEdit, onChat, onFinalize, isInstitutionView, isCompleted }
  });
  
  if (!need) {
    return (
      <View style={styles.container}>
        <Text>Necessidade não disponível</Text>
      </View>
    );
  }

  const handleEditPress = (e) => {
    e?.stopPropagation?.();
    if (onEdit && typeof onEdit === 'function') {
      console.log('✏️ [NEEDCARD] Chamando onEdit');
      onEdit(need);
    }
  };

  const handleChatPress = (e) => {
    e?.stopPropagation?.();
    if (onChat && typeof onChat === 'function') {
      console.log('💬 [NEEDCARD] Chamando onChat');
      onChat(need);
    }
  };

  const handleFinalizePress = (e) => {
    console.log('🟡 [NEEDCARD] Botão Finalizar pressionado');
    e?.stopPropagation?.();
    
    // Verificação mais robusta da função
    if (onFinalize && typeof onFinalize === 'function') {
      console.log('🟢 [NEEDCARD] onFinalize é uma função válida, chamando com need:', {
        id: need.id,
        title: need.title,
        status: need.status
      });
      
      try {
        onFinalize(need);
        console.log('✅ [NEEDCARD] onFinalize executado com sucesso');
      } catch (error) {
        console.error('💥 [NEEDCARD] Erro ao executar onFinalize:', error);
      }
    } else {
      console.log('🔴 [NEEDCARD] onFinalize não é uma função válida:', {
        type: typeof onFinalize,
        value: onFinalize
      });
    }
  };

  const handleDonatePress = (e) => {
    e?.stopPropagation?.();
    if (isInstitutionView && onEdit && typeof onEdit === 'function') {
      onEdit(need);
    } else if (!isInstitutionView && onChat && typeof onChat === 'function') {
      onChat(need);
    } else if (onPress && typeof onPress === 'function') {
      onPress(need);
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
  const needStatus = need.status || 'ativa';

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

  // Verifica se a necessidade está concluída
  const isNeedCompleted = needStatus === 'concluida' || needStatus === 'fulfilled' || isCompleted;

  // Verifica se deve mostrar o botão Finalizar
  const shouldShowFinalizeButton = isInstitutionView && 
                                 !isNeedCompleted && 
                                 onFinalize && 
                                 typeof onFinalize === 'function';

  console.log('🔍 [NEEDCARD] Renderização:', {
    shouldShowFinalizeButton,
    isInstitutionView,
    isNeedCompleted,
    hasOnFinalize: !!onFinalize
  });

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
        {/* Badge de Status */}
        {isNeedCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>CONCLUÍDA</Text>
          </View>
        )}
        
        <Text style={styles.needTitle}>{needTitle}</Text>
        <Text style={styles.needDescription}>{needDescription}</Text>
        
        <View style={styles.details}>
          <Text style={styles.detailText}>
            Quantidade: {needQuantity} {needUnit}
          </Text>
          <Text style={styles.detailText}>
            Categoria: {needCategory}
          </Text>
          <Text style={styles.detailText}>
            Status: {needStatus}
          </Text>
        </View>
      </View>

      {/* Ações */}
      <View style={styles.actions}>
        {isInstitutionView ? (
          <View style={styles.institutionActions}>
            <TouchableOpacity 
              style={[
                styles.editButton,
                isNeedCompleted && styles.disabledButton
              ]}
              onPress={handleEditPress}
              disabled={isNeedCompleted}
            >
              <Text style={styles.editButtonText}>
                {isNeedCompleted ? 'Concluída' : 'Editar'}
              </Text>
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
        ) : (
          // Botão Doar para doador
          <TouchableOpacity 
            style={[
              styles.donateButton,
              isNeedCompleted && styles.disabledButton
            ]}
            onPress={handleDonatePress}
            disabled={isNeedCompleted}
          >
            <Text style={styles.donateButtonText}>
              {isNeedCompleted ? 'Concluída' : 'Doar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  if (isClickable && !isNeedCompleted) {
    return (
      <TouchableOpacity 
        style={[
          styles.container,
          isNeedCompleted && styles.completedContainer
        ]}
        onPress={handleDonatePress}
        activeOpacity={0.7}
        disabled={isNeedCompleted}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[
      styles.container,
      isNeedCompleted && styles.completedContainer
    ]}>
      <CardContent />
    </View>
  );
};

// ... (estilos permanecem os mesmos)

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
  completedContainer: {
    opacity: 0.8,
    backgroundColor: '#F8F9FA',
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
    position: 'relative',
  },
  completedBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  completedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  institutionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FF1434',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  finalizeButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  finalizeButtonText: {
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
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
});

export default NeedCard;