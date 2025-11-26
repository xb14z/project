const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'กรุณากรอกชื่อ'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'กรุณากรอกอีเมล'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'กรุณากรอกรหัสผ่าน'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'กรุณากรอกเบอร์โทรศัพท์']
  },
  idCardNumber: {
    type: String,
    required: [true, 'กรุณากรอกเลขบัตรประชาชน']
  },
  licenseNumber: {
    type: String,
    required: [true, 'กรุณากรอกเลขใบขับขี่']
  },
  vehicleType: {
    type: String,
    enum: ['motorcycle', 'car', 'bicycle'],
    default: 'motorcycle'
  },
  vehiclePlate: {
    type: String,
    required: [true, 'กรุณากรอกทะเบียนรถ']
  },
  vehicleColor: String,
  photo: String,
  status: {
    type: String,
    enum: ['available', 'busy', 'offline', 'suspended'],
    default: 'offline'
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  currentOrder: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    default: null
  },
  zone: {
    type: mongoose.Schema.ObjectId,
    ref: 'DeliveryZone'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  stats: {
    totalDeliveries: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 },
    cancelledDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountName: String
  }
}, {
  timestamps: true
});

// Hash password
driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
driverSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate token
driverSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, role: 'driver' }, config.jwt.secret, {
    expiresIn: config.jwt.expire
  });
};

module.exports = mongoose.model('Driver', driverSchema);
