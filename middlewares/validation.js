import { z } from 'zod';

// Common schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
export const phoneSchema = z.string().regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh phone number');
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

// Auth schemas
export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    phone: z.string().optional(),
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: passwordSchema,
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
});

// Product schemas
export const productSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    offerPrice: z.number().positive().optional(),
    category: z.string().min(1, 'Category is required'),
    subcategory: z.string().optional(),
    tags: z.array(z.string()).optional(),
    quantity: z.number().int().min(0, 'Quantity must be non-negative').optional(),
    weight: z.number().optional(),
});

// Order schemas
export const placeOrderSchema = z.object({
    addressId: z.string().min(1, 'Address is required'),
    paymentType: z.enum(['COD', 'bKash', 'Online'], 'Invalid payment type'),
    deliveryInstructions: z.string().optional(),
    couponCode: z.string().optional(),
});

export const cancelOrderSchema = z.object({
    reason: z.string().min(1, 'Reason is required'),
});

// Address schemas
export const addressSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: emailSchema,
    phone: z.string().min(1, 'Phone is required'),
    houseNumber: z.string().min(1, 'House number is required'),
    floorNumber: z.string().optional(),
    roadNumber: z.string().min(1, 'Road number is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipcode: z.string().min(4, 'Zip code must be at least 4 digits'),
    country: z.string().default('Bangladesh'),
});

// Support ticket schemas
export const createTicketSchema = z.object({
    orderId: z.string().optional(),
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    category: z.enum(['general', 'order', 'delivery', 'payment', 'product', 'refund', 'other']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const replyTicketSchema = z.object({
    message: z.string().min(1, 'Message is required'),
});

// Review schemas
export const createReviewSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    orderId: z.string().min(1, 'Order ID is required'),
    rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
    title: z.string().optional(),
    comment: z.string().min(10, 'Comment must be at least 10 characters'),
});

// Validation middleware
export const validate = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                const errors = result.error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors,
                });
            }
            req.validatedData = result.data;
            next();
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.message,
            });
        }
    };
};
