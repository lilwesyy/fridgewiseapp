import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  color?: string;
  emptyColor?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  onRatingChange,
  interactive = false,
  color = '#FFD700',
  emptyColor = '#E5E5E5'
}) => {
  const handleStarPress = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  const renderStar = (index: number) => {
    const isFilled = index < rating;
    const isHalfFilled = rating > index && rating < index + 1;
    
    const StarIcon = ({ filled }: { filled: boolean }) => (
      <Ionicons 
        name={filled ? "star" : "star-outline"} 
        size={size} 
        color={filled ? color : emptyColor} 
      />
    );

    if (interactive) {
      return (
        <TouchableOpacity
          key={index}
          onPress={() => handleStarPress(index)}
          style={styles.starButton}
          activeOpacity={0.7}
        >
          <StarIcon filled={isFilled || isHalfFilled} />
        </TouchableOpacity>
      );
    }

    return (
      <View key={index} style={styles.star}>
        <StarIcon filled={isFilled || isHalfFilled} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 1,
  },
  starButton: {
    marginHorizontal: 1,
    padding: 2,
  },
});