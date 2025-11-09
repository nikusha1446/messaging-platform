let socket = null;
let currentUser = null;
let onlineUsers = new Map();
let typingTimeout = null;
let currentChat = 'group';
let messageHistory = {
  group: [],
  private: new Map(),
};

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const loginButton = loginForm.querySelector('button');
const usernameInput = document.getElementById('username-input');
const loginError = document.getElementById('login-error');
const logoutButton = document.getElementById('logout-btn');
const usersCountEl = document.getElementById('users-count');
const usersListEl = document.getElementById('users-list');
const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');
const typingText = document.getElementById('typing-text');
const groupChatBtn = document.getElementById('group-chat-btn');
const chatTitle = document.getElementById('chat-title');
const chatSubtitle = document.getElementById('chat-subtitle');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();

  if (username.length < 2 || username.length > 20) {
    showLoginError('Username must be 2-20 characters');
    return;
  }

  usernameInput.disabled = true;
  loginButton.disabled = true;
  loginButton.textContent = 'Connecting...';

  connectToServer(username);
});

function connectToServer(username) {
  let currentTypingUser = null;
  let currentTypingContext = null;

  socket = io({
    auth: {
      username,
    },
  });

  socket.on('connect', () => {
    console.log('Connected to server', socket.id);
  });

  socket.on('user:connected', (data) => {
    currentUser = data.user;
    console.log('Login successful:', currentUser);
    showChatScreen();
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    showLoginError(error.message);
    resetLoginForm();
  });

  socket.on('error', (data) => {
    console.error('Server error:', data);
    showLoginError(data.message);

    if (!currentUser) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      resetLoginForm();
    }
  });

  socket.on('users:list', (data) => {
    console.log('Users list received:', data);

    data.users.forEach((user) => {
      onlineUsers.set(user.id, user);
    });

    renderUsersList();
  });

  socket.on('user:joined', (data) => {
    console.log('User joined:', data.user.username);
    onlineUsers.set(data.user.id, data.user);
    renderUsersList();
  });

  socket.on('user:left', (data) => {
    console.log('User left:', data.user.username);
    onlineUsers.delete(data.user.id);
    renderUsersList();
  });

  socket.on('user:status:changed', (data) => {
    console.log('User status changed:', data.user.username, data.newStatus);
    const user = onlineUsers.get(data.user.id);

    if (user) {
      user.status = data.newStatus;
      renderUsersList();
    }
  });

  socket.on('message', (message) => {
    console.log('Message received:', message);

    messageHistory.group.push(message);

    if (currentChat === 'group') {
      displayMessage(message);
    }
  });

  socket.on('message:private', (message) => {
    console.log('Private message received:', message);

    const otherUserId =
      message.senderId === currentUser.id
        ? message.recipientId
        : message.senderId;

    if (!messageHistory.private.has(otherUserId)) {
      messageHistory.private.set(otherUserId, []);
    }

    messageHistory.private.get(otherUserId).push(message);

    if (currentChat === otherUserId) {
      displayMessage(message, true);
    }
  });

  socket.on('user:typing', (data) => {
    console.log('User typing:', data.username, 'Context:', data.context);

    const typingContext = data.context || 'group';

    if (currentChat === typingContext) {
      currentTypingUser = data.userId;
      currentTypingContext = typingContext;
      showTypingIndicator(data.username);
    }
  });

  socket.on('user:stopped:typing', (data) => {
    console.log('User stopped typing:', data.username);

    const typingContext = data.context || 'group';

    if (currentChat === typingContext && currentTypingUser === data.userId) {
      hideTypingIndicator();
      currentTypingUser = null;
      currentTypingContext = null;
    }
  });
}

function showChatScreen() {
  loginScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  console.log('Switched to chat screen');
}

function showLoginError(message) {
  loginError.textContent = message;
  loginError.classList.remove('hidden');

  setTimeout(() => {
    loginError.classList.add('hidden');
  }, 5000);
}

function resetLoginForm() {
  usernameInput.disabled = false;
  loginButton.disabled = false;
  loginButton.textContent = 'Join Chat';
}

logoutButton.addEventListener('click', () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentUser = null;
  messageHistory.group = [];
  messageHistory.private.clear();
  location.reload();
});

groupChatBtn.addEventListener('click', () => {
  switchToGroupChat();
});

function startTyping() {
  const data = currentChat === 'group' ? {} : { recipientId: currentChat };
  socket.emit('typing:start', data);

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    stopTyping();
  }, 2000);
}

function stopTyping() {
  const data = currentChat === 'group' ? {} : { recipientId: currentChat };
  socket.emit('typing:stop', data);
  clearTimeout(typingTimeout);
}

function showTypingIndicator(username) {
  typingText.textContent = `${username} is typing...`;
  typingIndicator.classList.remove('hidden');
}

function hideTypingIndicator() {
  typingIndicator.classList.add('hidden');
}

function switchToPrivateChat(user) {
  currentChat = user.id;
  chatTitle.textContent = user.username;
  chatSubtitle.textContent = 'Private conversation';

  messagesEl.innerHTML = '';
  hideTypingIndicator();

  const history = messageHistory.private.get(user.id) || [];
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

  groupChatBtn.classList.remove('active');
  messageInput.focus();
}

function switchToGroupChat() {
  currentChat = 'group';
  chatTitle.textContent = 'Group Chat';
  chatSubtitle.textContent = 'Everyone can see these messages';

  messagesEl.innerHTML = '';
  hideTypingIndicator();

  messageHistory.group.forEach((message) => {
    displayMessage(message, false);
  });

  document.querySelectorAll('.user-item').forEach((el) => {
    el.classList.remove('active');
  });

  groupChatBtn.classList.add('active');
  messageInput.focus();
}

function renderUsersList() {
  usersListEl.innerHTML = '';
  usersCountEl.textContent = onlineUsers.size - 1;

  onlineUsers.forEach((user) => {
    if (user.id === currentUser.id) return;

    const userEl = document.createElement('div');
    userEl.className = 'user-item';
    userEl.dataset.userId = user.id;

    if (currentChat === user.id) {
      userEl.classList.add('active');
    }

    const statusDot = document.createElement('span');
    statusDot.className = `user-status ${user.status}`;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'user-name';
    nameSpan.textContent = user.username;

    userEl.appendChild(statusDot);
    userEl.appendChild(nameSpan);

    userEl.addEventListener('click', () => {
      switchToPrivateChat(user);
    });

    usersListEl.appendChild(userEl);
  });
}

function sendMessage() {
  const text = messageInput.value.trim();

  if (!text) return;

  if (currentChat === 'group') {
    socket.emit('message', text);
  } else {
    socket.emit('message:private', {
      recipientId: currentChat,
      text: text,
    });
  }

  messageInput.value = '';
  stopTyping();
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('input', () => {
  if (messageInput.value.trim()) {
    startTyping();
  } else {
    stopTyping();
  }
});

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

function displayMessage(message, isPrivate = false) {
  const messageEl = document.createElement('div');
  const isOwn = message.senderId === currentUser.id;

  messageEl.className = `message ${isOwn ? 'own' : 'other'}`;

  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const username = message.username || message.senderUsername;

  messageEl.innerHTML = `
  <div class="message-header">
    <span class="message-username">${escapeHtml(message.username)}</span>
    <span class="message-time">${time}</span>
  </div>
  <div class="message-bubble">
    <div class="message-text">${escapeHtml(message.text)}</div>
  </div>
  `;

  messagesEl.appendChild(messageEl);
  scrollToBottom();
}

function scrollToBottom() {
  messagesEl.parentElement.scrollTop = messagesEl.parentElement.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
