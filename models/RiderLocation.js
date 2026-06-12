import mongoose from 'mongoose';

const riderLocationSchema = new mongoose.Schema({
    riderId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'deliveryMan'},
    latitude: {type: Number, required: true},
    longitude: {type: Number, required: true},
    accuracy: {type: Number, default: null},
    speed: {type: Number, default: null},
    heading: {type: Number, default: null},
    timestamp: {type: Date, default: Date.now},
    isActive: {type: Boolean, default: true},
}, {timestamps: true});

// Index for location queries
riderLocationSchema.index({riderId: 1, timestamp: -1});
riderLocationSchema.index({timestamp: -1});

const RiderLocation = mongoose.models.riderLocation || mongoose.model('riderLocation', riderLocationSchema);

export default RiderLocation;
