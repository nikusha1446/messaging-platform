export const authMiddleware = (socket, next) => {
  const username =
    socket.handshake.auth.username || socket.handshake.query.username;

  if (!username || username.trim() === '') {
    return next(new Error('Username is required'));
  }

  if (username.length < 2 || username.length > 20) {
    return next(new Error('Username must be between 2 and 20 characters'));
  }

  socket.username = username.trim();
  next();
};
