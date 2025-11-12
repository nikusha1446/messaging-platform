import { dom } from './dom.js';
import { closeSidebarOnMobile } from './sidebar.js';
import { state } from './state.js';
import { hideTypingIndicator, stopTyping } from './typing.js';
import { renderUsersList } from './users.js';
import { escapeHtml, formatTime, scrollToBottom } from './utils.js';

export function initChat() {
  dom.sendButton.addEventListener('click', sendMessage);
  dom.messageInput.addEventListener('keypress', handleKeypress);
  dom.groupChatBtn.addEventListener('click', switchToGroupChat);
}

function handleKeypress(e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
}

export function sendMessage() {
  const text = dom.messageInput.value.trim();

  if (!text) return;

  if (state.currentChat === 'group') {
    state.socket.emit('message', text);
  } else {
    state.socket.emit('message:private', {
      recipientId: state.currentChat,
      text: text,
    });
  }

  dom.messageInput.value = '';
  stopTyping();
}

function getStatusText(message, isLastOwnMessage, isPrivate) {
  const isOwn = message.senderId === state.currentUser.id;

  if (!isOwn || !isLastOwnMessage) {
    return '';
  }

  if (message.status === 'read') {
    if (isPrivate) {
      return '<span class="message-status-text read">Seen</span>';
    }

    const readCount = message.readByCount || 0;

    if (readCount === 0) {
      return '<span class="message-status-text delivered">Delivered</span>';
    } else if (readCount === 1) {
      return `<span class="message-status-text read">Seen by 1 person</span>`;
    } else {
      return `<span class="message-status-text read">Seen by ${readCount} people</span>`;
    }
  } else if (message.status === 'delivered') {
    return '<span class="message-status-text delivered">Delivered</span>';
  } else if (message.status === 'sent') {
    return '<span class="message-status-text sent">Sent</span>';
  }

  return '';
}

function isLastOwnMessage(messageId) {
  const allMessageEls = Array.from(
    dom.messagesEl.querySelectorAll('.message.own')
  );

  if (allMessageEls.length === 0) return false;

  const lastMessageEl = allMessageEls[allMessageEls.length - 1];
  return lastMessageEl.dataset.messageId === messageId;
}

export function displayMessage(message, isPrivate = false) {
  const messageEl = document.createElement('div');
  const isOwn = message.senderId === state.currentUser.id;

  messageEl.className = `message ${isOwn ? 'own' : 'other'}`;
  messageEl.dataset.messageId = message.id;

  const time = formatTime(message.timestamp);
  const username = message.username || message.senderUsername;

  const willBeLastOwn = isOwn;
  const statusText = getStatusText(message, willBeLastOwn, isPrivate);

  messageEl.innerHTML = `
    <div class="message-header">
      <span class="message-username">${escapeHtml(username)}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="message-bubble">
      <div class="message-text">${escapeHtml(message.text)}</div>
    </div>
    ${statusText}
  `;

  dom.messagesEl.appendChild(messageEl);

  if (isOwn) {
    updateAllMessageStatuses();
  }

  scrollToBottom(dom.messagesEl.parentElement);

  if (!isOwn) {
    markMessageAsRead(message);
  }
}

export function markMessageAsRead(message) {
  if (message.type === 'private') {
    state.socket.emit('message:private:read', { messageId: message.id });
  } else {
    state.socket.emit('message:read', { messageId: message.id });
  }
}

function updateAllMessageStatuses() {
  const allStatusTexts = dom.messagesEl.querySelectorAll(
    '.message-status-text'
  );
  allStatusTexts.forEach((text) => text.remove());

  const allOwnMessages = Array.from(
    dom.messagesEl.querySelectorAll('.message.own')
  );

  if (allOwnMessages.length === 0) return;

  const lastOwnMessage = allOwnMessages[allOwnMessages.length - 1];
  const messageId = lastOwnMessage.dataset.messageId;

  let messageData = null;

  if (state.currentChat === 'group') {
    messageData = state.messageHistory.group.find((m) => m.id === messageId);
  } else {
    const history = state.messageHistory.private.get(state.currentChat);
    if (history) {
      messageData = history.find((m) => m.id === messageId);
    }
  }

  if (messageData) {
    const isPrivate = state.currentChat !== 'group';
    let statusText = '';

    if (messageData.status === 'read') {
      if (isPrivate) {
        statusText = '<span class="message-status-text read">Seen</span>';
      } else {
        const readCount = messageData.readByCount || 0;

        if (readCount === 0) {
          statusText =
            '<span class="message-status-text delivered">Delivered</span>';
        } else if (readCount === 1) {
          statusText = `<span class="message-status-text read">Seen by 1 person</span>`;
        } else {
          statusText = `<span class="message-status-text read">Seen by ${readCount} people</span>`;
        }
      }
    } else if (messageData.status === 'delivered') {
      statusText =
        '<span class="message-status-text delivered">Delivered</span>';
    } else if (messageData.status === 'sent') {
      statusText = '<span class="message-status-text sent">Sent</span>';
    }

    if (statusText) {
      lastOwnMessage.insertAdjacentHTML('afterend', statusText);
    }
  }
}

export function updateMessageStatus(messageId, status) {
  if (state.currentChat === 'group') {
    const message = state.messageHistory.group.find((m) => m.id === messageId);
    if (message) {
      message.status = status;
    }
  } else {
    const history = state.messageHistory.private.get(state.currentChat);
    if (history) {
      const message = history.find((m) => m.id === messageId);
      if (message) {
        message.status = status;
      }
    }
  }

  if (isLastOwnMessage(messageId)) {
    const messageEl = document.querySelector(
      `[data-message-id="${messageId}"]`
    );

    if (messageEl) {
      const existingStatus = messageEl.nextElementSibling;

      if (
        existingStatus &&
        existingStatus.classList.contains('message-status-text')
      ) {
        existingStatus.remove();
      }

      const isPrivate = state.currentChat !== 'group';
      let statusText = '';

      let messageData = null;
      if (state.currentChat === 'group') {
        messageData = state.messageHistory.group.find(
          (m) => m.id === messageId
        );
      } else {
        const history = state.messageHistory.private.get(state.currentChat);

        if (history) {
          messageData = history.find((m) => m.id === messageId);
        }
      }

      if (messageData && status === 'read') {
        if (isPrivate) {
          statusText = '<span class="message-status-text read">Seen</span>';
        } else {
          const readCount = messageData.readByCount || 0;

          if (readCount === 0) {
            statusText =
              '<span class="message-status-text delivered">Delivered</span>';
          } else if (readCount === 1) {
            statusText = `<span class="message-status-text read">Seen by 1 person</span>`;
          } else {
            statusText = `<span class="message-status-text read">Seen by ${readCount} people</span>`;
          }
        }
      } else if (status === 'delivered') {
        statusText =
          '<span class="message-status-text delivered">Delivered</span>';
      } else if (status === 'sent') {
        statusText = '<span class="message-status-text sent">Sent</span>';
      }

      if (statusText) {
        messageEl.insertAdjacentHTML('afterend', statusText);
      }
    }
  }
}

export function addSystemMessage(text) {
  const messageEl = document.createElement('div');
  messageEl.className = 'system-message';
  messageEl.textContent = text;
  dom.messagesEl.appendChild(messageEl);
  scrollToBottom(dom.messagesEl.parentElement);
}

export function switchToPrivateChat(user) {
  state.currentChat = user.id;
  state.unreadCounts.private.set(user.id, 0);
  renderUsersList();
  dom.chatTitle.textContent = user.username;
  dom.chatSubtitle.textContent = 'Private conversation';

  dom.messagesEl.innerHTML = '';
  hideTypingIndicator();

  const history = state.messageHistory.private.get(user.id) || [];
  history.forEach((message) => {
    displayMessage(message, true);
  });

  document.querySelectorAll('.user-item').forEach((el) => {
    el.classList.remove('active');
  });

  const selectedUser = document.querySelector(`[data-user-id="${user.id}"]`);

  if (selectedUser) {
    selectedUser.classList.add('active');
  }

  dom.groupChatBtn.classList.remove('active');
  dom.messageInput.focus();

  closeSidebarOnMobile();
}

export function switchToGroupChat() {
  state.currentChat = 'group';
  state.unreadCounts.group = 0;
  renderUsersList();
  dom.chatTitle.textContent = 'Group Chat';
  dom.chatSubtitle.textContent = 'Everyone can see these messages';

  dom.messagesEl.innerHTML = '';
  hideTypingIndicator();

  state.messageHistory.group.forEach((message) => {
    if (message.type === 'system') {
      addSystemMessage(message.text);
    } else {
      displayMessage(message, false);
    }
  });

  document.querySelectorAll('.user-item').forEach((el) => {
    el.classList.remove('active');
  });

  dom.groupChatBtn.classList.add('active');
  dom.messageInput.focus();

  closeSidebarOnMobile();
}
