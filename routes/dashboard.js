const express = require('express');
const router = express.Router();
const {
  getOverview,
  getSalesAnalytics,
  getTopProducts,
  getDriverPerformance,
  getOrdersByHour,
  getRecentOrders,
  getCustomerAnalytics
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin/manager access
router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/overview', getOverview);
router.get('/sales', getSalesAnalytics);
router.get('/top-products', getTopProducts);
router.get('/driver-performance', getDriverPerformance);
router.get('/orders-by-hour', getOrdersByHour);
router.get('/recent-orders', getRecentOrders);
router.get('/customers', getCustomerAnalytics);

module.exports = router;
