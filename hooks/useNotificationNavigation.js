import { useEffect, useRef } from 'react';
import apiClient from '../api';
import { subscribeFcmNotificationOpened } from '../services/fcmBackgroundTap';
import {
  addNotificationTapListener,
  addNotificationReceivedListener,
  consumeStoredNotificationData,
  getInitialNotificationData,
  getOrderIdFromNotificationData,
} from '../services/pushNotifications';
import { useOrderIncomingToast } from '../contexts/OrderIncomingToastContext';
import i18n from '../i18n';

const DEDUPE_MS = 2000;

export const useNotificationNavigation = (navigationRef, isAuthenticated) => {
  const pendingOrderIdRef = useRef(null);
  const lastHandledRef = useRef({ orderId: null, at: 0 });
  const { showIncomingOrder, registerNavigateToOrder } = useOrderIncomingToast();

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

    const navigateOnce = async (orderId) => {
      if (!orderId) return;
      const now = Date.now();
      const { orderId: prev, at } = lastHandledRef.current;
      if (prev === orderId && now - at < DEDUPE_MS) return;
      lastHandledRef.current = { orderId, at: now };
      await openOrderDetails(orderId);
    };

    const handleNotificationTap = async (data) => {
      const orderId = getOrderIdFromNotificationData(data);
      if (!orderId) {
        const storedData = await consumeStoredNotificationData();
        const fallbackOrderId = getOrderIdFromNotificationData(storedData);
        if (!fallbackOrderId) return;
        await navigateOnce(fallbackOrderId);
        return;
      }
      await navigateOnce(orderId);
    };

    const handleForegroundIncoming = async (data) => {
      const orderId = getOrderIdFromNotificationData(data);
      if (!orderId) return;
      const pt = data?.type != null ? String(data.type) : '';
      if (pt && pt !== 'order' && pt !== 'order_cancelled') return;

      const isCancelled = pt === 'order_cancelled';
      const subtitleFromPush = typeof data.body === 'string' && data.body.trim() ? data.body.trim() : null;
      const titleFromPush = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : null;

      showIncomingOrder({
        orderId,
        ...(isCancelled
          ? {
            sheetTitle: titleFromPush ?? i18n.t('orders.incomingCancelledSheetTitle'),
            subtitle:
              subtitleFromPush
              ?? i18n.t('orders.incomingCancelledSheetSubtitle', { id: String(orderId) }),
            headerIcon: 'close-circle-outline',
          }
          : {}),
      });
    };

    registerNavigateToOrder((orderId) => {
      void navigateOnce(orderId);
    });

    const unsubscribeReceived = addNotificationReceivedListener(handleForegroundIncoming);
    const unsubscribe = addNotificationTapListener(handleNotificationTap);
    const unsubscribeFcm = subscribeFcmNotificationOpened((orderId) => {
      navigateOnce(orderId);
    });

    getInitialNotificationData().then(async (data) => {
      const orderId = getOrderIdFromNotificationData(data);
      if (!orderId) return;
      navigateOnce(orderId);
    });

    return () => {
      registerNavigateToOrder(null);
      unsubscribe();
      unsubscribeReceived();
      unsubscribeFcm();
    };
  }, [isAuthenticated, navigationRef, showIncomingOrder, registerNavigateToOrder]);

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
