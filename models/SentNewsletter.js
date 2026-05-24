import mongoose from 'mongoose';

const sentNewsletterSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    sentTo: {
        type: Number,
        default: 0,
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

export default mongoose.model('SentNewsletter', sentNewsletterSchema);
