import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const RatingStars = ({ 
  rating = 0, 
  onRatingChange, 
  size = 'medium',
  interactive = true,
  showValue = false 
}) => {
  const getStarSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 32;
      default: return 24;
    }
  };

  const handleStarPress = (starValue) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const renderStars = () => {
    const starSize = getStarSize();
    
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
            disabled={!interactive}
            accessible={true}
            accessibilityLabel={`${star} estrela${star > 1 ? 's' : ''}`}
            accessibilityRole={interactive ? "button" : "text"}
          >
            <Text style={[
              styles.star,
              { fontSize: starSize },
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
    <View style={styles.container}>
      {renderStars()}
      {showValue && rating > 0 && (
        <Text style={[styles.ratingText, { fontSize: getStarSize() * 0.6 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 2,
  },
  star: {
    color: '#E0E0E0',
  },
  starFilled: {
    color: '#FFD700',
  },
  starEmpty: {
    color: '#E0E0E0',
  },
  ratingText: {
    marginLeft: 8,
    color: '#757575',
    fontWeight: '600',
  },
});

export default RatingStars;
