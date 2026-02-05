import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, constants } from '../global';

const StatCard = ({
  title,
  value,
  subtitle = null,
  icon,
  iconType = 'material',
  color = colors.primary,
  backgroundColor = colors.white,
  gradient = null,
  size = 'medium',
  style = {},
  onPress = null,
  ...props
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          iconSize: 20,
          titleSize: 12,
          valueSize: 16,
          subtitleSize: 10,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          iconSize: 32,
          titleSize: 16,
          valueSize: 28,
          subtitleSize: 12,
        };
      default: // medium
        return {
          container: styles.mediumContainer,
          iconSize: 24,
          titleSize: 14,
          valueSize: 20,
          subtitleSize: 11,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const CardContent = () => (
    <View style={[styles.card, sizeStyles.container, { backgroundColor }, style]} {...props}>
      <View style={styles.iconContainer}>
        <Icon
          name={icon}
          type={iconType}
          size={sizeStyles.iconSize}
          color={color}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { fontSize: sizeStyles.titleSize }]}>
          {title}
        </Text>

        <Text style={[styles.value, { fontSize: sizeStyles.valueSize, color }]}>
          {value}
        </Text>

        {subtitle && (
          <Text style={[styles.subtitle, { fontSize: sizeStyles.subtitleSize }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        style={[styles.card, sizeStyles.container, style]}
        {...props}
      >
        <CardContent />
      </LinearGradient>
    );
  }

  return <CardContent />;
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
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});

export default StatCard;
