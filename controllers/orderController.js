const { Order, Product, Driver, DeliveryZone } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/error');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin)
exports.getOrders = asyncHandler(async (req, res, next) => {
  const {
    status,
    driver,
    customer,
    fromDate,
    toDate,
    paymentStatus,
    sort,
    page = 1,
    limit = 20
  } = req.query;

  let query = {};

  if (status) {
    query.status = status;
  }

  if (driver) {
    query.driver = driver;
  }

  if (customer) {
    query.customer = customer;
  }

  if (paymentStatus) {
    query['payment.status'] = paymentStatus;
  }

  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  let sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };

  const orders = await Order.find(query)
    .populate('customer', 'name email phone')
    .populate('driver', 'name phone vehiclePlate')
    .populate('items.product', 'name image')
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  const total = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    pages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    data: orders
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone addresses')
    .populate('driver', 'name phone vehiclePlate photo currentLocation')
    .populate('items.product', 'name image');

  if (!order) {
    return next(new ErrorResponse('ไม่พบออเดอร์', 404));
  }

  // Check ownership if customer
  if (req.user?.role === 'customer' && order.customer._id.toString() !== req.user.id) {
    return next(new ErrorResponse('ไม่มีสิทธิ์เข้าถึงออเดอร์นี้', 403));
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Get order by order number
// @route   GET /api/orders/track/:orderNumber
// @access  Public
exports.trackOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber })
    .populate('driver', 'name phone vehiclePlate currentLocation')
    .select('orderNumber status statusHistory estimatedDeliveryTime driver deliveryAddress');

  if (!order) {
    return next(new ErrorResponse('ไม่พบออเดอร์', 404));
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Create order
// @route   POST /api/orders
// @access  Private (Customer)
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { items, deliveryAddress, payment, notes, scheduledFor } = req.body;

  // Calculate pricing
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return next(new ErrorResponse(`ไม่พบสินค้า ${item.product}`, 404));
    }
    if (!product.isAvailable) {
      return next(new ErrorResponse(`สินค้า ${product.name} ไม่พร้อมจำหน่าย`, 400));
    }

    let itemPrice = product.price;
    
    // Calculate option price modifiers
    if (item.options) {
      for (const opt of item.options) {
        if (opt.priceModifier) {
          itemPrice += opt.priceModifier;
        }
      }
    }

    const itemSubtotal = itemPrice * item.quantity;
    subtotal += itemSubtotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      price: itemPrice,
      quantity: item.quantity,
      options: item.options,
      specialInstructions: item.specialInstructions,
      subtotal: itemSubtotal
    });
  }

  // Get delivery fee from zone or default
  let deliveryFee = 40; // Default delivery fee
  let zone = null;

  if (deliveryAddress.postalCode) {
    zone = await DeliveryZone.findOne({
      'areas.postalCode': deliveryAddress.postalCode,
      isActive: true
    });

    if (zone) {
      deliveryFee = zone.deliveryFee;
      if (zone.freeDeliveryMinimum && subtotal >= zone.freeDeliveryMinimum) {
        deliveryFee = 0;
      }
    }
  }

  const total = subtotal + deliveryFee;

  // Calculate estimated delivery time
  const estimatedDeliveryTime = new Date();
  estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 45);

  const order = await Order.create({
    customer: req.user.id,
    items: orderItems,
    deliveryAddress,
    pricing: {
      subtotal,
      deliveryFee,
      total
    },
    payment: {
      method: payment?.method || 'cash',
      status: 'pending'
    },
    notes,
    scheduledFor,
    zone: zone?._id,
    estimatedDeliveryTime
  });

  // Populate response
  const populatedOrder = await Order.findById(order._id)
    .populate('customer', 'name email phone')
    .populate('items.product', 'name image');

  res.status(201).json({
    success: true,
    data: populatedOrder
  });
});

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Admin/Driver)
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;

  const validStatuses = [
    'pending', 'confirmed', 'preparing', 'ready_for_pickup',
    'driver_assigned', 'picked_up', 'out_for_delivery',
    'delivered', 'cancelled', 'refunded'
  ];

  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse('สถานะไม่ถูกต้อง', 400));
  }

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('ไม่พบออเดอร์', 404));
  }

  // Update status
  order.status = status;
  
  // Add to history
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
    updatedBy: req.user?._id || req.driver?._id,
    updatedByModel: req.driver ? 'Driver' : 'User'
  });

  // Handle specific status changes
  if (status === 'delivered') {
    order.actualDeliveryTime = new Date();
    
    // Update product sold count
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { soldCount: item.quantity }
      });
    }

    // Update driver stats if assigned
    if (order.driver) {
      await Driver.findByIdAndUpdate(order.driver, {
        $inc: {
          'stats.completedDeliveries': 1,
          'stats.totalEarnings': order.pricing.deliveryFee
        },
        currentOrder: null,
        status: 'available'
      });
    }
  }

  if (status === 'cancelled' && order.driver) {
    await Driver.findByIdAndUpdate(order.driver, {
      $inc: { 'stats.cancelledDeliveries': 1 },
      currentOrder: null,
      status: 'available'
    });
  }

  await order.save();

  order = await Order.findById(order._id)
    .populate('customer', 'name email phone')
    .populate('driver', 'name phone');

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Assign driver to order
// @route   PATCH /api/orders/:id/assign-driver
// @access  Private (Admin)
exports.assignDriver = asyncHandler(async (req, res, next) => {
  const { driverId } = req.body;

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('ไม่พบออเดอร์', 404));
  }

  if (!['confirmed', 'preparing', 'ready_for_pickup'].includes(order.status)) {
    return next(new ErrorResponse('ไม่สามารถมอบหมายคนขับได้ในสถานะนี้', 400));
  }

  const driver = await Driver.findById(driverId);

  if (!driver) {
    return next(new ErrorResponse('ไม่พบคนขับ', 404));
  }

  if (driver.status !== 'available') {
    return next(new ErrorResponse('คนขับไม่พร้อมรับงาน', 400));
  }

  // Assign driver
  order.driver = driverId;
  order.driverAssignedAt = new Date();
  order.status = 'driver_assigned';
  order.statusHistory.push({
    status: 'driver_assigned',
    note: `มอบหมาย ${driver.name}`,
    updatedBy: req.user._id,
    updatedByModel: 'User'
  });

  await order.save();

  // Update driver status
  await Driver.findByIdAndUpdate(driverId, {
    status: 'busy',
    currentOrder: order._id
  });

  order = await Order.findById(order._id)
    .populate('customer', 'name phone')
    .populate('driver', 'name phone vehiclePlate');

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('ไม่พบออเดอร์', 404));
  }

  // Check if can cancel
  const cancelableStatuses = ['pending', 'confirmed'];
  if (!cancelableStatuses.includes(order.status)) {
    return next(new ErrorResponse('ไม่สามารถยกเลิกออเดอร์ในสถานะนี้', 400));
  }

  // Check ownership if customer
  if (req.user?.role === 'customer' && order.customer.toString() !== req.user.id) {
    return next(new ErrorResponse('ไม่มีสิทธิ์ยกเลิกออเดอร์นี้', 403));
  }

  order.status = 'cancelled';
  order.cancelReason = reason;
  order.cancelledBy = req.user?._id || req.driver?._id;
  order.cancelledByModel = req.driver ? 'Driver' : 'User';

  await order.save();

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Rate order
// @route   POST /api/orders/:id/rate
// @access  Private (Customer)
exports.rateOrder = asyncHandler(async (req, res, next) => {
  const { food, delivery, comment } = req.body;

  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('ไม่พบออเดอร์', 404));
  }

  if (order.customer.toString() !== req.user.id) {
    return next(new ErrorResponse('ไม่มีสิทธิ์ให้คะแนนออเดอร์นี้', 403));
  }

  if (order.status !== 'delivered') {
    return next(new ErrorResponse('สามารถให้คะแนนได้หลังส่งสำเร็จเท่านั้น', 400));
  }

  if (order.rating?.ratedAt) {
    return next(new ErrorResponse('คุณได้ให้คะแนนออเดอร์นี้แล้ว', 400));
  }

  order.rating = {
    food,
    delivery,
    comment,
    ratedAt: new Date()
  };

  await order.save();

  // Update driver rating
  if (order.driver && delivery) {
    const driver = await Driver.findById(order.driver);
    const newCount = driver.rating.count + 1;
    const newAverage = ((driver.rating.average * driver.rating.count) + delivery) / newCount;
    
    await Driver.findByIdAndUpdate(order.driver, {
      'rating.average': Math.round(newAverage * 10) / 10,
      'rating.count': newCount
    });
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Get customer orders
// @route   GET /api/orders/my-orders
// @access  Private (Customer)
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;

  let query = { customer: req.user.id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.find(query)
    .populate('driver', 'name phone')
    .populate('items.product', 'name image')
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

// @desc    Get pending orders count (for real-time dashboard)
// @route   GET /api/orders/pending-count
// @access  Private (Admin)
exports.getPendingCount = asyncHandler(async (req, res, next) => {
  const counts = await Order.aggregate([
    {
      $match: {
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready_for_pickup'] }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready_for_pickup: 0
  };

  counts.forEach(c => {
    result[c._id] = c.count;
  });

  res.status(200).json({
    success: true,
    data: result
  });
});
