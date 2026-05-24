import mongoose from 'mongoose';

const deliveryManSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    phone: {type: String, default: ''},
    avatar: {type: String, default: ''},
    isActive: {type: Boolean, default: true},
    totalEarnings: {type: Number, default: 0},
    totalDeliveries: {type: Number, default: 0},
    currentOrderId: {type: mongoose.Schema.Types.ObjectId, ref: 'order', default: null},
}, {timestamps: true});

const DeliveryMan = mongoose.models.deliveryman || mongoose.model('deliveryman', deliveryManSchema);

export default DeliveryMan;
