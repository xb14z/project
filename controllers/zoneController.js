const { DeliveryZone } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/error');

// @desc    Get all delivery zones
// @route   GET /api/zones
// @access  Public
exports.getZones = asyncHandler(async (req, res, next) => {
  const { active } = req.query;
  
  let query = {};
  if (active === 'true') {
    query.isActive = true;
  }

  const zones = await DeliveryZone.find(query).sort('name');

  res.status(200).json({
    success: true,
    count: zones.length,
    data: zones
  });
});

// @desc    Get single zone
// @route   GET /api/zones/:id
// @access  Public
exports.getZone = asyncHandler(async (req, res, next) => {
  const zone = await DeliveryZone.findById(req.params.id);

  if (!zone) {
    return next(new ErrorResponse('ไม่พบโซนจัดส่ง', 404));
  }

  res.status(200).json({
    success: true,
    data: zone
  });
});

// @desc    Create zone
// @route   POST /api/zones
// @access  Private (Admin)
exports.createZone = asyncHandler(async (req, res, next) => {
  const zone = await DeliveryZone.create(req.body);

  res.status(201).json({
    success: true,
    data: zone
  });
});

// @desc    Update zone
// @route   PUT /api/zones/:id
// @access  Private (Admin)
exports.updateZone = asyncHandler(async (req, res, next) => {
  let zone = await DeliveryZone.findById(req.params.id);

  if (!zone) {
    return next(new ErrorResponse('ไม่พบโซนจัดส่ง', 404));
  }

  zone = await DeliveryZone.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: zone
  });
});

// @desc    Delete zone
// @route   DELETE /api/zones/:id
// @access  Private (Admin)
exports.deleteZone = asyncHandler(async (req, res, next) => {
  const zone = await DeliveryZone.findById(req.params.id);

  if (!zone) {
    return next(new ErrorResponse('ไม่พบโซนจัดส่ง', 404));
  }

  await zone.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Check if postal code is in delivery zone
// @route   GET /api/zones/check/:postalCode
// @access  Public
exports.checkPostalCode = asyncHandler(async (req, res, next) => {
  const zone = await DeliveryZone.findOne({
    'areas.postalCode': req.params.postalCode,
    isActive: true
  });

  if (!zone) {
    return res.status(200).json({
      success: true,
      available: false,
      message: 'พื้นที่นี้ยังไม่รองรับการจัดส่ง'
    });
  }

  res.status(200).json({
    success: true,
    available: true,
    data: {
      zone: zone.name,
      deliveryFee: zone.deliveryFee,
      freeDeliveryMinimum: zone.freeDeliveryMinimum,
      estimatedTime: zone.estimatedTime,
      minOrderAmount: zone.minOrderAmount
    }
  });
});

// @desc    Get delivery fee by location
// @route   POST /api/zones/calculate-fee
// @access  Public
exports.calculateDeliveryFee = asyncHandler(async (req, res, next) => {
  const { postalCode, orderAmount } = req.body;

  const zone = await DeliveryZone.findOne({
    'areas.postalCode': postalCode,
    isActive: true
  });

  if (!zone) {
    return res.status(200).json({
      success: true,
      available: false,
      message: 'พื้นที่นี้ยังไม่รองรับการจัดส่ง'
    });
  }

  let deliveryFee = zone.deliveryFee;
  let isFreeDelivery = false;

  if (zone.freeDeliveryMinimum && orderAmount >= zone.freeDeliveryMinimum) {
    deliveryFee = 0;
    isFreeDelivery = true;
  }

  res.status(200).json({
    success: true,
    available: true,
    data: {
      zone: zone.name,
      deliveryFee,
      isFreeDelivery,
      freeDeliveryMinimum: zone.freeDeliveryMinimum,
      estimatedTime: zone.estimatedTime,
      meetsMinimum: orderAmount >= zone.minOrderAmount
    }
  });
});

// @desc    Add area to zone
// @route   POST /api/zones/:id/areas
// @access  Private (Admin)
exports.addArea = asyncHandler(async (req, res, next) => {
  const zone = await DeliveryZone.findById(req.params.id);

  if (!zone) {
    return next(new ErrorResponse('ไม่พบโซนจัดส่ง', 404));
  }

  zone.areas.push(req.body);
  await zone.save();

  res.status(200).json({
    success: true,
    data: zone
  });
});

// @desc    Remove area from zone
// @route   DELETE /api/zones/:id/areas/:areaId
// @access  Private (Admin)
exports.removeArea = asyncHandler(async (req, res, next) => {
  const zone = await DeliveryZone.findById(req.params.id);

  if (!zone) {
    return next(new ErrorResponse('ไม่พบโซนจัดส่ง', 404));
  }

  zone.areas = zone.areas.filter(
    area => area._id.toString() !== req.params.areaId
  );
  
  await zone.save();

  res.status(200).json({
    success: true,
    data: zone
  });
});
