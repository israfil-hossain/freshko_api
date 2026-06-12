import mongoose from 'mongoose';

const deliveryRouteSchema = new mongoose.Schema({
    riderId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'deliveryMan'},
    date: {type: Date, required: true},
    orders: [{
        orderId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'order'},
        sequence: {type: Number, required: true},
        estimatedArrival: {type: Date, default: null},
        actualArrival: {type: Date, default: null},
        status: {type: String, enum: ['pending', 'in-progress', 'completed', 'skipped'], default: 'pending'},
    }],
    totalDistance: {type: Number, default: 0}, // in km
    estimatedTime: {type: Number, default: 0}, // in minutes
    actualTime: {type: Number, default: 0},
    status: {type: String, enum: ['planned', 'active', 'completed'], default: 'planned'},
}, {timestamps: true});

deliveryRouteSchema.index({riderId: 1, date: 1});

const DeliveryRoute = mongoose.models.deliveryRoute || mongoose.model('deliveryRoute', deliveryRouteSchema);

export default DeliveryRoute;
