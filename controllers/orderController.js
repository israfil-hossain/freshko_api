import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { emitToAdmin, emitToOrder, emitToUser } from "../configs/socket.js";
import DeliveryAssignment from "../models/DeliveryAssignment.js";
import DeliveryMan from "../models/DeliveryMan.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

import User from "../models/User.js";
import {
  createPayment,
  executePayment,
  isBkashEnabled,
} from "../services/bkashService.js";
import { calculateDeliveryCharge } from "../services/deliveryChargeService.js";
import { sendOrderConfirmationEmail } from "../services/emailService.js";
import { notifyOrderCreated } from "../services/notificationService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function calcAmount(items) {
  let subtotal = 0;
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product) subtotal += product.offerPrice * item.quantity;
  }
  const deliveryCharge = await calculateDeliveryCharge(items, subtotal);
  return { subtotal, deliveryCharge, total: subtotal + deliveryCharge };
}

async function validateStock(items) {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return { valid: false, message: `Product not found` };
    }
    if (!product.inStock || product.quantity < item.quantity) {
      return {
        valid: false,
        message: `"${product.name}" is out of stock. Available: ${product.quantity}, Requested: ${item.quantity}`,
      };
    }
  }
  return { valid: true };
}

async function decrementStock(items) {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product) {
      const newQty = product.quantity - item.quantity;
      await Product.findByIdAndUpdate(product._id, {
        quantity: newQty,
        inStock: newQty > 0,
      });
    }
  }
}

// Place Order COD : /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {
    const { userId, address, items } = req.body;
    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    const stockCheck = await validateStock(items);
    if (!stockCheck.valid) {
      return res.json({ success: false, message: stockCheck.message });
    }

    const { subtotal, deliveryCharge, total } = await calcAmount(items);

    await decrementStock(items);

    const order = await Order.create({
      userId,
      items,
      amount: total,
      deliveryCharge,
      address,
      paymentType: "COD",
      isPaid: false,
    });

    try {
      const user = await User.findById(userId);
      if (user?.email) {
        sendOrderConfirmationEmail(user.email, order, user.name);
      }
    } catch (err) {
      console.log("Failed to send order email:", err.message);
    }

    return res.json({ success: true, message: "Order placed successfully!" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Place Order Stripe : /api/order/stripe
export const placeOrderStripe = async (req, res) => {
  try {
    const userId = req.userId;
    const { address, items } = req.body;
    const { origin } = req.headers;

    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    const stockCheck = await validateStock(items);
    if (!stockCheck.valid) {
      return res.json({ success: false, message: stockCheck.message });
    }

    let productData = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        productData.push({
          name: product.name,
          price: product.offerPrice,
          quantity: item.quantity,
        });
      }
    }

    const { subtotal, deliveryCharge, total } = await calcAmount(items);

    await decrementStock(items);

    const order = await Order.create({
      userId,
      items,
      amount: total,
      deliveryCharge,
      address,
      paymentType: "Online",
      isPaid: false,
    });

    // Stripe line items
    const line_items = productData.map((item) => ({
      price_data: {
        currency: "bdt",
        product_data: { name: item.name },
        unit_amount: Math.floor(item.price + item.price * 0.02) * 100,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      payment_intent_data: {
        metadata: {
          orderId: order._id.toString(),
          userId,
        },
      },
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Stripe Webhooks to verify payments : /stripe
export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    // Stripe requires raw body
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    let orderId, userId;
    // Handle different Stripe events
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      orderId = session.metadata.orderId;
      userId = session.metadata.userId;
    } else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      orderId = paymentIntent.metadata?.orderId;
      userId = paymentIntent.metadata?.userId;
    } else {
      // ignore other events
      return res.status(200).json({ received: true });
    }
    if (!orderId || !userId) {
      console.error("Missing metadata for orderId or userId");
      return res.status(400).send("Missing metadata");
    }
    // Update order to mark as paid
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { isPaid: true },
      { new: true }, // return updated document
    );
    if (!updatedOrder) {
      return res.status(404).send("Order not found");
    }
    // Clear user's cart
    await User.findByIdAndUpdate(userId, { cartItems: {} });

    try {
      const user = await User.findById(userId);
      if (user?.email) {
        sendOrderConfirmationEmail(user.email, updatedOrder, user.name);
      }
    } catch (err) {
      console.log("Failed to send order email:", err.message);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error handling webhook:", err.message);
    res.status(500).send("Internal server error");
  }
};

// Get Orders by userId : /api/order/user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    // Include all orders for this user
    const orders = await Order.find({ userId })
      .populate("items.product address")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get all orders (for seller / admin) : /api/order/seller
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("items.product address")
      .populate({
        path: "deliveryAssignment",
        populate: { path: "deliveryManId", select: "name phone" },
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Admin create order : POST /api/order/admin-create
export const adminCreateOrder = async (req, res) => {
  try {
    const { userId, customer, items, address, paymentType } = req.body;
    if (!items || items.length === 0 || !address) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const stockCheck = await validateStock(items);
    if (!stockCheck.valid) {
      return res.json({ success: false, message: stockCheck.message });
    }

    let resolvedUserId = userId;

    if (!resolvedUserId && customer) {
      const { name, phone, email } = customer;
      if (!name || !phone) {
        return res.json({
          success: false,
          message: "Customer name and phone are required",
        });
      }
      let user = await User.findOne({ phone });
      if (!user && email) {
        user = await User.findOne({ email });
      }
      if (user) {
        resolvedUserId = user._id;
      } else {
        const hashedPassword = await bcrypt.hash("greencart_" + phone, 10);

        // 👇 Unique referralCode generate
        let referralCode;
        let isUnique = false;
        while (!isUnique) {
          referralCode = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
          const existing = await User.findOne({ referralCode });
          if (!existing) isUnique = true;
        }

        user = await User.create({
          name,
          email: email || `${phone}@guest.greencart`,
          password: hashedPassword,
          phone,
          referralCode, // 👈 null এর বদলে unique code
        });
        resolvedUserId = user._id;
      }
    }

    if (!resolvedUserId) {
      return res.json({
        success: false,
        message: "Customer not found. Provide userId or customer details.",
      });
    }

    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    amount += Math.floor(amount * 0.02);

    await decrementStock(items);

    const order = await Order.create({
      userId: resolvedUserId,
      items,
      amount,
      address,
      paymentType: paymentType || "COD",
      isPaid: false,
    });

    try {
      const user = await User.findById(resolvedUserId);
      if (user?.email) {
        sendOrderConfirmationEmail(user.email, order, user.name);
      }
    } catch (err) {
      console.log("Failed to send order email:", err.message);
    }

    res.json({ success: true, message: "Order created", order });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
// Assign delivery man : POST /api/order/assign-delivery
export const assignDeliveryMan = async (req, res) => {
  try {
    const { orderId, deliveryManId } = req.body;
    if (!orderId || !deliveryManId) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    const deliveryMan = await DeliveryMan.findById(deliveryManId);
    if (!deliveryMan || !deliveryMan.isActive) {
      return res.json({
        success: false,
        message: "Delivery man not found or inactive",
      });
    }

    const assignment = await DeliveryAssignment.create({
      orderId,
      deliveryManId,
      status: "assigned",
      assignedAt: new Date(),
    });

    order.deliveryStatus = "assigned";
    order.deliveryAssignment = assignment._id; // 👈 added
    await order.save();

    res.json({ success: true, message: "Delivery man assigned", assignment });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Place Order bKash : /api/order/bkash
export const placeOrderBkash = async (req, res) => {
  try {
    const bkashEnabled = process.env.BKASH_ENABLED === "true";
    if (!bkashEnabled) {
      return res.json({
        success: false,
        message: "bKash payment is not available yet",
      });
    }

    const userId = req.userId;
    const { address, items, trxID, phone } = req.body;
    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }
    if (!trxID || !phone) {
      return res.json({
        success: false,
        message: "bKash transaction ID and phone number required",
      });
    }

    const stockCheck = await validateStock(items);
    if (!stockCheck.valid) {
      return res.json({ success: false, message: stockCheck.message });
    }

    const { subtotal, deliveryCharge, total } = await calcAmount(items);

    await decrementStock(items);

    const order = await Order.create({
      userId,
      items,
      amount: total,
      deliveryCharge,
      address,
      paymentType: "bKash",
      isPaid: false,
      bkashDetails: { trxID, phone },
    });

    try {
      const user = await User.findById(userId);
      if (user?.email) {
        sendOrderConfirmationEmail(user.email, order, user.name);
      }
    } catch (err) {
      console.log("Failed to send order email:", err.message);
    }

    return res.json({
      success: true,
      message: "Order placed! Awaiting bKash payment confirmation.",
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get delivery assignments for an order : GET /api/order/:id/delivery
export const getOrderDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await DeliveryAssignment.findOne({
      orderId: id,
    }).populate("deliveryManId", "name phone");
    res.json({ success: true, assignment });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Cancel Order : POST /api/order/:id/cancel
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.userId || req.user._id;

    const order = await Order.findById(id);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Check if order belongs to user (unless admin)
    const isAdmin =
      req.user && req.user.roles && req.user.roles.includes("admin");
    if (order.userId.toString() !== userId.toString() && !isAdmin) {
      return res.json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    // Check if order can be cancelled
    if (order.deliveryStatus === "delivered") {
      return res.json({
        success: false,
        message: "Cannot cancel delivered order",
      });
    }

    if (order.deliveryStatus === "in-transit") {
      return res.json({
        success: false,
        message: "Cannot cancel order in transit",
      });
    }

    // Update order
    order.status = "Cancelled";
    order.deliveryStatus = "cancelled";
    order.cancellationReason = reason || "No reason provided";
    order.cancelledAt = new Date();
    order.cancelledBy = isAdmin ? "admin" : "customer";
    await order.save();

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        await Product.findByIdAndUpdate(product._id, {
          $inc: { quantity: item.quantity },
          inStock: true,
        });
      }
    }

    // Process refund to wallet
    if (order.isPaid || order.paymentType === "bKash") {
      const WalletTransaction = (await import("../models/WalletTransaction.js"))
        .default;
      const User = (await import("../models/User.js")).default;

      const user = await User.findById(order.userId);
      const currentBalance = user.walletBalance || 0;
      const refundAmount = order.amount;

      await new WalletTransaction({
        userId: order.userId,
        type: "refund",
        amount: refundAmount,
        description: `Refund for cancelled order #${order._id}`,
        orderId: order._id,
        balance: currentBalance + refundAmount,
      }).save();

      user.walletBalance = currentBalance + refundAmount;
      await user.save();

      order.refundAmount = refundAmount;
      order.refundStatus = "processed";
      await order.save();
    }

    // Emit real-time update
    emitToOrder(id, "order_status_changed", {
      orderId: id,
      status: "Cancelled",
      deliveryStatus: "cancelled",
      message: `Order cancelled: ${reason}`,
    });

    emitToUser(order.userId, "order_status_changed", {
      orderId: id,
      status: "Cancelled",
      deliveryStatus: "cancelled",
    });

    emitToAdmin("order_status_changed", {
      orderId: id,
      status: "Cancelled",
      deliveryStatus: "cancelled",
      userId: order.userId,
    });

    res.json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// bKash Payment : POST /api/order/bkash-payment
export const bkashPayment = async (req, res) => {
  try {
    if (!isBkashEnabled()) {
      return res.json({
        success: false,
        message: "bKash payment is not available",
      });
    }

    const userId = req.userId;
    const { address, items } = req.body;
    const { origin } = req.headers;

    if (!address || !items || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    const stockCheck = await validateStock(items);
    if (!stockCheck.valid) {
      return res.json({ success: false, message: stockCheck.message });
    }

    const { subtotal, deliveryCharge, total } = await calcAmount(items);

    await decrementStock(items);

    const order = await Order.create({
      userId,
      items,
      amount: total,
      deliveryCharge,
      address,
      paymentType: "bKash",
      isPaid: false,
    });

    // Create bKash payment
    const callbackURL = `${origin}/api/order/bkash-callback`;
    const bkashResponse = await createPayment(
      total.toString(),
      order._id.toString(),
      callbackURL,
    );

    if (bkashResponse.statusCode === "0000") {
      // Update order with bKash paymentID
      order.bkashDetails.paymentID = bkashResponse.paymentID;
      await order.save();

      return res.json({
        success: true,
        bkashURL: bkashResponse.bkashURL,
        paymentID: bkashResponse.paymentID,
        orderId: order._id,
      });
    } else {
      return res.json({
        success: false,
        message: bkashResponse.statusMessage || "bKash payment creation failed",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// bKash Callback : GET /api/order/bkash-callback
export const bkashCallback = async (req, res) => {
  try {
    const { paymentID, status } = req.query;

    if (status === "cancel" || status === "failure") {
      return res.redirect(`${process.env.CLIENT_URL}/cart?payment=failed`);
    }

    // Execute payment
    const result = await executePayment(paymentID);

    if (result.statusCode === "0000") {
      // Find order by paymentID
      const order = await Order.findOne({
        "bkashDetails.paymentID": paymentID,
      });

      if (order) {
        order.isPaid = true;
        order.bkashDetails.trxID = result.trxID;
        order.bkashDetails.status = result.transactionStatus;
        await order.save();

        // Clear cart
        await User.findByIdAndUpdate(order.userId, { cartItems: {} });

        // Send notification
        await notifyOrderCreated(order.userId, order._id, order.amount);

        return res.redirect(
          `${process.env.CLIENT_URL}/loader?next=my-orders&payment=success`,
        );
      }
    }

    return res.redirect(`${process.env.CLIENT_URL}/cart?payment=failed`);
  } catch (error) {
    console.log(error.message);
    return res.redirect(`${process.env.CLIENT_URL}/cart?payment=failed`);
  }
};

// Request Refund : POST /api/order/:id/refund
export const requestRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, amount, type } = req.body;
    const userId = req.userId || req.user._id;

    const order = await Order.findById(id);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (order.userId.toString() !== userId.toString()) {
      return res.json({ success: false, message: "Not authorized" });
    }

    if (order.deliveryStatus !== "delivered") {
      return res.json({
        success: false,
        message: "Order must be delivered to request refund",
      });
    }

    // Create refund request
    const Refund = (await import("../models/Refund.js")).default;
    const refund = new Refund({
      orderId: id,
      userId,
      amount: amount || order.amount,
      reason,
      type: type || "full",
    });
    await refund.save();

    // Update order
    order.refundStatus = "pending";
    await order.save();

    res.json({ success: true, message: "Refund request submitted", refund });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
