const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const config = require('../config');
const { User, Category, Product, Driver, DeliveryZone } = require('../models');

const seedData = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Driver.deleteMany({});
    await DeliveryZone.deleteMany({});
    console.log('Cleared existing data');

    // Create Admin
    const adminPassword = await bcrypt.hash(config.admin.password, 10);
    const admin = await User.create({
      name: 'Admin',
      email: config.admin.email,
      password: adminPassword,
      phone: '0999999999',
      role: 'admin'
    });
    console.log('✅ Admin created:', admin.email);

    // Create Categories
    const categories = await Category.insertMany([
      { name: 'อาหารไทย', description: 'อาหารไทยต้นตำรับ', sortOrder: 1 },
      { name: 'อาหารญี่ปุ่น', description: 'ซูชิ ราเมน และอื่นๆ', sortOrder: 2 },
      { name: 'อาหารจานเดียว', description: 'ข้าวผัด ก๋วยเตี๋ยว', sortOrder: 3 },
      { name: 'เครื่องดื่ม', description: 'น้ำผลไม้ ชา กาแฟ', sortOrder: 4 },
      { name: 'ของหวาน', description: 'ขนมไทย ไอศกรีม', sortOrder: 5 }
    ]);
    console.log('✅ Categories created:', categories.length);

    // Create Products
    const products = await Product.insertMany([
      // อาหารไทย
      { name: 'ผัดกระเพราหมูสับ', price: 50, category: categories[0]._id, preparationTime: 10, isAvailable: true },
      { name: 'ต้มยำกุ้ง', price: 120, category: categories[0]._id, preparationTime: 15, isAvailable: true },
      { name: 'แกงเขียวหวานไก่', price: 80, category: categories[0]._id, preparationTime: 15, isAvailable: true },
      { name: 'ส้มตำไทย', price: 45, category: categories[0]._id, preparationTime: 5, isAvailable: true },
      { name: 'ข้าวมันไก่', price: 55, category: categories[0]._id, preparationTime: 10, isAvailable: true },

      // อาหารญี่ปุ่น
      { name: 'ซูชิเซ็ต 8 ชิ้น', price: 199, category: categories[1]._id, preparationTime: 20, isAvailable: true },
      { name: 'ราเมนหมูชาชู', price: 159, category: categories[1]._id, preparationTime: 15, isAvailable: true },
      { name: 'ข้าวหน้าแซลมอน', price: 169, category: categories[1]._id, preparationTime: 10, isAvailable: true },
      { name: 'เกี๊ยวซ่าทอด', price: 79, category: categories[1]._id, preparationTime: 10, isAvailable: true },

      // อาหารจานเดียว
      { name: 'ข้าวผัดปู', price: 89, category: categories[2]._id, preparationTime: 10, isAvailable: true },
      { name: 'ก๋วยเตี๋ยวเรือ', price: 45, category: categories[2]._id, preparationTime: 8, isAvailable: true },
      { name: 'บะหมี่เกี๊ยวหมูแดง', price: 55, category: categories[2]._id, preparationTime: 8, isAvailable: true },
      { name: 'ผัดไทยกุ้งสด', price: 75, category: categories[2]._id, preparationTime: 12, isAvailable: true },

      // เครื่องดื่ม
      { name: 'ชาไทย', price: 35, category: categories[3]._id, preparationTime: 3, isAvailable: true },
      { name: 'กาแฟเย็น', price: 40, category: categories[3]._id, preparationTime: 3, isAvailable: true },
      { name: 'น้ำมะพร้าว', price: 45, category: categories[3]._id, preparationTime: 2, isAvailable: true },
      { name: 'สมูทตี้มะม่วง', price: 55, category: categories[3]._id, preparationTime: 5, isAvailable: true },

      // ของหวาน
      { name: 'ข้าวเหนียวมะม่วง', price: 69, category: categories[4]._id, preparationTime: 5, isAvailable: true },
      { name: 'ไอศกรีมกะทิ', price: 39, category: categories[4]._id, preparationTime: 3, isAvailable: true },
      { name: 'บัวลอยไข่หวาน', price: 35, category: categories[4]._id, preparationTime: 5, isAvailable: true }
    ]);
    console.log('✅ Products created:', products.length);

    // Create Delivery Zones
    const zones = await DeliveryZone.insertMany([
      {
        name: 'โซนกลางเมือง',
        deliveryFee: 0,
        freeDeliveryMinimum: null,
        minOrderAmount: 0,
        estimatedTime: { min: 15, max: 30 },
        areas: [
          { district: 'เมือง', postalCode: '10100' },
          { district: 'ปทุมวัน', postalCode: '10330' },
          { district: 'บางรัก', postalCode: '10500' }
        ]
      },
      {
        name: 'โซนรอบนอก',
        deliveryFee: 20,
        freeDeliveryMinimum: 300,
        minOrderAmount: 100,
        estimatedTime: { min: 25, max: 45 },
        areas: [
          { district: 'จตุจักร', postalCode: '10900' },
          { district: 'ลาดพร้าว', postalCode: '10230' },
          { district: 'บางกะปิ', postalCode: '10240' }
        ]
      },
      {
        name: 'โซนไกล',
        deliveryFee: 40,
        freeDeliveryMinimum: 500,
        minOrderAmount: 150,
        estimatedTime: { min: 35, max: 60 },
        areas: [
          { district: 'มีนบุรี', postalCode: '10510' },
          { district: 'หนองจอก', postalCode: '10530' },
          { district: 'บางขุนเทียน', postalCode: '10150' }
        ]
      }
    ]);
    console.log('✅ Delivery Zones created:', zones.length);

    // Create Sample Drivers
    const driverPassword = await bcrypt.hash('driver123', 10);
    const drivers = await Driver.insertMany([
      {
        name: 'สมชาย ขับดี',
        email: 'driver1@example.com',
        password: driverPassword,
        phone: '0811111111',
        idCardNumber: '1234567890123',
        licenseNumber: 'DL001',
        vehicleType: 'motorcycle',
        vehiclePlate: 'กข 1234',
        vehicleColor: 'แดง',
        zone: zones[0]._id,
        isVerified: true,
        status: 'available'
      },
      {
        name: 'สมหญิง ส่งเร็ว',
        email: 'driver2@example.com',
        password: driverPassword,
        phone: '0822222222',
        idCardNumber: '1234567890124',
        licenseNumber: 'DL002',
        vehicleType: 'motorcycle',
        vehiclePlate: 'ขค 5678',
        vehicleColor: 'น้ำเงิน',
        zone: zones[1]._id,
        isVerified: true,
        status: 'available'
      },
      {
        name: 'สมศักดิ์ รถเร็ว',
        email: 'driver3@example.com',
        password: driverPassword,
        phone: '0833333333',
        idCardNumber: '1234567890125',
        licenseNumber: 'DL003',
        vehicleType: 'motorcycle',
        vehiclePlate: 'คง 9012',
        vehicleColor: 'ดำ',
        zone: zones[0]._id,
        isVerified: true,
        status: 'offline'
      }
    ]);
    console.log('✅ Drivers created:', drivers.length);

    // Create Sample Customer
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customer = await User.create({
      name: 'ลูกค้าตัวอย่าง',
      email: 'customer@example.com',
      password: customerPassword,
      phone: '0899999999',
      role: 'customer',
      addresses: [
        {
          label: 'บ้าน',
          address: '123 ถนนสุขุมวิท',
          district: 'คลองเตย',
          province: 'กรุงเทพฯ',
          postalCode: '10110',
          isDefault: true
        }
      ]
    });
    console.log('✅ Sample customer created:', customer.email);

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ✅ Seed completed successfully!                          ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               ║
║                                                            ║
║   📧 Admin Login:                                          ║
║      Email: ${config.admin.email}                       ║
║      Password: ${config.admin.password}                          ║
║                                                            ║
║   📧 Customer Login:                                       ║
║      Email: customer@example.com                           ║
║      Password: customer123                                 ║
║                                                            ║
║   📧 Driver Login:                                         ║
║      Email: driver1@example.com                            ║
║      Password: driver123                                   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
