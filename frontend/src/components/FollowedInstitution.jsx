import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const FollowedInstitution = ({ institution, onPress, onUnfollow }) => {
  const handleInstitutionPress = () => {
    onPress(institution);
  };

  const handleUnfollowPress = () => {
    onUnfollow(institution.id);
  };

  // Determinar cor baseada na quantidade de necessidades ativas
  const getUrgencyColor = (activeNeedsCount) => {
    if (activeNeedsCount === 0) return '#9E9E9E'; // Cinza - sem necessidades
    if (activeNeedsCount <= 2) return '#4CAF50'; // Verde - poucas necessidades
    if (activeNeedsCount <= 5) return '#FF9800'; // Laranja - algumas necessidades
    return '#FF1744'; // Vermelho - muitas necessidades
  };

  const getUrgencyText = (activeNeedsCount) => {
    if (activeNeedsCount === 0) return 'Sem necessidades ativas';
    if (activeNeedsCount === 1) return '1 necessidade ativa';
    return `${activeNeedsCount} necessidades ativas`;
  };

  const urgencyColor = getUrgencyColor(institution.active_needs_count || 0);
  const urgencyText = getUrgencyText(institution.active_needs_count || 0);

  return (
    <TouchableOpacity style={styles.container} onPress={handleInstitutionPress}>
      <View style={styles.leftContent}>
        <Image 
          source={{ 
            uri: institution.avatar || `https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=${institution.name?.charAt(0) || 'I'}`
          }} 
          style={styles.avatar} 
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {institution.name}
          </Text>
          <View style={styles.urgencyContainer}>
            <View style={[styles.urgencyDot, { backgroundColor: urgencyColor }]} />
            <Text style={styles.urgencyText}>{urgencyText}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.followButton} 
        onPress={handleUnfollowPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.followButtonText}>Seguindo</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  followButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF1434',
    minWidth: 80,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 12,
    color: '#FF1434',
    fontWeight: '600',
  },
});

export default FollowedInstitution;