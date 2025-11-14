# Real-Time Chat Application

Real-time chat application built with Socket.IO, Node.js, and vanilla JavaScript for frontend. Features include group chat, private messaging, typing indicators, read receipts, and user status tracking.

## Features

### 💬 Messaging
- **Group Chat** - Send messages visible to all online users
- **Private Messages** - One-on-one conversations with any user
- **Real-time Delivery** - Instant message delivery using WebSocket
- **Read Receipts** - See when messages are sent and read
- **Typing Indicators** - Know when someone is typing

### 👥 User Management
- **Username Authentication** - Join chat with a unique username
- **Online Users List** - See who's currently online
- **User Status** - Automatic "online" and "away" status tracking

### 🎨 User Interface
- **Modern Dark Theme** - Dark mode design
- **Responsive Design** - Works on desktop and mobile devices
- **Unread Badges** - Visual indicators for unread messages
- **Status Indicators** - Color-coded online/away status dots

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Socket.IO** - Real-time bidirectional communication

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Socket.IO Client** - WebSocket client
- **CSS3** - Modern styling with animations

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Steps

1. **Clone the repository**
```bash
   git clone https://github.com/nikusha1446/chat-app.git
   cd chat-app
```

2. **Install dependencies**
```bash
   npm install
```

3. **Start the server**
```bash
   npm start
```

4. **Open in browser**
```
   http://localhost:3000
```

## Project Structure
```
messaging-platform/
├── src/
│   ├── handlers/
│   │   ├── connectionHandler.js    # Socket connection handling
│   │   ├── messageHandler.js       # Message event handlers
│   │   ├── index.js                # Entry point for handlers
│   │   └── typingHandler.js        # Typing indicator handlers
│   ├── middleware/
│   │   └── authMiddleware.js       # Username validation
│   ├── services/
│   │   ├── messageService.js       # Message management
│   │   └── userService.js          # User state management
│   ├── utils/
│   │   └── logger.js               # Winston logger configuration
│   └── server.js                   # Main server file
├── public/
│   ├── js/
│   │   ├── auth.js                 # Login handling
│   │   ├── chat.js                 # Chat UI and messaging
│   │   ├── dom.js                  # DOM element references
│   │   ├── sidebar.js              # Sidebar toggle logic
│   │   ├── socket.js               # Socket event handlers
│   │   ├── state.js                # Client state management
│   │   ├── typing.js               # Typing indicator logic
│   │   ├── users.js                # User list rendering
│   │   └── utils.js                # Utility functions
│   ├── index.html                  # Main HTML file
│   ├── app.js                      # Main app entry point
│   └── styles.css                  # Application styles
├── package.json
└── README.md
```

## Usage

### Joining the Chat
1. Enter a username (2-20 characters, letters/numbers/underscore/hyphen only)
2. Click "Join Chat"
3. You'll see the group chat and list of online users

### Sending Messages
- **Group Chat**: Type in the input field and press Enter or click Send
- **Private Chat**: Click a user in the sidebar, then send messages

### Message Status
- **Sent**: Message sent to server
- **Seen**: Recipient has read the message (group shows count, private shows "Seen")

### User Status
- **Green Dot**: User is online
- **Yellow Dot**: User is away (inactive for 2+ minutes)

## API Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `message` | `string` | Send message to group chat |
| `message:private` | `{ recipientId, text }` | Send private message |
| `message:read` | `{ messageId }` | Confirm message read (group) |
| `message:private:read` | `{ messageId }` | Confirm private message read |
| `typing:start` | `{ recipientId? }` | User started typing |
| `typing:stop` | `{ recipientId? }` | User stopped typing |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `user:connected` | `{ user }` | Successful connection |
| `users:list` | `{ users }` | List of all online users |
| `user:joined` | `{ user, userCount }` | New user joined |
| `user:left` | `{ user, userCount }` | User disconnected |
| `user:status:changed` | `{ user, oldStatus, newStatus }` | User status changed |
| `message` | `message` | New group message |
| `message:private` | `message` | New private message |
| `message:status:updated` | `{ messageId, status, ... }` | Message status changed |
| `user:typing` | `{ userId, username, context }` | User is typing |
| `user:stopped:typing` | `{ userId, username, context }` | User stopped typing |
| `error` | `{ message }` | Error occurred |

## License
ISC
