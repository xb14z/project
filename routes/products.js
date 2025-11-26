const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleAvailability,
  updateStock,
  bulkUpdate
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin routes
router.post('/', protect, authorize('admin', 'manager'), createProduct);
router.put('/bulk', protect, authorize('admin', 'manager'), bulkUpdate);
router.put('/:id', protect, authorize('admin', 'manager'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.patch('/:id/availability', protect, authorize('admin', 'manager'), toggleAvailability);
router.patch('/:id/stock', protect, authorize('admin', 'manager'), updateStock);

module.exports = router;
