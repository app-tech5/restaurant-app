import { useEffect, useRef } from 'react';
import apiClient from '../api';
import {
  addNotificationTapListener,
  addNotificationReceivedListener,
  consumeStoredNotificationData,
  getInitialNotificationData,
  getOrderIdFromNotificationData,
} from '../services/pushNotifications';

export const useNotificationNavigation = (navigationRef, isAuthenticated) => {
  const pendingOrderIdRef = useRef(null);

  useEffect(() => {
    const openOrderDetails = async (orderId) => {
      if (!orderId) return;
      if (!isAuthenticated || !navigationRef.current) {
        pendingOrderIdRef.current = orderId;
        return;
      }

      try {
        const order = await apiClient.getOrderById(orderId);
        navigationRef.current.navigate('DrawerNavigator', {
          screen: 'Orders',
          params: {
            screen: 'OrderDetails',
            params: { order },
          },
        });
      } catch (error) {
        navigationRef.current.navigate('DrawerNavigator', {
          screen: 'Orders',
          params: { screen: 'OrdersMain' },
        });
      }
    };

    const handleNotificationTap = async (data) => {
      const orderId = getOrderIdFromNotificationData(data);
      if (!orderId) {
        const storedData = await consumeStoredNotificationData();
        const fallbackOrderId = getOrderIdFromNotificationData(storedData);
        if (!fallbackOrderId) return;
        await openOrderDetails(fallbackOrderId);
        return;
      }
      await openOrderDetails(orderId);
    };

    const unsubscribeReceived = addNotificationReceivedListener(() => {});
    const unsubscribe = addNotificationTapListener(handleNotificationTap);

    getInitialNotificationData().then(async (data) => {
      let orderId = getOrderIdFromNotificationData(data);
      if (!orderId) {
        const storedData = await consumeStoredNotificationData();
        orderId = getOrderIdFromNotificationData(storedData);
      }
      if (!orderId) return;
      openOrderDetails(orderId);
    });

    return () => {
      unsubscribe();
      unsubscribeReceived();
    };
  }, [isAuthenticated, navigationRef]);

  useEffect(() => {
    if (!isAuthenticated || !pendingOrderIdRef.current) return;
    const orderId = pendingOrderIdRef.current;
    pendingOrderIdRef.current = null;

    apiClient.getOrderById(orderId)
      .then((order) => {
        if (!navigationRef.current) return;
        navigationRef.current.navigate('DrawerNavigator', {
          screen: 'Orders',
          params: {
            screen: 'OrderDetails',
            params: { order },
          },
        });
      })
      .catch(() => {
        if (!navigationRef.current) return;
        navigationRef.current.navigate('DrawerNavigator', {
          screen: 'Orders',
          params: { screen: 'OrdersMain' },
        });
      });
  }, [isAuthenticated, navigationRef]);
};
