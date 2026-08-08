import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../api';
import { ScreenHeader } from '../components';
import { colors } from '../global';
import i18n from '../i18n';

export default function SponsoredListingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [listings, setListings] = useState([]);
  const [headline, setHeadline] = useState('');
  const [bidAmount, setBidAmount] = useState('15');
  const [placement, setPlacement] = useState('both');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.listMySponsoredListings();
      setListings(res?.listings || []);
    } catch (error) {
      Alert.alert(i18n.t('common.error'), error?.message || i18n.t('sponsored.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onCreate = async () => {
    try {
      setBusy(true);
      const startAt = new Date();
      const endAt = new Date(Date.now() + 14 * 86400000);
      await apiClient.createSponsoredListing({
        name: i18n.t('sponsored.defaultCampaignName'),
        placement,
        bidAmount: Number(bidAmount) || 10,
        priority: 80,
        headline: headline || i18n.t('sponsored.defaultHeadline'),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        status: 'active',
      });
      setHeadline('');
      await load();
      Alert.alert(i18n.t('common.success'), i18n.t('sponsored.createSuccess'));
    } catch (error) {
      Alert.alert(i18n.t('common.error'), error?.message || i18n.t('sponsored.createError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title={i18n.t('sponsored.title')} autoLeftNav />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        >
          <Text style={styles.lead}>{i18n.t('sponsored.lead')}</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{i18n.t('sponsored.newCampaign')}</Text>
            <Text style={styles.label}>{i18n.t('sponsored.headline')}</Text>
            <TextInput
              style={styles.input}
              value={headline}
              onChangeText={setHeadline}
              placeholder={i18n.t('sponsored.defaultHeadline')}
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>{i18n.t('sponsored.bid')}</Text>
            <TextInput
              style={styles.input}
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>{i18n.t('sponsored.placement')}</Text>
            <View style={styles.row}>
              {['search', 'home_banner', 'both'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, placement === p && styles.chipOn]}
                  onPress={() => setPlacement(p)}
                >
                  <Text style={[styles.chipText, placement === p && styles.chipTextOn]}>
                    {i18n.t(`sponsored.placement_${p}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.btn, busy && { opacity: 0.6 }]}
              onPress={onCreate}
              disabled={busy}
            >
              <Text style={styles.btnText}>{i18n.t('sponsored.launch')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>{i18n.t('sponsored.myCampaigns')}</Text>
          {listings.length === 0 ? (
            <Text style={styles.empty}>{i18n.t('sponsored.empty')}</Text>
          ) : (
            listings.map((item) => (
              <View key={item.id} style={styles.listCard}>
                <View style={styles.listHead}>
                  <MaterialIcons name="campaign" size={22} color={colors.primary} />
                  <Text style={styles.listTitle}>{item.name}</Text>
                  <Text style={styles.status}>
                    {String(item.status || '')
                      .split(/[_-\s]+/)
                      .filter(Boolean)
                      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                      .join(' ') || '—'}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  {i18n.t(`sponsored.placement_${item.placement}`)} · bid {item.bidAmount}
                  {item.currency}
                </Text>
                {item.headline ? <Text style={styles.headline}>{item.headline}</Text> : null}
                <Text style={styles.meta}>
                  {item.impressions || 0} impressions · {item.clicks || 0} clicks
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background?.secondary || '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  lead: { fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12, color: '#111' },
  label: { fontSize: 13, fontWeight: '700', color: '#333', marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    color: '#111',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.primary || '#FF6B35', borderColor: colors.primary || '#FF6B35' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#444' },
  chipTextOn: { color: '#fff' },
  btn: {
    marginTop: 16,
    backgroundColor: colors.primary || '#FF6B35',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  section: { fontSize: 16, fontWeight: '800', marginBottom: 10, color: '#111' },
  empty: { color: '#888', fontSize: 14 },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  listHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  listTitle: { flex: 1, fontWeight: '800', color: '#111' },
  status: { fontSize: 11, fontWeight: '800', color: colors.primary || '#FF6B35', textTransform: 'uppercase' },
  meta: { color: '#777', fontSize: 12, marginTop: 2 },
  headline: { color: '#333', fontSize: 13, marginTop: 6, fontWeight: '600' },
});
