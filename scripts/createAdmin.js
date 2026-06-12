import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/freshko');
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@freshko.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      console.log('Roles:', existingAdmin.roles);
      process.exit(0);
    }
    
    // Create admin user
    const password = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@freshko.com',
      password: password,
      roles: ['super_admin'],
      permissions: ['all'],
      isActive: true,
      phone: '+8801XXXXXXXXX',
      address: 'Admin Office',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Roles:', admin.roles);
    console.log('');
    console.log('You can now login at: http://localhost:3000/seller/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

// Run the script
createAdmin();
