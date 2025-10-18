import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const FollowedInstitution = ({ institution }) => {
  const handleInstitutionPress = () => {
    // TODO: Navegar para perfil da instituição
    // navigateToInstitution(institution.id);
  };

  const handleFollowToggle = () => {
    // TODO: Implementar seguir/deixar de seguir
    // toggleFollow(institution.id);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleInstitutionPress}>
      <View style={styles.leftContent}>
        <Image source={{ uri: institution.avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {institution.name}
          </Text>
          <View style={styles.urgencyContainer}>
            <View style={[styles.urgencyDot, { backgroundColor: institution.urgencyColor }]} />
            <Text style={styles.urgencyText}>{institution.urgency}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.followButton} onPress={handleFollowToggle}>
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
    backgroundColor: '#F6F8F9',
    borderRadius: 12,
    marginBottom: 8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  followButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF1434',
  },
  followButtonText: {
    fontSize: 12,
    color: '#FF1434',
    fontWeight: '600',
  },
});

export default FollowedInstitution;
