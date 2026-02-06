import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { colors, constants } from '../global';

const ActionCard = ({
  title,
  subtitle,
  icon,
  iconType = 'material',
  color = colors.primary,
  backgroundColor = colors.white,
  size = 'medium',
  style = {},
  onPress,
  disabled = false,
  ...props
}) => {
  // Configuration des tailles
  const sizeConfig = {
    small: {
      container: styles.smallContainer,
      iconSize: 20,
      titleSize: 14,
      subtitleSize: 12,
    },
    medium: {
      container: styles.mediumContainer,
      iconSize: 24,
      titleSize: 16,
      subtitleSize: 14,
    },
    large: {
      container: styles.largeContainer,
      iconSize: 32,
      titleSize: 18,
      subtitleSize: 16,
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        config.container,
        { backgroundColor },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {/* Icône */}
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon
          name={icon}
          type={iconType}
          size={config.iconSize}
          color={color}
        />
      </View>

      {/* Contenu texte */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { fontSize: config.titleSize, color: colors.text.primary }
          ]}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { fontSize: config.subtitleSize, color: colors.text.secondary }
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Flèche pour indiquer que c'est cliquable */}
      <Icon
        name="chevron-right"
        type="material"
        size={20}
        color={colors.text.secondary}
      />
    </TouchableOpacity>
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
    marginBottom: constants.SPACING.sm,
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
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontWeight: '400',
  },
});

export default ActionCard;
