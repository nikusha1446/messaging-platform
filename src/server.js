import express from 'express';
import { Server } from 'socket.io';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { UserService } from './services/userService.js';

const userService = new UserService();
const app = express();

const io = new Server({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// middleware
app.use(express.json());

// health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: config.env,
  });
});

// socket io midleware
io.use((socket, next) => {
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
});

// socket io
io.on('connection', (socket) => {
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

  socket.on('message', (data) => {
    const messageText = typeof data === 'string' ? data : String(data);

    if (!messageText || messageText.trim() === '') {
      socket.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    const user = userService.getUser(socket.id);

    const message = {
      id: `${Date.now()}-${socket.id}`,
      text: messageText.trim(),
      senderId: socket.id,
      username: user.username,
      timestamp: new Date().toISOString(),
    };

    io.emit('message', message);

    logger.info(`Message from ${user.username}:`, message.text);
  });

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
});

// start server
const server = app.listen(config.port, () => {
  logger.info(`Server started on port ${config.port}`);
  logger.info(`Environment: ${config.env}`);
});

io.attach(server);

// graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  io.close(() => {
    logger.info('Socket.IO server closed');
  });
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
