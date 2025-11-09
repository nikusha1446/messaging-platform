import { logger } from '../utils/logger.js';

export const handleTypingStart = (userService) => (socket) => {
  socket.on('typing:start', (data) => {
    const user = userService.setTyping(socket.id);

    if (user) {
      logger.debug(`${user.username} started typing`);

      if (data && data.recipientId) {
        socket.to(data.recipientId).emit('user:typing', {
          userId: user.id,
          username: user.username,
          context: socket.id,
        });
      } else {
        socket.broadcast.emit('user:typing', {
          userId: user.id,
          username: user.username,
          context: 'group',
        });
      }

      userService.setTypingTimeout(socket.id, () => {
        const user = userService.stopTyping(socket.id);
        if (user) {
          logger.debug(`${user.username} auto-stopped typing (timeout)`);

          if (data && data.recipientId) {
            socket.to(data.recipientId).emit('user:stopped:typing', {
              userId: user.id,
              username: user.username,
              context: socket.id,
            });
          } else {
            socket.broadcast.emit('user:stopped:typing', {
              userId: user.id,
              username: user.username,
              context: 'group',
            });
          }
        }
      });
    }
  });
};

export const handleTypingStop = (userService) => (socket) => {
  socket.on('typing:stop', (data) => {
    const user = userService.stopTyping(socket.id);

    if (user) {
      logger.debug(`${user.username} stopped typing`);

      if (data && data.recipientId) {
        socket.to(data.recipientId).emit('user:stopped:typing', {
          userId: user.id,
          username: user.username,
          context: socket.id,
        });
      } else {
        socket.broadcast.emit('user:stopped:typing', {
          userId: user.id,
          username: user.username,
          context: 'group',
        });
      }
    }
  });
};
