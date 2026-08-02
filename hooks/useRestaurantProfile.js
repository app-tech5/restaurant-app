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
        }
      );
    } catch (error) {
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
      return null;
    }
  };

  return {
    loadRestaurantProfile,
    invalidateRestaurantProfileCache,
  };
};
