

export function deliverySettingsFormDefaults(restaurant) {
  let radius = 15;
  if (restaurant) {
    const n = Number(restaurant.distance);
    if (Number.isFinite(n) && n > 0) {
      radius = Math.min(50, Math.max(1, Math.round(n)));
    }
  }
  return {
    deliveryEnabled: true,
    pickupEnabled: true,
    deliveryRadius: String(radius),
    estimatedTime: '30',
  };
}

export function deliverySettingsFormFromDoc(doc, restaurant) {
  if (!doc || !doc._id) {
    return deliverySettingsFormDefaults(restaurant);
  }
  return {
    deliveryEnabled: doc.isDeliveryEnabled !== false,
    pickupEnabled: doc.isPickupEnabled !== false,
    deliveryRadius: String(doc.maxDeliveryDistance ?? 15),
    estimatedTime: String(doc.deliveryPreparationTime ?? 30),
  };
}

export function buildRestaurantDeliverySettingsPayload(formData, restaurantId) {
  const maxDeliveryDistance = Math.min(
    50,
    Math.max(1, parseFloat(formData.deliveryRadius))
  );
  const prep = parseInt(String(formData.estimatedTime).trim(), 10) || 30;

  return {
    restaurant: restaurantId,
    isDeliveryEnabled: !!formData.deliveryEnabled,
    isPickupEnabled: !!formData.pickupEnabled,
    maxDeliveryDistance,
    deliveryPreparationTime: Math.min(180, Math.max(5, prep)),
  };
}

export function validateDeliverySettingsForm(formData, t) {
  if (!formData.deliveryEnabled && !formData.pickupEnabled) {
    return t('delivery.serviceModeRequired');
  }

  const radiusNum = parseFloat(formData.deliveryRadius);
  if (!Number.isFinite(radiusNum) || radiusNum < 1 || radiusNum > 50) {
    return t('delivery.invalidRadius');
  }

  const prep = parseInt(String(formData.estimatedTime).trim(), 10);
  if (!Number.isFinite(prep) || prep < 5 || prep > 180) {
    return t('delivery.invalidTime');
  }

  return null;
}

export function resolveDeliveryFeeType(doc) {
  const raw = doc?.deliveryFeeType;
  if (raw === 'RESTAURANT_DEFINED') return 'DYNAMIC';
  if (raw === 'FREE' || raw === 'FIXED' || raw === 'DYNAMIC') return raw;
  return 'FIXED';
}

function formatAmount(value, currencySymbol) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(2)} ${currencySymbol}`;
}

export function getAdminDeliveryPricingSummary(doc, t, currencySymbol = '€') {
  if (!doc?._id) {
    return t('delivery.pricingNotConfigured');
  }

  const feeType = resolveDeliveryFeeType(doc);

  if (feeType === 'FREE') {
    return t('delivery.pricingFreeDelivery');
  }

  if (feeType === 'FIXED') {
    const amount = formatAmount(doc.fixedDeliveryFee, currencySymbol);
    if (doc.freeDeliveryEnabled) {
      const th = Number(doc.freeDeliveryThreshold);
      if (Number.isFinite(th) && th > 0) {
        return t('delivery.pricingSummaryFixedWithFree', {
          amount,
          threshold: formatAmount(th, currencySymbol),
        });
      }
      return t('delivery.pricingFreeDelivery');
    }
    return t('delivery.pricingSummaryFixed', { amount });
  }

  return t('delivery.pricingSummaryDynamic');
}
