import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Icon } from 'react-native-elements';
import { colors, constants } from '../global';

const AnalyticsCard = ({
  title,
  value,
  change = null,
  changeType = 'neutral', 
  icon,
  iconType = 'material',
  chart = null,
  style = {},
  titleStyle = {},
  valueStyle = {},
  changeStyle = {}
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return '#4CAF50';
      case 'negative':
        return '#F44336';
      default:
        return colors.grey[600];
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return 'trending-up';
      case 'negative':
        return 'trending-down';
      default:
        return 'trending-flat';
    }
  };

  const formatChange = (change) => {
    if (typeof change === 'number') {
      const sign = change >= 0 ? '+' : '';
      return `${sign}${change}%`;
    }
    return change;
  };

  return (
    <Card containerStyle={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon
            name={icon}
            type={iconType}
            size={20}
            color={colors.primary}
            containerStyle={styles.iconContainer}
          />
          <Text style={[styles.title, titleStyle]}>
            {title}
          </Text>
        </View>

        {change !== null && (
          <View style={styles.changeContainer}>
            <Icon
              name={getChangeIcon()}
              type="material"
              size={16}
              color={getChangeColor()}
            />
            <Text style={[styles.changeText, { color: getChangeColor() }, changeStyle]}>
              {formatChange(change)}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.value, valueStyle]}>
        {value}
      </Text>

      {chart && (
        <View style={styles.chartContainer}>
          {chart}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    margin: constants.SPACING.sm,
    marginBottom: constants.SPACING.sm,
  },
  header: {
    
    justifyContent: 'space-between',
    
    marginBottom: constants.SPACING.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: constants.SPACING.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    flexShrink: 1, 
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: constants.SPACING.sm,
  },
  chartContainer: {
    marginTop: constants.SPACING.sm,
    alignItems: 'center',
  },
});

export default AnalyticsCard;
