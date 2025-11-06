let socket = null;
let currentUser = null;

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const loginButton = loginForm.querySelector('button');
const usernameInput = document.getElementById('username-input');
const loginError = document.getElementById('login-error');

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
