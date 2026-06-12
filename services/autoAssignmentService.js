import Order from '../models/Order.js';
import DeliveryMan from '../models/DeliveryMan.js';
import DeliveryAssignment from '../models/DeliveryAssignment.js';
import RiderLocation from '../models/RiderLocation.js';
import Address from '../models/Address.js';
import { emitToOrder, emitToUser, emitToAdmin } from '../configs/socket.js';
import { notifyDeliveryAssigned } from '../services/notificationService.js';

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Get rider score based on distance, load, and performance
function calculateRiderScore(rider, distance, currentLoad) {
    // Weight factors
    const distanceWeight = 0.5;
    const loadWeight = 0.3;
    const performanceWeight = 0.2;
    
    // Distance score (closer = higher score, max 10km)
    const distanceScore = Math.max(0, 1 - (distance / 10)) * 100;
    
    // Load score (fewer current orders = higher score)
    const loadScore = Math.max(0, 1 - (currentLoad / 5)) * 100;
    
    // Performance score (based on delivery completion rate)
    const totalDeliveries = rider.totalDeliveries || 1;
    const completionRate = (totalDeliveries - (rider.cancelledDeliveries || 0)) / totalDeliveries;
    const performanceScore = completionRate * 100;
    
    return (distanceScore * distanceWeight) + 
           (loadScore * loadWeight) + 
           (performanceScore * performanceWeight);
}

// Find nearest available riders
async function findAvailableRiders(deliveryLat, deliveryLng, maxDistance = 10) {
    // Get active riders
    const activeRiders = await DeliveryMan.find({ isActive: true });
    
    if (activeRiders.length === 0) {
        return [];
    }
    
    // Get current location for each rider
    const riderLocations = await Promise.all(
        activeRiders.map(async (rider) => {
            const location = await RiderLocation.findOne({ 
                riderId: rider._id 
            }).sort({ timestamp: -1 });
            
            return {
                rider,
                location: location || null
            };
        })
    );
    
    // Calculate distance and score for each rider
    const scoredRiders = await Promise.all(
        riderLocations.map(async ({ rider, location }) => {
            if (!location || !location.latitude || !location.longitude) {
                return null;
            }
            
            const distance = calculateDistance(
                location.latitude, 
                location.longitude, 
                deliveryLat, 
                deliveryLng
            );
            
            if (distance > maxDistance) {
                return null;
            }
            
            // Get current load (active deliveries)
            const currentLoad = await DeliveryAssignment.countDocuments({
                deliveryManId: rider._id,
                status: { $in: ['assigned', 'picked-up', 'in-transit'] }
            });
            
            const score = calculateRiderScore(rider, distance, currentLoad);
            
            return {
                rider,
                distance,
                currentLoad,
                score,
                location
            };
        })
    );
    
    // Filter null values and sort by score
    return scoredRiders
        .filter(r => r !== null)
        .sort((a, b) => b.score - a.score);
}

// Auto-assign order to rider
export const autoAssignOrder = async (orderId) => {
    try {
        const order = await Order.findById(orderId).populate('address');
        if (!order) {
            throw new Error('Order not found');
        }
        
        if (order.deliveryStatus !== 'unassigned') {
            throw new Error('Order already assigned');
        }
        
        // Get delivery coordinates
        const address = await Address.findById(order.address);
        if (!address || !address.coordinates || !address.coordinates.lat) {
            throw new Error('Delivery address coordinates not found');
        }
        
        const deliveryLat = address.coordinates.lat;
        const deliveryLng = address.coordinates.lng;
        
        // Find available riders
        const availableRiders = await findAvailableRiders(deliveryLat, deliveryLng);
        
        if (availableRiders.length === 0) {
            // No riders available - notify admin
            emitToAdmin('assignment_failed', {
                orderId: order._id,
                reason: 'No available riders in delivery area',
                timestamp: new Date().toISOString()
            });
            
            return {
                success: false,
                message: 'No available riders in delivery area'
            };
        }
        
        // Assign to best rider
        const bestRider = availableRiders[0];
        
        const assignment = await DeliveryAssignment.create({
            orderId: order._id,
            deliveryManId: bestRider.rider._id,
            status: 'assigned',
            assignedAt: new Date(),
            distance: bestRider.distance,
            estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000) // 30 min default
        });
        
        // Update order
        order.deliveryStatus = 'assigned';
        await order.save();
        
        // Notify rider
        emitToOrder(order._id.toString(), 'rider_assigned', {
            orderId: order._id,
            riderId: bestRider.rider._id,
            riderName: bestRider.rider.name,
            distance: bestRider.distance.toFixed(2),
            estimatedTime: '30 mins'
        });
        
        // Notify customer
        await notifyDeliveryAssigned(order.userId, order._id, bestRider.rider.name);
        
        // Notify admin
        emitToAdmin('order_assigned', {
            orderId: order._id,
            riderId: bestRider.rider._id,
            riderName: bestRider.rider.name,
            distance: bestRider.distance.toFixed(2),
            timestamp: new Date().toISOString()
        });
        
        return {
            success: true,
            assignment,
            rider: bestRider.rider,
            distance: bestRider.distance,
            otherOptions: availableRiders.slice(1, 4).map(r => ({
                riderId: r.rider._id,
                name: r.rider.name,
                distance: r.distance,
                score: r.score
            }))
        };
    } catch (error) {
        console.error('Auto Assignment Error:', error);
        return {
            success: false,
            message: error.message
        };
    }
};

// Batch assign multiple orders to same rider
export const batchAssignOrders = async (orderIds) => {
    try {
        const orders = await Order.find({
            _id: { $in: orderIds },
            deliveryStatus: 'unassigned'
        }).populate('address');
        
        if (orders.length === 0) {
            return { success: false, message: 'No unassigned orders found' };
        }
        
        // Calculate centroid of all orders
        let totalLat = 0;
        let totalLng = 0;
        for (const order of orders) {
            const address = await Address.findById(order.address);
            if (address?.coordinates) {
                totalLat += address.coordinates.lat;
                totalLng += address.coordinates.lng;
            }
        }
        const centroidLat = totalLat / orders.length;
        const centroidLng = totalLng / orders.length;
        
        // Find best rider for the batch
        const availableRiders = await findAvailableRiders(centroidLat, centroidLng, 15);
        
        if (availableRiders.length === 0) {
            return { success: false, message: 'No available riders' };
        }
        
        const bestRider = availableRiders[0];
        const assignments = [];
        
        // Assign all orders to this rider
        for (const order of orders) {
            const assignment = await DeliveryAssignment.create({
                orderId: order._id,
                deliveryManId: bestRider.rider._id,
                status: 'assigned',
                assignedAt: new Date(),
                isBatch: true,
                batchOrders: orderIds
            });
            
            order.deliveryStatus = 'assigned';
            await order.save();
            
            assignments.push(assignment);
            
            // Notify
            emitToOrder(order._id.toString(), 'rider_assigned', {
                orderId: order._id,
                riderId: bestRider.rider._id,
                riderName: bestRider.rider.name,
                isBatch: true
            });
        }
        
        return {
            success: true,
            assignments,
            rider: bestRider.rider,
            orderCount: orders.length
        };
    } catch (error) {
        console.error('Batch Assignment Error:', error);
        return {
            success: false,
            message: error.message
        };
    }
};

// Manual assignment override
export const manualAssignOrder = async (orderId, riderId) => {
    try {
        const order = await Order.findById(orderId);
        const rider = await DeliveryMan.findById(riderId);
        
        if (!order || !rider) {
            throw new Error('Order or rider not found');
        }
        
        if (!rider.isActive) {
            throw new Error('Rider is not active');
        }
        
        const assignment = await DeliveryAssignment.create({
            orderId: order._id,
            deliveryManId: rider._id,
            status: 'assigned',
            assignedAt: new Date()
        });
        
        order.deliveryStatus = 'assigned';
        await order.save();
        
        // Notify
        emitToOrder(order._id.toString(), 'rider_assigned', {
            orderId: order._id,
            riderId: rider._id,
            riderName: rider.name
        });
        
        await notifyDeliveryAssigned(order.userId, order._id, rider.name);
        
        return {
            success: true,
            assignment
        };
    } catch (error) {
        console.error('Manual Assignment Error:', error);
        return {
            success: false,
            message: error.message
        };
    }
};

export default {
    autoAssignOrder,
    batchAssignOrders,
    manualAssignOrder
};
