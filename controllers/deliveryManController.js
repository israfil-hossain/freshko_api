import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import DeliveryMan from '../models/DeliveryMan.js';
import DeliveryAssignment from '../models/DeliveryAssignment.js';
import Order from '../models/Order.js';

// Admin: Add delivery man : POST /api/delivery-man/add
export const addDeliveryMan = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const existing = await DeliveryMan.findOne({ email });
        if (existing) {
            return res.json({ success: false, message: 'Delivery man already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const deliveryMan = await DeliveryMan.create({
            name, email, password: hashedPassword, phone
        });
        res.json({ success: true, message: 'Delivery man added', deliveryMan: { ...deliveryMan.toObject(), password: undefined } });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Delivery Man Login : POST /api/delivery-man/login
export const deliveryManLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const deliveryMan = await DeliveryMan.findOne({ email });
        if (!deliveryMan) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }
        if (!deliveryMan.isActive) {
            return res.json({ success: false, message: 'Account is deactivated' });
        }
        const isMatch = await bcrypt.compare(password, deliveryMan.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: deliveryMan._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('deliveryManToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ success: true, message: 'Logged in', deliveryMan: { name: deliveryMan.name, email: deliveryMan.email } });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Check Delivery Man Auth : GET /api/delivery-man/is-auth
export const isDeliveryManAuth = async (req, res) => {
    try {
        const deliveryMan = await DeliveryMan.findById(req.deliveryManId).select('-password');
        if (!deliveryMan) {
            return res.json({ success: false, message: 'Not found' });
        }
        res.json({ success: true, deliveryMan });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Logout : GET /api/delivery-man/logout
export const deliveryManLogout = async (req, res) => {
    try {
        res.clearCookie('deliveryManToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        res.json({ success: true, message: 'Logged out' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Admin: List all delivery men : GET /api/delivery-man/list
export const listDeliveryMen = async (req, res) => {
    try {
        const deliveryMen = await DeliveryMan.find({}).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, deliveryMen });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Update delivery man : PUT /api/delivery-man/:id
export const updateDeliveryMan = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }
        const deliveryMan = await DeliveryMan.findByIdAndUpdate(id, updates, { new: true }).select('-password');
        if (!deliveryMan) {
            return res.json({ success: false, message: 'Delivery man not found' });
        }
        res.json({ success: true, message: 'Updated', deliveryMan });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Delete delivery man : DELETE /api/delivery-man/:id
export const deleteDeliveryMan = async (req, res) => {
    try {
        const { id } = req.params;
        await DeliveryMan.findByIdAndDelete(id);
        res.json({ success: true, message: 'Delivery man deleted' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Delivery Man: Get dashboard stats : GET /api/delivery-man/dashboard
export const getDeliveryManDashboard = async (req, res) => {
    try {
        const deliveryManId = req.deliveryManId;
        const deliveryMan = await DeliveryMan.findById(deliveryManId).select('-password');

        const assignments = await DeliveryAssignment.find({ deliveryManId })
            .populate('orderId')
            .sort({ createdAt: -1 });

        const completed = assignments.filter(a => a.status === 'delivered');
        const currentAssignment = assignments.find(a => ['assigned', 'picked-up', 'in-transit'].includes(a.status));
        const queue = assignments.filter(a => a.status === 'assigned' && (!currentAssignment || a._id.toString() !== currentAssignment._id.toString()));

        let totalEarnings = 0;
        for (const a of completed) {
            if (a.orderId) totalEarnings += a.orderId.amount || 0;
        }

        res.json({
            success: true,
            dashboard: {
                totalDeliveries: completed.length,
                totalEarnings,
                currentOrder: currentAssignment ? currentAssignment : null,
                queueOrders: queue.slice(0, 5),
                recentDeliveries: assignments.slice(0, 10),
                deliveryMan,
            }
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Delivery Man: Get assigned orders : GET /api/delivery-man/orders
export const getDeliveryManOrders = async (req, res) => {
    try {
        const assignments = await DeliveryAssignment.find({ deliveryManId: req.deliveryManId })
            .populate({
                path: 'orderId',
                populate: [
                    { path: 'items.product' },
                    { path: 'address' }
                ]
            })
            .sort({ createdAt: -1 });

        res.json({ success: true, assignments });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Delivery Man: Update delivery status : PUT /api/delivery-man/update-status
export const updateDeliveryStatus = async (req, res) => {
    try {
        const { assignmentId, status, notes } = req.body;
        const assignment = await DeliveryAssignment.findById(assignmentId);
        if (!assignment) {
            return res.json({ success: false, message: 'Assignment not found' });
        }
        if (assignment.deliveryManId.toString() !== req.deliveryManId) {
            return res.json({ success: false, message: 'Not authorized' });
        }

        const validTransitions = {
            'assigned': ['picked-up', 'cancelled'],
            'picked-up': ['in-transit', 'cancelled'],
            'in-transit': ['delivered', 'cancelled'],
        };

        if (!validTransitions[assignment.status]?.includes(status)) {
            return res.json({ success: false, message: `Cannot transition from ${assignment.status} to ${status}` });
        }

        assignment.status = status;
        if (status === 'picked-up') assignment.pickedUpAt = new Date();
        if (status === 'delivered') assignment.deliveredAt = new Date();
        if (notes) assignment.notes = notes;
        await assignment.save();

        // Update Order deliveryStatus
        await Order.findByIdAndUpdate(assignment.orderId, { deliveryStatus: status });

        // Update delivery man stats on delivery
        if (status === 'delivered') {
            const order = await Order.findById(assignment.orderId);
            await DeliveryMan.findByIdAndUpdate(req.deliveryManId, {
                $inc: { totalDeliveries: 1, totalEarnings: order?.amount || 0 },
                currentOrderId: null,
            });
        } else if (status === 'picked-up') {
            await DeliveryMan.findByIdAndUpdate(req.deliveryManId, {
                currentOrderId: assignment.orderId,
            });
        } else if (status === 'cancelled') {
            await DeliveryMan.findByIdAndUpdate(req.deliveryManId, {
                currentOrderId: null,
            });
        }

        res.json({ success: true, message: `Order ${status}`, assignment });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
