import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import DeliveryMan from '../models/DeliveryMan.js';
import DeliveryAssignment from '../models/DeliveryAssignment.js';
import CustomerSubscription from '../models/CustomerSubscription.js';

export const getAdminDashboard = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const completedOrders = await Order.countDocuments({ deliveryStatus: 'delivered' });
        const pendingOrders = await Order.countDocuments({ deliveryStatus: { $in: ['assigned', 'picked-up', 'in-transit'] } });
        const unassignedOrders = await Order.countDocuments({ deliveryStatus: 'unassigned' });
        const cancelledOrders = await Order.countDocuments({ deliveryStatus: 'cancelled' });

        const totalRevenueAgg = await Order.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

        const totalProducts = await Product.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalDeliveryMen = await DeliveryMan.countDocuments();
        const activeSubscriptions = await CustomerSubscription.countDocuments({ status: 'active' });
        const totalSubscriptions = await CustomerSubscription.countDocuments();

        // Orders by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const ordersByMonth = await Order.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                count: { $sum: 1 },
                revenue: { $sum: { $cond: ['$isPaid', '$amount', 0] } },
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Recent orders
        const recentOrders = await Order.find({})
            .populate('items.product address')
            .sort({ createdAt: -1 })
            .limit(10);

        // Delivery men on duty
        const activeDeliveryMen = await DeliveryAssignment.aggregate([
            { $match: { status: { $in: ['assigned', 'picked-up', 'in-transit'] } } },
            { $group: { _id: '$deliveryManId', count: { $sum: 1 } } },
            { $lookup: { from: 'deliverymen', localField: '_id', foreignField: '_id', as: 'deliveryMan' } },
            { $unwind: { path: '$deliveryMan', preserveNullAndEmptyArrays: true } },
            { $project: { name: '$deliveryMan.name', activeOrders: '$count', _id: 0 } }
        ]);

        const onDutyCount = await DeliveryAssignment.distinct('deliveryManId', {
            status: { $in: ['assigned', 'picked-up', 'in-transit'] }
        }).then(ids => ids.length);

        res.json({
            success: true,
            stats: {
                totalOrders,
                completedOrders,
                pendingOrders,
                unassignedOrders,
                cancelledOrders,
                totalRevenue,
                totalProducts,
                totalUsers,
                totalDeliveryMen,
                activeSubscriptions,
                totalSubscriptions,
                onDutyDeliveryMen: onDutyCount,
            },
            ordersByMonth,
            recentOrders,
            activeDeliveryMen,
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
