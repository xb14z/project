# 🚀 Delivery Management System

ระบบจัดการหลังบ้านสำหรับบริการ Delivery พัฒนาด้วย Node.js + Express + MongoDB

## 📋 Features

### 🛒 Order Management
- สร้าง/แก้ไข/ยกเลิกออเดอร์
- ติดตามสถานะออเดอร์แบบ Real-time
- อัพเดทสถานะ (pending → confirmed → preparing → delivered)
- ประวัติการสั่งซื้อ
- ให้คะแนนและรีวิว

### 👥 Customer Management
- ลงทะเบียน/เข้าสู่ระบบ
- จัดการที่อยู่หลายแห่ง
- ดูประวัติการสั่งซื้อ
- ระงับ/เปิดใช้งานบัญชี

### 🏍️ Driver Management
- CRUD คนขับ
- ยืนยันตัวตนคนขับ
- สถานะ (available/busy/offline)
- ติดตามตำแหน่ง GPS
- มอบหมายงานอัตโนมัติ
- สถิติการทำงาน

### 📦 Product/Menu Management
- CRUD สินค้า/เมนู
- หมวดหมู่สินค้า
- ตั้งราคา/โปรโมชั่น
- จัดการสต็อก
- เปิด/ปิดการขาย

### 🗺️ Delivery Zone
- กำหนดพื้นที่จัดส่ง
- ค่าจัดส่งตามโซน
- ส่งฟรีเมื่อถึงยอดขั้นต่ำ
- เวลาจัดส่งโดยประมาณ

### 📊 Dashboard & Reports
- ภาพรวมยอดขาย
- สถิติออเดอร์รายวัน/เดือน
- สินค้าขายดี
- Performance คนขับ
- กราฟแนวโน้ม

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT
- **Security:** Helmet, bcryptjs

## 📁 Project Structure

```
delivery-system/
├── src/
│   ├── config/
│   │   ├── index.js          # Configuration
│   │   └── database.js       # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── driverController.js
│   │   ├── zoneController.js
│   │   ├── customerController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js           # Authentication middleware
│   │   └── error.js          # Error handling
│   ├── models/
│   │   ├── User.js
│   │   ├── Category.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Driver.js
│   │   └── DeliveryZone.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── drivers.js
│   │   ├── zones.js
│   │   ├── customers.js
│   │   └── dashboard.js
│   ├── seeds/
│   │   └── seed.js           # Sample data
│   └── server.js             # Entry point
├── .env.example
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd delivery-system
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Seed sample data
```bash
npm run seed
```

5. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

## 🔐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register customer |
| POST | `/api/auth/login` | Login customer |
| POST | `/api/auth/admin/login` | Login admin |
| POST | `/api/auth/driver/login` | Login driver |
| GET | `/api/auth/me` | Get current user |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:id` | Get single category |
| POST | `/api/categories` | Create category *(Admin)* |
| PUT | `/api/categories/:id` | Update category *(Admin)* |
| DELETE | `/api/categories/:id` | Delete category *(Admin)* |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product *(Admin)* |
| PUT | `/api/products/:id` | Update product *(Admin)* |
| DELETE | `/api/products/:id` | Delete product *(Admin)* |
| PATCH | `/api/products/:id/availability` | Toggle availability |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders *(Admin)* |
| GET | `/api/orders/my-orders` | Get my orders |
| GET | `/api/orders/track/:orderNumber` | Track order |
| POST | `/api/orders` | Create order |
| PATCH | `/api/orders/:id/status` | Update status |
| PATCH | `/api/orders/:id/assign-driver` | Assign driver *(Admin)* |
| PATCH | `/api/orders/:id/cancel` | Cancel order |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | Get all drivers *(Admin)* |
| GET | `/api/drivers/available` | Get available drivers |
| POST | `/api/drivers` | Create driver *(Admin)* |
| PATCH | `/api/drivers/status` | Update own status *(Driver)* |
| PATCH | `/api/drivers/location` | Update location *(Driver)* |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | Get overview stats |
| GET | `/api/dashboard/sales` | Get sales analytics |
| GET | `/api/dashboard/top-products` | Get top products |
| GET | `/api/dashboard/driver-performance` | Driver performance |

## 📝 Sample Login Credentials

After running seed:

**Admin:**
- Email: admin@delivery.com
- Password: admin123456

**Customer:**
- Email: customer@example.com
- Password: customer123

**Driver:**
- Email: driver1@example.com
- Password: driver123

## 📄 License

MIT License
