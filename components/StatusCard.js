import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { colors, constants } from '../global';

const StatusCard = ({
  title,
  value,
  icon,
  iconType = 'material',
  color = colors.primary,
  backgroundColor = colors.white,
  size = 'medium',
  style = {},
  ...props
}) => {
  
  const sizeConfig = {
    small: {
      container: styles.smallContainer,
      iconSize: 20,
      titleSize: 12,
      valueSize: 16,
    },
    medium: {
      container: styles.mediumContainer,
      iconSize: 24,
      titleSize: 14,
      valueSize: 20,
    },
    large: {
      container: styles.largeContainer,
      iconSize: 32,
      titleSize: 16,
      valueSize: 28,
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  return (
    <View
      style={[
        styles.card,
        config.container,
        { backgroundColor },
        style
      ]}
      {...props}
    >
      {}
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon
          name={icon}
          type={iconType}
          size={config.iconSize}
          color={color}
        />
      </View>

      {}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { fontSize: config.titleSize, color: colors.text.secondary }
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.value,
            { fontSize: config.valueSize, color: colors.text.primary }
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallContainer: {
    minHeight: 60,
    padding: constants.SPACING.sm,
  },
  mediumContainer: {
    minHeight: 80,
    padding: constants.SPACING.md,
  },
  largeContainer: {
    minHeight: 100,
    padding: constants.SPACING.lg,
  },
  iconContainer: {
    marginRight: constants.SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontWeight: 'bold',
  },
});

export default StatusCard;
