const socketUrl = 'ws://127.0.0.1:8000/ws/connect';

let socket = null;
let messageQueue = [];
let isConnecting = false;

const connect = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return;
  }

  if (isConnecting) {
    return;
  }

  isConnecting = true;
  socket = new WebSocket(socketUrl);

  socket.onopen = () => {
    console.log('WebSocket connected');
    isConnecting = false;
    messageQueue.forEach(msg => socket.send(JSON.stringify(msg)));
    messageQueue = [];
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
    socket = null;
    isConnecting = false;
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    socket = null;
    isConnecting = false;
  };
};

export const websocketService = {
  connect,
  send: (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      messageQueue.push(message);
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        connect();
      }
    }
  },
  onMessage: (callback) => {
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        callback(message);
      };
    }
  },
};

connect();
