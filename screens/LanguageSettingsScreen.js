import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components';
import { useSettings } from '../contexts/SettingContext';
import { colors, constants } from '../global';
import i18n from '../i18n';

const LanguageSettingsScreen = ({ navigation }) => {
  const { language, changeLanguage, getAvailableLanguages } = useSettings();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getAvailableLanguages();
        if (mounted) setLanguages(Array.isArray(list) ? list : []);
      } catch (error) {
        if (mounted) {
          setLanguages([
            { code: 'fr', name: 'Français' },
            { code: 'en', name: 'English' },
          ]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getAvailableLanguages]);

  const currentCode = language?.code || i18n.locale || 'fr';

  const handleSelect = async (code) => {
    try {
      await changeLanguage(code);
      Alert.alert(
        i18n.t('success.saved'),
        i18n.t('settings.languageChanged', { language: String(code).toUpperCase() })
      );
    } catch (error) {
      Alert.alert(i18n.t('errors.error'), i18n.t('settings.languageLoadError'));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title={i18n.t('settings.language')} autoLeftNav />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{i18n.t('settings.selectLanguage')}</Text>
        {loading ? (
          <Text style={styles.hint}>{i18n.t('common.loading')}</Text>
        ) : (
          languages.map((lang) => {
            const selected = String(lang.code) === String(currentCode);
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => handleSelect(lang.code)}
              >
                <View>
                  <Text style={styles.rowTitle}>{lang.name}</Text>
                  <Text style={styles.rowSubtitle}>{String(lang.code).toUpperCase()}</Text>
                </View>
                {selected ? <Icon name="check" color={colors.primary} size={22} /> : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: constants.SPACING.md, paddingBottom: constants.SPACING.xl },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: constants.SPACING.md,
  },
  hint: { color: colors.text.secondary, marginTop: constants.SPACING.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: constants.SPACING.md,
    paddingHorizontal: constants.SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey[200],
    borderRadius: constants.BORDER_RADIUS,
    marginBottom: constants.SPACING.sm,
    backgroundColor: colors.white,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
  rowSubtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
});

export default LanguageSettingsScreen;
