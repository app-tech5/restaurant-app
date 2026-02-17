import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  RefreshControl,
  Platform,
} from 'react-native';
import { Card } from 'react-native-elements';
import { ScreenHeader, ReportMetricsCards, ReportCharts } from '../components';
import { useReportData, useReportCalculations } from '../hooks';
import { colors, constants } from '../global';
import i18n from '../i18n';

const ReportDetailsScreen = ({ route, navigation }) => {
  const { reportType, period } = route.params || {};

  const { isLoading, refreshing, filteredOrders, baseMetrics, reportInfo, onRefresh } = useReportData(reportType, period);
  const calculations = useReportCalculations(filteredOrders, reportType);


  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={i18n.t('reports.reportDetailsTitle')}
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{i18n.t('reports.loadingReport')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={i18n.t('reports.reportDetailsTitle')}
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* En-tête du rapport */}
        <Card containerStyle={styles.headerCard}>
          <Text style={styles.reportTitle}>{reportInfo.title}</Text>
          <Text style={styles.reportPeriod}>{reportInfo.periodText}</Text>
        </Card>

        {/* Métriques principales */}
        <ReportMetricsCards
          baseMetrics={baseMetrics}
          reportType={reportType}
        />

        {/* Graphiques spécifiques au type de rapport */}
        <ReportCharts
          calculations={calculations}
          reportType={reportType}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  scrollView: {
    flex: 1,
    padding: constants.SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  headerCard: {
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    marginBottom: constants.SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.xs,
  },
  reportPeriod: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default ReportDetailsScreen;
