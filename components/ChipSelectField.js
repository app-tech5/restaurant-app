import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, constants } from '../global';

export default function ChipSelectField({
  options = [],
  value,
  onChange,
  multiple = false,
  disabled = false,
  emptyText,
}) {
  const selectedSet = new Set(
    multiple
      ? (Array.isArray(value) ? value : []).map(String)
      : value != null && value !== '' ? [String(value)] : []
  );

  const toggle = (optionValue) => {
    if (disabled || !onChange) return;
    const key = String(optionValue);

    if (multiple) {
      const current = Array.isArray(value) ? value.map(String) : [];
      onChange(
        current.includes(key)
          ? current.filter((item) => item !== key)
          : [...current, key]
      );
      return;
    }

    onChange(selectedSet.has(key) ? '' : key);
  };

  if (options.length === 0) {
    return emptyText ? <Text style={styles.empty}>{emptyText}</Text> : null;
  }

  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const key = String(option.value);
        const active = selectedSet.has(key);
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.chip,
              active && styles.chipSelected,
              disabled && styles.chipDisabled,
            ]}
            onPress={() => toggle(option.value)}
            disabled={disabled}
          >
            <Text style={[styles.chipText, active && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: constants.SPACING.sm,
  },
  chip: {
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.xs,
    borderRadius: constants.BORDER_RADIUS,
    backgroundColor: colors.grey[100],
    borderWidth: 1,
    borderColor: colors.grey[200],
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDisabled: {
    opacity: 0.85,
  },
  chipText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  empty: {
    fontSize: 13,
    color: colors.text.secondary,
    marginVertical: 8,
  },
});
