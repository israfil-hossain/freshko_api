import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
    key: {type: String, required: true, unique: true},
    value: {type: mongoose.Schema.Types.Mixed, required: true},
    description: {type: String, default: ''},
    isPublic: {type: Boolean, default: false}, // can be accessed without auth
}, {timestamps: true});

const SystemSetting = mongoose.models.systemSetting || mongoose.model('systemSetting', systemSettingSchema);

export default SystemSetting;
