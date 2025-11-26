const { User, Order } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/error');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private (Admin)
exports.getCustomers = asyncHandler(async (req, res, next) => {
  const { search, active, sort, page = 1, limit = 20 } = req.query;

  let query = { role: 'customer' };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  const skip = (Number(page) - 1) * Number(limit);

  let sortOption = { createdAt: -1 };
  if (sort === 'name') sortOption = { name: 1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };

  const customers = await User.find(query)
    .select('-password')
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: customers.length,
    total,
    pages: Math.ceil(total / Number(limit)),
    data: customers
  });
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private (Admin)
exports.getCustomer = asyncHandler(async (req, res, next) => {
  const customer = await User.findOne({ 
    _id: req.params.id, 
    role: 'customer' 
  }).select('-password');

  if (!customer) {
    return next(new ErrorResponse('ไม่พบลูกค้า', 404));
  }

  // Get order stats
  const orderStats = await Order.aggregate([
    { $match: { customer: customer._id } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        totalSpent: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$pricing.total', 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      ...customer.toObject(),
      stats: orderStats[0] || { totalOrders: 0, completedOrders: 0, totalSpent: 0 }
    }
  });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Admin)
exports.updateCustomer = asyncHandler(async (req, res, next) => {
  // Don't allow password update through this route
  delete req.body.password;
  delete req.body.role;

  let customer = await User.findOne({ 
    _id: req.params.id, 
    role: 'customer' 
  });

  if (!customer) {
    return next(new ErrorResponse('ไม่พบลูกค้า', 404));
  }

  customer = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Deactivate customer
// @route   PATCH /api/customers/:id/deactivate
// @access  Private (Admin)
exports.deactivateCustomer = asyncHandler(async (req, res, next) => {
  const customer = await User.findOne({ 
    _id: req.params.id, 
    role: 'customer' 
  });

  if (!customer) {
    return next(new ErrorResponse('ไม่พบลูกค้า', 404));
  }

  customer.isActive = false;
  await customer.save();

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Activate customer
// @route   PATCH /api/customers/:id/activate
// @access  Private (Admin)
exports.activateCustomer = asyncHandler(async (req, res, next) => {
  const customer = await User.findOne({ 
    _id: req.params.id, 
    role: 'customer' 
  });

  if (!customer) {
    return next(new ErrorResponse('ไม่พบลูกค้า', 404));
  }

  customer.isActive = true;
  await customer.save();

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Get customer order history
// @route   GET /api/customers/:id/orders
// @access  Private (Admin)
exports.getCustomerOrders = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;

  let query = { customer: req.params.id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.find(query)
    .populate('driver', 'name phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    pages: Math.ceil(total / Number(limit)),
    data: orders
  });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin)
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const customer = await User.findOne({ 
    _id: req.params.id, 
    role: 'customer' 
  });

  if (!customer) {
    return next(new ErrorResponse('ไม่พบลูกค้า', 404));
  }

  // Check if customer has active orders
  const activeOrders = await Order.countDocuments({
    customer: req.params.id,
    status: { $nin: ['delivered', 'cancelled', 'refunded'] }
  });

  if (activeOrders > 0) {
    return next(new ErrorResponse('ไม่สามารถลบลูกค้าที่มีออเดอร์ค้างอยู่', 400));
  }

  await customer.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
