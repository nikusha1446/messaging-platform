import { logger } from '../utils/logger.js';

export const handlePublicMessage =
  (io, userService, messageService) => (socket) => {
    socket.on('message', (data, acknowledgment) => {
      const messageText = typeof data === 'string' ? data : String(data);

      if (!messageText || messageText.trim() === '') {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      userService.stopTyping(socket.id);

      const activityResult = userService.updateActivity(socket.id);

      if (activityResult.statusChanged) {
        logger.info(`User ${socket.username} is back online`);

        io.emit('user:status:changed', {
          user: activityResult.user,
          oldStatus: 'away',
          newStatus: 'online',
        });
      }

      const user = userService.getUser(socket.id);

      const message = messageService.createMessage(
        socket.id,
        user.username,
        messageText
      );

      if (acknowledgment && typeof acknowledgment === 'function') {
        acknowledgment({
          success: true,
          messageId: message.id,
          timestamp: message.timestamp,
        });
      }

      io.emit('message', message);

      logger.info(`Message from ${user.username}:`, message.text);
    });
  };

export const handlePrivateMessage =
  (io, userService, messageService) => (socket) => {
    socket.on('message:private', (data) => {
      const { recipientId, text } = data;

      if (!recipientId || !text || text.trim() === '') {
        socket.emit('error', { message: 'Invalid private message format' });
        return;
      }

      const recipient = userService.getUser(recipientId);

      if (!recipient) {
        socket.emit('error', { message: 'Recipient not found' });
        return;
      }

      if (recipientId === socket.id) {
        socket.emit('error', { message: 'Cannot send message to yourself' });
        return;
      }

      const sender = userService.getUser(socket.id);

      const message = messageService.createPrivateMessage(
        socket.id,
        sender.username,
        recipientId,
        recipient.username,
        text
      );

      io.to(recipientId).emit('message:private', message);
      socket.emit('message:private', message);

      logger.info(
        `Private message from ${sender.username} to ${recipient.username}: "${message.text}"`
      );
    });
  };

export const handleMessageDelivery = (io, messageService) => (socket) => {
  socket.on('message:delivered', (data) => {
    const { messageId } = data;

    if (!messageId) {
      logger.warn(`Invalid delivery confirmation from ${socket.username}`);
      return;
    }

    const message = messageService.markAsDelivered(messageId, socket.id);

    if (message) {
      logger.debug(
        `Message ${messageId} delivered to ${socket.username} (${message.deliveredTo.length} recipients)`
      );

      io.to(message.senderId).emit('message:status:updated', {
        messageId: message.id,
        status: message.status,
        deliveredTo: message.deliveredTo.length,
        deliveredAt: message.deliveredAt,
      });
    }
  });
};

export const handlePrivateMessageDelivery =
  (io, messageService) => (socket) => {
    socket.on('message:private:delivered', (data) => {
      const { messageId } = data;

      if (!messageId) {
        logger.warn(
          `Invalid private message delivery confirmation from ${socket.username}`
        );
        return;
      }

      const message = messageService.markPrivateMessageAsDelivered(messageId);

      if (message) {
        logger.debug(
          `Private message ${messageId} delivered to ${socket.username}`
        );

        io.to(message.senderId).emit('message:status:updated', {
          messageId: message.id,
          status: 'delivered',
          type: 'private',
          recipientId: message.recipientId,
          deliveredAt: message.deliveredAt,
        });
      }
    });
  };
