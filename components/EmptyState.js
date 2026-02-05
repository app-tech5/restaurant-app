import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { colors } from '../global';
import i18n from '../i18n';

const EmptyState = ({
  icon = 'inbox',
  iconType = 'material',
  title = i18n.t('common.noData'),
  subtitle = null,
  action = null,
  containerStyle = {},
  iconStyle = {},
  titleStyle = {},
  subtitleStyle = {}
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Icon
        name={icon}
        type={iconType}
        size={64}
        color={colors.grey[400]}
        containerStyle={[styles.iconContainer, iconStyle]}
      />

      <Text style={[styles.title, titleStyle]}>
        {title}
      </Text>

      {subtitle && (
        <Text style={[styles.subtitle, subtitleStyle]}>
          {subtitle}
        </Text>
      )}

      {action && (
        <View style={styles.actionContainer}>
          {action}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 20,
  },
});

export default EmptyState;
