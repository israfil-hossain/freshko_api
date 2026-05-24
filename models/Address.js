import mongoose from 'mongoose';


const addressSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true},
    houseNumber: {type: String, required: true},
    floorNumber: {type: String, required: true},
    roadNumber: {type: String, required: true},
    city: {type: String, required: true},
    state: {type: String, required: true},
    zipcode: {type: String, required: true},
    country: {type: String, default: "Bangladesh"},
    phone: {type: String, required: true},
    coordinates: {
        lat: {type: Number, default: null},
        lng: {type: Number, default: null},
    },
});

const Address = mongoose.models.address || mongoose.model('address', addressSchema);

export default Address;