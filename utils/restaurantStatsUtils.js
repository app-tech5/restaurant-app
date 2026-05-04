const PENDING_LIKE_STATUSES = ['pending', 'accepted', 'preparing', 'ready'];

export function buildRestaurantStatsData({ orders, reviewsAverageRating, menuItemCount }) {
  const list = Array.isArray(orders) ? orders : [];
  const completedOrders = list.filter((o) => o.status === 'delivered').length;
  const totalRevenue = list
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const pendingOrders = list.filter((o) => PENDING_LIKE_STATUSES.includes(o.status)).length;
  return {
    todayOrders: pendingOrders,
    totalRevenue,
    averageRating: Number(reviewsAverageRating) || 0,
    completedOrders,
    pendingOrders,
    activeMenuItems: Math.max(0, Number(menuItemCount) || 0),
  };
}
