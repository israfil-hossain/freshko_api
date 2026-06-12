import mongoose from 'mongoose';

const deliveryAssignmentSchema = new mongoose.Schema({
    orderId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'order'},
    deliveryManId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'deliveryman'},
    status: {
        type: String,
        enum: ['assigned', 'picked-up', 'in-transit', 'delivered', 'cancelled'],
        default: 'assigned'
    },
    assignedAt: {type: Date, default: Date.now},
    pickedUpAt: {type: Date, default: null},
    deliveredAt: {type: Date, default: null},
    notes: {type: String, default: ''},
    
    // Auto-assignment fields
    distance: {type: Number, default: null},
    estimatedDeliveryTime: {type: Date, default: null},
    
    // Batch delivery fields
    isBatch: {type: Boolean, default: false},
    batchOrders: [{type: mongoose.Schema.Types.ObjectId, ref: 'order'}],
    sequence: {type: Number, default: 0}
}, {timestamps: true});

const DeliveryAssignment = mongoose.models.deliveryassignment || mongoose.model('deliveryassignment', deliveryAssignmentSchema);

export default DeliveryAssignment;
