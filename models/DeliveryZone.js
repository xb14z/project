const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'กรุณากรอกชื่อโซน'],
    unique: true,
    trim: true
  },
  description: String,
  areas: [{
    district: String,
    subDistrict: String,
    postalCode: String
  }],
  // หรือใช้ polygon สำหรับพื้นที่แบบละเอียด
  polygon: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // [[[lng, lat], [lng, lat], ...]]
      default: undefined
    }
  },
  deliveryFee: {
    type: Number,
    required: [true, 'กรุณากรอกค่าจัดส่ง'],
    min: 0
  },
  freeDeliveryMinimum: {
    type: Number,
    default: null // ยอดขั้นต่ำสำหรับส่งฟรี
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  estimatedTime: {
    min: { type: Number, default: 20 }, // นาที
    max: { type: Number, default: 45 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxConcurrentOrders: {
    type: Number,
    default: 50
  }
}, {
  timestamps: true
});

// Index for geo queries
deliveryZoneSchema.index({ polygon: '2dsphere' });

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);
