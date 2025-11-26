const { Order, User, Driver, Product, Category } = require('../models');
const { asyncHandler } = require('../middleware/error');

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private (Admin)
exports.getOverview = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  // Today's stats
  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today }
  });

  const todayRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: today },
        status: 'delivered'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$pricing.total' }
      }
    }
  ]);

  // This month stats
  const monthOrders = await Order.countDocuments({
    createdAt: { $gte: thisMonth }
  });

  const monthRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: thisMonth },
        status: 'delivered'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$pricing.total' }
      }
    }
  ]);

  // Last month for comparison
  const lastMonthRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: lastMonth, $lte: lastMonthEnd },
        status: 'delivered'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$pricing.total' }
      }
    }
  ]);

  // Active orders by status
  const ordersByStatus = await Order.aggregate([
    {
      $match: {
        status: { $nin: ['delivered', 'cancelled', 'refunded'] }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Counts
  const totalCustomers = await User.countDocuments({ role: 'customer' });
  const totalDrivers = await Driver.countDocuments({ isActive: true });
  const activeDrivers = await Driver.countDocuments({ status: 'available' });
  const totalProducts = await Product.countDocuments({ isActive: true });

  // Calculate growth
  const currentRev = monthRevenue[0]?.total || 0;
  const lastRev = lastMonthRevenue[0]?.total || 0;
  const revenueGrowth = lastRev > 0 ? ((currentRev - lastRev) / lastRev) * 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      today: {
        orders: todayOrders,
        revenue: todayRevenue[0]?.total || 0
      },
      thisMonth: {
        orders: monthOrders,
        revenue: currentRev,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100
      },
      ordersByStatus: ordersByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      counts: {
        customers: totalCustomers,
        drivers: totalDrivers,
        activeDrivers,
        products: totalProducts
      }
    }
  });
});

// @desc    Get sales analytics
// @route   GET /api/dashboard/sales
// @access  Private (Admin)
exports.getSalesAnalytics = asyncHandler(async (req, res, next) => {
  const { period = '7days' } = req.query;

  let startDate = new Date();
  let groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

  switch (period) {
    case '7days':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '12months':
      startDate.setMonth(startDate.getMonth() - 12);
      groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      break;
  }

  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: 'delivered'
      }
    },
    {
      $group: {
        _id: groupBy,
        orders: { $sum: 1 },
        revenue: { $sum: '$pricing.total' },
        deliveryFees: { $sum: '$pricing.deliveryFee' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: salesData
  });
});

// @desc    Get top products
// @route   GET /api/dashboard/top-products
// @access  Private (Admin)
exports.getTopProducts = asyncHandler(async (req, res, next) => {
  const { limit = 10, period = '30days' } = req.query;

  let startDate = new Date();
  startDate.setDate(startDate.getDate() - (period === '7days' ? 7 : 30));

  const topProducts = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: 'delivered'
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: Number(limit) }
  ]);

  // Get product details
  const productIds = topProducts.map(p => p._id);
  const products = await Product.find({ _id: { $in: productIds } })
    .select('name image category')
    .populate('category', 'name');

  const result = topProducts.map(tp => {
    const product = products.find(p => p._id.toString() === tp._id.toString());
    return {
      ...tp,
      image: product?.image,
      category: product?.category?.name
    };
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Get driver performance
// @route   GET /api/dashboard/driver-performance
// @access  Private (Admin)
exports.getDriverPerformance = asyncHandler(async (req, res, next) => {
  const { period = '30days' } = req.query;

  let startDate = new Date();
  startDate.setDate(startDate.getDate() - (period === '7days' ? 7 : 30));

  const driverStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        driver: { $ne: null },
        status: { $in: ['delivered', 'cancelled'] }
      }
    },
    {
      $group: {
        _id: '$driver',
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        totalEarnings: { $sum: '$pricing.deliveryFee' },
        avgDeliveryTime: {
          $avg: {
            $subtract: ['$actualDeliveryTime', '$driverAssignedAt']
          }
        }
      }
    },
    { $sort: { completedOrders: -1 } }
  ]);

  // Get driver details
  const driverIds = driverStats.map(d => d._id);
  const drivers = await Driver.find({ _id: { $in: driverIds } })
    .select('name phone photo rating');

  const result = driverStats.map(ds => {
    const driver = drivers.find(d => d._id.toString() === ds._id.toString());
    return {
      ...ds,
      name: driver?.name,
      phone: driver?.phone,
      photo: driver?.photo,
      rating: driver?.rating,
      completionRate: ds.totalOrders > 0 
        ? Math.round((ds.completedOrders / ds.totalOrders) * 100) 
        : 0,
      avgDeliveryTimeMinutes: ds.avgDeliveryTime 
        ? Math.round(ds.avgDeliveryTime / 60000) 
        : null
    };
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Get orders by hour
// @route   GET /api/dashboard/orders-by-hour
// @access  Private (Admin)
exports.getOrdersByHour = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ordersByHour = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: today }
      }
    },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Fill missing hours with 0
  const result = Array.from({ length: 24 }, (_, hour) => {
    const found = ordersByHour.find(o => o._id === hour);
    return {
      hour,
      count: found?.count || 0
    };
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Get recent orders
// @route   GET /api/dashboard/recent-orders
// @access  Private (Admin)
exports.getRecentOrders = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const orders = await Order.find()
    .populate('customer', 'name phone')
    .populate('driver', 'name')
    .select('orderNumber status pricing.total createdAt')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    data: orders
  });
});

// @desc    Get customer analytics
// @route   GET /api/dashboard/customers
// @access  Private (Admin)
exports.getCustomerAnalytics = asyncHandler(async (req, res, next) => {
  const { period = '30days' } = req.query;

  let startDate = new Date();
  startDate.setDate(startDate.getDate() - (period === '7days' ? 7 : 30));

  // New customers
  const newCustomers = await User.countDocuments({
    role: 'customer',
    createdAt: { $gte: startDate }
  });

  // Top customers
  const topCustomers = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: 'delivered'
      }
    },
    {
      $group: {
        _id: '$customer',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$pricing.total' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 }
  ]);

  // Get customer details
  const customerIds = topCustomers.map(c => c._id);
  const customers = await User.find({ _id: { $in: customerIds } })
    .select('name email phone');

  const result = topCustomers.map(tc => {
    const customer = customers.find(c => c._id.toString() === tc._id.toString());
    return {
      ...tc,
      name: customer?.name,
      email: customer?.email,
      phone: customer?.phone
    };
  });

  res.status(200).json({
    success: true,
    data: {
      newCustomers,
      topCustomers: result
    }
  });
});
