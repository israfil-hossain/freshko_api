import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

// Seller Login : /api/seller/login
export const sellerLogin = async (req, res) => {
    try{
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({email});
        
        if(!user){
            return res.json({success: false, message: "Invalid Credentials!"});
        }
        
        // Check if user has admin/seller/super_admin role
        const allowedRoles = ['seller', 'admin', 'super_admin', 'shop_manager', 'shop_picker', 'support_agent', 'content_manager', 'finance_manager'];
        if(!user.roles.some(role => allowedRoles.includes(role))){
            return res.json({success: false, message: "Not Authorized - Admin access only!"});
        }
        
        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.json({success: false, message: "Invalid Credentials!"});
        }
        
        // Check if user is active
        if(!user.isActive){
            return res.json({success: false, message: "Account is deactivated!"});
        }
        
        // Generate token
        const token = jwt.sign(
            {id: user._id, email: user.email, roles: user.roles}, 
            process.env.JWT_SECRET, 
            {expiresIn: '7d'}
        );
        
        res.cookie('sellerToken', token, {
            httpOnly: true,  
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });
        
        return res.json({success: true, message: "Logged In!", user: {email: user.email, name: user.name, roles: user.roles}});
    }catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Check Seller Auth : /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({success: false, message: "Not authenticated"});
        }
        
        return res.json({
            success: true, 
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                roles: req.user.roles,
                permissions: req.user.permissions || []
            }
        });
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message}); 
    }
}

// Check Seller Logout : /api/seller/logout
export  const sellerLogout = async (req, res) => {
    try {
        res.clearCookie('sellerToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        return res.json({success: true, message: 'Admin Logged Out!'});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Get All Users : /api/seller/users
export const listUsers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password");
        res.json({success: true, users});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}
