const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  trackOrder,
  createOrder,
  updateOrderStatus,
  assignDriver,
  cancelOrder,
  rateOrder,
  getMyOrders,
  getPendingCount
} = require('../controllers/orderController');
const { protect, authorize, isDriver } = require('../middleware/auth');

// Public routes
router.get('/track/:orderNumber', trackOrder);

// Customer routes
router.get('/my-orders', protect, getMyOrders);
router.post('/', protect, createOrder);
router.post('/:id/rate', protect, rateOrder);
router.patch('/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/', protect, authorize('admin', 'manager'), getOrders);
router.get('/pending-count', protect, authorize('admin', 'manager'), getPendingCount);
router.get('/:id', protect, getOrder);
router.patch('/:id/status', protect, authorize('admin', 'manager', 'driver'), updateOrderStatus);
router.patch('/:id/assign-driver', protect, authorize('admin', 'manager'), assignDriver);

module.exports = router;
