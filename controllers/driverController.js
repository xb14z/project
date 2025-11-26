const { Driver, Order } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/error');

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private (Admin)
exports.getDrivers = asyncHandler(async (req, res, next) => {
  const { status, verified, active, zone, page = 1, limit = 20 } = req.query;

  let query = {};

  if (status) query.status = status;
  if (verified !== undefined) query.isVerified = verified === 'true';
  if (active !== undefined) query.isActive = active === 'true';
  if (zone) query.zone = zone;

  const skip = (Number(page) - 1) * Number(limit);

  const drivers = await Driver.find(query)
    .select('-password')
    .populate('currentOrder', 'orderNumber status')
    .populate('zone', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Driver.countDocuments(query);

  res.status(200).json({
    success: true,
    count: drivers.length,
    total,
    pages: Math.ceil(total / Number(limit)),
    data: drivers
  });
});

// @desc    Get single driver
// @route   GET /api/drivers/:id
// @access  Private (Admin)
exports.getDriver = asyncHandler(async (req, res, next) => {
  const driver = await Driver.findById(req.params.id)
    .select('-password')
    .populate('currentOrder')
    .populate('zone', 'name');

  if (!driver) {
    return next(new ErrorResponse('ไม่พบคนขับ', 404));
  }

  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Create driver
// @route   POST /api/drivers
// @access  Private (Admin)
exports.createDriver = asyncHandler(async (req, res, next) => {
  const driver = await Driver.create(req.body);

  res.status(201).json({
    success: true,
    data: {
      id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      vehiclePlate: driver.vehiclePlate
    }
  });
});

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Private (Admin)
exports.updateDriver = asyncHandler(async (req, res, next) => {
  // Remove password from update
  delete req.body.password;

  let driver = await Driver.findById(req.params.id);

  if (!driver) {
    return next(new ErrorResponse('ไม่พบคนขับ', 404));
  }

  driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Private (Admin)
exports.deleteDriver = asyncHandler(async (req, res, next) => {
  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    return next(new ErrorResponse('ไม่พบคนขับ', 404));
  }

  // Check if driver has active order
  if (driver.currentOrder) {
    return next(new ErrorResponse('ไม่สามารถลบคนขับที่มีงานอยู่', 400));
  }

  await driver.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Verify driver
// @route   PATCH /api/drivers/:id/verify
// @access  Private (Admin)
exports.verifyDriver = asyncHandler(async (req, res, next) => {
  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    return next(new ErrorResponse('ไม่พบคนขับ', 404));
  }

  driver.isVerified = true;
  await driver.save();

  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Suspend/Unsuspend driver
// @route   PATCH /api/drivers/:id/suspend
// @access  Private (Admin)
exports.toggleSuspend = asyncHandler(async (req, res, next) => {
  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    return next(new ErrorResponse('ไม่พบคนขับ', 404));
  }

  if (driver.status === 'suspended') {
    driver.status = 'offline';
  } else {
    driver.status = 'suspended';
  }

  await driver.save();

  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Update driver status (by driver)
// @route   PATCH /api/drivers/status
// @access  Private (Driver)
exports.updateStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!['available', 'busy', 'offline'].includes(status)) {
    return next(new ErrorResponse('สถานะไม่ถูกต้อง', 400));
  }

  const driver = await Driver.findByIdAndUpdate(
    req.driver.id,
    { status },
    { new: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Update driver location
// @route   PATCH /api/drivers/location
// @access  Private (Driver)
exports.updateLocation = asyncHandler(async (req, res, next) => {
  const { lat, lng } = req.body;

  const driver = await Driver.findByIdAndUpdate(
    req.driver.id,
    {
      currentLocation: {
        lat,
        lng,
        updatedAt: new Date()
      }
    },
    { new: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    data: driver.currentLocation
  });
});

// @desc    Get driver's current order
// @route   GET /api/drivers/current-order
// @access  Private (Driver)
exports.getCurrentOrder = asyncHandler(async (req, res, next) => {
  const driver = await Driver.findById(req.driver.id).populate({
    path: 'currentOrder',
    populate: [
      { path: 'customer', select: 'name phone' },
      { path: 'items.product', select: 'name image' }
    ]
  });

  res.status(200).json({
    success: true,
    data: driver.currentOrder
  });
});

// @desc    Get driver's order history
// @route   GET /api/drivers/orders
// @access  Private (Driver)
exports.getDriverOrders = asyncHandler(async (req, res, next) => {
  const { status, fromDate, toDate, page = 1, limit = 20 } = req.query;

  let query = { driver: req.driver.id };

  if (status) query.status = status;

  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.find(query)
    .populate('customer', 'name phone')
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

// @desc    Get available drivers
// @route   GET /api/drivers/available
// @access  Private (Admin)
exports.getAvailableDrivers = asyncHandler(async (req, res, next) => {
  const { zone } = req.query;

  let query = {
    status: 'available',
    isActive: true,
    isVerified: true
  };

  if (zone) {
    query.zone = zone;
  }

  const drivers = await Driver.find(query)
    .select('name phone vehicleType vehiclePlate currentLocation rating')
    .sort({ 'rating.average': -1 });

  res.status(200).json({
    success: true,
    count: drivers.length,
    data: drivers
  });
});

// @desc    Get driver stats
// @route   GET /api/drivers/:id/stats
// @access  Private (Admin)
exports.getDriverStats = asyncHandler(async (req, res, next) => {
  const driver = await Driver.findById(req.params.id).select('stats rating');

  if (!driver) {
    return next(new ErrorResponse('ไม่พบคนขับ', 404));
  }

  // Get additional stats from orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = await Order.countDocuments({
    driver: req.params.id,
    status: 'delivered',
    actualDeliveryTime: { $gte: today }
  });

  const todayEarnings = await Order.aggregate([
    {
      $match: {
        driver: driver._id,
        status: 'delivered',
        actualDeliveryTime: { $gte: today }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$pricing.deliveryFee' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      ...driver.stats,
      rating: driver.rating,
      todayDeliveries: todayOrders,
      todayEarnings: todayEarnings[0]?.total || 0
    }
  });
});
