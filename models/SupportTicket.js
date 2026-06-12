import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
    orderId: {type: mongoose.Schema.Types.ObjectId, default: null, ref: 'order'},
    subject: {type: String, required: true},
    category: {type: String, enum: ['general', 'order', 'delivery', 'payment', 'product', 'refund', 'other'], default: 'general'},
    priority: {type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium'},
    status: {type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open'},
    assignedTo: {type: mongoose.Schema.Types.ObjectId, default: null, ref: 'user'},
    messages: [{
        sender: {type: String, enum: ['customer', 'admin'], required: true},
        message: {type: String, required: true},
        attachments: [{type: String}],
        createdAt: {type: Date, default: Date.now}
    }],
    resolvedAt: {type: Date, default: null},
}, {timestamps: true});

supportTicketSchema.index({userId: 1, status: 1, createdAt: -1});
supportTicketSchema.index({status: 1, priority: 1});

const SupportTicket = mongoose.models.supportTicket || mongoose.model('supportTicket', supportTicketSchema);

export default SupportTicket;
