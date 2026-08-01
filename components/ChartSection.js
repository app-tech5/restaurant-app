import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, constants } from '../global';
import i18n from '../i18n';

const WEEKLY_BARS = [0.45, 0.72, 0.58, 0.85, 0.62, 0.95, 0.78];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const BAR_MAX_HEIGHT = 120;
const LABEL_SLOT = 22;

const ChartSection = ({ isLoading }) => {
  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>{i18n.t('analytics.salesByDay')}</Text>
      <View style={styles.chartArea}>
        <View style={styles.baseline} pointerEvents="none" />
        {WEEKLY_BARS.map((ratio, index) => {
          const barHeight = Math.max(8, Math.round(BAR_MAX_HEIGHT * ratio));
          return (
            <View key={DAY_KEYS[index]} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: barHeight }]} />
              </View>
              <Text style={styles.dayLabel}>{i18n.t(`analytics.days.${DAY_KEYS[index]}`)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.lg,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: constants.SPACING.md,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT + LABEL_SLOT,
  },
  baseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: BAR_MAX_HEIGHT,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey[300],
    zIndex: 1,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barTrack: {
    width: 14,
    height: BAR_MAX_HEIGHT,
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  dayLabel: {
    height: LABEL_SLOT,
    fontSize: 10,
    lineHeight: LABEL_SLOT,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default ChartSection;
