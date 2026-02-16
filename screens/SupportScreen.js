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

  // Récupération des données depuis les contextes
  const { restaurant } = useRestaurant();
  const { appName, settings } = useSettings();

  const supportCategories = [
    { key: 'general', label: 'Général', icon: 'help' },
    { key: 'technical', label: 'Technique', icon: 'build' },
    { key: 'orders', label: 'Commandes', icon: 'restaurant' },
    { key: 'billing', label: 'Facturation', icon: 'payment' },
    { key: 'account', label: 'Compte', icon: 'account-circle' },
  ];

  const faqItems = [
    {
      question: 'Comment modifier mon menu ?',
      answer: 'Allez dans l\'onglet Menu et cliquez sur un plat pour le modifier.',
      category: 'general'
    },
    {
      question: 'Comment accepter une commande ?',
      answer: 'Dans l\'onglet Commandes, touchez une commande en attente et cliquez sur "Accepter".',
      category: 'orders'
    },
    {
      question: 'Comment changer mes horaires ?',
      answer: 'Allez dans Paramètres > Restaurant > Horaires d\'ouverture.',
      category: 'general'
    },
    {
      question: `Comment contacter le support pour ${restaurant?.name || 'mon restaurant'} ?`,
      answer: 'Utilisez le formulaire ci-dessous ou appelez le numéro indiqué.',
      category: 'general'
    }
  ];

  // Données de contact dynamiques depuis les contextes
  const contactMethods = [
    {
      title: 'Téléphone',
      subtitle: restaurant?.phone || '+33 1 23 45 67 89',
      icon: 'phone',
      action: () => Linking.openURL(`tel:${restaurant?.phone || '+33123456789'}`)
    },
    {
      title: 'Email',
      subtitle: settings?.supportEmail || 'support@goodfood.com',
      icon: 'email',
      action: () => Linking.openURL(`mailto:${settings?.supportEmail || 'support@goodfood.com'}`)
    },
    {
      title: 'Chat en ligne',
      subtitle: 'Disponible 24/7',
      icon: 'chat',
      action: () => Alert.alert('Chat', 'Le chat en ligne sera bientôt disponible')
    }
  ];

  const handleSubmitSupport = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Simulation d'envoi
    Alert.alert(
      'Message envoyé',
      `Votre message concernant ${restaurant?.name || 'votre restaurant'} a été envoyé avec succès. L'équipe ${appName || 'Good Food'} vous répondra dans les plus brefs délais.`,
      [{ text: 'OK', onPress: () => {
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
        {/* Méthodes de contact rapide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact rapide</Text>
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

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>

          {/* Filtres de catégorie */}
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

          {/* Liste FAQ */}
          {filteredFaq.map((faq, index) => (
            <Card key={index} containerStyle={styles.faqCard}>
              <Card.Title style={styles.faqQuestion}>{faq.question}</Card.Title>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </Card>
          ))}
        </View>

        {/* Formulaire de contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Envoyer un message</Text>

          <Card containerStyle={styles.contactForm}>
            <Input
              placeholder="Sujet de votre message"
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
              placeholder="Votre message..."
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
              title="Envoyer"
              onPress={handleSubmitSupport}
              buttonStyle={styles.submitButton}
              containerStyle={styles.submitButtonContainer}
            />
          </Card>
        </View>

        {/* Informations supplémentaires */}
        <View style={styles.section}>
          <Card containerStyle={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon
                name="info"
                type="material"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.infoTitle}>Horaires de support {appName || 'Good Food'}</Text>
            </View>
            <Text style={styles.infoText}>
              L'équipe de support {appName || 'Good Food'} est disponible :
            </Text>
            <Text style={styles.infoText}>• Lundi - Vendredi : 9h00 - 18h00</Text>
            <Text style={styles.infoText}>• Samedi : 10h00 - 16h00</Text>
            <Text style={styles.infoText}>• Dimanche : Fermé</Text>
            <Text style={styles.infoText}>
              Temps de réponse moyen : 2-4 heures en semaine
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
