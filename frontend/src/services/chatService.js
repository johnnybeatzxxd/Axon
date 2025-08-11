const WEBSOCKET_URL = 'ws://127.0.0.1:8000/ws/connect';

let socket = null;
let messageListeners = [];

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  socket = new WebSocket(WEBSOCKET_URL);

  socket.onopen = () => {
    console.log('WebSocket connected');
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    messageListeners.forEach(listener => listener(message));
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected. Reconnecting...');
    // Simple reconnect strategy
    setTimeout(connect, 3000);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    socket.close();
  };
}

function disconnect() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

function sendMessage(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const data = {
      request_id: 'conversation',
      payload: { message: message },
    };
    socket.send(JSON.stringify(data));
  } else {
    console.error('WebSocket is not connected.');
  }
}

function addMessageListener(listener) {
  messageListeners.push(listener);
}

function removeMessageListener(listener) {
  messageListeners = messageListeners.filter(l => l !== listener);
}

// Automatically connect when the module is loaded
connect();

export {
  connect,
  disconnect,
  sendMessage,
  addMessageListener,
  removeMessageListener,
};
