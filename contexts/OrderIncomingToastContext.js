import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';
import { colors, constants, parameters } from '../global';

const accentGradient = [colors.statusbar, colors.warning];
const iconGradient = [colors.primary, colors.grey[800]];

const OrderIncomingToastContext = createContext(null);

export const OrderIncomingToastProvider = ({ children }) => {
  const [payload, setPayload] = useState(null);
  const navigateToOrderRef = useRef(null);

  const registerNavigateToOrder = useCallback((fn) => {
    navigateToOrderRef.current = typeof fn === 'function' ? fn : null;
  }, []);

  const showIncomingOrder = useCallback(({ orderId, subtitle, sheetTitle, headerIcon }) => {
    if (!orderId) return;
    setPayload({
      orderId,
      subtitle: subtitle || null,
      sheetTitle: sheetTitle || null,
      headerIcon: headerIcon || null,
    });
  }, []);

  const hideIncomingOrder = useCallback(() => {
    setPayload(null);
  }, []);

  const onViewPress = useCallback(() => {
    if (!payload?.orderId) return;
    const id = payload.orderId;
    hideIncomingOrder();
    const go = navigateToOrderRef.current;
    if (typeof go === 'function') {
      void go(id);
    }
  }, [payload, hideIncomingOrder]);

  const value = useMemo(
    () => ({ showIncomingOrder, hideIncomingOrder, registerNavigateToOrder }),
    [showIncomingOrder, hideIncomingOrder, registerNavigateToOrder]
  );

  return (
    <OrderIncomingToastContext.Provider value={value}>
      {children}
      <OrderIncomingSheet
        visible={!!payload}
        orderId={payload?.orderId}
        subtitle={payload?.subtitle}
        sheetTitle={payload?.sheetTitle}
        headerIcon={payload?.headerIcon}
        onView={onViewPress}
        onDismiss={hideIncomingOrder}
      />
    </OrderIncomingToastContext.Provider>
  );
};

export const useOrderIncomingToast = () => {
  const ctx = useContext(OrderIncomingToastContext);
  if (!ctx) {
    throw new Error('useOrderIncomingToast must be used within OrderIncomingToastProvider');
  }
  return ctx;
};

const OrderIncomingSheet = ({ visible, orderId, subtitle, sheetTitle, headerIcon, onView, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const open = visible && !!orderId;

  if (!orderId) return null;

  const title = sheetTitle || i18n.t('orders.incomingOrderTitle');
  const line = subtitle || i18n.t('orders.incomingOrderSubtitle', { id: String(orderId) });
  const iconName = headerIcon || 'restaurant';

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.modalRoot} pointerEvents="box-none">
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.background.modal }]}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('orders.incomingOrderLater')}
        />
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, constants.SPACING.md) + constants.SPACING.sm,
            },
          ]}
        >
          <LinearGradient
            colors={accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentBar}
          />
          <View style={styles.sheetInner}>
            <View style={styles.handle} accessibilityElementsHidden />
            <View style={styles.headerRow}>
              <LinearGradient colors={iconGradient} style={styles.iconWrap}>
                <Ionicons name={iconName} size={26} color={colors.accent} />
              </LinearGradient>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle} numberOfLines={3}>
                  {line}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onView}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>{i18n.t('orders.incomingOrderPrimaryCta')}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.accent} style={styles.primaryChevron} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onDismiss}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{i18n.t('orders.incomingOrderLater')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    marginHorizontal: constants.SPACING.sm,
    marginBottom: constants.SPACING.xs,
    borderRadius: parameters.styledButton.borderRadius * 1.5,
    backgroundColor: colors.background.card,
    borderWidth: constants.BORDER_WIDTH,
    borderColor: colors.border.light,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: { elevation: 24 },
    }),
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  sheetInner: {
    paddingHorizontal: constants.SPACING.md,
    paddingTop: constants.SPACING.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    marginBottom: constants.SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: constants.SPACING.lg,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: constants.SPACING.md,
  },
  headerText: {
    flex: 1,
    paddingTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: constants.SPACING.xs,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text.secondary,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: parameters.styledButton.borderRadius,
    paddingVertical: 16,
    paddingHorizontal: constants.SPACING.md,
    borderWidth: parameters.styledButton.borderWidth,
    borderColor: colors.primary,
  },
  primaryBtnText: {
    color: colors.text.white,
    fontSize: 17,
    fontWeight: '700',
  },
  primaryChevron: {
    marginLeft: 6,
    marginTop: 1,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: constants.SPACING.md,
    marginTop: constants.SPACING.xs,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.muted,
  },
});
