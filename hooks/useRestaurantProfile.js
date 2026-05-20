import apiClient from '../api';
import { loadRestaurantProfileWithSmartCache, clearRestaurantProfileCache } from '../utils/cacheUtils';
import { resolveRestaurantPlaceId } from '../utils/restaurantIdUtils';

export const useRestaurantProfile = (restaurant, isAuthenticated) => {
  const loadRestaurantProfile = async () => {
    const restaurantId =
      resolveRestaurantPlaceId(restaurant) ?? apiClient.resolveRestaurantPlaceId();
    if (!isAuthenticated || !restaurantId) {
      return null;
    }

    let profile = null;
    try {
      await loadRestaurantProfileWithSmartCache(
        String(restaurantId),
        () => apiClient.getRestaurantProfile(),
        (data) => {
          profile = data;
        },
        (data) => {
          profile = data;
        },
        null,
        (errorMsg) => {
          console.error('Erreur chargement profil restaurant:', errorMsg);
        }
      );
    } catch (error) {
      console.error('Error loading restaurant profile with smart cache:', error);
    }
    return profile;
  };

  const invalidateRestaurantProfileCache = async () => {
    const restaurantId =
      resolveRestaurantPlaceId(restaurant) ?? apiClient.resolveRestaurantPlaceId();
    if (!restaurantId) {
      return null;
    }
    try {
      await clearRestaurantProfileCache(String(restaurantId));
      return loadRestaurantProfile();
    } catch (error) {
      console.error('Erreur lors de l\'invalidation du cache du profil restaurant:', error);
      return null;
    }
  };

  return {
    loadRestaurantProfile,
    invalidateRestaurantProfileCache,
  };
};
