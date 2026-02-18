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
  style = {},
  onPress,
  disabled = false,
  ...props
}) => {

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {}
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon
          name={icon}
          type={iconType}
          size={24}
          color={color}
        />
      </View>

      {}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { fontSize: 16, color: colors.text.primary }
          ]}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { fontSize: 14, color: colors.text.secondary }
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {}
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
