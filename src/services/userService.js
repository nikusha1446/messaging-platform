export class UserService {
  constructor() {
    this.users = new Map();
    this.usernames = new Set();
  }

  addUser(socketId, username) {
    if (this.usernames.has(username)) {
      return { success: false, error: 'Username already taken' };
    }

    const user = {
      id: socketId,
      username: username,
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
}
