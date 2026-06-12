import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    phone: {type: String, default: ""},
    phoneVerified: {type: Boolean, default: false},
    avatar: {type: String, default: ""},
    googleId: {type: String, default: null},
    cartItems: {type: Object, default: {}},
    
    // RBAC fields
    roles: {type: [String], default: ['customer']}, // customer, admin, seller, rider, support
    permissions: {type: [String], default: []},
    isActive: {type: Boolean, default: true},
    
    // Wallet
    walletBalance: {type: Number, default: 0},
    
    // Referral
    referralCode: {type: String, default: null, unique: true, sparse: true},
    referredBy: {type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user'},
    
    // Push notifications
    fcmToken: {type: String, default: null},
    
    // Password reset
    resetPasswordToken: {type: String, default: null},
    resetPasswordExpires: {type: Date, default: null},
    
    // Address coordinates
    addresses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'address'
    }]
}, {minimize: false, timestamps: true});

// Index for phone lookup
userSchema.index({phone: 1});

const User = mongoose.models.user || mongoose.model('user', userSchema);

export default User;
