import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

const Badge = ({
  label,
  variant = 'default',
  size = 'medium',
  style,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'success':
        return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'danger':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      case 'warning':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'info':
        return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'primary':
        return { backgroundColor: '#e0e7ff', color: '#3730a3' };
      case 'secondary':
        return { backgroundColor: '#f3e8ff', color: '#6b21a8' };
      default:
        return { backgroundColor: COLORS.gray[200], color: COLORS.gray[700] };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 2, paddingHorizontal: 6, fontSize: 10 };
      case 'large':
        return { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 };
      default:
        return { paddingVertical: 4, paddingHorizontal: 8, fontSize: 12 };
    }
  };

  const variantStyle = getVariantStyle();
  const sizeStyle = getSizeStyle();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: variantStyle.backgroundColor },
        { paddingVertical: sizeStyle.paddingVertical, paddingHorizontal: sizeStyle.paddingHorizontal },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: variantStyle.color, fontSize: sizeStyle.fontSize },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});

export default Badge;
