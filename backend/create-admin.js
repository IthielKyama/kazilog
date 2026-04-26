require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');

const adminConfig = {
  name: process.env.ADMIN_NAME || 'System Admin',
  email: (process.env.ADMIN_EMAIL || 'admin@kazilog.com').trim().toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'Admin@12345',
};

async function createOrUpdateAdmin() {
  try {
    await connectDB();

    let admin = await User.findOne({ email: adminConfig.email }).select('+password');

    if (admin) {
      admin.name = adminConfig.name;
      admin.role = 'admin';
      admin.password = adminConfig.password;
      admin.mustChangePassword = false;
      await admin.save();
      console.log('Updated existing admin account.');
    } else {
      admin = await User.create({
        name: adminConfig.name,
        email: adminConfig.email,
        password: adminConfig.password,
        role: 'admin',
        mustChangePassword: false,
      });
      console.log('Created admin account.');
    }

    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${adminConfig.password}`);
  } catch (error) {
    console.error('Failed to bootstrap admin account:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

createOrUpdateAdmin();
