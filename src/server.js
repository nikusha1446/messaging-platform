import express from 'express';
import { Server } from 'socket.io';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { UserService } from './services/userService.js';
import { MessageService } from './services/messageService.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { registerSocketHandlers } from './handlers/index.js';

const userService = new UserService();
const messageService = new MessageService();
const app = express();

const io = new Server({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// middleware
app.use(express.json());
app.use(express.static('public'));

// health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: config.env,
    connections: userService.getUserCount(),
  });
});

// check for inactive users
setInterval(() => {
  const changedUsers = userService.checkInactiveUsers();

  changedUsers.forEach((user) => {
    logger.info(`User ${user.username} is now away (inactive)`);

    io.emit('user:status:changed', {
      user: user,
      oldStatus: 'online',
      newStatus: 'away',
    });
  });
}, 30000);

// socket io midleware
io.use(authMiddleware);

// socket event handlers
registerSocketHandlers(io, userService, messageService);

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
