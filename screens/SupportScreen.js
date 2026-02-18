import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Text, RefreshControl } from 'react-native';
import { Card, Input, Button, ListItem, Icon } from 'react-native-elements';
import { ScreenHeader } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useSettings } from '../contexts/SettingContext';

const SupportScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const { restaurant } = useRestaurant();
  const { appName, settings } = useSettings();

  const supportCategories = [
    { key: 'general', label: i18n.t('support.categories.general'), icon: 'help' },
    { key: 'technical', label: i18n.t('support.categories.technical'), icon: 'build' },
    { key: 'orders', label: i18n.t('support.categories.orders'), icon: 'restaurant' },
    { key: 'billing', label: i18n.t('support.categories.billing'), icon: 'payment' },
    { key: 'account', label: i18n.t('support.categories.account'), icon: 'account-circle' },
  ];

  const faqItems = [
    {
      question: i18n.t('support.faq.menuEdit'),
      answer: i18n.t('support.faq.menuAnswer'),
      category: 'general'
    },
    {
      question: i18n.t('support.faq.acceptOrder'),
      answer: i18n.t('support.faq.acceptAnswer'),
      category: 'orders'
    },
    {
      question: i18n.t('support.faq.openingHours'),
      answer: i18n.t('support.faq.hoursAnswer'),
      category: 'general'
    },
    {
      question: i18n.t('support.faq.contactSupport'),
      answer: i18n.t('support.faq.contactAnswer'),
      category: 'general'
    }
  ];
  
  const contactMethods = [
    {
      title: i18n.t('support.phone'),
      subtitle: restaurant?.phone || '+33 1 23 45 67 89',
      icon: 'phone',
      action: () => Linking.openURL(`tel:${restaurant?.phone || '+33123456789'}`)
    },
    {
      title: i18n.t('support.email'),
      subtitle: settings?.supportEmail || 'support@goodfood.com',
      icon: 'email',
      action: () => Linking.openURL(`mailto:${settings?.supportEmail || 'support@goodfood.com'}`)
    },
    {
      title: i18n.t('support.liveChat'),
      subtitle: 'Available 24/7',
      icon: 'chat',
      action: () => Alert.alert(i18n.t('support.liveChat'), i18n.t('support.chatComingSoon'))
    }
  ];

  const handleSubmitSupport = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('support.contactForm.fillAllFields'));
      return;
    }
    
    Alert.alert(
      i18n.t('support.contactForm.messageSent'),
      i18n.t('support.contactForm.messageSentSuccess', {
        restaurantName: restaurant?.name || 'your restaurant',
        appName: appName || 'Good Food'
      }),
      [{ text: i18n.t('common.ok'), onPress: () => {
        setSubject('');
        setMessage('');
      }}]
    );
  };

  const filteredFaq = faqItems.filter(item =>
    selectedCategory === 'general' || item.category === selectedCategory
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`${i18n.t('navigation.support')} - ${appName || 'Good Food'}`}
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('support.quickContact')}</Text>
          {contactMethods.map((method, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={method.action}
            >
              <Icon
                name={method.icon}
                type="material"
                size={24}
                color={colors.primary}
                containerStyle={styles.contactIcon}
              />
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
              </View>
              <Icon
                name="chevron-right"
                type="material"
                size={24}
                color={colors.grey[400]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('support.frequentlyAskedQuestions')}</Text>

          {}
          <View style={styles.categoryFilters}>
            {supportCategories.map(category => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.key && styles.activeCategoryButton
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Icon
                  name={category.icon}
                  type="material"
                  size={16}
                  color={selectedCategory === category.key ? colors.white : colors.primary}
                />
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.key && styles.activeCategoryButtonText
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          {filteredFaq.map((faq, index) => (
            <Card key={index} containerStyle={styles.faqCard}>
              <Card.Title style={styles.faqQuestion}>{faq.question}</Card.Title>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </Card>
          ))}
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('support.contactForm.title')}</Text>

          <Card containerStyle={styles.contactForm}>
            <Input
              placeholder={i18n.t('support.contactForm.subjectPlaceholder')}
              value={subject}
              onChangeText={setSubject}
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
              leftIcon={
                <Icon
                  name="subject"
                  type="material"
                  size={20}
                  color={colors.grey[500]}
                />
              }
            />

            <Input
              placeholder={i18n.t('support.contactForm.messagePlaceholder')}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              containerStyle={styles.inputContainer}
              inputStyle={[styles.input, styles.textArea]}
              leftIcon={
                <Icon
                  name="message"
                  type="material"
                  size={20}
                  color={colors.grey[500]}
                  containerStyle={styles.textAreaIcon}
                />
              }
            />

            <Button
              title={i18n.t('support.contactForm.send')}
              onPress={handleSubmitSupport}
              buttonStyle={styles.submitButton}
              containerStyle={styles.submitButtonContainer}
            />
          </Card>
        </View>

        {}
        <View style={styles.section}>
          <Card containerStyle={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon
                name="info"
                type="material"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.infoTitle}>{i18n.t('support.supportHours.title')} {appName || 'Good Food'}</Text>
            </View>
            <Text style={styles.infoText}>
              {i18n.t('support.supportHours.description', { appName: appName || 'Good Food' })}
            </Text>
            <Text style={styles.infoText}>• {i18n.t('support.supportHours.mondayFriday')}</Text>
            <Text style={styles.infoText}>• {i18n.t('support.supportHours.saturday')}</Text>
            <Text style={styles.infoText}>• {i18n.t('support.supportHours.sunday')}</Text>
            <Text style={styles.infoText}>
              {i18n.t('support.supportHours.responseTime')}
            </Text>
          </Card>
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
  section: {
    margin: constants.SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: constants.SPACING.md,
    borderRadius: constants.BORDER_RADIUS,
    marginBottom: constants.SPACING.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactIcon: {
    marginRight: constants.SPACING.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  contactSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  categoryFilters: {
    flexDirection: 'row',
    marginBottom: constants.SPACING.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
    marginRight: constants.SPACING.sm,
    borderRadius: constants.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeCategoryButton: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: constants.SPACING.xs,
  },
  activeCategoryButtonText: {
    color: colors.white,
  },
  faqCard: {
    marginBottom: constants.SPACING.sm,
    borderRadius: constants.BORDER_RADIUS,
  },
  faqQuestion: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'left',
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  contactForm: {
    padding: constants.SPACING.md,
    borderRadius: constants.BORDER_RADIUS,
  },
  inputContainer: {
    paddingHorizontal: 0,
    marginBottom: constants.SPACING.md,
  },
  input: {
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaIcon: {
    alignSelf: 'flex-start',
    marginTop: constants.SPACING.sm,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: constants.BORDER_RADIUS,
  },
  submitButtonContainer: {
    marginTop: constants.SPACING.md,
  },
  infoCard: {
    padding: constants.SPACING.md,
    borderRadius: constants.BORDER_RADIUS,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: constants.SPACING.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: constants.SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: constants.SPACING.xs,
  },
});

export default SupportScreen;
