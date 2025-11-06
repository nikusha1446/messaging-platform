import { logger } from '../utils/logger.js';

export const handleConnection = (io, userService) => (socket) => {
  const result = userService.addUser(socket.id, socket.username);

  if (!result.success) {
    socket.emit('error', { message: result.error });
    socket.disconnect();
    return;
  }

  logger.info(`User connected: ${socket.username} (${socket.id})`);

  socket.emit('user:connected', {
    user: result.user,
  });

  io.emit('user:joined', {
    user: result.user,
    userCount: userService.getUserCount(),
  });

  socket.emit('users:list', {
    users: userService.getAllUsers(),
  });
};

export const handleDisconnect = (io, userService) => (socket) => {
  socket.on('disconnect', (reason) => {
    const user = userService.removeUser(socket.id);

    if (user) {
      logger.info(
        `User disconnected: ${user.username} (${socket.id}), reason: ${reason}`
      );

      io.emit('user:left', {
        user: user,
        userCount: userService.getUserCount(),
      });
    }
  });

  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.username}:`, error);
  });
};
