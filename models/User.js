const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'กรุณากรอกชื่อ'],
    trim: true,
    maxlength: [100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร']
  },
  email: {
    type: String,
    required: [true, 'กรุณากรอกอีเมล'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'กรุณากรอกอีเมลที่ถูกต้อง']
  },
  password: {
    type: String,
    required: [true, 'กรุณากรอกรหัสผ่าน'],
    minlength: [6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'กรุณากรอกเบอร์โทรศัพท์'],
    match: [/^[0-9]{10}$/, 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง']
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'manager'],
    default: 'customer'
  },
  addresses: [{
    label: { type: String, default: 'บ้าน' },
    address: { type: String, required: true },
    district: String,
    province: String,
    postalCode: String,
    lat: Number,
    lng: Number,
    isDefault: { type: Boolean, default: false }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT Token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, config.jwt.secret, {
    expiresIn: config.jwt.expire
  });
};

module.exports = mongoose.model('User', userSchema);
