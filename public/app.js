import { initAuth } from './js/auth.js';
import { initChat } from './js/chat.js';
import { initSidebarToggle } from './js/sidebar.js';
import { initTyping } from './js/typing.js';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initChat();
  initTyping();
  initSidebarToggle();
});
