import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../api';
import { colors } from '../global';
import i18n from '../i18n';
import ChipSelectField from './ChipSelectField';

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

  const options = [];
  const seen = new Set();
  list.forEach((cat) => {
    const value = String(cat._id || cat.id || '');
    if (!value || seen.has(value)) return;
    seen.add(value);
    options.push({ value, label: cat.name });
  });

  return (
    <View>
      {sectionTitle ? (
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      ) : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : (
        <ChipSelectField
          options={options}
          value={selectedIds}
          onChange={onChangeSelectedIds}
          multiple
          disabled={disabled}
          emptyText={emptyMessage || i18n.t('onboarding.categoriesEmpty')}
        />
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
});
