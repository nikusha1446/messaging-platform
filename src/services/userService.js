export class UserService {
  constructor() {
    this.users = new Map();
    this.usernames = new Set();
    this.typingUsers = new Map();
    this.AWAY_THRESHOLD = 2 * 60 * 1000;
    this.TYPING_TIMEOUT = 5000;
  }

  addUser(socketId, username) {
    if (this.usernames.has(username)) {
      return { success: false, error: 'Username already taken' };
    }

    const user = {
      id: socketId,
      username: username,
      status: 'online',
      lastActivity: Date.now(),
      connectedAt: new Date().toISOString(),
    };

    this.users.set(socketId, user);
    this.usernames.add(username);

    return { success: true, user };
  }

  removeUser(socketId) {
    const user = this.users.get(socketId);

    if (user) {
      this.users.delete(socketId);
      this.usernames.delete(user.username);
      this.clearTypingTimeout(socketId);
      return user;
    }

    return null;
  }

  getUser(socketId) {
    return this.users.get(socketId);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  getUserCount() {
    return this.users.size;
  }

  updateActivity(socketId) {
    const user = this.users.get(socketId);

    if (user) {
      user.lastActivity = Date.now();

      if (user.status === 'away') {
        user.status = 'online';
        return { statusChanged: true, user };
      }
    }

    return { statusChanged: false, user };
  }

  checkInactiveUsers() {
    const now = Date.now();
    const changedUsers = [];

    for (const [socketId, user] of this.users.entries()) {
      if (user.status === 'online') {
        const inactiveDuration = now - user.lastActivity;

        if (inactiveDuration >= this.AWAY_THRESHOLD) {
          user.status = 'away';
          changedUsers.push(user);
        }
      }
    }

    return changedUsers;
  }

  setTyping(socketId) {
    const user = this.users.get(socketId);
    if (!user) return null;

    this.clearTypingTimeout(socketId);
    user.isTyping = true;

    return user;
  }

  stopTyping(socketId) {
    const user = this.users.get(socketId);
    if (!user) return null;

    this.clearTypingTimeout(socketId);
    user.isTyping = false;

    return user;
  }

  setTypingTimeout(socketId, callback) {
    this.clearTypingTimeout(socketId);
    const timeout = setTimeout(callback, this.TYPING_TIMEOUT);
    this.typingUsers.set(socketId, timeout);
  }

  clearTypingTimeout(socketId) {
    const timeout = this.typingUsers.get(socketId);

    if (timeout) {
      clearTimeout(timeout);
      this.typingUsers.delete(socketId);
    }
  }

  isUserTyping(socketId) {
    const user = this.users.get(socketId);
    return user ? user.isTyping : false;
  }
}
