// A much simpler singleton to hold the WebSocket instance
const WS_URL = 'ws://127.0.0.1:8000/ws/connect';

class WebSocketService {
  constructor() {
    if (WebSocketService.instance) {
      return WebSocketService.instance;
    }
    this.socket = null;
    WebSocketService.instance = this;
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected.');
      return;
    }
    this.socket = new WebSocket(WS_URL);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      // Optional: implement automatic reconnection logic here
      this.socket = null;
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.socket = null;
    };
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message); // We'll send plain text from client
    } else {
      console.error('WebSocket is not connected.');
      // You could queue the message here or reconnect
      this.connect(); // Attempt to reconnect
      // A robust solution would wait for onopen before sending.
      setTimeout(() => this.send(message), 5000);
    }
  }

  // The component will attach its own onmessage listener
  getSocket() {
    return this.socket;
  }
}

// Export a single instance
export const websocketService = new WebSocketService();
