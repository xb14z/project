const express = require('express');
const router = express.Router();
const {
  getZones,
  getZone,
  createZone,
  updateZone,
  deleteZone,
  checkPostalCode,
  calculateDeliveryFee,
  addArea,
  removeArea
} = require('../controllers/zoneController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getZones);
router.get('/check/:postalCode', checkPostalCode);
router.post('/calculate-fee', calculateDeliveryFee);
router.get('/:id', getZone);

// Admin routes
router.post('/', protect, authorize('admin'), createZone);
router.put('/:id', protect, authorize('admin'), updateZone);
router.delete('/:id', protect, authorize('admin'), deleteZone);
router.post('/:id/areas', protect, authorize('admin'), addArea);
router.delete('/:id/areas/:areaId', protect, authorize('admin'), removeArea);

module.exports = router;
