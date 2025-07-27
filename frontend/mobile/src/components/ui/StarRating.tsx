import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={filled ? color : emptyColor}
          stroke={filled ? color : emptyColor}
          strokeWidth="1"
        />
      </Svg>
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