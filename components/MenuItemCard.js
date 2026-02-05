import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Icon } from 'react-native-elements';
import { colors, constants } from '../global';
import { formatPrice } from '../utils/restaurantUtils';
import i18n from '../i18n';

const MenuItemCard = ({
  item,
  onPress = null,
  onEdit = null,
  onDelete = null,
  onToggleAvailability = null,
  showActions = true,
  style = {}
}) => {
  const {
    _id,
    name,
    description,
    price,
    category,
    available = true,
    image = null
  } = item;

  const handleDelete = () => {
    Alert.alert(
      i18n.t('common.confirm'),
      i18n.t('menu.deleteItem') + ' "' + name + '" ?',
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => onDelete && onDelete(_id)
        }
      ]
    );
  };

  const handleToggleAvailability = () => {
    onToggleAvailability && onToggleAvailability(_id, !available);
  };

  return (
    <Card containerStyle={[styles.card, style]}>
      <TouchableOpacity
        onPress={onPress ? () => onPress(item) : null}
        style={styles.content}
        disabled={!onPress}
      >
        {/* Image placeholder ou vraie image */}
        <View style={styles.imageContainer}>
          {image ? (
            <Card.Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon
                name="restaurant"
                type="material"
                size={32}
                color={colors.grey[400]}
              />
            </View>
          )}
        </View>

        {/* Informations principales */}
        <View style={styles.infoContainer}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            <Text style={styles.price}>
              {formatPrice(price)}
            </Text>
          </View>

          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}

          <View style={styles.footer}>
            <View style={styles.categoryContainer}>
              <Icon
                name="label"
                type="material"
                size={14}
                color={colors.grey[600]}
              />
              <Text style={styles.category}>
                {category}
              </Text>
            </View>

            <View style={[styles.availabilityBadge, { backgroundColor: available ? '#4CAF50' : '#F44336' }]}>
              <Text style={styles.availabilityText}>
                {available ? i18n.t('menu.available') : i18n.t('menu.unavailable')}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Actions */}
      {showActions && (
        <View style={styles.actionsContainer}>
          {onToggleAvailability && (
            <TouchableOpacity
              onPress={handleToggleAvailability}
              style={[styles.actionButton, { backgroundColor: available ? '#F44336' : '#4CAF50' }]}
            >
              <Icon
                name={available ? 'visibility-off' : 'visibility'}
                type="material"
                size={16}
                color={colors.white}
              />
              <Text style={styles.actionButtonText}>
                {available ? i18n.t('common.disable') : i18n.t('common.enable')}
              </Text>
            </TouchableOpacity>
          )}

          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            >
              <Icon
                name="edit"
                type="material"
                size={16}
                color={colors.white}
              />
              <Text style={styles.actionButtonText}>
                {i18n.t('common.edit')}
              </Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.actionButton, { backgroundColor: '#F44336' }]}
            >
              <Icon
                name="delete"
                type="material"
                size={16}
                color={colors.white}
              />
              <Text style={styles.actionButtonText}>
                {i18n.t('common.delete')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: constants.BORDER_RADIUS,
    padding: 0,
    margin: constants.SPACING.sm,
    marginBottom: constants.SPACING.sm,
  },
  content: {
    flexDirection: 'row',
    padding: constants.SPACING.md,
  },
  imageContainer: {
    marginRight: constants.SPACING.md,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.grey[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: constants.SPACING.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: constants.SPACING.sm,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  description: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: constants.SPACING.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: constants.SPACING.md,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default MenuItemCard;
