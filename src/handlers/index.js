import { handleConnection, handleDisconnect } from './connectionHandler.js';
import {
  handleMessageDelivery,
  handlePrivateMessage,
  handlePrivateMessageDelivery,
  handlePublicMessage,
} from './messageHandler.js';
import { handleTypingStart, handleTypingStop } from './typingHandler.js';

export const registerSocketHandlers = (io, userService, messageService) => {
  io.on('connection', (socket) => {
    // connection
    handleConnection(io, userService)(socket);

    // messages
    handlePublicMessage(io, userService, messageService)(socket);
    handlePrivateMessage(io, userService, messageService)(socket);
    handleMessageDelivery(io, messageService)(socket);
    handlePrivateMessageDelivery(io, messageService)(socket);

    // typing indicators
    handleTypingStart(userService)(socket);
    handleTypingStop(userService)(socket);

    // disconnection
    handleDisconnect(io, userService)(socket);
  });
};
