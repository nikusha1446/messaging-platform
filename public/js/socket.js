import { resetLoginForm, showChatScreen, showLoginError } from './auth.js';
import {
  addSystemMessage,
  displayMessage,
  updateMessageStatus,
} from './chat.js';
import { state } from './state.js';
import { hideTypingIndicator, showTypingIndicator } from './typing.js';
import { renderUsersList } from './users.js';

export function connectToServer(username) {
  state.socket = io({
    auth: { username },
  });

  state.socket.on('user:connected', (data) => {
    state.currentUser = data.user;
    showChatScreen();
  });

  state.socket.on('connect_error', (error) => {
    showLoginError(error.message);
    resetLoginForm();
  });

  state.socket.on('error', (data) => {
    showLoginError(data.message);

    if (!state.currentUser) {
      if (state.socket) {
        state.socket.disconnect();
        state.socket = null;
      }
      resetLoginForm();
    }
  });

  state.socket.on('users:list', (data) => {
    data.users.forEach((user) => {
      state.onlineUsers.set(user.id, user);
    });
    renderUsersList();
  });

  state.socket.on('user:joined', (data) => {
    state.onlineUsers.set(data.user.id, data.user);
    renderUsersList();

    if (data.user.id !== state.currentUser.id) {
      const systemMessage = {
        type: 'system',
        text: `${data.user.username} joined the chat`,
        timestamp: Date.now(),
      };
      state.messageHistory.group.push(systemMessage);

      if (state.currentChat === 'group') {
        addSystemMessage(systemMessage.text);
      }
    }
  });

  state.socket.on('user:left', (data) => {
    state.onlineUsers.delete(data.user.id);
    renderUsersList();

    if (data.user.id !== state.currentUser.id) {
      const systemMessage = {
        type: 'system',
        text: `${data.user.username} left the chat`,
        timestamp: Date.now(),
      };

      state.messageHistory.group.push(systemMessage);

      if (state.currentChat === 'group') {
        addSystemMessage(systemMessage.text);
      }
    }
  });

  state.socket.on('user:status:changed', (data) => {
    const user = state.onlineUsers.get(data.user.id);

    if (user) {
      user.status = data.newStatus;
      renderUsersList();
    }
  });

  state.socket.on('message', (message) => {
    state.messageHistory.group.push(message);

    if (state.currentChat === 'group') {
      displayMessage(message);
    } else {
      if (message.senderId !== state.currentUser.id) {
        state.unreadCounts.group++;
        renderUsersList();
      }
    }
  });

  state.socket.on('message:private', (message) => {
    const otherUserId =
      message.senderId === state.currentUser.id
        ? message.recipientId
        : message.senderId;

    if (!state.messageHistory.private.has(otherUserId)) {
      state.messageHistory.private.set(otherUserId, []);
    }

    state.messageHistory.private.get(otherUserId).push(message);

    if (state.currentChat === otherUserId) {
      displayMessage(message, true);
    } else {
      if (message.senderId !== state.currentUser.id) {
        const currentCount = state.unreadCounts.private.get(otherUserId) || 0;
        state.unreadCounts.private.set(otherUserId, currentCount + 1);
        renderUsersList();
      }
    }
  });

  state.socket.on('message:status:updated', (data) => {
    const { messageId, status, type } = data;

    if (type === 'private') {
      state.messageHistory.private.forEach((messages) => {
        const message = messages.find((m) => m.id === messageId);

        if (message) {
          message.status = status;
          if (data.readAt) message.readAt = data.readAt;
          if (data.deliveredAt) message.deliveredAt = data.deliveredAt;
        }
      });
    } else {
      const message = state.messageHistory.group.find(
        (m) => m.id === messageId
      );
      if (message) {
        message.status = status;
        if (data.readBy !== undefined) message.readByCount = data.readBy;
        if (data.readAt) message.readAt = data.readAt;
        if (data.deliveredAt) message.deliveredAt = data.deliveredAt;
      }
    }

    updateMessageStatus(messageId, status);
  });

  state.socket.on('user:typing', (data) => {
    const typingContext = data.context || 'group';

    if (state.currentChat === typingContext) {
      state.currentTypingUser = data.userId;
      state.currentTypingContext = typingContext;
      showTypingIndicator(data.username);
    }
  });

  state.socket.on('user:stopped:typing', (data) => {
    const typingContext = data.context || 'group';

    if (
      state.currentChat === typingContext &&
      state.currentTypingUser === data.userId
    ) {
      hideTypingIndicator();
      state.currentTypingUser = null;
      state.currentTypingContext = null;
    }
  });
}
