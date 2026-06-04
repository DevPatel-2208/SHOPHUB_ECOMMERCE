let io = null;

export const initializeSockets = (_io) => {
  io = _io;

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('ping_server', () => {
      socket.emit('pong_server', { serverTime: Date.now() });
    });

    socket.on('join_user', (userId) => {
      if (!userId) {
        console.warn(`[Socket] join_user called without userId (socket: ${socket.id})`);
        return;
      }
      const room = `user_${userId}`;
      socket.join(room);
      console.log(`[Socket] User ${userId} joined room: ${room} (socket: ${socket.id})`);
      socket.emit('user_room_joined', { room, userId, success: true });
    });

    socket.on('leave_user', (userId) => {
      if (!userId) return;
      const room = `user_${userId}`;
      socket.leave(room);
      console.log(`[Socket] User ${userId} left room: ${room} (socket: ${socket.id})`);
    });

    socket.on('join_admin', () => {
      socket.join('admin_room');
      console.log(`[Socket] Admin joined admin_room (socket: ${socket.id})`);
      socket.emit('admin_room_joined', { room: 'admin_room', success: true });
    });

    socket.on('leave_admin', () => {
      socket.leave('admin_room');
      console.log(`[Socket] Admin left admin_room (socket: ${socket.id})`);
    });

    socket.on('new_order_placed', (data) => {
      if (!data?.orderId) return;
      io.to('admin_room').emit('new_order', {
        orderId: data.orderId,
        total: data.total,
        message: 'New order received!',
        timestamp: new Date(),
      });
    });

    socket.on('order_status_update', (data) => {
      if (!data?.userId || !data?.orderId) return;
      io.to(`user_${data.userId}`).emit('order_update', {
        orderId: data.orderId,
        status: data.status,
        message: `Your order is now ${data.status}`,
      });
    });

    socket.on('low_stock_alert', (data) => {
      if (!data?.productId || !data?.productName) return;
      io.to('admin_room').emit('stock_alert', {
        productId: data.productId,
        productName: data.productName,
        stock: data.stock,
        message: `${data.productName} is low on stock (${data.stock} left)`,
      });
    });

    socket.on('typing', (data) => {
      socket.broadcast.to('admin_room').emit('user_typing', data);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (reason: ${reason})`);
    });

    socket.on('error', (error) => {
      console.error(`[Socket] Error for ${socket.id}:`, error.message);
    });
  });

  io.engine.on('connection_error', (err) => {
    console.error(`[Socket] Engine connection error: ${err.message} (code: ${err.code})`);
    if (err.req) {
      console.error(`   Request: ${err.req.method} ${err.req.url}`);
    }
  });

  io.engine.on('initial_headers', (headers, req) => {
    headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    headers['Access-Control-Allow-Credentials'] = 'true';
  });

  console.log('[Socket] Socket.IO initialized successfully');
  return io;
};

export const getIO = () => io;

export const emitAdminNotification = (_io, notification) => {
  const target = _io || io;
  if (!target) return;

  target.to('admin_room').emit('admin_notification', {
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    orderId: notification.orderId,
    customerName: notification.customerName,
    customerEmail: notification.customerEmail,
    amount: notification.amount,
    isRead: notification.isRead ?? false,
    link: notification.link,
    createdAt: notification.createdAt,
  });
};

export const emitNewOrderToAdmins = (_io, order, user) => {
  const target = _io || io;
  if (!target) return;

  const notificationData = {
    orderId: order._id,
    orderNumber: order._id.toString().slice(-6).toUpperCase(),
    customerName: user?.name || 'Guest',
    customerEmail: user?.email || '',
    amount: order.totalPrice,
    itemsCount: order.orderItems?.length || 0,
    paymentMethod: order.paymentMethod || 'N/A',
    timestamp: new Date(),
  };

  target.to('admin_room').emit('new_order', notificationData);
};

export const emitUserNotification = (_io, userId, notification) => {
  const target = _io || io;
  if (!target || !userId) return;

  target.to(`user_${userId}`).emit('user_notification', {
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead ?? false,
    link: notification.link,
    metadata: notification.metadata,
    createdAt: notification.createdAt || new Date().toISOString(),
  });
};

export const emitUserOrderUpdate = (_io, userId, orderId, status, message) => {
  const target = _io || io;
  if (!target || !userId) return;

  target.to(`user_${userId}`).emit('order_update', {
    orderId,
    status,
    message,
    timestamp: new Date(),
  });
};

export const emitNewMessageToAdmins = (_io, message) => {
  const target = _io || io;
  if (!target) return;

  target.to('admin_room').emit('new_message', {
    _id: message._id,
    name: message.name,
    email: message.email,
    subject: message.subject,
    message: message.message,
    createdAt: message.createdAt || new Date().toISOString(),
  });
};

export const emitAdminPaymentSuccess = (_io, order, user) => {
  const target = _io || io;
  if (!target) return;

  target.to('admin_room').emit('payment_success', {
    orderId: order._id,
    amount: order.totalPrice,
    customerName: user?.name || 'Guest',
    customerEmail: user?.email || '',
    title: 'Payment Received',
    message: `Payment of ₹${order.totalPrice} received from ${user?.name || 'Guest'}`,
    link: `/orders/${order._id}`,
    timestamp: new Date(),
  });
};
