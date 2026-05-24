import DeliveryCharge from '../models/DeliveryCharge.js';

export const getSettings = async (req, res) => {
    try {
        let settings = await DeliveryCharge.findOne();
        if (!settings) {
            settings = await DeliveryCharge.create({});
        }
        res.json({ success: true, settings });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { baseCharge, perKgCharge, freeDeliveryMinAmount } = req.body;
        let settings = await DeliveryCharge.findOne();
        if (!settings) {
            settings = new DeliveryCharge();
        }
        if (baseCharge !== undefined) settings.baseCharge = baseCharge;
        if (perKgCharge !== undefined) settings.perKgCharge = perKgCharge;
        if (freeDeliveryMinAmount !== undefined) settings.freeDeliveryMinAmount = freeDeliveryMinAmount;
        await settings.save();
        res.json({ success: true, message: 'Delivery charge settings updated', settings });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
