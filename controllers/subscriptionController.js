import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import CustomerSubscription from '../models/CustomerSubscription.js';
import SubscriptionOrder from '../models/SubscriptionOrder.js';

// ---------- Subscription Plans (Admin CRUD) ----------

export const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .populate('items.product')
      .populate('weeklyItems.items.product');
    res.json({ success: true, plans });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getPlanById = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id)
      .populate('items.product')
      .populate('weeklyItems.items.product');
    if (!plan) return res.json({ success: false, message: 'Plan not found' });
    res.json({ success: true, plan });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { name, description, price, image, type, schedule, items, weeklyItems, maxItems, allowedCategories } = req.body;
    const plan = await SubscriptionPlan.create({
      name, description, price, image, type,
      schedule: schedule || 'monthly',
      items: items || [],
      weeklyItems: weeklyItems || [],
      maxItems: maxItems || 5,
      allowedCategories: allowedCategories || [],
    });
    res.json({ success: true, message: 'Plan created', plan });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.json({ success: false, message: 'Plan not found' });
    res.json({ success: true, message: 'Plan updated', plan });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getAllPlansAdmin = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({})
      .populate('items.product')
      .populate('weeklyItems.items.product');
    res.json({ success: true, plans });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ---------- Subscriptions (Customer) ----------

export const subscribe = async (req, res) => {
  try {
    const userId = req.userId;
    const { planId, type, schedule, items, weeklyItems, deliveryDay, deliveryDays, addressId, paymentType } = req.body;

    if (!addressId || !type) {
      return res.json({ success: false, message: 'Missing required fields' });
    }

    // Require phone number for subscription
    const user = await User.findById(userId);
    if (!user || !user.phone) {
      return res.json({ success: false, message: 'Phone number is required to subscribe. Please update your profile.' });
    }

    const subSchedule = schedule || 'monthly';
    let price = 0;
    let isFree = false;
    let planData = null;
    let finalItems = [];
    let finalWeeklyItems = [];
    let finalDeliveryDay = deliveryDay || 1;
    let finalDeliveryDays = deliveryDays || [];

    if (type === 'plan') {
      if (!planId) return res.json({ success: false, message: 'Plan ID required' });
      planData = await SubscriptionPlan.findById(planId).populate('items.product').populate('weeklyItems.items.product');
      if (!planData) return res.json({ success: false, message: 'Plan not found' });
      price = planData.price;
      isFree = planData.type === 'free';

      if (planData.schedule === 'weekly' || subSchedule === 'weekly') {
        finalWeeklyItems = (planData.weeklyItems || []).map(w => ({
          week: w.week,
          items: w.items.map(item => ({ product: item.product._id, quantity: item.quantity })),
        }));
        finalDeliveryDays = [1, 8, 15];
        finalDeliveryDay = 1;
      } else {
        finalItems = planData.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
        }));
      }
    } else {
      // Custom type
      if (subSchedule === 'weekly') {
        if (!weeklyItems || weeklyItems.length === 0) {
          return res.json({ success: false, message: 'Weekly items required for weekly plan' });
        }
        if (type === 'free-custom') {
          isFree = true;
          for (const w of weeklyItems) {
            if (w.items.length > 5) {
              return res.json({ success: false, message: 'Free custom plan limited to 5 items per week' });
            }
          }
        }
        for (const w of weeklyItems) {
          let weekPrice = 0;
          for (const item of w.items) {
            const product = await Product.findById(item.product);
            if (!product) return res.json({ success: false, message: `Product ${item.product} not found` });
            weekPrice += product.offerPrice * item.quantity;
          }
          price += weekPrice;
          finalWeeklyItems.push({ week: w.week, items: w.items });
        }
        finalDeliveryDays = [1, 8, 15];
        finalDeliveryDay = 1;
      } else {
        if (!items || items.length === 0) {
          return res.json({ success: false, message: 'Items required for custom plan' });
        }
        if (!deliveryDay) return res.json({ success: false, message: 'Delivery day required' });
        if (type === 'free-custom') {
          isFree = true;
          if (items.length > 5) {
            return res.json({ success: false, message: 'Free custom plan limited to 5 items' });
          }
        }
        for (const item of items) {
          const product = await Product.findById(item.product);
          if (!product) return res.json({ success: false, message: `Product ${item.product} not found` });
          price += product.offerPrice * item.quantity;
        }
        finalItems = items;
        finalDeliveryDay = deliveryDay;
      }
    }

    const now = new Date();
    const nextDelivery = new Date(now.getFullYear(), now.getMonth(), finalDeliveryDay);
    if (nextDelivery <= now) {
      nextDelivery.setMonth(nextDelivery.getMonth() + 1);
    }

    const subscription = await CustomerSubscription.create({
      userId,
      planId: planId || null,
      type,
      schedule: subSchedule,
      items: finalItems,
      weeklyItems: finalWeeklyItems,
      price,
      status: 'active',
      startDate: now,
      nextDeliveryDate: nextDelivery,
      deliveryDay: finalDeliveryDay,
      deliveryDays: finalDeliveryDays,
      addressId,
      paymentType: paymentType || 'COD',
      isFree,
    });

    res.json({ success: true, message: 'Subscribed successfully!', subscription });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getMySubscriptions = async (req, res) => {
  try {
    const subs = await CustomerSubscription.find({ userId: req.userId })
      .populate('items.product')
      .populate('weeklyItems.items.product')
      .populate('addressId')
      .sort({ createdAt: -1 });
    res.json({ success: true, subscriptions: subs });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getMySubscriptionById = async (req, res) => {
  try {
    const sub = await CustomerSubscription.findById(req.params.id)
      .populate('items.product')
      .populate('weeklyItems.items.product')
      .populate('addressId');
    if (!sub) return res.json({ success: false, message: 'Subscription not found' });
    if (sub.userId.toString() !== req.userId) {
      return res.json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, subscription: sub });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const sub = await CustomerSubscription.findById(req.params.id);
    if (!sub) return res.json({ success: false, message: 'Subscription not found' });

    // Allow if user owns subscription OR if admin (authSeller sets req.userId to seller email, not matching)
    const isOwner = sub.userId.toString() === req.userId;
    const isAdmin = req.cookies?.sellerToken !== undefined && !isOwner;
    if (!isOwner && !isAdmin) {
      return res.json({ success: false, message: 'Not authorized' });
    }

    sub.status = status;
    await sub.save();
    res.json({ success: true, message: `Subscription ${status}`, subscription: sub });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const updateSubscriptionItems = async (req, res) => {
  try {
    const { items, weeklyItems, schedule } = req.body;
    const sub = await CustomerSubscription.findById(req.params.id);
    if (!sub) return res.json({ success: false, message: 'Subscription not found' });
    if (sub.userId.toString() !== req.userId) {
      return res.json({ success: false, message: 'Not authorized' });
    }
    if (sub.status !== 'active') {
      return res.json({ success: false, message: 'Can only modify active subscriptions' });
    }

    let price = 0;

    if (schedule === 'weekly' || sub.schedule === 'weekly') {
      if (!weeklyItems || weeklyItems.length === 0) {
        return res.json({ success: false, message: 'Weekly items required' });
      }
      if (sub.type === 'free-custom') {
        for (const w of weeklyItems) {
          if (w.items.length > 5) {
            return res.json({ success: false, message: 'Free custom: max 5 items per week' });
          }
        }
      }
      for (const w of weeklyItems) {
        for (const item of w.items) {
          const product = await Product.findById(item.product);
          if (product) price += product.offerPrice * item.quantity;
        }
      }
      sub.schedule = 'weekly';
      sub.weeklyItems = weeklyItems;
      sub.items = [];
    } else {
      if (sub.type === 'free-custom' && items.length > 5) {
        return res.json({ success: false, message: 'Free custom plan limited to 5 items' });
      }
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (product) price += product.offerPrice * item.quantity;
      }
      sub.items = items;
      sub.weeklyItems = [];
    }

    sub.price = price;
    await sub.save();
    res.json({ success: true, message: 'Items updated', subscription: sub });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ---------- Admin Subscriptions ----------

export const getAllSubscriptions = async (req, res) => {
  try {
    const { type, status, planType } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (planType === 'free') filter.isFree = true;
    if (planType === 'premium') filter.isFree = { $ne: true };

    const subs = await CustomerSubscription.find(filter)
      .populate('items.product')
      .populate('weeklyItems.items.product')
      .populate('addressId')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, subscriptions: subs });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getSubscriptionOrders = async (req, res) => {
  try {
    const subOrders = await SubscriptionOrder.find({})
      .populate({
        path: 'subscriptionId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('orderId')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders: subOrders });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ------- Generate helpers -------

async function generateOrderForItems(sub, itemsForOrder, weekLabel) {
  let amount = 0;
  for (const item of itemsForOrder) {
    const product = await Product.findById(item.product);
    if (product) amount += product.offerPrice * item.quantity;
  }
  amount += Math.floor(amount * 0.02);

  for (const item of itemsForOrder) {
    const product = await Product.findById(item.product);
    if (product) {
      const newQty = product.quantity - item.quantity;
      await Product.findByIdAndUpdate(product._id, {
        quantity: newQty,
        inStock: newQty > 0,
      });
    }
  }

  const order = await Order.create({
    userId: sub.userId,
    items: itemsForOrder,
    amount,
    address: sub.addressId,
    paymentType: sub.paymentType,
    isPaid: sub.isFree ? true : false,
  });

  return order;
}

// Generate orders for current month : POST /api/subscription/generate
export const generateMonthlyOrders = async (req, res) => {
  try {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let generated = 0;
    let skipped = 0;

    const activeSubs = await CustomerSubscription.find({ status: 'active', nextDeliveryDate: { $lte: now } });

    for (const sub of activeSubs) {
      if (sub.schedule === 'weekly') {
        // Generate up to 3 weekly orders
        for (const w of (sub.weeklyItems || [])) {
          const weekMonthKey = `${month}-w${w.week}`;
          const existing = await SubscriptionOrder.findOne({ subscriptionId: sub._id, month: weekMonthKey });
          if (existing) { skipped++; continue; }

          if (!w.items || w.items.length === 0) continue;

          const order = await generateOrderForItems(sub, w.items, `Week ${w.week}`);

          await SubscriptionOrder.create({
            subscriptionId: sub._id,
            orderId: order._id,
            month: weekMonthKey,
            status: 'generated',
          });
          generated++;
        }
      } else {
        const existing = await SubscriptionOrder.findOne({ subscriptionId: sub._id, month });
        if (existing) { skipped++; continue; }

        if (!sub.items || sub.items.length === 0) continue;

        const order = await generateOrderForItems(sub, sub.items);

        await SubscriptionOrder.create({
          subscriptionId: sub._id,
          orderId: order._id,
          month,
          status: 'generated',
        });
      }

      // Update next delivery date
      const nextDate = new Date(sub.nextDeliveryDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      sub.nextDeliveryDate = nextDate;
      await sub.save();
    }

    res.json({
      success: true,
      message: `Generated ${generated} orders, ${skipped} already existed`,
      generated,
      skipped,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Manually generate for a specific subscription : POST /api/subscription/generate/:id
export const generateSingleOrder = async (req, res) => {
  try {
    const sub = await CustomerSubscription.findById(req.params.id);
    if (!sub) return res.json({ success: false, message: 'Subscription not found' });

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (sub.schedule === 'weekly') {
      let generated = 0;
      for (const w of (sub.weeklyItems || [])) {
        const weekMonthKey = `${month}-w${w.week}`;
        const existing = await SubscriptionOrder.findOne({ subscriptionId: sub._id, month: weekMonthKey });
        if (existing) continue;
        if (!w.items || w.items.length === 0) continue;

        const order = await generateOrderForItems(sub, w.items, `Week ${w.week}`);

        await SubscriptionOrder.create({
          subscriptionId: sub._id,
          orderId: order._id,
          month: weekMonthKey,
          status: 'generated',
        });
        generated++;
      }
      return res.json({ success: true, message: `Generated ${generated} weekly orders` });
    }

    const existing = await SubscriptionOrder.findOne({ subscriptionId: sub._id, month });
    if (existing) return res.json({ success: false, message: 'Order already generated for this month' });

    const order = await generateOrderForItems(sub, sub.items);

    await SubscriptionOrder.create({
      subscriptionId: sub._id,
      orderId: order._id,
      month,
      status: 'generated',
    });

    res.json({ success: true, message: 'Order generated', order });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
