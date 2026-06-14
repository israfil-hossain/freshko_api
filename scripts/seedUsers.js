import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import DeliveryMan from '../models/DeliveryMan.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/freshko');
    console.log('✅ Connected to MongoDB');
    console.log('');

    const adminPassword = await bcrypt.hash('Grocika@123', 10);
    const defaultPassword = await bcrypt.hash('Password123', 10);

    // Generate unique referral code
    const generateRefCode = (prefix) => {
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${prefix}${random}`;
    };

    // ============ 1. SUPER ADMIN ============
    console.log('Creating Super Admin...');
    const existingAdmin = await User.findOne({ email: 'admin@grocika.com' });
    let admin;
    if (!existingAdmin) {
      admin = await User.create({
        name: 'Super Admin',
        email: 'admin@grocika.com',
        password: adminPassword,
        phone: '+8801234567890',
        roles: ['super_admin'],
        permissions: ['all'],
        isActive: true,
        phoneVerified: true,
        walletBalance: 0,
        avatar: '',
        cartItems: {},
        referralCode: generateRefCode('ADMIN')
      });
      console.log('✅ Super Admin created: admin@grocika.com / Grocika@123');
    } else {
      console.log('⚠️ Super Admin already exists: admin@grocika.com');
    }

    // ============ 2. ADMIN ============
    console.log('Creating Admin...');
    const existingAdmin2 = await User.findOne({ email: 'admin2@freshko.com' });
    if (!existingAdmin2) {
      await User.create({
        name: 'Admin User',
        email: 'admin2@freshko.com',
        password: defaultPassword,
        phone: '+8801234567891',
        roles: ['admin'],
        permissions: ['all'],
        isActive: true,
        phoneVerified: true,
        walletBalance: 0,
        avatar: '',
        cartItems: {},
        referralCode: generateRefCode('ADMIN2')
      });
      console.log('✅ Admin created: admin2@freshko.com / Password123');
    } else {
      console.log('⚠️ Admin already exists: admin2@freshko.com');
    }

    // ============ 3. SELLER ============
    console.log('Creating Seller...');
    const existingSeller = await User.findOne({ email: 'seller@freshko.com' });
    if (!existingSeller) {
      await User.create({
        name: 'Freshko Shop Owner',
        email: 'seller@freshko.com',
        password: defaultPassword,
        phone: '+8801234567892',
        roles: ['seller'],
        permissions: [],
        isActive: true,
        phoneVerified: true,
        walletBalance: 5000,
        avatar: '',
        cartItems: {},
        referralCode: generateRefCode('SELLER')
      });
      console.log('✅ Seller created: seller@freshko.com / Password123');
    } else {
      console.log('⚠️ Seller already exists: seller@freshko.com');
    }

    // ============ 4. SHOP MANAGER ============
    console.log('Creating Shop Manager...');
    const existingManager = await User.findOne({ email: 'manager@freshko.com' });
    if (!existingManager) {
      await User.create({
        name: 'Shop Manager',
        email: 'manager@freshko.com',
        password: defaultPassword,
        phone: '+8801234567893',
        roles: ['shop_manager'],
        permissions: [],
        isActive: true,
        phoneVerified: true,
        walletBalance: 0,
        avatar: '',
        cartItems: {},
        referralCode: generateRefCode('MGR')
      });
      console.log('✅ Shop Manager created: manager@freshko.com / Password123');
    } else {
      console.log('⚠️ Shop Manager already exists: manager@freshko.com');
    }

    // ============ 5. SHOP PICKER ============
    console.log('Creating Shop Picker...');
    const existingPicker = await User.findOne({ email: 'picker@freshko.com' });
    if (!existingPicker) {
      await User.create({
        name: 'Warehouse Staff',
        email: 'picker@freshko.com',
        password: defaultPassword,
        phone: '+8801234567894',
        roles: ['shop_picker'],
        permissions: [],
        isActive: true,
        phoneVerified: true,
        walletBalance: 0,
        avatar: '',
        cartItems: {},
        referralCode: generateRefCode('PICK')
      });
      console.log('✅ Shop Picker created: picker@freshko.com / Password123');
    } else {
      console.log('⚠️ Shop Picker already exists: picker@freshko.com');
    }

    // ============ 6. SUPPORT AGENT ============
    console.log('Creating Support Agent...');
    const existingSupport = await User.findOne({ email: 'support@freshko.com' });
    if (!existingSupport) {
      await User.create({
        name: 'Support Agent',
        email: 'support@freshko.com',
        password: defaultPassword,
        phone: '+8801234567895',
        roles: ['support_agent'],
        permissions: [],
        isActive: true,
        phoneVerified: true,
        walletBalance: 0,
        avatar: '',
        cartItems: {},
        referralCode: generateRefCode('SUPP')
      });
      console.log('✅ Support Agent created: support@freshko.com / Password123');
    } else {
      console.log('⚠️ Support Agent already exists: support@freshko.com');
    }

    // ============ 7. CONTENT MANAGER ============
    console.log('Creating Content Manager...');
    const existingContent = await User.findOne({ email: 'content@freshko.com' });
    if (!existingContent) {
      await User.create({
        name: 'Marketing Manager',
        email: 'content@freshko.com',
        password: defaultPassword,
        phone: '+8801234567896',
        roles: ['content_manager'],
        permissions: [],
        isActive: true,
        phoneVerified: true,
        walletBalance: 0,
        avatar: '',
        cartItems: {},
        referralCode: generateRefCode('CONT')
      });
      console.log('✅ Content Manager created: content@freshko.com / Password123');
    } else {
      console.log('⚠️ Content Manager already exists: content@freshko.com');
    }

    // ============ 8. FINANCE MANAGER ============
    console.log('Creating Finance Manager...');
    const existingFinance = await User.findOne({ email: 'finance@freshko.com' });
    if (!existingFinance) {
      await User.create({
        name: 'Finance Manager',
        email: 'finance@freshko.com',
        password: defaultPassword,
        phone: '+8801234567897',
        roles: ['finance_manager'],
        permissions: [],
        isActive: true,
        phoneVerified: true,
        walletBalance: 0,
        avatar: '',
        cartItems: {},
        referralCode: generateRefCode('FIN')
      });
      console.log('✅ Finance Manager created: finance@freshko.com / Password123');
    } else {
      console.log('⚠️ Finance Manager already exists: finance@freshko.com');
    }

    // ============ 9. DELIVERY RIDER ============
    console.log('Creating Delivery Rider...');
    const existingRider = await User.findOne({ email: 'rider@freshko.com' });
    if (!existingRider) {
      await User.create({
        name: 'Delivery Rider',
        email: 'rider@freshko.com',
        password: defaultPassword,
        phone: '+8801234567898',
        roles: ['rider'],
        permissions: [],
        isActive: true,
        phoneVerified: true,
        walletBalance: 2000,
        avatar: '',
        cartItems: {},
        referralCode: generateRefCode('RIDER')
      });
      console.log('✅ Rider (User) created: rider@freshko.com / Password123');
    } else {
      console.log('⚠️ Rider (User) already exists: rider@freshko.com');
    }

    // Also create in DeliveryMan collection for delivery-specific functionality
    const existingDeliveryMan = await DeliveryMan.findOne({ email: 'rider@freshko.com' });
    if (!existingDeliveryMan) {
      await DeliveryMan.create({
        name: 'Delivery Rider',
        email: 'rider@freshko.com',
        password: defaultPassword,
        phone: '+8801234567898',
        isActive: true,
        totalEarnings: 5000,
        totalDeliveries: 120,
        currentOrderId: null
      });
      console.log('✅ DeliveryMan created in DeliveryMan collection');
    } else {
      console.log('⚠️ DeliveryMan already exists in DeliveryMan collection');
    }

    // ============ 10. CUSTOMER ============
    console.log('Creating Customer...');
    const existingCustomer = await User.findOne({ email: 'customer@freshko.com' });
    if (!existingCustomer) {
      await User.create({
        name: 'John Doe',
        email: 'customer@freshko.com',
        password: defaultPassword,
        phone: '+8801234567899',
        roles: ['customer'],
        permissions: [],
        isActive: true,
        phoneVerified: true,
        walletBalance: 1000,
        avatar: '',
        cartItems: {},
        referralCode: generateRefCode('CUST')
      });
      console.log('✅ Customer created: customer@freshko.com / Password123');
    } else {
      console.log('⚠️ Customer already exists: customer@freshko.com');
    }

    // ============ 11. CUSTOMER 2 (with referral) ============
    console.log('Creating Customer 2...');
    const existingCustomer2 = await User.findOne({ email: 'customer2@freshko.com' });
    if (!existingCustomer2) {
      await User.create({
        name: 'Jane Smith',
        email: 'customer2@freshko.com',
        password: defaultPassword,
        phone: '+8801234567900',
        roles: ['customer'],
        permissions: [],
        isActive: true,
        phoneVerified: true,
        walletBalance: 500,
        avatar: '',
        cartItems: {},
        referralCode: generateRefCode('CUST2')
      });
      console.log('✅ Customer 2 created: customer2@freshko.com / Password123');
    } else {
      console.log('⚠️ Customer 2 already exists: customer2@freshko.com');
    }

    console.log('');
    console.log('========================================');
    console.log('✅ ALL USERS SEEDED SUCCESSFULLY!');
    console.log('========================================');
    console.log('');
    console.log('LOGIN CREDENTIALS:');
    console.log('');
    console.log('👤 SUPER ADMIN:');
    console.log('   Email: admin@grocika.com');
    console.log('   Password: Grocika@123');
    console.log('   Role: super_admin');
    console.log('   Login: http://localhost:3000/seller/login');
    console.log('');
    console.log('👤 ADMIN:');
    console.log('   Email: admin2@freshko.com');
    console.log('   Password: Password123');
    console.log('   Role: admin');
    console.log('   Login: http://localhost:3000/seller/login');
    console.log('');
    console.log('🏪 SELLER:');
    console.log('   Email: seller@freshko.com');
    console.log('   Password: Password123');
    console.log('   Role: seller');
    console.log('   Login: http://localhost:3000/seller/login');
    console.log('');
    console.log('👨‍💼 SHOP MANAGER:');
    console.log('   Email: manager@freshko.com');
    console.log('   Password: Password123');
    console.log('   Role: shop_manager');
    console.log('   Login: http://localhost:3000/seller/login');
    console.log('');
    console.log('📦 SHOP PICKER:');
    console.log('   Email: picker@freshko.com');
    console.log('   Password: Password123');
    console.log('   Role: shop_picker');
    console.log('   Login: http://localhost:3000/seller/login');
    console.log('');
    console.log('🎧 SUPPORT AGENT:');
    console.log('   Email: support@freshko.com');
    console.log('   Password: Password123');
    console.log('   Role: support_agent');
    console.log('   Login: http://localhost:3000/seller/login');
    console.log('');
    console.log('📝 CONTENT MANAGER:');
    console.log('   Email: content@freshko.com');
    console.log('   Password: Password123');
    console.log('   Role: content_manager');
    console.log('   Login: http://localhost:3000/seller/login');
    console.log('');
    console.log('💰 FINANCE MANAGER:');
    console.log('   Email: finance@freshko.com');
    console.log('   Password: Password123');
    console.log('   Role: finance_manager');
    console.log('   Login: http://localhost:3000/seller/login');
    console.log('');
    console.log('🚴 DELIVERY RIDER:');
    console.log('   Email: rider@freshko.com');
    console.log('   Password: Password123');
    console.log('   Role: rider');
    console.log('   Login: http://localhost:3000/delivery-man/login');
    console.log('');
    console.log('🛒 CUSTOMER:');
    console.log('   Email: customer@freshko.com');
    console.log('   Password: Password123');
    console.log('   Role: customer');
    console.log('   Login: http://localhost:3000/login');
    console.log('');
    console.log('🛒 CUSTOMER 2:');
    console.log('   Email: customer2@freshko.com');
    console.log('   Password: Password123');
    console.log('   Role: customer');
    console.log('   Login: http://localhost:3000/login');
    console.log('');
    console.log('========================================');
    console.log('');
    console.log('Super Admin password: Grocika@123');
    console.log('All other passwords: Password123');
    console.log('');
    console.log('You can also use Phone Login with these phone numbers:');
    console.log('  +8801234567890 (Admin)');
    console.log('  +8801234567898 (Rider)');
    console.log('  +8801234567899 (Customer)');
    console.log('');
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run the script
seedUsers();
