import RiderLocation from '../models/RiderLocation.js';
import DeliveryMan from '../models/DeliveryMan.js';
import Order from '../models/Order.js';
import { emitToOrder, emitToAdmin } from '../configs/socket.js';

// Update rider location
export const updateRiderLocation = async (req, res) => {
    try {
        const riderId = req.deliveryMan._id || req.body.riderId;
        const { latitude, longitude, accuracy, speed, heading } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required',
            });
        }
        
        // Update rider location
        const location = await RiderLocation.create({
            riderId,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            timestamp: new Date(),
        });
        
        // Find active order for this rider
        const activeOrder = await Order.findOne({
            deliveryStatus: { $in: ['assigned', 'picked-up', 'in-transit'] },
        }).populate({
            path: 'deliveryAssignment',
            match: { deliveryManId: riderId },
        });
        
        if (activeOrder) {
            // Emit to order room
            emitToOrder(activeOrder._id.toString(), 'rider_location_update', {
                riderId,
                latitude,
                longitude,
                timestamp: new Date().toISOString(),
            });
        }
        
        // Emit to admin
        emitToAdmin('rider_location_update', {
            riderId,
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
            orderId: activeOrder ? activeOrder._id.toString() : null,
        });
        
        res.json({ success: true, location });
    } catch (error) {
        console.error('Update Rider Location Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get rider location
export const getRiderLocation = async (req, res) => {
    try {
        const { riderId } = req.params;
        
        const location = await RiderLocation.findOne({ riderId })
            .sort({ timestamp: -1 })
            .limit(1);
        
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found',
            });
        }
        
        res.json({ success: true, location });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get rider location history
export const getRiderLocationHistory = async (req, res) => {
    try {
        const { riderId } = req.params;
        const { startDate, endDate } = req.query;
        
        const filter = { riderId };
        if (startDate && endDate) {
            filter.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        
        const locations = await RiderLocation.find(filter)
            .sort({ timestamp: -1 })
            .limit(100);
        
        res.json({ success: true, locations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get tracking info for an order
export const getOrderTracking = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await Order.findById(orderId)
            .populate('items.product')
            .populate('deliveryAssignment');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        
        // Get rider location if assigned
        let riderLocation = null;
        let rider = null;
        
        if (order.deliveryAssignment) {
            rider = await DeliveryMan.findById(order.deliveryAssignment.deliveryManId);
            
            const latestLocation = await RiderLocation.findOne({
                riderId: order.deliveryAssignment.deliveryManId,
            }).sort({ timestamp: -1 });
            
            if (latestLocation) {
                riderLocation = {
                    latitude: latestLocation.latitude,
                    longitude: latestLocation.longitude,
                    timestamp: latestLocation.timestamp,
                };
            }
        }
        
        // Calculate ETA
        let eta = null;
        if (order.estimatedDeliveryTime) {
            eta = order.estimatedDeliveryTime;
        } else if (order.deliveryStatus === 'picked-up' || order.deliveryStatus === 'in-transit') {
            // Simple ETA calculation (20 minutes from now)
            eta = new Date(Date.now() + 20 * 60 * 1000);
        }
        
        res.json({
            success: true,
            order,
            rider,
            riderLocation,
            eta,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Calculate ETA
export const calculateETA = (pickupLocation, deliveryLocation, prepTime = 10) => {
    // Simple distance calculation using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (deliveryLocation.lat - pickupLocation.lat) * Math.PI / 180;
    const dLon = (deliveryLocation.lng - pickupLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(pickupLocation.lat * Math.PI / 180) * Math.cos(deliveryLocation.lat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Average speed: 20 km/h in city
    const travelTime = (distance / 20) * 60; // in minutes
    
    // Total ETA = prep time + travel time
    const totalMinutes = prepTime + travelTime;
    
    return {
        distance: Math.round(distance * 100) / 100,
        travelTime: Math.round(travelTime),
        prepTime,
        totalMinutes: Math.round(totalMinutes),
        estimatedArrival: new Date(Date.now() + totalMinutes * 60 * 1000),
    };
};

export default {
    updateRiderLocation,
    getRiderLocation,
    getRiderLocationHistory,
    getOrderTracking,
    calculateETA,
};
