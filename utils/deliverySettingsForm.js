/** Champs formulaire restaurant-app ↔ document API `DeliverySetting`. */

export const RESTAURANT_DELIVERY_FEE_TYPES = Object.freeze(['FIXED', 'DYNAMIC']);

export function normalizeDeliveryFeeType(raw) {
  if (raw === 'DYNAMIC' || raw === 'RESTAURANT_DEFINED') return 'DYNAMIC';
  return 'FIXED';
}

function dynFromDoc(doc) {
  const d = doc?.dynamicDeliveryFee;
  return d && typeof d === 'object' ? d : {};
}

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
    freeDeliveryEnabled: false,
    deliveryRadius: String(radius),
    deliveryFeeType: 'FIXED',
    fixedFee: '2.50',
    baseFee: '1.50',
    perKmFee: '0.50',
    minFee: '1.50',
    maxFee: '10.00',
    freeDeliveryThreshold: '25.00',
    estimatedTime: '30',
  };
}

export function deliverySettingsFormFromDoc(doc, restaurant) {
  if (!doc || !doc._id) {
    return deliverySettingsFormDefaults(restaurant);
  }
  const dyn = dynFromDoc(doc);
  return {
    deliveryEnabled: doc.isDeliveryEnabled !== false,
    pickupEnabled: doc.isPickupEnabled !== false,
    freeDeliveryEnabled: !!doc.freeDeliveryEnabled,
    deliveryRadius: String(doc.maxDeliveryDistance ?? 15),
    deliveryFeeType: normalizeDeliveryFeeType(doc.deliveryFeeType),
    fixedFee: String(doc.fixedDeliveryFee ?? 2.5),
    baseFee: String(dyn.baseFee ?? 1.5),
    perKmFee: String(dyn.perKmFee ?? 0.5),
    minFee: String(dyn.minFee ?? 1.5),
    maxFee: String(dyn.maxFee ?? 10),
    freeDeliveryThreshold: String(doc.freeDeliveryThreshold ?? 25),
    estimatedTime: String(doc.deliveryPreparationTime ?? 30),
  };
}

export function buildDeliverySettingsPayload(formData, restaurantId, baselineDoc) {
  const maxDeliveryDistance = Math.min(
    50,
    Math.max(1, parseFloat(formData.deliveryRadius))
  );
  const prep = parseInt(String(formData.estimatedTime).trim(), 10) || 30;
  const feeType = normalizeDeliveryFeeType(formData.deliveryFeeType);

  const existingDyn = dynFromDoc(baselineDoc);
  const dynamicDeliveryFee = {
    baseFee: parseFloat(formData.baseFee),
    perKmFee: parseFloat(formData.perKmFee),
    minFee: parseFloat(formData.minFee),
    maxFee: parseFloat(formData.maxFee),
  };

  if (!Number.isFinite(dynamicDeliveryFee.baseFee)) {
    dynamicDeliveryFee.baseFee = Number(existingDyn.baseFee) || 1.5;
  }
  if (!Number.isFinite(dynamicDeliveryFee.perKmFee)) {
    dynamicDeliveryFee.perKmFee = Number(existingDyn.perKmFee) || 0.5;
  }
  if (!Number.isFinite(dynamicDeliveryFee.minFee)) {
    dynamicDeliveryFee.minFee = Number(existingDyn.minFee) || 1.5;
  }
  if (!Number.isFinite(dynamicDeliveryFee.maxFee)) {
    dynamicDeliveryFee.maxFee = Number(existingDyn.maxFee) || 10;
  }

  return {
    restaurant: restaurantId,
    isDeliveryEnabled: !!formData.deliveryEnabled,
    isPickupEnabled: !!formData.pickupEnabled,
    maxDeliveryDistance,
    deliveryFeeType: feeType,
    fixedDeliveryFee: parseFloat(formData.fixedFee),
    dynamicDeliveryFee,
    freeDeliveryEnabled: !!formData.freeDeliveryEnabled,
    freeDeliveryThreshold: formData.freeDeliveryEnabled
      ? parseFloat(formData.freeDeliveryThreshold)
      : 0,
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

  if (formData.freeDeliveryEnabled) {
    const th = parseFloat(formData.freeDeliveryThreshold);
    if (!Number.isFinite(th) || th < 0) {
      return t('delivery.invalidThreshold');
    }
  }

  const isDynamic = normalizeDeliveryFeeType(formData.deliveryFeeType) === 'DYNAMIC';

  if (isDynamic) {
    const baseFee = parseFloat(formData.baseFee);
    const perKm = parseFloat(formData.perKmFee);
    const minFee = parseFloat(formData.minFee);
    const maxFee = parseFloat(formData.maxFee);
    if (
      ![baseFee, perKm, minFee, maxFee].every((n) => Number.isFinite(n) && n >= 0)
    ) {
      return t('delivery.invalidFee');
    }
    if (minFee > maxFee) {
      return t('delivery.invalidMinMax');
    }
  } else {
    const fixed = parseFloat(formData.fixedFee);
    if (!Number.isFinite(fixed) || fixed < 0) {
      return t('delivery.invalidFee');
    }
  }

  return null;
}
