const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/error');
const {
  authRoutes,
  categoryRoutes,
  productRoutes,
  orderRoutes,
  driverRoutes,
  zoneRoutes,
  dashboardRoutes,
  customerRoutes
} = require('./routes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (development only)
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Delivery Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Delivery Management System API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new customer',
        'POST /api/auth/login': 'Login customer',
        'POST /api/auth/admin/login': 'Login admin',
        'POST /api/auth/driver/login': 'Login driver',
        'GET /api/auth/me': 'Get current user',
        'PUT /api/auth/updatedetails': 'Update user details',
        'PUT /api/auth/updatepassword': 'Update password',
        'POST /api/auth/addresses': 'Add address',
        'PUT /api/auth/addresses/:id': 'Update address',
        'DELETE /api/auth/addresses/:id': 'Delete address'
      },
      categories: {
        'GET /api/categories': 'Get all categories',
        'GET /api/categories/:id': 'Get single category',
        'POST /api/categories': 'Create category (Admin)',
        'PUT /api/categories/:id': 'Update category (Admin)',
        'DELETE /api/categories/:id': 'Delete category (Admin)'
      },
      products: {
        'GET /api/products': 'Get all products (with filters)',
        'GET /api/products/:id': 'Get single product',
        'POST /api/products': 'Create product (Admin)',
        'PUT /api/products/:id': 'Update product (Admin)',
        'DELETE /api/products/:id': 'Delete product (Admin)',
        'PATCH /api/products/:id/availability': 'Toggle availability (Admin)',
        'PATCH /api/products/:id/stock': 'Update stock (Admin)'
      },
      orders: {
        'GET /api/orders': 'Get all orders (Admin)',
        'GET /api/orders/:id': 'Get single order',
        'GET /api/orders/track/:orderNumber': 'Track order by number',
        'GET /api/orders/my-orders': 'Get customer orders',
        'GET /api/orders/pending-count': 'Get pending orders count (Admin)',
        'POST /api/orders': 'Create order',
        'PATCH /api/orders/:id/status': 'Update order status (Admin/Driver)',
        'PATCH /api/orders/:id/assign-driver': 'Assign driver (Admin)',
        'PATCH /api/orders/:id/cancel': 'Cancel order',
        'POST /api/orders/:id/rate': 'Rate order'
      },
      drivers: {
        'GET /api/drivers': 'Get all drivers (Admin)',
        'GET /api/drivers/:id': 'Get single driver (Admin)',
        'GET /api/drivers/available': 'Get available drivers (Admin)',
        'POST /api/drivers': 'Create driver (Admin)',
        'PUT /api/drivers/:id': 'Update driver (Admin)',
        'DELETE /api/drivers/:id': 'Delete driver (Admin)',
        'PATCH /api/drivers/:id/verify': 'Verify driver (Admin)',
        'PATCH /api/drivers/:id/suspend': 'Suspend/Unsuspend driver (Admin)',
        'PATCH /api/drivers/status': 'Update own status (Driver)',
        'PATCH /api/drivers/location': 'Update own location (Driver)',
        'GET /api/drivers/current-order': 'Get current order (Driver)',
        'GET /api/drivers/orders': 'Get order history (Driver)'
      },
      zones: {
        'GET /api/zones': 'Get all zones',
        'GET /api/zones/:id': 'Get single zone',
        'GET /api/zones/check/:postalCode': 'Check if postal code is deliverable',
        'POST /api/zones/calculate-fee': 'Calculate delivery fee',
        'POST /api/zones': 'Create zone (Admin)',
        'PUT /api/zones/:id': 'Update zone (Admin)',
        'DELETE /api/zones/:id': 'Delete zone (Admin)'
      },
      customers: {
        'GET /api/customers': 'Get all customers (Admin)',
        'GET /api/customers/:id': 'Get single customer (Admin)',
        'GET /api/customers/:id/orders': 'Get customer orders (Admin)',
        'PUT /api/customers/:id': 'Update customer (Admin)',
        'PATCH /api/customers/:id/deactivate': 'Deactivate customer (Admin)',
        'PATCH /api/customers/:id/activate': 'Activate customer (Admin)',
        'DELETE /api/customers/:id': 'Delete customer (Admin)'
      },
      dashboard: {
        'GET /api/dashboard/overview': 'Get dashboard overview (Admin)',
        'GET /api/dashboard/sales': 'Get sales analytics (Admin)',
        'GET /api/dashboard/top-products': 'Get top products (Admin)',
        'GET /api/dashboard/driver-performance': 'Get driver performance (Admin)',
        'GET /api/dashboard/orders-by-hour': 'Get orders by hour (Admin)',
        'GET /api/dashboard/recent-orders': 'Get recent orders (Admin)',
        'GET /api/dashboard/customers': 'Get customer analytics (Admin)'
      }
    }
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler
app.use(errorHandler);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Delivery Management System API                        ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               ║
║                                                            ║
║   Server running on: http://localhost:${PORT}                ║
║   Environment: ${config.nodeEnv}                              ║
║   API Docs: http://localhost:${PORT}/api                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
