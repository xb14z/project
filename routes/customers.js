const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  updateCustomer,
  deactivateCustomer,
  activateCustomer,
  getCustomerOrders,
  deleteCustomer
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin/manager access
router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.get('/:id/orders', getCustomerOrders);
router.put('/:id', updateCustomer);
router.patch('/:id/deactivate', deactivateCustomer);
router.patch('/:id/activate', activateCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer);

module.exports = router;
