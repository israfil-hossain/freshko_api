import jwt from 'jsonwebtoken';

// Permission definitions
export const PERMISSIONS = {
    // User management
    USERS_VIEW: 'users.view',
    USERS_CREATE: 'users.create',
    USERS_EDIT: 'users.edit',
    USERS_DELETE: 'users.delete',
    
    // Product management
    PRODUCTS_VIEW: 'products.view',
    PRODUCTS_CREATE: 'products.create',
    PRODUCTS_EDIT: 'products.edit',
    PRODUCTS_DELETE: 'products.delete',
    
    // Order management
    ORDERS_VIEW: 'orders.view',
    ORDERS_EDIT: 'orders.edit',
    ORDERS_CANCEL: 'orders.cancel',
    ORDERS_ASSIGN: 'orders.assign',
    
    // Category management
    CATEGORIES_VIEW: 'categories.view',
    CATEGORIES_CREATE: 'categories.create',
    CATEGORIES_EDIT: 'categories.edit',
    CATEGORIES_DELETE: 'categories.delete',
    
    // Rider management
    RIDERS_VIEW: 'riders.view',
    RIDERS_CREATE: 'riders.create',
    RIDERS_EDIT: 'riders.edit',
    RIDERS_DELETE: 'riders.delete',
    
    // Delivery management
    DELIVERY_VIEW: 'delivery.view',
    DELIVERY_UPDATE: 'delivery.update',
    
    // Financial
    FINANCIAL_VIEW: 'financial.view',
    FINANCIAL_PAYOUT: 'financial.payout',
    
    // Support
    SUPPORT_VIEW: 'support.view',
    SUPPORT_REPLY: 'support.reply',
    SUPPORT_RESOLVE: 'support.resolve',
    
    // Content
    CONTENT_VIEW: 'content.view',
    CONTENT_EDIT: 'content.edit',
    
    // Settings
    SETTINGS_VIEW: 'settings.view',
    SETTINGS_EDIT: 'settings.edit',
    
    // Analytics
    ANALYTICS_VIEW: 'analytics.view',
    
    // All
    ALL: 'all',
};

// Role definitions
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    SELLER: 'seller',
    SHOP_MANAGER: 'shop_manager',
    SHOP_PICKER: 'shop_picker',
    SUPPORT_AGENT: 'support_agent',
    CONTENT_MANAGER: 'content_manager',
    FINANCE_MANAGER: 'finance_manager',
    RIDER: 'rider',
    CUSTOMER: 'customer',
};

// Default permissions per role
export const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: [PERMISSIONS.ALL],
    [ROLES.ADMIN]: [
        PERMISSIONS.ALL,
    ],
    [ROLES.SELLER]: [
        PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_EDIT, PERMISSIONS.PRODUCTS_DELETE,
        PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_EDIT, PERMISSIONS.ORDERS_ASSIGN,
        PERMISSIONS.CATEGORIES_VIEW, PERMISSIONS.CATEGORIES_CREATE, PERMISSIONS.CATEGORIES_EDIT, PERMISSIONS.CATEGORIES_DELETE,
        PERMISSIONS.RIDERS_VIEW, PERMISSIONS.RIDERS_CREATE, PERMISSIONS.RIDERS_EDIT, PERMISSIONS.RIDERS_DELETE,
        PERMISSIONS.DELIVERY_VIEW, PERMISSIONS.DELIVERY_UPDATE,
        PERMISSIONS.FINANCIAL_VIEW,
        PERMISSIONS.SUPPORT_VIEW, PERMISSIONS.SUPPORT_REPLY, PERMISSIONS.SUPPORT_RESOLVE,
        PERMISSIONS.CONTENT_VIEW, PERMISSIONS.CONTENT_EDIT,
        PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_EDIT,
        PERMISSIONS.ANALYTICS_VIEW,
    ],
    [ROLES.SHOP_MANAGER]: [
        PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_EDIT, PERMISSIONS.PRODUCTS_DELETE,
        PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_EDIT,
        PERMISSIONS.CATEGORIES_VIEW,
        PERMISSIONS.DELIVERY_VIEW,
        PERMISSIONS.FINANCIAL_VIEW,
        PERMISSIONS.ANALYTICS_VIEW,
    ],
    [ROLES.SHOP_PICKER]: [
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_EDIT,
        PERMISSIONS.DELIVERY_VIEW,
    ],
    [ROLES.SUPPORT_AGENT]: [
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.SUPPORT_VIEW, PERMISSIONS.SUPPORT_REPLY, PERMISSIONS.SUPPORT_RESOLVE,
    ],
    [ROLES.CONTENT_MANAGER]: [
        PERMISSIONS.CONTENT_VIEW, PERMISSIONS.CONTENT_EDIT,
        PERMISSIONS.CATEGORIES_VIEW, PERMISSIONS.CATEGORIES_CREATE, PERMISSIONS.CATEGORIES_EDIT, PERMISSIONS.CATEGORIES_DELETE,
    ],
    [ROLES.FINANCE_MANAGER]: [
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.FINANCIAL_VIEW, PERMISSIONS.FINANCIAL_PAYOUT,
        PERMISSIONS.ANALYTICS_VIEW,
    ],
    [ROLES.RIDER]: [
        PERMISSIONS.DELIVERY_VIEW, PERMISSIONS.DELIVERY_UPDATE,
    ],
    [ROLES.CUSTOMER]: [
        PERMISSIONS.ORDERS_VIEW,
    ],
};

// Check if user has permission
export const hasPermission = (user, permission) => {
    if (!user || !user.roles) return false;
    
    // Super admin has all permissions
    if (user.roles.includes(ROLES.SUPER_ADMIN)) return true;
    
    // Check user permissions
    if (user.permissions && user.permissions.includes(permission)) return true;
    if (user.permissions && user.permissions.includes(PERMISSIONS.ALL)) return true;
    
    // Check role permissions
    for (const role of user.roles) {
        const rolePerms = ROLE_PERMISSIONS[role] || [];
        if (rolePerms.includes(permission) || rolePerms.includes(PERMISSIONS.ALL)) {
            return true;
        }
    }
    
    return false;
};

// Check if user has any of the permissions
export const hasAnyPermission = (user, permissions) => {
    return permissions.some(permission => hasPermission(user, permission));
};

// Check if user has all of the permissions
export const hasAllPermissions = (user, permissions) => {
    return permissions.every(permission => hasPermission(user, permission));
};

// Middleware to check permission
export const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({success: false, message: 'Authentication required'});
        }
        
        if (!hasPermission(req.user, permission)) {
            return res.status(403).json({success: false, message: 'Permission denied'});
        }
        
        next();
    };
};

// Middleware to check any of multiple permissions
export const requireAnyPermission = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({success: false, message: 'Authentication required'});
        }
        
        if (!hasAnyPermission(req.user, permissions)) {
            return res.status(403).json({success: false, message: 'Permission denied'});
        }
        
        next();
    };
};

// Main auth middleware (replaces old auth middleware)
export const authMiddleware = async (req, res, next) => {
    try {
        // Check for token in cookies or Authorization header
        const token = req.cookies?.token || req.cookies?.sellerToken || req.cookies?.deliveryManToken || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({success: false, message: 'Authentication required'});
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.MOBILE_TOKEN_SECRET);
        
        // Fetch user from database
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(decoded.id || decoded._id).select('-password');
        
        if (!user) {
            return res.status(401).json({success: false, message: 'User not found'});
        }
        
        if (!user.isActive) {
            return res.status(401).json({success: false, message: 'Account is deactivated'});
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({success: false, message: 'Invalid token'});
    }
};

// Legacy auth middleware for backward compatibility
export const authUser = async (req, res, next) => {
    try {
        const token = req.cookies?.userToken || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({success: false, message: 'Not Authorized'});
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.MOBILE_TOKEN_SECRET);
        
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(decoded.id || decoded._id).select('-password');
        
        if (!user) {
            return res.status(401).json({success: false, message: 'User not found'});
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({success: false, message: error.message});
    }
};

// Legacy seller auth (updated to support RBAC)
export const authSeller = async (req, res, next) => {
    try {
        const token = req.cookies?.sellerToken;
        
        if (!token) {
            return res.status(401).json({success: false, message: 'Not Authorized'});
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(decoded.id || decoded._id).select('-password');
        
        if (!user) {
            return res.status(401).json({success: false, message: 'User not found'});
        }
        
        // Check if user has seller or admin role
        const allowedRoles = ['seller', 'admin', 'super_admin'];
        if (!user.roles.some(role => allowedRoles.includes(role))) {
            return res.status(403).json({success: false, message: 'Not Authorized'});
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({success: false, message: error.message});
    }
};

// Legacy delivery man auth
export const authDeliveryMan = async (req, res, next) => {
    try {
        const token = req.cookies?.deliveryManToken;
        
        if (!token) {
            return res.status(401).json({success: false, message: 'Not Authorized'});
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const DeliveryMan = (await import('../models/DeliveryMan.js')).default;
        const deliveryMan = await DeliveryMan.findById(decoded.id || decoded._id);
        
        if (!deliveryMan) {
            return res.status(401).json({success: false, message: 'Delivery man not found'});
        }
        
        req.deliveryMan = deliveryMan;
        next();
    } catch (error) {
        return res.status(401).json({success: false, message: error.message});
    }
};

export default {
    authMiddleware,
    authUser,
    authSeller,
    authDeliveryMan,
    requirePermission,
    requireAnyPermission,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    PERMISSIONS,
    ROLES,
    ROLE_PERMISSIONS,
};
