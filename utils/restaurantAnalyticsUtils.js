function analyticsPeriodBounds(period, now) {
  const endDate = now;
  let startDate;
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week': {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'month':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  return { startDate, endDate };
}

function orderCreatedInRange(order, from, to) {
  const t = new Date(order.createdAt);
  return t >= from && t <= to;
}

function revenueOfDelivered(orders) {
  return orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
}

function uniqueCustomerCount(orders) {
  return new Set(
    orders
      .map((o) => {
        const u = o.user;
        if (u != null && typeof u === 'object' && u._id != null) return String(u._id);
        if (u != null) return String(u);
        return '';
      })
      .filter(Boolean)
  ).size;
}

function averageRatingInDateRange(reviews, from, to) {
  const slice = (Array.isArray(reviews) ? reviews : []).filter((r) => {
    const t = new Date(r.createdAt || r.updatedAt || 0);
    return t >= from && t <= to;
  });
  if (!slice.length) return 0;
  return parseFloat(
    (slice.reduce((s, rev) => s + (Number(rev.rating) || 0), 0) / slice.length).toFixed(1)
  );
}

function pctChange(curr, prev) {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
}

function onTimeDeliveryRateForOrders(orders) {
  const delivered = orders.filter((o) => o.status === 'delivered');
  if (!delivered.length) return 0;
  let onTime = 0;
  for (const o of delivered) {
    const est = o.delivery?.estimatedTime;
    if (!est) continue;
    if (new Date(o.updatedAt) <= new Date(est)) onTime += 1;
  }
  return parseFloat(((onTime / delivered.length) * 100).toFixed(1));
}

export function buildRestaurantAnalyticsData(period, orders, reviews, now = new Date()) {
  const { startDate, endDate } = analyticsPeriodBounds(period, now);
  const list = orders.filter((o) => orderCreatedInRange(o, startDate, endDate));
  const periodMs = Math.max(endDate - startDate, 60 * 1000);
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - periodMs);
  const prevList = orders.filter((o) => orderCreatedInRange(o, prevStart, prevEnd));

  const totalOrders = list.length;
  const completedOrders = list.filter((o) => o.status === 'delivered').length;
  const cancelledOrders = list.filter((o) => o.status === 'cancelled').length;
  const totalRevenue = revenueOfDelivered(list);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
  const averageRating = averageRatingInDateRange(reviews, startDate, endDate);
  const avgPrev = averageRatingInDateRange(reviews, prevStart, prevEnd);

  const revCurr = revenueOfDelivered(list);
  const revPrev = revenueOfDelivered(prevList);
  const custCurr = uniqueCustomerCount(list);
  const custPrev = uniqueCustomerCount(prevList);

  return {
    period,
    generatedAt: new Date().toISOString(),
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalOrders,
    completedOrders,
    averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
    averageRating,
    averagePreparationTime: 0,
    activeCustomers: custCurr,
    cancellationRate: parseFloat(cancellationRate.toFixed(1)),
    onTimeDeliveryRate: onTimeDeliveryRateForOrders(list),
    totalDeliveries: completedOrders,
    trends: {
      revenue: pctChange(revCurr, revPrev),
      orders: pctChange(list.length, prevList.length),
      customers: pctChange(custCurr, custPrev),
      rating: pctChange(averageRating, avgPrev),
    },
  };
}
