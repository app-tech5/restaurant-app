/**
 * Mongo _id of the Restaurant document (not the User account id).
 * @param {object|null|undefined} restaurant — stored session user / profile object
 */
export function resolveRestaurantPlaceId(restaurant) {
  const r = restaurant;
  if (!r) return null;
  const ref = r.restaurant;
  if (ref != null) {
    return typeof ref === 'object' && ref._id != null ? ref._id : ref;
  }
  return r._id;
}

/** Compte lié à un restaurant ou profil restaurant déjà en cache */
export function userHasLinkedRestaurant(user) {
  if (!user) return false;
  if (user.restaurant != null) {
    const ref = user.restaurant;
    if (typeof ref === 'object') return !!(ref._id || ref.id);
    return String(ref).length > 0;
  }
  return !!(user.description || user.openingTime || user.image);
}
