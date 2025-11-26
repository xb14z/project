const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, Driver } = require('../models');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'กรุณาเข้าสู่ระบบ'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    if (decoded.role === 'driver') {
      req.driver = await Driver.findById(decoded.id);
      req.user = null;
    } else {
      req.user = await User.findById(decoded.id);
      req.driver = null;
    }

    if (!req.user && !req.driver) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบผู้ใช้งาน'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token ไม่ถูกต้อง'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || (req.driver ? 'driver' : null);
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึง'
      });
    }
    next();
  };
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'ต้องเป็น Admin เท่านั้น'
    });
  }
  next();
};

// Check if user is driver
exports.isDriver = (req, res, next) => {
  if (!req.driver) {
    return res.status(403).json({
      success: false,
      message: 'ต้องเป็นคนขับเท่านั้น'
    });
  }
  next();
};
