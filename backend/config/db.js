import mongoose from 'mongoose';
import User from '../models/User.js';

const createDefaultAdmin = async () => {
  try {
    const adminEmail = 'admin@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        isVerified: true,
        isActive: true,
      });
      console.log('✅ Default admin created — admin@gmail.com / admin123');
    } else {
      // Ensure existing admin has correct role, verified status, and active status
      if (!existingAdmin.isVerified || existingAdmin.role !== 'admin' || !existingAdmin.isActive) {
        existingAdmin.isVerified = true;
        existingAdmin.role = 'admin';
        existingAdmin.isActive = true;
        existingAdmin.password = 'admin123';
        await existingAdmin.save();
        console.log('✅ Existing admin record corrected — verified, active & role set, password reset');
      } else {
        console.log('✅ Admin user already exists and is properly configured');
      }
    }
  } catch (error) {
    console.error('❌ Admin seed error:', error.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await createDefaultAdmin();
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB connection error: ${err}`);
});

export default connectDB;
