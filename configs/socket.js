import { Server } from 'socket.io';

let io = null;

// Initialize Socket.IO
export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    
    // Socket connection handler
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);
        
        // Join user-specific room
        socket.on('join_user', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined their room`);
        });
        
        // Join order-specific room
        socket.on('join_order', (orderId) => {
            socket.join(`order_${orderId}`);
            console.log(`Joined order room: ${orderId}`);
        });
        
        // Join rider-specific room
        socket.on('join_rider', (riderId) => {
            socket.join(`rider_${riderId}`);
            console.log(`Rider ${riderId} joined their room`);
        });
        
        // Join admin room
        socket.on('join_admin', () => {
            socket.join('admin');
            console.log('Admin joined admin room');
        });
        
        // Rider location update
        socket.on('rider_location', (data) => {
            const {riderId, orderId, latitude, longitude, timestamp} = data;
            
            // Broadcast to order room (customers and admins)
            if (orderId) {
                io.to(`order_${orderId}`).emit('rider_location_update', {
                    riderId,
                    latitude,
                    longitude,
                    timestamp,
                });
            }
            
            // Broadcast to admin room
            io.to('admin').emit('rider_location_update', {
                riderId,
                latitude,
                longitude,
                timestamp,
                orderId,
            });
        });
        
        // Order status update
        socket.on('order_status_update', (data) => {
            const {orderId, userId, status, deliveryStatus, message} = data;
            
            // Broadcast to order room
            io.to(`order_${orderId}`).emit('order_status_changed', {
                orderId,
                status,
                deliveryStatus,
                message,
                timestamp: new Date().toISOString(),
            });
            
            // Broadcast to user room
            if (userId) {
                io.to(`user_${userId}`).emit('order_status_changed', {
                    orderId,
                    status,
                    deliveryStatus,
                    message,
                    timestamp: new Date().toISOString(),
                });
            }
            
            // Broadcast to admin room
            io.to('admin').emit('order_status_changed', {
                orderId,
                status,
                deliveryStatus,
                userId,
                message,
                timestamp: new Date().toISOString(),
            });
        });
        
        // Delivery status update
        socket.on('delivery_status_update', (data) => {
            const {orderId, userId, status, riderId, message} = data;
            
            // Broadcast to order room
            io.to(`order_${orderId}`).emit('delivery_status_changed', {
                orderId,
                status,
                riderId,
                message,
                timestamp: new Date().toISOString(),
            });
            
            // Broadcast to user room
            if (userId) {
                io.to(`user_${userId}`).emit('delivery_status_changed', {
                    orderId,
                    status,
                    riderId,
                    message,
                    timestamp: new Date().toISOString(),
                });
            }
            
            // Broadcast to admin room
            io.to('admin').emit('delivery_status_changed', {
                orderId,
                status,
                riderId,
                userId,
                message,
                timestamp: new Date().toISOString(),
            });
        });
        
        // New order notification
        socket.on('new_order', (data) => {
            // Broadcast to admin room
            io.to('admin').emit('new_order_received', {
                ...data,
                timestamp: new Date().toISOString(),
            });
        });
        
        // Rider assignment
        socket.on('rider_assigned', (data) => {
            const {orderId, userId, riderId, riderName} = data;
            
            // Broadcast to order room
            io.to(`order_${orderId}`).emit('rider_assigned', {
                orderId,
                riderId,
                riderName,
                timestamp: new Date().toISOString(),
            });
            
            // Broadcast to user room
            if (userId) {
                io.to(`user_${userId}`).emit('rider_assigned', {
                    orderId,
                    riderId,
                    riderName,
                    timestamp: new Date().toISOString(),
                });
            }
            
            // Broadcast to rider room
            if (riderId) {
                io.to(`rider_${riderId}`).emit('order_assigned', {
                    orderId,
                    timestamp: new Date().toISOString(),
                });
            }
        });
        
        // New notification
        socket.on('new_notification', (data) => {
            const {userId, notification} = data;
            
            if (userId) {
                io.to(`user_${userId}`).emit('notification', notification);
            }
        });
        
        // Support ticket update
        socket.on('ticket_update', (data) => {
            const {ticketId, userId, message} = data;
            
            if (userId) {
                io.to(`user_${userId}`).emit('ticket_updated', {
                    ticketId,
                    message,
                    timestamp: new Date().toISOString(),
                });
            }
            
            io.to('admin').emit('ticket_updated', {
                ticketId,
                userId,
                message,
                timestamp: new Date().toISOString(),
            });
        });
        
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
    
    return io;
};

// Get io instance
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

// Emit to specific room
export const emitToRoom = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);
    }
};

// Emit to user
export const emitToUser = (userId, event, data) => {
    emitToRoom(`user_${userId}`, event, data);
};

// Emit to order
export const emitToOrder = (orderId, event, data) => {
    emitToRoom(`order_${orderId}`, event, data);
};

// Emit to rider
export const emitToRider = (riderId, event, data) => {
    emitToRoom(`rider_${riderId}`, event, data);
};

// Emit to admin
export const emitToAdmin = (event, data) => {
    emitToRoom('admin', event, data);
};

// Emit to all
export const emitToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

export default {
    initSocket,
    getIO,
    emitToRoom,
    emitToUser,
    emitToOrder,
    emitToRider,
    emitToAdmin,
    emitToAll,
};
