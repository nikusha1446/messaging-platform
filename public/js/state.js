export const state = {
  socket: null,
  currentUser: null,
  onlineUsers: new Map(),
  typingTimeout: null,
  currentChat: 'group',
  currentTypingUser: null,
  currentTypingContext: null,
  messageHistory: {
    group: [],
    private: new Map(),
  },
  unreadCounts: {
    group: 0,
    private: new Map(),
  },
};
