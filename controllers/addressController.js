import Address from '../models/Address.js';

// Add Address : /api/address/add
export const addAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const { firstName, lastName, email, houseNumber, floorNumber, roadNumber, city, state, zipcode, country, phone, coordinates } = req.body;
        await Address.create({ userId, firstName, lastName, email, houseNumber, floorNumber, roadNumber, city, state, zipcode, country, phone, coordinates });
        res.json({success: true, message: "Address added successfully"});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Get Address : /api/address/get
export const getAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const addresses = await Address.find({userId});
        res.json({success: true, addresses});
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Delete Address : /api/address/delete/:id
export const deleteAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const address = await Address.findOneAndDelete({ _id: req.params.id, userId });
        if (!address) {
            return res.json({ success: false, message: "Address not found" });
        }
        res.json({ success: true, message: "Address deleted" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}