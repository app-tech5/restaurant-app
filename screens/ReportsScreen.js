import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import { ScreenHeader } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';

const ReportsScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const reportTypes = [
    {
      id: 'daily',
      title: i18n.t('reports.dailyReport'),
      description: i18n.t('reports.dailyReportDescription'),
      icon: 'today',
      color: colors.info,
      available: true,
    },
    {
      id: 'weekly',
      title: i18n.t('reports.weeklyReport'),
      description: i18n.t('reports.weeklyReportDescription'),
      icon: 'date-range',
      color: colors.success,
      available: true,
    },
    {
      id: 'monthly',
      title: i18n.t('reports.monthlyReport'),
      description: i18n.t('reports.monthlyReportDescription'),
      icon: 'calendar-month',
      color: colors.warning,
      available: true,
    },
    {
      id: 'revenue',
      title: i18n.t('reports.revenueReport'),
      description: i18n.t('reports.revenueReportDescription'),
      icon: 'euro',
      color: colors.accent,
      available: true,
    },
    {
      id: 'orders',
      title: i18n.t('reports.orderReport'),
      description: i18n.t('reports.orderReportDescription'),
      icon: 'restaurant',
      color: colors.primary,
      available: true,
    },
    {
      id: 'customers',
      title: i18n.t('reports.customerReport'),
      description: i18n.t('reports.customerReportDescription'),
      icon: 'people',
      color: colors.grey[700],
      available: false, 
    },
  ];

  const periodOptions = [
    { key: 'week', label: i18n.t('reports.periodWeek') },
    { key: 'month', label: i18n.t('reports.periodMonth') },
    { key: 'quarter', label: i18n.t('reports.periodQuarter') },
    { key: 'year', label: i18n.t('reports.periodYear') },
  ];

  const handleGenerateReport = (reportType) => {
    if (!reportType.available) {
      Alert.alert(
        i18n.t('reports.featureComingSoonTitle'),
        i18n.t('reports.featureComingSoonMessage'),
        [{ text: i18n.t('common.ok') }]
      );
      return;
    }
    
    Alert.alert(
      i18n.t('reports.reportGeneratedTitle'),
      i18n.t('reports.reportGeneratedMessage', { reportTitle: reportType.title, period: selectedPeriod }),
      [
        { text: i18n.t('reports.view'), onPress: () => navigation.navigate('ReportDetails', { reportType, period: selectedPeriod }) },
        { text: i18n.t('reports.export'), style: 'default' },
        { text: i18n.t('common.close'), style: 'cancel' }
      ]
    );
  };

  const handleExportReport = (reportType) => {
    Alert.alert(
      i18n.t('reports.exportTitle'),
      i18n.t('reports.exportMessage'),
      [
        { text: i18n.t('reports.pdf'), onPress: () => Alert.alert(i18n.t('common.success'), i18n.t('success.sent')) },
        { text: i18n.t('reports.excel'), onPress: () => Alert.alert(i18n.t('common.success'), i18n.t('success.sent')) },
        { text: i18n.t('common.cancel'), style: 'cancel' }
      ]
    );
  };

  const renderReportCard = (report) => (
    <TouchableOpacity
      key={report.id}
      style={[
        styles.reportCard,
        !report.available && styles.disabledCard
      ]}
      onPress={() => handleGenerateReport(report)}
      disabled={!report.available}
    >
      <View style={styles.reportHeader}>
        <View style={[styles.iconContainer, { backgroundColor: report.color + '20' }]}>
          <Icon
            name={report.icon}
            type="material"
            size={24}
            color={report.color}
          />
        </View>

        {!report.available && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>{i18n.t('reports.comingSoon')}</Text>
          </View>
        )}
      </View>

      <View style={styles.reportContent}>
        <Text style={[styles.reportTitle, !report.available && styles.disabledText]}>
          {report.title}
        </Text>
        <Text style={[styles.reportDescription, !report.available && styles.disabledText]}>
          {report.description}
        </Text>
      </View>

      <View style={styles.reportActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleGenerateReport(report)}
        >
          <Text style={styles.actionButtonText}>{i18n.t('reports.generate')}</Text>
        </TouchableOpacity>

        {report.available && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleExportReport(report)}
          >
            <Icon name="download" type="material" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={i18n.t('navigation.reports')}
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {}
        <View style={styles.periodSection}>
          <Text style={styles.sectionTitle}>{i18n.t('reports.periodTitle')}</Text>
          <View style={styles.periodSelector}>
            {periodOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === option.key && styles.activePeriodButton
                ]}
                onPress={() => setSelectedPeriod(option.key)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === option.key && styles.activePeriodButtonText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {}
        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>{i18n.t('reports.availableReports')}</Text>
          <View style={styles.reportsGrid}>
            {reportTypes.map(renderReportCard)}
          </View>
        </View>

        {}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Icon
              name="info"
              type="material"
              size={24}
              color={colors.primary}
              containerStyle={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{i18n.t('reports.aboutReportsTitle')}</Text>
              <Text style={styles.infoText}>
                {i18n.t('reports.aboutReportsDescription')}
              </Text>
            </View>
          </View>
        </View>
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
  },
  periodSection: {
    margin: constants.SPACING.md,
  },
  reportsSection: {
    margin: constants.SPACING.md,
    marginTop: 0,
  },
  infoSection: {
    margin: constants.SPACING.md,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: constants.SPACING.sm,
    alignItems: 'center',
    borderRadius: constants.BORDER_RADIUS,
  },
  activePeriodButton: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activePeriodButtonText: {
    color: colors.white,
  },
  reportsGrid: {
    gap: constants.SPACING.md,
  },
  reportCard: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.7,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: constants.SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
  },
  reportContent: {
    marginBottom: constants.SPACING.md,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.xs,
  },
  reportDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  disabledText: {
    color: colors.grey[400],
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: constants.SPACING.lg,
    paddingVertical: constants.SPACING.sm,
    borderRadius: constants.BORDER_RADIUS,
    minWidth: 80,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: constants.SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.xs,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

export default ReportsScreen;
