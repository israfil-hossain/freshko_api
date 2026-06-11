import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

// Register User : /api/user/register
export const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if(!name || !email || !password){
            return res.json({success: false, message: 'Missing Details'});
        }
        
        const existingUser = await User.findOne({email});
        if(existingUser)
            return res.json({success: false, message: "User Already Exists"});
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({name, email, password: hashedPassword, phone: phone || ""});
        
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie('userToken', token, {
            httpOnly: true,  // Prevent JavaScript to access cookie
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // CSRF Production
            maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expiration time
            path: '/'
        })
        const tokenSecret = process.env.MOBILE_TOKEN_SECRET || process.env.JWT_SECRET;
        const mobileToken = jwt.sign({id: user._id}, tokenSecret, {expiresIn: '30d'});
        return res.json({success: true, token: mobileToken, user: {_id: user._id, email: user.email, name: user.name, phone: user.phone}});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Login User : /api/user/login

export const login = async (req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.json({success: false, message: "Email and Password are required"});
        }
        const user = await User.findOne({email});
        if(!user){
            return res.json({success: false, message: "Invalid Email or Password"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch)
            return res.json({success: false, message: "Invalid Email or Password"});

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
        res.cookie('userToken', token, {
            httpOnly: true,  
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/' 
        });
        const tokenSecret = process.env.MOBILE_TOKEN_SECRET || process.env.JWT_SECRET;
        const mobileToken = jwt.sign({id: user._id}, tokenSecret, {expiresIn: '30d'});
        return res.json({success: true, token: mobileToken, user: {email: user.email, name: user.name}});

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});       
    }
}

// Google Login : /api/user/google-login
export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.json({ success: false, message: "Google token required" });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return res.json({ success: false, message: "Google login not configured" });
        }

        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
            idToken,
            audience: clientId,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.json({ success: false, message: "Invalid Google token" });
        }

        let user = await User.findOne({ email: payload.email });

        if (user) {
            // Link googleId if not already linked
            if (!user.googleId) {
                user.googleId = payload.sub;
                await user.save();
            }
        } else {
            // Create new user with Google info
            const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
            user = await User.create({
                name: payload.name || payload.email.split('@')[0],
                email: payload.email,
                password: hashedPassword,
                avatar: payload.picture || '',
                googleId: payload.sub,
                phone: "",
            });
        }

        const tokenSecret = process.env.MOBILE_TOKEN_SECRET || process.env.JWT_SECRET;
        const token = jwt.sign({ id: user._id }, tokenSecret, { expiresIn: '30d' });

        // Set cookie for web
        res.cookie('userToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });

        return res.json({
            success: true,
            token,
            user: { _id: user._id, email: user.email, name: user.name, phone: user.phone, avatar: user.avatar }
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Check Auth : /api/user/is-auth
export const isAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password -resetPasswordToken -resetPasswordExpires");
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        res.json({success: true, user});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message}); 
    }
}

// Check User Logout : /api/user/logout
export  const logout = async (req, res) => {
    try {
        res.clearCookie('userToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/' 
        });
        return res.json({success: true, message: 'Logged Out!'});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Update Profile : /api/user/update-profile
export const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { name, phone },
            { new: true }
        ).select("-password -resetPasswordToken -resetPasswordExpires");
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Change Password : /api/user/change-password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.json({ success: false, message: "Current and new password required" });
        }
        if (newPassword.length < 6) {
            return res.json({ success: false, message: "Password must be at least 6 characters" });
        }
        const user = await User.findById(req.userId);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Current password is incorrect" });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Forgot Password : /api/user/forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "No account with that email" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"GreenCart" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Password Reset Request",
            html: `
                <h2>GreenCart Password Reset</h2>
                <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
                <p style="margin-top:16px;color:#666;">If you did not request this, please ignore this email.</p>
            `,
        });

        console.log("Password reset link:", resetUrl);

        res.json({ success: true, message: "Password reset link sent to your email" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Reset Password : /api/user/reset-password
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.json({ success: false, message: "Token and password required" });
        }
        if (password.length < 6) {
            return res.json({ success: false, message: "Password must be at least 6 characters" });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.json({ success: false, message: "Invalid or expired token" });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ success: true, message: "Password reset successful" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

