import { normalizeRestaurantServiceMode } from './restaurantUtils';

/**
 * Corps minimal POST `/resource/deliverysettings` à l'onboarding.
 * Les défauts (frais, rayon, etc.) viennent du schéma Mongoose — ne pas les dupliquer ici.
 */
export function buildDeliverySettingsOnboardingPayload(restaurantId, restaurantBody = {}) {
  const payload = { restaurant: restaurantId };
  const mode = normalizeRestaurantServiceMode(restaurantBody.serviceModes);

  if (mode === 'pickup') {
    payload.isDeliveryEnabled = false;
  }

  const prepRaw = parseInt(String(restaurantBody.collectTime ?? '').replace(/\D/g, ''), 10);
  if (Number.isFinite(prepRaw) && prepRaw >= 5 && prepRaw <= 180) {
    payload.deliveryPreparationTime = prepRaw;
  }

  return payload;
}

export function isRestaurantAvailableForDelivery(serviceModes) {
  return normalizeRestaurantServiceMode(serviceModes) === 'delivery';
}
