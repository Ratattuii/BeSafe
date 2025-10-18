import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const PostCard = ({ post }) => {
  const getUrgencyStyle = (urgencyLevel) => {
    switch (urgencyLevel) {
      case 'urgent':
        return { backgroundColor: '#FF1434', color: '#FFFFFF' };
      case 'high':
        return { backgroundColor: '#FF9800', color: '#FFFFFF' };
      case 'medium':
        return { backgroundColor: '#4CAF50', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#757575', color: '#FFFFFF' };
    }
  };

  const handleLike = () => {
    // TODO: Implementar funcionalidade de like
    // likePost(post.id);
  };

  const handleComment = () => {
    // TODO: Abrir modal ou navegar para comentários
    // openComments(post.id);
  };

  const handleShare = () => {
    // TODO: Implementar funcionalidade de compartilhamento
    // sharePost(post.id);
  };

  const handleDonate = () => {
    // TODO: Navegar para tela de doação
    // navigateToDonate(post.id);
  };

  return (
    <View style={styles.container}>
      {/* Header do Post */}
      <View style={styles.header}>
        <Image source={{ uri: post.institution.avatar }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.institutionName}>{post.institution.name}</Text>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>

      {/* Imagem Principal */}
      <Image source={{ uri: post.image }} style={styles.postImage} />

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Badge de Urgência */}
        <View style={[styles.urgencyBadge, getUrgencyStyle(post.urgencyLevel)]}>
          <Text style={[styles.urgencyText, { color: getUrgencyStyle(post.urgencyLevel).color }]}>
            {post.urgency}
          </Text>
        </View>

        {/* Descrição */}
        <Text style={styles.description}>{post.description}</Text>

        {/* Estatísticas e Ações */}
        <View style={styles.actionsContainer}>
          <View style={styles.stats}>
            <TouchableOpacity style={styles.statButton} onPress={handleLike}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statText}>{post.stats.likes}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statButton} onPress={handleComment}>
              <Text style={styles.statIcon}>💬</Text>
              <Text style={styles.statText}>{post.stats.comments}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statButton} onPress={handleShare}>
              <Text style={styles.statIcon}>📤</Text>
              <Text style={styles.statText}>{post.stats.shares}</Text>
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
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
  
  // Imagem
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F6F8F9',
  },
  
  // Conteúdo
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
  },
  description: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
    marginBottom: 16,
  },
  
  // Ações
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
