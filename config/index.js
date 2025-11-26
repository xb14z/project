require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery_system',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expire: process.env.JWT_EXPIRE || '7d'
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@delivery.com',
    password: process.env.ADMIN_PASSWORD || 'admin123456'
  }
};
