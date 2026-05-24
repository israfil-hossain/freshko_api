import DeliveryCharge from '../models/DeliveryCharge.js';
import Product from '../models/Product.js';

export async function getDeliverySettings() {
    let settings = await DeliveryCharge.findOne();
    if (!settings) {
        settings = await DeliveryCharge.create({});
    }
    return settings;
}

export async function calculateDeliveryCharge(items, subtotal) {
    const settings = await getDeliverySettings();

    if (subtotal >= settings.freeDeliveryMinAmount) {
        return 0;
    }

    let totalWeight = 0;
    for (const item of items) {
        const product = await Product.findById(item.product);
        if (product) {
            totalWeight += (product.weight || 0.5) * item.quantity;
        }
    }

    const weightCharge = Math.round(totalWeight * settings.perKgCharge);
    return settings.baseCharge + weightCharge;
}
