import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "product",
        },
        quantity: { type: Number, required: true },
      },
    ],
    amount: { type: Number, required: true },
    address: { type: mongoose.Schema.Types.ObjectId, ref: "address", required: true },
    status: { type: String, default: "Order Placed" },
    paymentType: { type: String, required: true },
    isPaid: { type: Boolean, required: true, default: false },
    deliveryStatus: {
      type: String,
      enum: [
        "unassigned",
        "assigned",
        "picked-up",
        "in-transit",
        "delivered",
        "cancelled",
      ],
      default: "unassigned",
    },

    //
    deliveryAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "deliveryAssignment",
    },

    // Cancellation
    cancellationReason: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: {
      type: String,
      enum: ["customer", "admin", "system"],
      default: null,
    },

    // Refund
    refundAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "processed", "failed"],
      default: "none",
    },
    refundId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "walletTransaction",
    },

    // Delivery
    deliveryInstructions: { type: String, default: null },
    estimatedDeliveryTime: { type: Date, default: null },
    actualDeliveryTime: { type: Date, default: null },

    // Coupon
    couponCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },

    // bKash
    bkashDetails: {
      trxID: { type: String, default: null },
      phone: { type: String, default: null },
      paymentID: { type: String, default: null },
      status: { type: String, default: null },
    },
  },
  { timestamps: true },
);
const Order = mongoose.models.order || mongoose.model("order", orderSchema);

export default Order;
