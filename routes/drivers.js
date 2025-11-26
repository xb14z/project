const express = require('express');
const router = express.Router();
const {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  verifyDriver,
  toggleSuspend,
  updateStatus,
  updateLocation,
  getCurrentOrder,
  getDriverOrders,
  getAvailableDrivers,
  getDriverStats
} = require('../controllers/driverController');
const { protect, authorize, isDriver } = require('../middleware/auth');

// Driver self-service routes
router.patch('/status', protect, isDriver, updateStatus);
router.patch('/location', protect, isDriver, updateLocation);
router.get('/current-order', protect, isDriver, getCurrentOrder);
router.get('/orders', protect, isDriver, getDriverOrders);

// Admin routes
router.get('/', protect, authorize('admin', 'manager'), getDrivers);
router.get('/available', protect, authorize('admin', 'manager'), getAvailableDrivers);
router.post('/', protect, authorize('admin'), createDriver);
router.get('/:id', protect, authorize('admin', 'manager'), getDriver);
router.get('/:id/stats', protect, authorize('admin', 'manager'), getDriverStats);
router.put('/:id', protect, authorize('admin'), updateDriver);
router.delete('/:id', protect, authorize('admin'), deleteDriver);
router.patch('/:id/verify', protect, authorize('admin'), verifyDriver);
router.patch('/:id/suspend', protect, authorize('admin'), toggleSuspend);

module.exports = router;
