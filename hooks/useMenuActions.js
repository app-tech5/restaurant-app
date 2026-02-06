import { useState } from 'react';
import { Alert } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import i18n from '../i18n';

export const useMenuActions = (navigation) => {
  const {
    loadMenu,
    deleteMenuItem,
    toggleMenuItemAvailability,
    isAuthenticated
  } = useRestaurant();

  const [refreshing, setRefreshing] = useState(false);

  const loadMenuItems = async () => {
    try {
      await loadMenu();
    } catch (error) {
      console.error('Erreur chargement menu:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMenuItems();
    setRefreshing(false);
  };

  const handleAddMenuItem = () => {
    navigation.navigate('AddEditMenuItem', { mode: 'add' });
  };

  const handleEditMenuItem = (item) => {
    navigation.navigate('AddEditMenuItem', { mode: 'edit', item });
  };

  const handleDeleteMenuItem = async (itemId) => {
    Alert.alert(
      i18n.t('common.confirm'),
      i18n.t('menu.deleteItem') + ' ?',
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenuItem(itemId);
            } catch (error) {
              console.error('Erreur suppression item:', error);
            }
          }
        }
      ]
    );
  };

  const handleToggleAvailability = async (itemId, available) => {
    try {
      await toggleMenuItemAvailability(itemId, available);
    } catch (error) {
      console.error('Erreur changement disponibilité:', error);
    }
  };

  return {
    refreshing,
    loadMenuItems,
    onRefresh,
    handleAddMenuItem,
    handleEditMenuItem,
    handleDeleteMenuItem,
    handleToggleAvailability
  };
};
