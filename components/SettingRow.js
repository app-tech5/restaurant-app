import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Icon } from 'react-native-elements';
import { colors, constants } from '../global';

const SettingRow = ({
  title,
  subtitle = null,
  icon,
  iconType = 'material',
  value = null,
  onPress = null,
  showArrow = true,
  disabled = false,
  style = {},
  titleStyle = {},
  subtitleStyle = {},
  rightComponent = null
}) => {
  const renderRightContent = () => {
    if (rightComponent) {
      return rightComponent;
    }

    if (value !== null && typeof value === 'boolean') {
      return (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: colors.grey[300], true: colors.primary }}
          thumbColor={value ? colors.white : colors.grey[400]}
          disabled={disabled}
        />
      );
    }

    if (showArrow && onPress) {
      return (
        <Icon
          name="chevron-right"
          type="material"
          size={20}
          color={colors.grey[400]}
        />
      );
    }

    if (value !== null && typeof value !== 'boolean') {
      return (
        <Text style={styles.valueText}>
          {value}
        </Text>
      );
    }

    return null;
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.container,
        disabled && styles.disabled,
        style
      ]}
      onPress={disabled ? null : onPress}
      disabled={disabled}
    >
      <View style={styles.leftContainer}>
        {icon && (
          <View style={styles.iconContainer}>
            <Icon
              name={icon}
              type={iconType}
              size={20}
              color={disabled ? colors.grey[400] : colors.primary}
            />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            disabled && styles.disabledText,
            titleStyle
          ]}>
            {title}
          </Text>

          {subtitle && (
            <Text style={[
              styles.subtitle,
              subtitleStyle
            ]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightContainer}>
        {renderRightContent()}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: constants.SPACING.md,
    paddingHorizontal: constants.SPACING.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[100],
  },
  disabled: {
    opacity: 0.6,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grey[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: constants.SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  disabledText: {
    color: colors.grey[400],
  },
  rightContainer: {
    marginLeft: constants.SPACING.md,
  },
  valueText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});

export default SettingRow;
