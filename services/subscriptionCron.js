import cron from 'node-cron';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import CustomerSubscription from '../models/CustomerSubscription.js';
import SubscriptionOrder from '../models/SubscriptionOrder.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';

async function generateOrderForItems(sub, itemsForOrder) {
  let amount = 0;
  for (const item of itemsForOrder) {
    const product = await Product.findById(item.product);
    if (product) amount += product.offerPrice * item.quantity;
  }
  amount += Math.floor(amount * 0.02);

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

export const startSubscriptionCron = () => {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Subscription Cron] Checking for due subscriptions...');
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      let generated = 0;

      const dueSubs = await CustomerSubscription.find({
        status: 'active',
        nextDeliveryDate: { $lte: now },
      });

      for (const sub of dueSubs) {
        if (sub.schedule === 'weekly') {
          for (const w of (sub.weeklyItems || [])) {
            const weekMonthKey = `${month}-w${w.week}`;
            const existing = await SubscriptionOrder.findOne({ subscriptionId: sub._id, month: weekMonthKey });
            if (existing) continue;
            if (!w.items || w.items.length === 0) continue;

            const order = await generateOrderForItems(sub, w.items);

            await SubscriptionOrder.create({
              subscriptionId: sub._id,
              orderId: order._id,
              month: weekMonthKey,
              status: 'generated',
            });
            generated++;
            console.log(`[Subscription Cron] Weekly order for sub ${sub._id} week ${w.week}`);
          }
        } else {
          const existing = await SubscriptionOrder.findOne({ subscriptionId: sub._id, month });
          if (existing) continue;

          const order = await generateOrderForItems(sub, sub.items);

          await SubscriptionOrder.create({
            subscriptionId: sub._id,
            orderId: order._id,
            month,
            status: 'generated',
          });
          generated++;
          console.log(`[Subscription Cron] Monthly order for sub ${sub._id}`);
        }

        const nextDate = new Date(sub.nextDeliveryDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        sub.nextDeliveryDate = nextDate;
        await sub.save();
      }

      console.log(`[Subscription Cron] Done. Generated ${generated} orders.`);
    } catch (error) {
      console.error('[Subscription Cron] Error:', error.message);
    }
  });

  console.log('[Subscription Cron] Scheduled (daily at 2:00 AM)');
};
