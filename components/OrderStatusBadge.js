import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, constants } from '../global';
import { getOrderStatusLabel, getOrderStatusColor } from '../utils/restaurantUtils';

const OrderStatusBadge = ({
  status,
  size = 'medium',
  style = {},
  textStyle = {}
}) => {
  const label = getOrderStatusLabel(status);
  const backgroundColor = getOrderStatusColor(status);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          text: styles.smallText,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          text: styles.largeText,
        };
      default: 
        return {
          container: styles.mediumContainer,
          text: styles.mediumText,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container, { backgroundColor }, style]}>
      <Text style={[styles.text, sizeStyles.text, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 50,
  },
  mediumContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 70,
  },
  largeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 90,
  },
  text: {
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 9,
  },
  mediumText: {
    fontSize: 11,
  },
  largeText: {
    fontSize: 13,
  },
});

export default OrderStatusBadge;
