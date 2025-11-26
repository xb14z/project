const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'กรุณาระบุลูกค้า']
  },
  items: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    options: [{
      name: String,
      choice: String,
      priceModifier: Number
    }],
    specialInstructions: String,
    subtotal: Number
  }],
  deliveryAddress: {
    label: String,
    address: { type: String, required: true },
    district: String,
    province: String,
    postalCode: String,
    lat: Number,
    lng: Number,
    contactName: String,
    contactPhone: String
  },
  pricing: {
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountCode: String,
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'credit_card', 'bank_transfer', 'promptpay', 'wallet'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  status: {
    type: String,
    enum: [
      'pending',           // รอยืนยัน
      'confirmed',         // ยืนยันแล้ว
      'preparing',         // กำลังเตรียม
      'ready_for_pickup',  // พร้อมให้คนขับรับ
      'driver_assigned',   // มอบหมายคนขับแล้ว
      'picked_up',         // คนขับรับของแล้ว
      'out_for_delivery',  // กำลังจัดส่ง
      'delivered',         // ส่งสำเร็จ
      'cancelled',         // ยกเลิก
      'refunded'           // คืนเงินแล้ว
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      refPath: 'statusHistory.updatedByModel'
    },
    updatedByModel: {
      type: String,
      enum: ['User', 'Driver']
    }
  }],
  driver: {
    type: mongoose.Schema.ObjectId,
    ref: 'Driver',
    default: null
  },
  driverAssignedAt: Date,
  zone: {
    type: mongoose.Schema.ObjectId,
    ref: 'DeliveryZone'
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  scheduledFor: Date, // สำหรับสั่งล่วงหน้า
  notes: String,
  cancelReason: String,
  cancelledBy: {
    type: mongoose.Schema.ObjectId,
    refPath: 'cancelledByModel'
  },
  cancelledByModel: {
    type: String,
    enum: ['User', 'Driver', 'Admin']
  },
  rating: {
    food: { type: Number, min: 1, max: 5 },
    delivery: { type: Number, min: 1, max: 5 },
    comment: String,
    ratedAt: Date
  },
  proofOfDelivery: {
    photo: String,
    signature: String,
    receivedBy: String
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    });
    this.orderNumber = `ORD${dateStr}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Add status to history on status change
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ driver: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });

module.exports = mongoose.model('Order', orderSchema);
