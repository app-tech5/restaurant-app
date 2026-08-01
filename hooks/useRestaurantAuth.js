import { useState, useEffect } from 'react';
import apiClient from '../api';
import { getNativePushToken } from '../services/pushNotifications';
import {
  getRestaurantFromCache,
  updateRestaurantCache,
  getDeviceTokenFromCache,
  saveDeviceTokenToCache,
} from '../utils/storageUtils';
import { withRestaurantAccountEmail, buildRestaurantTaxField } from '../utils/restaurantUtils';
import { resolveRestaurantPlaceId, userHasLinkedRestaurant } from '../utils/restaurantIdUtils';
import {
  loadRestaurantProfileWithSmartCache,
  clearAllLocalAppDataOnLogout,
} from '../utils/cacheUtils';
import {
  buildDeliverySettingsOnboardingPayload,
  isRestaurantAvailableForDelivery,
} from '../utils/deliverySettingsUtils';

export const useRestaurantAuth = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const syncPushToken = async () => {
    try {
      const token = await getNativePushToken();
      const cachedDeviceToken = await getDeviceTokenFromCache();
      if (token && token !== cachedDeviceToken) {
        await apiClient.updateDeviceToken(token);
        await saveDeviceTokenToCache(token);
      }
    } catch (error) {
    }
  };

  const applyRestaurantProfile = async (profileData, accountUser, authToken) => {
    if (profileData && (profileData._id || profileData.id)) {
      const merged = withRestaurantAccountEmail(profileData, accountUser);
      setRestaurant(merged);
      setNeedsOnboarding(false);
      if (authToken) {
        await updateRestaurantCache(merged, authToken);
      }
      return merged;
    }
    setRestaurant(accountUser);
    setNeedsOnboarding(!userHasLinkedRestaurant(accountUser));
    return null;
  };

  const refreshRestaurantProfile = async (accountUser, token) => {
    const restaurantId =
      resolveRestaurantPlaceId(accountUser) ?? apiClient.resolveRestaurantPlaceId();
    if (!restaurantId || !accountUser) {
      return null;
    }

    let profileData = null;
    try {
      await loadRestaurantProfileWithSmartCache(
        String(restaurantId),
        () => apiClient.getRestaurantProfile(),
        (data) => {
          profileData = data;
        },
        (data) => {
          profileData = data;
        },
        null,
        (errorMsg) => {
          console.error('Erreur chargement profil restaurant:', errorMsg);
        }
      );
    } catch (error) {
      console.error('Error loading restaurant profile with smart cache:', error);
    }
    return applyRestaurantProfile(profileData, accountUser, token);
  };

  useEffect(() => {
    const initializeRestaurant = async () => {
      try {
        const cached = await getRestaurantFromCache();
        if (cached?.restaurant && cached?.token) {
          const authenticatedUser = cached.restaurant;
          apiClient.token = cached.token;
          apiClient.userId = authenticatedUser._id || authenticatedUser.id || null;
          apiClient.restaurant = authenticatedUser;
          setIsAuthenticated(true);
          try {
            await refreshRestaurantProfile(authenticatedUser, cached.token);
          } catch (refreshError) {
            setRestaurant(authenticatedUser);
            setNeedsOnboarding(true);
          }
          await syncPushToken();
        }
      } catch (error) {
        console.error('Error initializing restaurant:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeRestaurant();
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await apiClient.restaurantLogin(email, password);
      if (response.user && response.token) {
        const authenticatedUser = response.user;
        await updateRestaurantCache(authenticatedUser, response.token);
        setIsAuthenticated(true);
        let merged = null;
        try {
          merged = await refreshRestaurantProfile(authenticatedUser, response.token);
        } catch (refreshError) {
        }
        if (!merged) {
          merged = apiClient.restaurant || authenticatedUser;
          setRestaurant(merged);
          setNeedsOnboarding(!userHasLinkedRestaurant(merged));
        }
        await syncPushToken();
        return { success: true, restaurant: merged };
      } else {
        throw new Error('Réponse de connexion invalide');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Erreur de connexion' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async ({ email, password, name, phone, address } = {}) => {
    try {
      setIsLoading(true);
      const response = await apiClient.restaurantSignup({
        email,
        password,
        name,
        phone,
        address,
      });
      if (!response?.user || !response?.token) {
        throw new Error(response?.message || 'Réponse de signup invalide');
      }
      const authenticatedUser = {
        ...response.user,
        _id: response.user._id || response.user.id,
        role: 'restaurant',
      };
      apiClient.restaurant = authenticatedUser;
      await updateRestaurantCache(authenticatedUser, response.token);
      setIsAuthenticated(true);
      setRestaurant(authenticatedUser);
      setNeedsOnboarding(true);
      await syncPushToken();
      return { success: true, user: authenticatedUser };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: error.message || 'Erreur de création de compte' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await clearAllLocalAppDataOnLogout();
      await apiClient.logout();
      setRestaurant(null);
      setIsAuthenticated(false);
      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const completeOnboarding = async (restaurantBody) => {
    try {
      const userId = apiClient.userId || apiClient.restaurant?._id || apiClient.restaurant?.id;
      if (!userId) {
        throw new Error('Missing user id for onboarding');
      }
      let taxField = null;
      try {
        const taxes = await apiClient.listTaxes();
        taxField = buildRestaurantTaxField(taxes, restaurantBody?.country);
      } catch (taxError) {
        console.warn('Could not load taxes for onboarding, leaving tax empty:', taxError?.message);
      }
      const newRestaurant = await apiClient.createRestaurantDoc({
        ...restaurantBody,
        users: { value: userId, label: apiClient.restaurant?.email || '' },
        tax: taxField,
      });
      const restaurantId = newRestaurant?._id || newRestaurant?.id;
      if (!restaurantId) {
        throw new Error('Restaurant document creation failed');
      }

      try {
        await apiClient.createDeliverySettingsForRestaurant(
          restaurantId,
          buildDeliverySettingsOnboardingPayload(restaurantId, restaurantBody)
        );
      } catch (deliveryError) {
        console.warn(
          'Delivery settings creation failed (restaurant still created):',
          deliveryError?.message
        );
      }

      const linkedUser = await apiClient.linkUserToRestaurant(userId, restaurantId);
      const finalUser =
        linkedUser && (linkedUser._id || linkedUser.id)
          ? linkedUser
          : { ...(apiClient.restaurant || {}), restaurant: restaurantId };
      apiClient.restaurant = finalUser;

      if (isRestaurantAvailableForDelivery(restaurantBody?.serviceModes)) {
        try {
          await apiClient.updateRestaurantProfile({ isAvailableForDelivery: true });
        } catch (profileError) {
          console.warn('Post-onboarding delivery profile sync skipped:', profileError?.message);
        }
      }
      const merged =
        withRestaurantAccountEmail(newRestaurant, finalUser) || finalUser || null;
      await updateRestaurantCache(merged, apiClient.token);
      setRestaurant(merged);
      setNeedsOnboarding(false);
      return { success: true, restaurant: merged };
    } catch (error) {
      console.error('Onboarding error:', error);
      return { success: false, message: error.message || 'Erreur de création du restaurant' };
    }
  };

  return {
    restaurant,
    isLoading,
    isAuthenticated,
    needsOnboarding,
    login,
    signup,
    logout,
    completeOnboarding,
    refreshRestaurantProfile,
    setRestaurant,
    setIsAuthenticated,
  };
};
