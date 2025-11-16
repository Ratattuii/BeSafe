import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const PostCard = ({ 
  post, 
  stats = {}, 
  getUrgencyColor = () => '#757575', 
  formatDate = (date) => date, 
  onInstitutionPress = () => {}, 
  onLikePress = () => {}, 
  onCommentPress = () => {}, 
  onSharePress = () => {}, 
  onDonatePress = () => {} 
}) => {
  // Verificações de segurança para dados ausentes
  if (!post) {
    return (
      <View style={styles.container}>
        <Text>Post não disponível</Text>
      </View>
    );
  }

  // Dados seguros com fallbacks
  const institution = post.institution || {};
  const institutionName = institution.name || post.institution_name || 'Instituição';
  const institutionAvatar = institution.avatar || `https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=${institutionName.charAt(0)}`;
  
  const postImage = post.image || post.image_url || `https://via.placeholder.com/300x200/F6F8F9/757575?text=Necessidade`;
  const postUrgency = post.urgency || post.urgency_level || 'medium';
  const postUrgencyText = post.urgency_text || 
    (postUrgency === 'critica' ? 'Urgente' : 
     postUrgency === 'alta' ? 'Alta' : 
     postUrgency === 'media' ? 'Média' : 'Baixa');
  const postDescription = post.description || 'Sem descrição disponível';
  const postTimestamp = post.timestamp || post.created_at || 'Data não disponível';
  
  // Estatísticas seguras
  const postStats = stats || { likes: 0, comments: 0, shares: 0 };

  const urgencyColor = getUrgencyColor(postUrgency);

  const handleLike = (e) => {
    e.stopPropagation(); // Importante: previne o evento de chegar no card pai
    onLikePress(post.id);
  };

  const handleComment = (e) => {
    e.stopPropagation();
    onCommentPress(post.id);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    onSharePress(post.id);
  };

  const handleDonate = (e) => {
    e.stopPropagation();
    onDonatePress(post);
  };

  const handleInstitution = (e) => {
    e.stopPropagation();
    onInstitutionPress(post);
  };

  return (
    <View style={styles.container}>
      {/* Header do Post */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleInstitution} style={styles.institutionButton}>
          <Image 
            source={{ uri: institutionAvatar }} 
            style={styles.avatar}
            defaultSource={{ uri: 'https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=I' }}
          />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <TouchableOpacity onPress={handleInstitution}>
            <Text style={styles.institutionName}>{institutionName}</Text>
          </TouchableOpacity>
          <Text style={styles.timestamp}>{formatDate(postTimestamp)}</Text>
        </View>
      </View>

      {/* Imagem Principal */}
      <Image 
        source={{ uri: postImage }} 
        style={styles.postImage}
        defaultSource={{ uri: 'https://via.placeholder.com/300x200/F6F8F9/757575?text=Necessidade' }}
      />

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Badge de Urgência */}
        <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
          <Text style={styles.urgencyText}>
            {postUrgencyText}
          </Text>
        </View>

        {/* Título */}
        <Text style={styles.postTitle}>{post.title || 'Necessidade'}</Text>

        {/* Descrição */}
        <Text style={styles.description}>{postDescription}</Text>

        {/* Informações adicionais */}
        <View style={styles.details}>
          {post.quantity && (
            <Text style={styles.detailText}>
              Quantidade: {post.quantity} {post.unit || 'unidades'}
            </Text>
          )}
          {post.category && (
            <Text style={styles.detailText}>
              Categoria: {post.category}
            </Text>
          )}
        </View>

        {/* Estatísticas e Ações */}
        <View style={styles.actionsContainer}>
          <View style={styles.stats}>
            <TouchableOpacity style={styles.statButton} onPress={handleLike}>
              <Text style={styles.statIcon}>
                {postStats.userLiked ? '❤️' : '🤍'}
              </Text>
              <Text style={styles.statText}>{postStats.likes || 0}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statButton} onPress={handleComment}>
              <Text style={styles.statIcon}>💬</Text>
              <Text style={styles.statText}>{postStats.comments || 0}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statButton} onPress={handleShare}>
              <Text style={styles.statIcon}>📤</Text>
              <Text style={styles.statText}>{postStats.shares || 0}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.donateButton} onPress={handleDonate}>
            <Text style={styles.donateButtonText}>Doar</Text>
          </TouchableOpacity>
        </View>
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
  },
  institutionButton: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  timestamp: {
    fontSize: 12,
    color: '#757575',
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F6F8F9',
  },
  content: {
    padding: 16,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  description: {
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  statText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  donateButton: {
    backgroundColor: '#FF1434',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  donateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PostCard;