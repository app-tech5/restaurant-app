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
