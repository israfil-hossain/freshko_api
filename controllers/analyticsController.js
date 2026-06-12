import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import DeliveryMan from '../models/DeliveryMan.js';
import Review from '../models/Review.js';
import DeliveryAssignment from '../models/DeliveryAssignment.js';

// Get sales analytics
export const getSalesAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // Daily sales data
        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$amount' },
                    avgOrderValue: { $avg: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Payment method breakdown
        const paymentMethods = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: '$paymentType',
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' }
                }
            }
        ]);

        // Order status breakdown
        const orderStatus = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$deliveryStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Total metrics
        const totalMetrics = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$amount' },
                    avgOrderValue: { $avg: '$amount' },
                    maxOrderValue: { $max: '$amount' },
                    minOrderValue: { $min: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            dailySales,
            paymentMethods,
            orderStatus,
            totalMetrics: totalMetrics[0] || {}
        });
    } catch (error) {
        console.error('Sales Analytics Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get customer analytics
export const getCustomerAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // New customers over time
        const newCustomers = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    roles: { $in: ['customer'] }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top customers by orders
        const topCustomers = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$amount' },
                    avgOrderValue: { $avg: '$amount' }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' }
        ]);

        // Customer retention (customers who ordered more than once)
        const retention = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    orderCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    returningCustomers: {
                        $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] }
                    }
                }
            }
        ]);

        // Total customers
        const totalCustomers = await User.countDocuments({ roles: { $in: ['customer'] } });
        const activeCustomers = await Order.distinct('userId', {
            createdAt: { $gte: start, $lte: end },
            status: { $ne: 'Cancelled' }
        });

        res.json({
            success: true,
            newCustomers,
            topCustomers,
            retention: retention[0] || {},
            totalCustomers,
            activeCustomers: activeCustomers.length
        });
    } catch (error) {
        console.error('Customer Analytics Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get product analytics
export const getProductAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // Top selling products
        const topProducts = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'Cancelled' }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: {
                        $sum: {
                            $multiply: ['$items.quantity', { $ifNull: ['$items.price', 0] }]
                        }
                    }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' }
        ]);

        // Category performance
        const categoryPerformance = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'Cancelled' }
                }
            },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.category',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$amount' }
                }
            },
            { $sort: { totalSold: -1 } }
        ]);

        // Low stock products
        const lowStock = await Product.find({
            quantity: { $lte: 10 },
            inStock: true
        }).sort({ quantity: 1 }).limit(10);

        // Product ratings
        const topRated = await Review.aggregate([
            { $match: { isApproved: true } },
            {
                $group: {
                    _id: '$productId',
                    avgRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }
            },
            { $sort: { avgRating: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' }
        ]);

        res.json({
            success: true,
            topProducts,
            categoryPerformance,
            lowStock,
            topRated
        });
    } catch (error) {
        console.error('Product Analytics Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get rider analytics
export const getRiderAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // Top performing riders
        const topRiders = await DeliveryAssignment.aggregate([
            {
                $match: {
                    assignedAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$deliveryManId',
                    totalDeliveries: { $sum: 1 },
                    completedDeliveries: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                    },
                    cancelledDeliveries: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    },
                    avgDeliveryTime: {
                        $avg: {
                            $cond: [
                                { $and: ['$assignedAt', '$deliveredAt'] },
                                { $subtract: ['$deliveredAt', '$assignedAt'] },
                                null
                            ]
                        }
                    }
                }
            },
            { $sort: { completedDeliveries: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'deliverymen',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'rider'
                }
            },
            { $unwind: '$rider' }
        ]);

        // Delivery performance over time
        const dailyPerformance = await DeliveryAssignment.aggregate([
            {
                $match: {
                    assignedAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$assignedAt' } },
                    total: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                    },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Active riders count
        const activeRiders = await DeliveryMan.countDocuments({ isActive: true });
        const totalRiders = await DeliveryMan.countDocuments();

        // Average delivery time
        const avgDeliveryTime = await DeliveryAssignment.aggregate([
            {
                $match: {
                    status: 'delivered',
                    assignedAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    avgTime: {
                        $avg: { $subtract: ['$deliveredAt', '$assignedAt'] }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            topRiders,
            dailyPerformance,
            activeRiders,
            totalRiders,
            avgDeliveryTime: avgDeliveryTime[0]?.avgTime || 0
        });
    } catch (error) {
        console.error('Rider Analytics Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get dashboard overview
export const getDashboardOverview = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        // Today's orders
        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: today }
        });

        // Today's revenue
        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: today },
                    status: { $ne: 'Cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // This month vs last month
        const thisMonthRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thisMonth },
                    status: { $ne: 'Cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const lastMonthRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastMonth, $lt: thisMonth },
                    status: { $ne: 'Cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Active riders
        const activeRiders = await DeliveryMan.countDocuments({ isActive: true });

        // Pending orders
        const pendingOrders = await Order.countDocuments({
            deliveryStatus: { $in: ['unassigned', 'assigned'] }
        });

        // Total customers
        const totalCustomers = await User.countDocuments({ roles: { $in: ['customer'] } });

        // Recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'name')
            .populate('items.product', 'name');

        res.json({
            success: true,
            overview: {
                todayOrders,
                todayRevenue: todayRevenue[0]?.total || 0,
                thisMonthRevenue: thisMonthRevenue[0]?.total || 0,
                lastMonthRevenue: lastMonthRevenue[0]?.total || 0,
                activeRiders,
                pendingOrders,
                totalCustomers
            },
            recentOrders
        });
    } catch (error) {
        console.error('Dashboard Overview Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export default {
    getSalesAnalytics,
    getCustomerAnalytics,
    getProductAnalytics,
    getRiderAnalytics,
    getDashboardOverview
};
