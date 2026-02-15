import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import {
  Loading,
  ScreenHeader,
  PeriodSelector,
  AnalyticsGrid,
  PerformanceMetrics,
  DetailedStats,
  ChartSection
} from '../components';
import { colors, constants } from '../global';
import { useAnalytics } from '../hooks/useAnalytics';
import i18n from '../i18n';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnalyticsScreen = ({ navigation }) => {
  const { restaurant, isAuthenticated } = useRestaurant();
  const {
    derivedMetrics,
    period,
    isLoading,
    error,
    changePeriod,
    refreshAnalytics
  } = useAnalytics(restaurant, isAuthenticated);

  if (error) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={i18n.t('navigation.analytics')}
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {i18n.t('common.error')}: {error}
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading && !derivedMetrics) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={i18n.t('navigation.analytics')}
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <Loading fullScreen text={i18n.t('common.loading')} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={i18n.t('navigation.analytics')}
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshAnalytics}
          />
        }
      >
        {/* Sélecteur de période */}
        <PeriodSelector
          selectedPeriod={period}
          onPeriodChange={changePeriod}
        />

        {/* Métriques principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('analytics.mainMetrics')}</Text>
          <AnalyticsGrid
            metrics={derivedMetrics}
            isLoading={isLoading}
          />
        </View>

        {/* Graphiques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('analytics.evolution')}</Text>
          <ChartSection isLoading={isLoading} />
        </View>

        {/* Métriques de performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('analytics.performance')}</Text>
          <PerformanceMetrics
            metrics={derivedMetrics}
            isLoading={isLoading}
          />
        </View>

        {/* Statistiques détaillées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('analytics.detailedStats')}</Text>
          <DetailedStats
            metrics={derivedMetrics}
            isLoading={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: constants.SPACING.md,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: constants.SPACING.lg,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
