import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../api';
import { colors, constants } from '../global';
import i18n from '../i18n';

export default function Categories({
  selectedIds = [],
  onChangeSelectedIds,
  disabled = false,
  sectionTitle,
  hint,
  emptyMessage,
  onCategoriesLoaded,
}) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const onLoadedRef = useRef(onCategoriesLoaded);
  onLoadedRef.current = onCategoriesLoaded;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .listCategories()
      .then((items) => {
        if (cancelled) return;
        const categories = Array.isArray(items) ? items : [];
        setList(categories);
        onLoadedRef.current?.(categories);
      })
      .catch(() => {
        if (!cancelled) {
          setList([]);
          onLoadedRef.current?.([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id) => {
    if (disabled || !onChangeSelectedIds) return;
    const key = String(id);
    const current = (selectedIds || []).map(String);
    onChangeSelectedIds(
      current.includes(key)
        ? current.filter((x) => x !== key)
        : [...current, key]
    );
  };

  return (
    <View>
      {sectionTitle ? (
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      ) : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : list.length === 0 ? (
        <Text style={styles.empty}>
          {emptyMessage || i18n.t('onboarding.categoriesEmpty')}
        </Text>
      ) : (
        <View style={styles.chipRow}>
          {list.map((cat) => {
            const id = String(cat._id || cat.id);
            const active = (selectedIds || []).map(String).includes(id);
            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.chip,
                  active && styles.chipSelected,
                  disabled && styles.chipDisabled,
                ]}
                onPress={() => toggle(id)}
                disabled={disabled}
              >
                <Text style={[styles.chipText, active && styles.chipTextSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  hint: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  loader: {
    marginVertical: 12,
  },
  empty: {
    fontSize: 13,
    color: colors.text.secondary,
    marginVertical: 8,
  },
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
});
