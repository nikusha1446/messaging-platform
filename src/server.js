import express from 'express';
import { Server } from 'socket.io';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

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

// socket io
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('message', (data) => {
    logger.info(`Message from ${socket.id}:`, data);

    const messageText = typeof data === 'string' ? data : String(data);

    if (!messageText || messageText.trim() === '') {
      socket.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    const message = {
      id: `${Date.now()}-${socket.id}`,
      text: messageText.trim(),
      senderId: socket.id,
      timestamp: new Date().toISOString(),
    };

    io.emit('message', message);

    logger.info(`Message broadcasted:`, message);
  });

  socket.on('disconnect', (reason) => {
    logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });

  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
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
