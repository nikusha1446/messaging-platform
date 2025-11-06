import { logger } from '../utils/logger.js';

export const handleTypingStart = (userService) => (socket) => {
  socket.on('typing:start', () => {
    const user = userService.setTyping(socket.id);

    if (user) {
      logger.debug(`${user.username} started typing`);

      socket.broadcast.emit('user:typing', {
        userId: user.id,
        username: user.username,
      });

      userService.setTypingTimeout(socket.id, () => {
        const user = userService.stopTyping(socket.id);
        if (user) {
          logger.debug(`${user.username} auto-stopped typing (timeout)`);

          socket.broadcast.emit('user:stopped:typing', {
            userId: user.id,
            username: user.username,
          });
        }
      });
    }
  });
};

export const handleTypingStop = (userService) => (socket) => {
  socket.on('typing:stop', () => {
    const user = userService.stopTyping(socket.id);

    if (user) {
      logger.debug(`${user.username} stopped typing`);

      socket.broadcast.emit('user:stopped:typing', {
        userId: user.id,
        username: user.username,
      });
    }
  });
};
