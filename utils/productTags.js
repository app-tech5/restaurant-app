export const PRODUCT_TAGS = [
  'vegetarian',
  'vegan',
  'spicy',
];

export const normalizeProductTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag) => PRODUCT_TAGS.includes(tag));
};
