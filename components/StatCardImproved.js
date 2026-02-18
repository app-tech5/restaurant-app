import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, constants } from '../global';

const StatCardImproved = ({
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
  disabled = false,
  ...props
}) => {
  
  const sizeConfig = {
    small: {
      container: styles.smallContainer,
      iconSize: 20,
      titleSize: 12,
      valueSize: 16,
      subtitleSize: 10,
    },
    medium: {
      container: styles.mediumContainer,
      iconSize: 24,
      titleSize: 14,
      valueSize: 20,
      subtitleSize: 11,
    },
    large: {
      container: styles.largeContainer,
      iconSize: 32,
      titleSize: 16,
      valueSize: 28,
      subtitleSize: 12,
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;
  
  const cardContent = (
    <>
      {}
      <View style={styles.iconContainer}>
        <Icon
          name={icon}
          type={iconType}
          size={config.iconSize}
          color={gradient ? colors.white : color}
        />
      </View>

      {}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              fontSize: config.titleSize,
              color: gradient ? colors.white : colors.text.secondary
            }
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.value,
            {
              fontSize: config.valueSize,
              color: gradient ? colors.white : color
            }
          ]}
        >
          {value}
        </Text>

        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                fontSize: config.subtitleSize,
                color: gradient ? 'rgba(255,255,255,0.8)' : colors.text.secondary
              }
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </>
  );
  
  const baseCardStyle = [
    styles.card,
    config.container,
    style
  ];
  
  const CardComponent = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? {
    onPress,
    disabled,
    activeOpacity: 0.7,
    ...props
  } : props;
  
  if (gradient) {
    return (
      <CardComponent {...cardProps}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={baseCardStyle}
        >
          {cardContent}
        </LinearGradient>
      </CardComponent>
    );
  }

  return (
    <CardComponent
      {...cardProps}
      style={[baseCardStyle, { backgroundColor }]}
    >
      {cardContent}
    </CardComponent>
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
    minHeight: 60,
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
    marginBottom: 2,
  },
  subtitle: {
    fontStyle: 'italic',
  },
});

export default StatCardImproved;
