import { useMemo } from 'react';

export const useReportCalculations = (filteredOrders, reportType) => {
  
  const topItems = useMemo(() => {
    if (!filteredOrders.length) return [];

    const itemCount = {};
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        itemCount[item.name] = (itemCount[item.name] || 0) + item.quantity;
      });
    });

    return Object.entries(itemCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [filteredOrders]);
  
  const ordersByStatus = useMemo(() => {
    return {
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      accepted: filteredOrders.filter(o => o.status === 'accepted').length,
      preparing: filteredOrders.filter(o => o.status === 'preparing').length,
      ready: filteredOrders.filter(o => o.status === 'ready').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
    };
  }, [filteredOrders]);
  
  const hourlyDistribution = useMemo(() => {
    const hourlyCount = new Array(24).fill(0);
    filteredOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyCount[hour]++;
    });
    return hourlyCount.map((count, hour) => ({ hour, count }));
  }, [filteredOrders]);
  
  const revenueByDay = useMemo(() => {
    const revenueMap = {};
    filteredOrders
      .filter(order => order.status === 'delivered')
      .forEach(order => {
        const date = new Date(order.createdAt).toDateString();
        revenueMap[date] = (revenueMap[date] || 0) + (order.total || 0);
      });

    return Object.entries(revenueMap)
      .map(([date, revenue]) => ({ date: new Date(date), revenue }))
      .sort((a, b) => b.date - a.date);
  }, [filteredOrders]);
  
  const topRevenueItems = useMemo(() => {
    const itemRevenue = {};
    filteredOrders
      .filter(order => order.status === 'delivered')
      .forEach(order => {
        order.items?.forEach(item => {
          const revenue = item.price * item.quantity;
          itemRevenue[item.name] = (itemRevenue[item.name] || 0) + revenue;
        });
      });

    return Object.entries(itemRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));
  }, [filteredOrders]);
  
  const averagePreparationTime = useMemo(() => {
    const deliveredOrders = filteredOrders.filter(order => order.status === 'delivered');
    if (deliveredOrders.length === 0) return 0;

    const totalTime = deliveredOrders.reduce((sum, order) => {
      return sum + (order.estimatedTime || 30);
    }, 0);

    return Math.round(totalTime / deliveredOrders.length);
  }, [filteredOrders]);
  
  const peakHours = useMemo(() => {
    return hourlyDistribution
      .map((item, index) => ({ hour: index, count: item.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [hourlyDistribution]);
  
  const calculations = useMemo(() => {
    const baseData = {
      topItems,
      ordersByStatus,
      hourlyDistribution,
      revenueByDay,
      topRevenueItems,
      averagePreparationTime,
      peakHours
    };

    switch (reportType) {
      case 'daily':
      case 'weekly':
      case 'monthly':
        return {
          ...baseData,
          showStatusChart: true,
          showTopItems: true
        };

      case 'revenue':
        return {
          ...baseData,
          showRevenueChart: true,
          showTopRevenueItems: true
        };

      case 'orders':
        return {
          ...baseData,
          showStatusChart: true,
          showPeakHours: true
        };

      default:
        return baseData;
    }
  }, [
    reportType,
    topItems,
    ordersByStatus,
    hourlyDistribution,
    revenueByDay,
    topRevenueItems,
    averagePreparationTime,
    peakHours
  ]);

  return calculations;
};
