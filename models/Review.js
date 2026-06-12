import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
    productId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'product'},
    orderId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'order'},
    rating: {type: Number, required: true, min: 1, max: 5},
    title: {type: String, default: null},
    comment: {type: String, required: true},
    images: [{type: String}],
    isVerified: {type: Boolean, default: true}, // verified purchase
    isApproved: {type: Boolean, default: true},
    helpful: {type: Number, default: 0}, // number of users who found this helpful
}, {timestamps: true});

reviewSchema.index({productId: 1, isApproved: 1, createdAt: -1});
reviewSchema.index({userId: 1, createdAt: -1});

const Review = mongoose.models.review || mongoose.model('review', reviewSchema);

export default Review;
