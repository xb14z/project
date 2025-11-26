const { User, Driver } = require('../models');
const { asyncHandler, ErrorResponse } = require('../middleware/error');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    phone
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('กรุณากรอกอีเมลและรหัสผ่าน', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401));
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Login admin
// @route   POST /api/auth/admin/login
// @access  Public
exports.adminLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('กรุณากรอกอีเมลและรหัสผ่าน', 400));
  }

  const user = await User.findOne({ email, role: { $in: ['admin', 'manager'] } }).select('+password');

  if (!user) {
    return next(new ErrorResponse('ไม่มีสิทธิ์เข้าถึง', 401));
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401));
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Login driver
// @route   POST /api/auth/driver/login
// @access  Public
exports.driverLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('กรุณากรอกอีเมลและรหัสผ่าน', 400));
  }

  const driver = await Driver.findOne({ email }).select('+password');

  if (!driver) {
    return next(new ErrorResponse('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401));
  }

  if (!driver.isActive) {
    return next(new ErrorResponse('บัญชีถูกระงับ', 401));
  }

  const isMatch = await driver.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401));
  }

  const token = driver.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    data: {
      id: driver._id,
      name: driver.name,
      email: driver.email,
      status: driver.status,
      isVerified: driver.isVerified
    }
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const data = req.user || req.driver;
  res.status(200).json({
    success: true,
    data
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    phone: req.body.phone
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('รหัสผ่านปัจจุบันไม่ถูกต้อง', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Add user address
// @route   POST /api/auth/addresses
// @access  Private
exports.addAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // If setting as default, unset other defaults
  if (req.body.isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  user.addresses.push(req.body);
  await user.save();

  res.status(200).json({
    success: true,
    data: user.addresses
  });
});

// @desc    Update user address
// @route   PUT /api/auth/addresses/:addressId
// @access  Private
exports.updateAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    return next(new ErrorResponse('ไม่พบที่อยู่', 404));
  }

  if (req.body.isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  Object.assign(address, req.body);
  await user.save();

  res.status(200).json({
    success: true,
    data: user.addresses
  });
});

// @desc    Delete user address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  user.addresses = user.addresses.filter(
    addr => addr._id.toString() !== req.params.addressId
  );
  
  await user.save();

  res.status(200).json({
    success: true,
    data: user.addresses
  });
});

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    }
  });
};
