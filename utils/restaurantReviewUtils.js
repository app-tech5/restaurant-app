export function filterReviewsForRestaurant(allReviews, restaurantId) {
  if (!restaurantId) return [];
  const rid = String(restaurantId);
  return (Array.isArray(allReviews) ? allReviews : []).filter(
    (rev) =>
      String(rev.restaurant?._id || rev.restaurant) === rid &&
      (rev.status === 'approved' || rev.status == null)
  );
}

export function computeReviewStats(reviews) {
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? parseFloat(
          (reviews.reduce((s, rev) => s + (rev.rating || 0), 0) / totalReviews).toFixed(1)
        )
      : 0;
  const ratingCounts = reviews.reduce((acc, rev) => {
    const k = rev.rating;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  return { totalReviews, averageRating, ratingCounts };
}

export function buildRestaurantReviewsResult(restaurantId, rawReviewsArray) {
  const all = Array.isArray(rawReviewsArray) ? rawReviewsArray : [];
  const reviews = filterReviewsForRestaurant(all, restaurantId);
  const stats = computeReviewStats(reviews);
  return {
    success: true,
    data: {
      reviews,
      stats,
    },
  };
}
