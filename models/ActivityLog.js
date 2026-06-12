import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user'},
    role: {type: String, default: null},
    action: {type: String, required: true}, // create, update, delete, login, logout, etc.
    entity: {type: String, required: true}, // order, product, user, etc.
    entityId: {type: mongoose.Schema.Types.ObjectId, default: null},
    details: {type: Object, default: {}},
    ipAddress: {type: String, default: null},
    userAgent: {type: String, default: null},
}, {timestamps: true});

activityLogSchema.index({userId: 1, createdAt: -1});
activityLogSchema.index({entity: 1, entityId: 1});
activityLogSchema.index({createdAt: -1});

const ActivityLog = mongoose.models.activityLog || mongoose.model('activityLog', activityLogSchema);

export default ActivityLog;
