import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { Card, Button, Icon } from 'react-native-elements';
import { useRestaurant } from '../contexts/RestaurantContext';
import { ScreenHeader } from '../components';
import { colors, constants } from '../global';
import { getOrderStatusLabel, getOrderStatusColor, formatPrice } from '../utils/restaurantUtils';
import i18n from '../i18n';

const OrderDetailsScreen = ({ route, navigation }) => {
  const { order } = route.params;
  const {
    updateOrderStatus,
    acceptOrder,
    prepareOrder,
    readyForPickup
  } = useRestaurant();

  const [isLoading, setIsLoading] = useState(false);

  if (!order) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Détails commande"
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Commande introuvable</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const {
    _id,
    customerName,
    customerPhone,
    customerAddress,
    items = [],
    total,
    status,
    createdAt,
    estimatedTime,
    notes,
    paymentMethod
  } = order;

  const statusLabel = getOrderStatusLabel(status);
  const statusColor = getOrderStatusColor(status);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR'),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const formatEstimatedTime = (minutes) => {
    if (!minutes) return 'Non spécifié';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? `${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const handleStatusChange = async (newStatus) => {
    Alert.alert(
      'Confirmer le changement',
      `Voulez-vous changer le statut de cette commande à "${getOrderStatusLabel(newStatus)}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setIsLoading(true);
              await updateOrderStatus(_id, newStatus);
              Alert.alert('Succès', 'Statut de la commande mis à jour');
            } catch (error) {
              console.error('Erreur mise à jour statut:', error);
              Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      await acceptOrder(_id);
      Alert.alert('Succès', 'Commande acceptée');
    } catch (error) {
      console.error('Erreur acceptation:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter la commande');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrepare = async () => {
    try {
      setIsLoading(true);
      await prepareOrder(_id);
      Alert.alert('Succès', 'Commande en préparation');
    } catch (error) {
      console.error('Erreur préparation:', error);
      Alert.alert('Erreur', 'Impossible de commencer la préparation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReady = async () => {
    try {
      setIsLoading(true);
      await readyForPickup(_id);
      Alert.alert('Succès', 'Commande prête pour le retrait');
    } catch (error) {
      console.error('Erreur prêt:', error);
      Alert.alert('Erreur', 'Impossible de marquer comme prête');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionButtons = () => {
    const buttons = [];

    switch (status) {
      case 'pending':
        buttons.push(
          <Button
            key="accept"
            title="Accepter"
            buttonStyle={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={handleAccept}
            loading={isLoading}
            disabled={isLoading}
          />
        );
        buttons.push(
          <Button
            key="reject"
            title="Refuser"
            buttonStyle={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => handleStatusChange('cancelled')}
            disabled={isLoading}
          />
        );
        break;

      case 'accepted':
        buttons.push(
          <Button
            key="prepare"
            title="Commencer préparation"
            buttonStyle={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handlePrepare}
            loading={isLoading}
            disabled={isLoading}
          />
        );
        break;

      case 'preparing':
        buttons.push(
          <Button
            key="ready"
            title="Marquer comme prête"
            buttonStyle={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={handleReady}
            loading={isLoading}
            disabled={isLoading}
          />
        );
        break;

      case 'ready':
        buttons.push(
          <Text key="ready-text" style={styles.readyText}>
            Commande prête pour le retrait
          </Text>
        );
        break;

      default:
        break;
    }

    return buttons;
  };

  const orderDateTime = formatDateTime(createdAt);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`Commande #${_id.slice(-6)}`}
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Statut de la commande */}
        <Card containerStyle={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
            <Text style={styles.orderId}>#{_id.slice(-6)}</Text>
          </View>

          <View style={styles.orderInfo}>
            <Text style={styles.orderDate}>
              {orderDateTime.date} à {orderDateTime.time}
            </Text>
            {estimatedTime && (
              <Text style={styles.estimatedTime}>
                Temps estimé: {formatEstimatedTime(estimatedTime)}
              </Text>
            )}
          </View>
        </Card>

        {/* Actions disponibles */}
        {getActionButtons().length > 0 && (
          <Card containerStyle={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Actions</Text>
            <View style={styles.actionsContainer}>
              {getActionButtons()}
            </View>
          </Card>
        )}

        {/* Informations client */}
        <Card containerStyle={styles.customerCard}>
          <Text style={styles.cardTitle}>Informations client</Text>

          <View style={styles.customerInfo}>
            <View style={styles.infoRow}>
              <Icon name="person" size={20} color={colors.grey[600]} />
              <Text style={styles.infoText}>{customerName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="phone" size={20} color={colors.grey[600]} />
              <Text style={styles.infoText}>{customerPhone}</Text>
            </View>

            {customerAddress && (
              <View style={styles.infoRow}>
                <Icon name="location-on" size={20} color={colors.grey[600]} />
                <Text style={styles.infoText}>{customerAddress}</Text>
              </View>
            )}

            {paymentMethod && (
              <View style={styles.infoRow}>
                <Icon name="payment" size={20} color={colors.grey[600]} />
                <Text style={styles.infoText}>
                  Paiement: {paymentMethod === 'card' ? 'Carte bancaire' :
                           paymentMethod === 'cash' ? 'Espèces' : paymentMethod}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Articles commandés */}
        <Card containerStyle={styles.itemsCard}>
          <Text style={styles.cardTitle}>Articles commandés</Text>

          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}
                <Text style={styles.itemQuantity}>Quantité: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
          </View>
        </Card>

        {/* Notes spéciales */}
        {notes && (
          <Card containerStyle={styles.notesCard}>
            <Text style={styles.cardTitle}>Notes spéciales</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </Card>
        )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: constants.SPACING.xl,
  },
  errorText: {
    fontSize: 18,
    color: colors.grey[600],
    marginBottom: constants.SPACING.lg,
  },
  backButton: {
    paddingHorizontal: constants.SPACING.lg,
    paddingVertical: constants.SPACING.md,
    backgroundColor: colors.primary,
    borderRadius: constants.BORDER_RADIUS,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: constants.SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.xs,
    borderRadius: constants.BORDER_RADIUS / 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  orderInfo: {
    marginTop: constants.SPACING.sm,
  },
  orderDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  estimatedTime: {
    fontSize: 14,
    color: colors.primary,
    marginTop: constants.SPACING.xs,
  },
  actionsCard: {
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
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: constants.SPACING.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: constants.BORDER_RADIUS,
  },
  readyText: {
    fontSize: 16,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
  customerCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  customerInfo: {
    gap: constants.SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: constants.SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  itemsCard: {
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: constants.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[100],
  },
  itemInfo: {
    flex: 1,
    marginRight: constants.SPACING.md,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: constants.SPACING.xs,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.grey[600],
    marginTop: constants.SPACING.xs,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: constants.SPACING.md,
    marginTop: constants.SPACING.md,
    borderTopWidth: 2,
    borderTopColor: colors.grey[200],
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  notesCard: {
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
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});

export default OrderDetailsScreen;
