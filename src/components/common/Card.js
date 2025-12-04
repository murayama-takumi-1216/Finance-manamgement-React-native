import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

const Card = ({
  children,
  onPress,
  style,
  padding = 16,
  margin = 0,
  shadow = true,
}) => {
  const cardStyle = [
    styles.card,
    shadow && styles.shadow,
    { padding, margin },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  shadow: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default Card;
