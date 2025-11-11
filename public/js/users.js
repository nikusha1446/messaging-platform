import { switchToPrivateChat } from './chat.js';
import { dom } from './dom.js';
import { state } from './state.js';

export function renderUsersList() {
  dom.usersListEl.innerHTML = '';
  dom.usersCountEl.textContent = state.onlineUsers.size - 1;

  const existingGroupBadge = dom.groupChatBtn.querySelector('.unread-badge');

  if (existingGroupBadge) {
    existingGroupBadge.remove();
  }

  const groupUnreadCount = state.unreadCounts.group;

  if (groupUnreadCount > 0) {
    const displayCount = groupUnreadCount > 99 ? '99+' : groupUnreadCount;
    const badge = document.createElement('span');
    badge.className = 'unread-badge';
    badge.textContent = displayCount;
    dom.groupChatBtn.appendChild(badge);
  }

  state.onlineUsers.forEach((user) => {
    if (user.id === state.currentUser.id) return;

    const userEl = document.createElement('div');
    userEl.className = 'user-item';
    userEl.dataset.userId = user.id;

    if (state.currentChat === user.id) {
      userEl.classList.add('active');
    }

    const statusDot = document.createElement('span');
    statusDot.className = `user-status ${user.status}`;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'user-name';
    nameSpan.textContent = user.username;

    userEl.appendChild(statusDot);
    userEl.appendChild(nameSpan);

    const unreadCount = state.unreadCounts.private.get(user.id) || 0;

    if (unreadCount > 0) {
      const displayCount = unreadCount > 99 ? '99+' : unreadCount;
      const badge = document.createElement('span');
      badge.className = 'unread-badge';
      badge.textContent = displayCount;
      userEl.appendChild(badge);
    }

    userEl.addEventListener('click', () => {
      switchToPrivateChat(user);
    });

    dom.usersListEl.appendChild(userEl);
  });
}
