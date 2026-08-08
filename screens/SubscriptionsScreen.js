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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../api';
import { ScreenHeader } from '../components';
import { colors } from '../global';
import i18n from '../i18n';

export default function SubscriptionsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [plans, setPlans] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [benefits, setBenefits] = useState(null);

  const load = useCallback(async ({ soft = false } = {}) => {
    try {
      if (soft) setRefreshing(true);
      else setLoading(true);
      const [plansRes, mineRes] = await Promise.all([
        apiClient.listSubscriptionPlans('restaurant'),
        apiClient.getMySubscription(),
      ]);
      setPlans(plansRes?.plans || []);
      setEnrollment(mineRes?.enrollment || null);
      setBenefits(mineRes?.benefits || null);
    } catch (error) {
      Alert.alert(i18n.t('common.error'), error?.message || i18n.t('subscription.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onSubscribe = (plan) => {
    Alert.alert(
      i18n.t('subscription.confirmTitle'),
      i18n.t('subscription.confirmMessage', {
        name: plan.name,
        price: plan.price,
        cycle: plan.billingCycle,
      }),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('subscription.subscribe'),
          onPress: async () => {
            try {
              setBusy(true);
              const res = await apiClient.subscribeToPlan(plan.id);
              setEnrollment(res?.enrollment || null);
              setBenefits(res?.benefits || null);
              Alert.alert(i18n.t('common.success'), i18n.t('subscription.subscribeSuccess'));
            } catch (error) {
              Alert.alert(i18n.t('common.error'), error?.message || i18n.t('subscription.subscribeError'));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const onCancel = () => {
    Alert.alert(i18n.t('subscription.cancelTitle'), i18n.t('subscription.cancelMessage'), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      {
        text: i18n.t('subscription.cancelAction'),
        style: 'destructive',
        onPress: async () => {
          try {
            setBusy(true);
            const res = await apiClient.cancelMySubscription();
            setEnrollment(res?.enrollment?.status === 'active' ? res.enrollment : null);
            setBenefits(res?.benefits || null);
            Alert.alert(i18n.t('common.success'), i18n.t('subscription.cancelSuccess'));
            load();
          } catch (error) {
            Alert.alert(i18n.t('common.error'), error?.message || i18n.t('subscription.cancelError'));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={i18n.t('subscription.title')} autoLeftNav />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  const active = benefits?.active && enrollment?.status === 'active';

  return (
    <View style={styles.container}>
      <ScreenHeader title={i18n.t('subscription.title')} autoLeftNav />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ soft: true })} />}
      >
        {active ? (
          <View style={styles.activeCard}>
            <Text style={styles.activeTitle}>{i18n.t('subscription.activePlan')}</Text>
            <Text style={styles.planName}>{enrollment?.plan?.name || benefits?.planName}</Text>
            <Text style={styles.meta}>
              {i18n.t('subscription.validUntil', {
                date: enrollment?.currentPeriodEnd
                  ? new Date(enrollment.currentPeriodEnd).toLocaleDateString()
                  : '—',
              })}
            </Text>
            {(enrollment?.plan?.benefits || benefits?.benefits || []).map((b, idx) => (
              <View key={typeof b === 'string' ? b : `b-${idx}`} style={styles.benefitRow}>
                <MaterialIcons name="check-circle" size={18} color={colors.primary} />
                <Text style={styles.benefitText}>{typeof b === 'string' ? b : String(b)}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
              <Text style={styles.cancelText}>{i18n.t('subscription.cancelAction')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.intro}>
            <Text style={styles.introTitle}>{i18n.t('subscription.introTitle')}</Text>
            <Text style={styles.introSub}>{i18n.t('subscription.introSub')}</Text>
          </View>
        )}

        {!active &&
          plans.map((plan) => {
            const priceNum = Number(plan.price);
            const priceLabel =
              !Number.isFinite(priceNum) || priceNum <= 0
                ? i18n.t('subscription.free')
                : `${priceNum.toFixed(2)} ${plan.currency || ''}/${plan.billingCycle || 'monthly'}`;
            return (
            <View key={plan.id} style={styles.planCard}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.price}>{priceLabel}</Text>
              {(plan.benefits || []).map((b, idx) => (
                <View key={typeof b === 'string' ? b : `pb-${idx}`} style={styles.benefitRow}>
                  <MaterialIcons name="check" size={18} color={colors.primary} />
                  <Text style={styles.benefitText}>{typeof b === 'string' ? b : String(b)}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.subscribeBtn}
                onPress={() => onSubscribe(plan)}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.subscribeText}>{i18n.t('subscription.subscribe')}</Text>
                )}
              </TouchableOpacity>
            </View>
            );
          })}

        {!active && plans.length === 0 ? (
          <Text style={styles.empty}>{i18n.t('subscription.noPlans')}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#f5f5f7' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { marginBottom: 16 },
  introTitle: { fontSize: 22, fontWeight: '800', color: colors.text?.primary || '#111' },
  introSub: { marginTop: 8, fontSize: 15, color: colors.text?.secondary || '#666', lineHeight: 22 },
  activeCard: {
    backgroundColor: colors.white || '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  activeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  planCard: {
    backgroundColor: colors.white || '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  planName: { fontSize: 20, fontWeight: '800', color: colors.text?.primary || '#111' },
  price: { marginTop: 6, marginBottom: 12, fontSize: 16, fontWeight: '700', color: colors.primary },
  meta: { marginBottom: 12, color: colors.text?.secondary || '#666' },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  benefitText: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.text?.primary || '#222' },
  subscribeBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { color: colors.primary, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
});
