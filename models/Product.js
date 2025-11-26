const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'กรุณากรอกชื่อสินค้า'],
    trim: true,
    maxlength: [100, 'ชื่อสินค้าต้องไม่เกิน 100 ตัวอักษร']
  },
  description: {
    type: String,
    maxlength: [1000, 'คำอธิบายต้องไม่เกิน 1000 ตัวอักษร']
  },
  price: {
    type: Number,
    required: [true, 'กรุณากรอกราคา'],
    min: [0, 'ราคาต้องไม่ติดลบ']
  },
  originalPrice: {
    type: Number,
    default: null
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'กรุณาเลือกหมวดหมู่']
  },
  image: {
    type: String,
    default: null
  },
  images: [{
    type: String
  }],
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'จำนวนสต็อกต้องไม่ติดลบ']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  options: [{
    name: String,
    choices: [{
      name: String,
      priceModifier: { type: Number, default: 0 }
    }]
  }],
  preparationTime: {
    type: Number,
    default: 15,
    min: 0
  },
  tags: [{
    type: String
  }],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  soldCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
