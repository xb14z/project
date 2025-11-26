const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'กรุณากรอกชื่อหมวดหมู่'],
    unique: true,
    trim: true,
    maxlength: [50, 'ชื่อหมวดหมู่ต้องไม่เกิน 50 ตัวอักษร']
  },
  description: {
    type: String,
    maxlength: [500, 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร']
  },
  image: {
    type: String,
    default: null
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate products
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  justOne: false
});

module.exports = mongoose.model('Category', categorySchema);
